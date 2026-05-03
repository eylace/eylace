import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ProviderConfig {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  pickupLocation: string;
  codEnabled: boolean;
  defaultWeight: string;
  defaultLength: string;
  defaultWidth: string;
  defaultHeight: string;
  // Pathao
  environment?: 'sandbox' | 'live'; // sandbox or live
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  storeId?: string;
  // Carrybee
  clientContext?: string;
}

// Pathao default base URLs for each environment
const PATHAO_BASE = {
  sandbox: 'https://courier-api-sandbox.pathao.com',
  live: 'https://api-hermes.pathao.com',
} as const;

function pathaoBaseUrl(config: ProviderConfig): string {
  if (config.apiUrl && config.apiUrl.trim()) return trimSlash(config.apiUrl);
  const env = (config.environment === 'sandbox') ? 'sandbox' : 'live';
  return PATHAO_BASE[env];
}

function pathaoEnvKey(config: ProviderConfig): 'sandbox' | 'live' {
  if (config.environment === 'sandbox' || config.environment === 'live') return config.environment;
  const url = (config.apiUrl || '').toLowerCase();
  if (url.includes('sandbox')) return 'sandbox';
  const user = (config.username || '').toLowerCase();
  if (user.includes('test@pathao.com')) return 'sandbox';
  return 'live';
}

// Helper to always reply 200 with structured payload (so the client can read error messages)
function respond(ok: boolean, payload: Record<string, any>, stage?: string) {
  return new Response(
    JSON.stringify({ ok, ...(stage ? { stage } : {}), ...payload }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

const trimSlash = (u: string) => (u || '').replace(/\/+$/, '');

// ─── Retry helper with exponential backoff ──────────────────────────
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
async function withRetry<T>(label: string, fn: (attempt: number) => Promise<T>, maxAttempts = 3): Promise<{ result: T; attempts: number }> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn(attempt);
      return { result, attempts: attempt };
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      const statusMatch = msg.match(/\((\d{3})\)/);
      const status = statusMatch ? Number(statusMatch[1]) : 0;
      const retryable = status === 0 || RETRYABLE_STATUS.has(status) || /network|timeout|fetch failed|ECONNRESET/i.test(msg);
      if (!retryable || attempt === maxAttempts) throw err;
      const backoff = Math.min(2000 * 2 ** (attempt - 1), 8000);
      console.warn(`[${label}] attempt ${attempt} failed (${msg}); retrying in ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

function buildIdempotencyKey(orderId: string, providerCode: string, explicit?: string): string {
  if (explicit && typeof explicit === 'string' && explicit.trim()) return explicit.trim().slice(0, 128);
  return `${providerCode}:${orderId}`;
}

// ─── Shiprocket ─────────────────────────────────────────────
async function shiprocketAuth(email: string, password: string): Promise<string> {
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Shiprocket auth failed: ${JSON.stringify(data)}`);
  return data.token;
}

async function shiprocketCreateOrder(token: string, order: any, config: ProviderConfig) {
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      order_id: order.order_number,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: config.pickupLocation || 'Primary',
      billing_customer_name: order.customer_name,
      billing_last_name: '',
      billing_address: order.address,
      billing_city: order.city,
      billing_pincode: order.postcode,
      billing_state: order.state,
      billing_country: order.country || 'Bangladesh',
      billing_email: order.email || '',
      billing_phone: order.phone,
      shipping_is_billing: true,
      order_items: (order.items || []).map((item: any) => ({
        name: item.name,
        sku: item.sku || item.id,
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.subtotal,
      length: parseFloat(config.defaultLength || '20'),
      breadth: parseFloat(config.defaultWidth || '15'),
      height: parseFloat(config.defaultHeight || '10'),
      weight: parseFloat(config.defaultWeight || '0.5'),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Shiprocket order failed: ${JSON.stringify(data)}`);
  return data;
}

async function shiprocketTrack(token: string, trackingNumber: string) {
  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${trackingNumber}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Shiprocket tracking failed: ${JSON.stringify(data)}`);
  const activities = data?.tracking_data?.shipment_track_activities || [];
  return activities.map((a: any) => ({
    status: a['sr-status'] || a.activity,
    location: a.location || '',
    timestamp: a.date,
    description: a.activity,
  }));
}

async function shiprocketCheckRate(token: string, payload: any) {
  const params = new URLSearchParams({
    pickup_postcode: payload.pickup_postcode,
    delivery_postcode: payload.delivery_postcode,
    weight: String(payload.weight),
    cod: payload.cod_amount > 0 ? '1' : '0',
  });
  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Shiprocket rate check failed: ${JSON.stringify(data)}`);
  const couriers = data?.data?.available_courier_companies || [];
  return couriers.map((c: any) => ({
    provider: 'Shiprocket',
    service: c.courier_name,
    rate: c.rate,
    estimated_days: c.estimated_delivery_days,
  }));
}

// ─── Steadfast ──────────────────────────────────────────────
async function steadfastCreateOrder(config: ProviderConfig, order: any) {
  const base = trimSlash(config.apiUrl) || 'https://portal.packzy.com/api/v1';
  const res = await fetch(`${base}/create_order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': config.apiKey,
      'Secret-Key': config.apiSecret,
    },
    body: JSON.stringify({
      invoice: order.order_number,
      recipient_name: order.customer_name || order.recipient_name,
      recipient_phone: order.phone || order.recipient_phone,
      recipient_address: order.address || order.recipient_address,
      cod_amount: Number(order.amount_to_collect ?? (order.payment_method === 'cod' ? order.total : 0)) || 0,
      note: order.note || '',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Steadfast: ${data?.message || JSON.stringify(data)}`);
  const consignment = data?.consignment || data;
  return {
    ...data,
    tracking_code: consignment?.tracking_code || consignment?.consignment_id,
    consignment_id: consignment?.consignment_id || consignment?.tracking_code,
  };
}

async function steadfastTrack(config: ProviderConfig, trackingNumber: string) {
  const base = trimSlash(config.apiUrl) || 'https://portal.packzy.com/api/v1';
  const res = await fetch(`${base}/status_by_trackingcode/${trackingNumber}`, {
    headers: { 'Api-Key': config.apiKey, 'Secret-Key': config.apiSecret },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Steadfast tracking failed: ${JSON.stringify(data)}`);
  const delivery = data?.delivery_status || data?.status;
  return [{
    status: delivery || 'Unknown',
    location: data?.recipient_city || '',
    timestamp: data?.updated_at || new Date().toISOString(),
    description: `Status: ${delivery}, Invoice: ${data?.invoice || trackingNumber}`,
  }];
}

// ─── Pathao ─────────────────────────────────────────────────
interface PathaoCity {
  city_id: number;
  city_name: string;
}

interface PathaoZone {
  zone_id: number;
  zone_name: string;
}

interface PathaoArea {
  area_id: number;
  area_name: string;
  home_delivery_available?: boolean;
}

interface PathaoStore {
  store_id: number;
  store_name: string;
  store_address?: string;
  city_id?: number;
  zone_id?: number;
  is_active?: boolean | number;
  is_default_store?: boolean;
}

const compactText = (value: unknown) => String(value ?? '').trim();

const toPositiveInt = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
};

const normalizeLookupText = (value: unknown) => compactText(value)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const levenshteinDistance = (a: string, b: string) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

const getMatchScore = (needle: string, candidate: string) => {
  if (!needle || !candidate) return 0;
  if (needle === candidate) return 1;
  if (candidate.includes(needle) || needle.includes(candidate)) return 0.94;
  const distance = levenshteinDistance(needle, candidate);
  return 1 - distance / Math.max(needle.length, candidate.length, 1);
};

const buildSearchCandidates = (...values: unknown[]) => {
  const candidates: string[] = [];

  for (const value of values) {
    const text = compactText(value);
    if (!text) continue;
    candidates.push(text);
    for (const part of text.split(/[\n,|/]+/)) {
      const trimmed = part.trim();
      if (trimmed) candidates.push(trimmed);
    }
  }

  return Array.from(new Set(candidates));
};

const pickBestPathaoMatch = <T extends Record<string, any>>(
  candidates: unknown[],
  items: T[],
  getId: (item: T) => unknown,
  getLabels: (item: T) => unknown[],
  minScore = 0.72,
) => {
  for (const candidate of candidates) {
    const candidateId = toPositiveInt(candidate);
    if (!candidateId) continue;
    const directMatch = items.find((item) => toPositiveInt(getId(item)) === candidateId);
    if (directMatch) return directMatch;
  }

  let bestItem: T | null = null;
  let bestScore = 0;

  for (const candidate of buildSearchCandidates(...candidates)) {
    const normalizedCandidate = normalizeLookupText(candidate);
    if (!normalizedCandidate) continue;

    for (const item of items) {
      const labelTerms = buildSearchCandidates(...getLabels(item));
      for (const term of labelTerms) {
        const score = getMatchScore(normalizedCandidate, normalizeLookupText(term));
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
      }
    }
  }

  return bestScore >= minScore ? bestItem : null;
};

const normalizeBangladeshPhone = (value: unknown) => {
  const digits = compactText(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return `0${digits.slice(3)}`;
  if (digits.startsWith('88') && digits.length > 11) return digits.slice(2);
  if (digits.length === 10 && digits.startsWith('1')) return `0${digits}`;
  return digits;
};

const formatPathaoError = (payload: any) => {
  const details = payload?.errors && typeof payload.errors === 'object'
    ? Object.entries(payload.errors)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : String(messages)}`)
      .join(' | ')
    : '';

  return [payload?.message, details].filter(Boolean).join(' — ') || JSON.stringify(payload);
};

async function pathaoFetchCollection<T extends Record<string, any>>(
  token: string,
  config: ProviderConfig,
  path: string,
  label: string,
): Promise<T[]> {
  const base = pathaoBaseUrl(config);
  const res = await fetch(`${base}/aladdin/api/v1/${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));

  const items = Array.isArray(data?.data?.data)
    ? data.data.data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  if (!res.ok || (!items.length && data?.success === false)) {
    throw new Error(`Pathao ${label} failed (${res.status}): ${formatPathaoError(data)}`);
  }

  return items as T[];
}

async function resolvePathaoStore(token: string, order: any, config: ProviderConfig) {
  const stores = await pathaoFetchCollection<PathaoStore>(token, config, 'stores', 'store lookup');
  const activeStores = stores.filter((store) => store.is_active === undefined || store.is_active === true || Number(store.is_active) === 1);
  if (!activeStores.length) throw new Error('Pathao: no active stores found for this account');

  const configuredStore = pickBestPathaoMatch(
    [order?.store_id, config.storeId, config.pickupLocation],
    activeStores,
    (store) => store.store_id,
    (store) => [store.store_name, store.store_address],
    0.8,
  );

  if (configuredStore) return { store: configuredStore, fallbackUsed: false };

  const hasConfiguredStore = Boolean(compactText(order?.store_id || config.storeId || config.pickupLocation));
  const isSandbox = pathaoEnvKey(config) === 'sandbox';

  if (hasConfiguredStore && !isSandbox) {
    throw new Error('Pathao: configured Store ID was not found for this account. Update Courier Management with a valid Store ID.');
  }

  const fallbackStore = activeStores.find((store) => store.is_default_store) || activeStores[0];
  return { store: fallbackStore, fallbackUsed: hasConfiguredStore };
}

async function resolvePathaoDestination(token: string, order: any, config: ProviderConfig, store: PathaoStore) {
  const cities = await pathaoFetchCollection<PathaoCity>(token, config, 'city-list', 'city lookup');
  const city = pickBestPathaoMatch(
    [order?.recipient_city, order?.city_id, order?.city, order?.recipient_address, order?.address],
    cities,
    (item) => item.city_id,
    (item) => [item.city_name],
    0.74,
  ) || cities.find((item) => toPositiveInt(item.city_id) === toPositiveInt(store.city_id));

  if (!city) {
    throw new Error('Pathao: could not resolve the destination city from this order. Please add a valid city or Pathao city ID.');
  }

  const zones = await pathaoFetchCollection<PathaoZone>(token, config, `cities/${city.city_id}/zone-list`, 'zone lookup');
  const zone = pickBestPathaoMatch(
    [order?.recipient_zone, order?.zone_id, order?.zone, order?.recipient_address, order?.address],
    zones,
    (item) => item.zone_id,
    (item) => [item.zone_name],
    0.74,
  ) || zones.find((item) => toPositiveInt(item.zone_id) === toPositiveInt(store.zone_id)) || zones[0];

  if (!zone) {
    throw new Error(`Pathao: no delivery zone found for ${city.city_name}`);
  }

  const areas = await pathaoFetchCollection<PathaoArea>(token, config, `zones/${zone.zone_id}/area-list`, 'area lookup');
  const area = pickBestPathaoMatch(
    [order?.recipient_area, order?.area_id, order?.area, order?.recipient_address, order?.address],
    areas,
    (item) => item.area_id,
    (item) => [item.area_name],
    0.74,
  ) || areas.find((item) => item.home_delivery_available !== false) || areas[0] || null;

  return { city, zone, area };
}

// Issues a NEW Pathao access token via API. Does not cache. Used by both fresh-auth and refresh paths.
async function pathaoIssueToken(config: ProviderConfig, opts: { useRefresh?: string } = {}) {
  const base = pathaoBaseUrl(config);
  const clientId = config.clientId || config.apiKey;
  const clientSecret = config.clientSecret || config.apiSecret;
  if (!clientId || !clientSecret) throw new Error('Pathao: Client ID & Client Secret are required');

  const body: any = { client_id: clientId, client_secret: clientSecret };

  if (opts.useRefresh) {
    body.grant_type = 'refresh_token';
    body.refresh_token = opts.useRefresh;
  } else if (config.username && config.password) {
    body.grant_type = 'password';
    body.username = config.username;
    body.password = config.password;
  } else {
    throw new Error('Pathao: Username & Password are required for first-time authentication');
  }

  const res = await fetch(`${base}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access_token) {
    throw new Error(`Pathao auth failed (${res.status}): ${data?.message || JSON.stringify(data)}`);
  }
  return {
    access_token: data.access_token as string,
    refresh_token: (data.refresh_token as string) || null,
    expires_in: Number(data.expires_in) || 432000,
  };
}

// Reads token cache from DB and returns a valid access token, refreshing/issuing as needed.
async function pathaoGetToken(supabaseAdmin: any, config: ProviderConfig): Promise<string> {
  const provider = 'pathao';
  const environment = pathaoEnvKey(config);
  const clientId = config.clientId || config.apiKey || '';

  // 1. Look up cached token
  const { data: cached } = await supabaseAdmin
    .from('courier_auth_tokens')
    .select('*')
    .eq('provider', provider)
    .eq('environment', environment)
    .eq('client_id', clientId)
    .maybeSingle();

  const now = Date.now();
  // 60s safety buffer
  if (cached?.access_token && new Date(cached.expires_at).getTime() > now + 60_000) {
    return cached.access_token as string;
  }

  // 2. Try refresh token if we have one and the access token is expired
  if (cached?.refresh_token) {
    try {
      const refreshed = await pathaoIssueToken(config, { useRefresh: cached.refresh_token });
      const expiresAt = new Date(now + refreshed.expires_in * 1000).toISOString();
      await supabaseAdmin.from('courier_auth_tokens').upsert({
        provider, environment, client_id: clientId,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || cached.refresh_token,
        expires_at: expiresAt,
      }, { onConflict: 'provider,environment,client_id' });
      return refreshed.access_token;
    } catch (e) {
      console.warn('[pathao] refresh failed, falling back to password grant', (e as any)?.message);
    }
  }

  // 3. Fresh issue (password grant)
  const fresh = await pathaoIssueToken(config);
  const expiresAt = new Date(now + fresh.expires_in * 1000).toISOString();
  await supabaseAdmin.from('courier_auth_tokens').upsert({
    provider, environment, client_id: clientId,
    access_token: fresh.access_token,
    refresh_token: fresh.refresh_token,
    expires_at: expiresAt,
  }, { onConflict: 'provider,environment,client_id' });
  return fresh.access_token;
}

async function pathaoCreateOrder(token: string, order: any, config: ProviderConfig) {
  const base = pathaoBaseUrl(config);
  const { store, fallbackUsed } = await resolvePathaoStore(token, order, config);
  const { city, zone, area } = await resolvePathaoDestination(token, order, config, store);

  const amountToCollect = Math.max(0, Math.round(Number(order.amount_to_collect ?? (order.payment_method === 'cod' ? order.total : 0)) || 0));
  const recipientPhone = normalizeBangladeshPhone(order.recipient_phone || order.phone);
  if (!recipientPhone) throw new Error('Pathao: customer phone is required');

  const addressParts: string[] = [];
  for (const part of [
    order.recipient_address || order.address,
    area?.area_name,
    zone?.zone_name,
    city?.city_name,
    'Bangladesh',
  ]) {
    const text = compactText(part);
    if (!text) continue;
    const normalized = normalizeLookupText(text);
    if (!addressParts.some((item) => normalizeLookupText(item) === normalized)) {
      addressParts.push(text);
    }
  }

  const recipientAddress = addressParts.join(', ');
  if (recipientAddress.length < 10) {
    throw new Error('Pathao: customer address is too short. Please provide a more detailed delivery address.');
  }

  const requestBody = {
    store_id: Number(store.store_id),
    merchant_order_id: compactText(order.order_number || order.order_id),
    recipient_name: compactText(order.recipient_name || order.customer_name || 'Customer'),
    recipient_phone: recipientPhone,
    recipient_address: recipientAddress,
    recipient_city: Number(city.city_id),
    recipient_zone: Number(zone.zone_id),
    recipient_area: area ? Number(area.area_id) : undefined,
    delivery_type: 48,
    item_type: 2,
    item_quantity: Math.max(1, Math.round(Number(order.item_quantity || 1) || 1)),
    item_weight: Number(order.item_weight || config.defaultWeight || 0.5) || 0.5,
    amount_to_collect: amountToCollect,
    item_description: compactText(order.item_description || 'Products'),
    special_instruction: compactText(order.note || ''),
  };

  const res = await fetch(`${base}/aladdin/api/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Pathao order failed (${res.status}): ${formatPathaoError(data)}`);
  }
  const inner = data?.data || data;
  return {
    ...data,
    consignment_id: inner?.consignment_id || inner?.order_id,
    tracking_code: inner?.consignment_id || inner?.order_id,
    resolved_store_id: requestBody.store_id,
    resolved_city_id: requestBody.recipient_city,
    resolved_zone_id: requestBody.recipient_zone,
    resolved_area_id: requestBody.recipient_area,
    used_store_fallback: fallbackUsed,
  };
}

async function pathaoTrack(token: string, consignmentId: string, config: ProviderConfig) {
  const base = pathaoBaseUrl(config);
  const res = await fetch(`${base}/aladdin/api/v1/orders/${consignmentId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Pathao tracking failed: ${JSON.stringify(data)}`);
  const order = data?.data;
  return [{
    status: order?.order_status || 'Unknown',
    location: order?.recipient_address || '',
    timestamp: order?.updated_at || new Date().toISOString(),
    description: `Pathao Order #${order?.consignment_id || consignmentId} - ${order?.order_status || 'Processing'}`,
  }];
}

// ─── RedX ───────────────────────────────────────────────────
async function redxCreateOrder(config: ProviderConfig, order: any) {
  const base = trimSlash(config.apiUrl) || 'https://openapi.redx.com.bd/v1.0.0-beta';
  if (!config.apiKey) throw new Error('RedX: API Token is required');
  const res = await fetch(`${base}/parcel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'API-ACCESS-TOKEN': `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      customer_name: order.recipient_name || order.customer_name,
      customer_phone: order.recipient_phone || order.phone,
      delivery_area: order.recipient_area || order.city || 'Dhaka',
      delivery_area_id: Number(order.area_id || 1),
      customer_address: order.recipient_address || order.address,
      merchant_invoice_id: order.order_id || order.order_number,
      cash_collection_amount: String(order.amount_to_collect ?? (order.payment_method === 'cod' ? order.total : 0)),
      parcel_weight: Math.round((Number(order.item_weight) || 0.5) * 1000),
      instruction: order.note || '',
      value: Number(order.value || order.total || order.subtotal || 0),
      is_closed_box: true,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`RedX order failed (${res.status}): ${data?.message || JSON.stringify(data)}`);
  const tid = data?.tracking_id || data?.data?.tracking_id;
  return { ...data, tracking_code: tid, consignment_id: tid };
}

async function redxTrack(config: ProviderConfig, trackingNumber: string) {
  const base = trimSlash(config.apiUrl) || 'https://openapi.redx.com.bd/v1.0.0-beta';
  const res = await fetch(`${base}/parcel/track/${trackingNumber}`, {
    headers: { 'API-ACCESS-TOKEN': `Bearer ${config.apiKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`RedX tracking failed: ${JSON.stringify(data)}`);
  const events = data?.parcel_log || data?.data || [];
  return events.map((e: any) => ({
    status: e.parcel_status_title || e.status || 'Unknown',
    location: e.area_name || '',
    timestamp: e.time || e.created_at || new Date().toISOString(),
    description: e.message || e.parcel_status_title || '',
  }));
}

// ─── Carrybee ───────────────────────────────────────────────
async function carrybeeCreateOrder(config: ProviderConfig, order: any) {
  const base = trimSlash(config.apiUrl) || 'https://api.carrybee.com.bd/api/v1';
  if (!config.apiKey && !config.clientId) throw new Error('Carrybee: API Key / Client ID required');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
  if (config.clientId) headers['Client-Id'] = config.clientId;
  if (config.clientSecret) headers['Client-Secret'] = config.clientSecret;
  if (config.clientContext) headers['Client-Context'] = config.clientContext;

  const res = await fetch(`${base}/order/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      invoice_id: order.order_id || order.order_number,
      recipient_name: order.recipient_name || order.customer_name,
      recipient_phone: order.recipient_phone || order.phone,
      recipient_address: order.recipient_address || order.address,
      recipient_city: order.city || 'Dhaka',
      cod_amount: Number(order.amount_to_collect ?? (order.payment_method === 'cod' ? order.total : 0)) || 0,
      weight: Number(order.item_weight) || 0.5,
      product_description: order.item_description || 'Products',
      special_instruction: order.note || '',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Carrybee order failed (${res.status}): ${data?.message || JSON.stringify(data)}`);
  const tid = data?.tracking_code || data?.data?.tracking_code || data?.consignment_id;
  return { ...data, tracking_code: tid, consignment_id: tid };
}

async function carrybeeTrack(config: ProviderConfig, trackingNumber: string) {
  const base = trimSlash(config.apiUrl) || 'https://api.carrybee.com.bd/api/v1';
  const headers: Record<string, string> = {};
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
  const res = await fetch(`${base}/order/track/${trackingNumber}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(`Carrybee tracking failed: ${JSON.stringify(data)}`);
  const events = data?.tracking_events || data?.data?.events || [];
  return events.map((e: any) => ({
    status: e.status || 'Unknown',
    location: e.location || '',
    timestamp: e.timestamp || new Date().toISOString(),
    description: e.note || e.status || '',
  }));
}

// ─── Actual delivered cost fetch (Steadfast / Pathao / Carrybee / RedX) ──────
// Fetches actual courier-side cost for a delivered consignment. Each provider
// exposes the data slightly differently — we normalize to a single number.
async function fetchActualDeliveredCost(
  providerCode: string,
  config: ProviderConfig,
  trackingNumber: string,
  supabaseAdmin: any,
): Promise<{ amount: number | null; currency: string; raw: any }> {
  const trackingId = String(trackingNumber || '').trim();
  if (!trackingId) throw new Error('Tracking / consignment ID is required');

  if (providerCode === 'steadfast') {
    const base = trimSlash(config.apiUrl) || 'https://portal.packzy.com/api/v1';
    const res = await fetch(`${base}/status_by_trackingcode/${trackingId}`, {
      headers: { 'Api-Key': config.apiKey, 'Secret-Key': config.apiSecret },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Steadfast: ${data?.message || JSON.stringify(data)}`);
    // Steadfast charges a per-parcel delivery fee — exposed as `delivery_fee` or `charge`
    const amt = Number(data?.delivery_fee ?? data?.charge ?? data?.cost ?? data?.amount ?? 0) || null;
    return { amount: amt, currency: 'BDT', raw: data };
  }

  if (providerCode === 'pathao') {
    const token = await pathaoGetToken(supabaseAdmin, config);
    const base = pathaoBaseUrl(config);
    const res = await fetch(`${base}/aladdin/api/v1/orders/${trackingId}/info`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Pathao: ${formatPathaoError(data)}`);
    const inner = data?.data || data;
    const amt = Number(inner?.delivery_fee ?? inner?.collected_amount_fee ?? inner?.total_fee ?? 0) || null;
    return { amount: amt, currency: 'BDT', raw: data };
  }

  if (providerCode === 'carrybee') {
    const base = trimSlash(config.apiUrl) || 'https://api.carrybee.com.bd/api/v1';
    const headers: Record<string, string> = {};
    if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
    if (config.clientId) headers['Client-Id'] = config.clientId;
    const res = await fetch(`${base}/order/track/${trackingId}`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Carrybee: ${data?.message || JSON.stringify(data)}`);
    const inner = data?.data || data;
    const amt = Number(inner?.delivery_charge ?? inner?.delivery_fee ?? inner?.charge ?? 0) || null;
    return { amount: amt, currency: 'BDT', raw: data };
  }

  if (providerCode === 'redx') {
    const base = trimSlash(config.apiUrl) || 'https://openapi.redx.com.bd/v1.0.0-beta';
    const res = await fetch(`${base}/parcel/info/${trackingId}`, {
      headers: { 'API-ACCESS-TOKEN': `Bearer ${config.apiKey}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`RedX: ${data?.message || JSON.stringify(data)}`);
    const inner = data?.data || data;
    const amt = Number(inner?.delivery_fee ?? inner?.charge ?? 0) || null;
    return { amount: amt, currency: 'BDT', raw: data };
  }

  throw new Error(`Cost fetch not supported for provider ${providerCode}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let stage = 'init';
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return respond(false, { error: 'Unauthorized: missing token' }, 'auth');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    stage = 'verify_user';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) return respond(false, { error: 'Unauthorized' }, 'verify_user');

    stage = 'check_role';
    const allowedRoles = [
      'admin', 'super_admin', 'order_manager', 'support_manager', 'moderator',
      'vendor_admin', 'vendor_order_manager', 'vendor_staff', 'warehouse_manager'
    ];
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', user.id)
      .in('role', allowedRoles).limit(1);
    if (roleError) return respond(false, { error: `Role check failed: ${roleError.message}` }, 'check_role');
    if (!roleData || roleData.length === 0) return respond(false, { error: 'Forbidden: admin or seller role required' }, 'check_role');

    stage = 'parse_body';
    const body = await req.json();
    const { action, provider: providerCode, payload } = body || {};
    if (!action || !providerCode) return respond(false, { error: 'Missing action or provider' }, 'parse_body');

    stage = 'load_config';
    const { data: settingsData } = await supabaseAdmin
      .from('system_settings').select('value').eq('key', 'shipping_providers_config').maybeSingle();

    const providers: ProviderConfig[] = (settingsData?.value as any) || [];
    const config = providers.find((p) => p.id === providerCode || p.code === providerCode);

    if (!config) return respond(false, { error: `Provider "${providerCode}" not configured. Save it in Courier Management first.` }, 'load_config');
    if (!config.enabled) return respond(false, { error: `Provider "${providerCode}" is disabled. Enable it in Courier Management.` }, 'load_config');

    stage = `dispatch_${providerCode}_${action}`;
    let result: any;

    switch (providerCode) {
      case 'shiprocket': {
        const token = await shiprocketAuth(config.apiKey, config.apiSecret);
        if (action === 'create_order') result = await shiprocketCreateOrder(token, payload, config);
        else if (action === 'track') result = { events: await shiprocketTrack(token, payload.tracking_number) };
        else if (action === 'check_rate') result = { rates: await shiprocketCheckRate(token, payload) };
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      case 'steadfast': {
        if (action === 'create_order') result = await steadfastCreateOrder(config, payload);
        else if (action === 'track') result = { events: await steadfastTrack(config, payload.tracking_number) };
        else if (action === 'fetch_actual_cost') {
          const cost = await fetchActualDeliveredCost('steadfast', config, payload?.tracking_number, supabaseAdmin);
          let expenseId: string | null = null;
          if (payload?.order_id && cost.amount && cost.amount > 0) {
            const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('apply_courier_api_cost', {
              _order_id: payload.order_id,
              _provider: 'steadfast',
              _amount: cost.amount,
              _zone: payload?.zone || null,
              _notes: `Steadfast actual cost (${payload?.tracking_number})`,
            });
            if (rpcErr) throw new Error(rpcErr.message);
            expenseId = rpcData as string;
          }
          result = { ...cost, expense_id: expenseId };
        }
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      case 'pathao': {
        if (action === 'test_connection') {
          // Force fresh issue to validate credentials, then cache.
          const fresh = await pathaoIssueToken(config);
          const env = pathaoEnvKey(config);
          const clientId = config.clientId || config.apiKey || '';
          const expiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString();
          await supabaseAdmin.from('courier_auth_tokens').upsert({
            provider: 'pathao', environment: env, client_id: clientId,
            access_token: fresh.access_token, refresh_token: fresh.refresh_token,
            expires_at: expiresAt,
          }, { onConflict: 'provider,environment,client_id' });

          // Also fetch stores to confirm we can reach the API beyond just auth
          const stores = await pathaoFetchCollection<PathaoStore>(fresh.access_token, config, 'stores', 'store list');
          result = {
            authenticated: true,
            environment: env,
            base_url: pathaoBaseUrl(config),
            expires_in_seconds: fresh.expires_in,
            store_count: stores.length,
            stores: stores.map((s) => ({ store_id: s.store_id, store_name: s.store_name, is_default_store: s.is_default_store })),
          };
        } else {
          const token = await pathaoGetToken(supabaseAdmin, config);
          if (action === 'create_order') result = await pathaoCreateOrder(token, payload, config);
          else if (action === 'track') result = { events: await pathaoTrack(token, payload.tracking_number, config) };
          else if (action === 'fetch_actual_cost') {
            const cost = await fetchActualDeliveredCost('pathao', config, payload?.tracking_number, supabaseAdmin);
            let expenseId: string | null = null;
            if (payload?.order_id && cost.amount && cost.amount > 0) {
              const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('apply_courier_api_cost', {
                _order_id: payload.order_id,
                _provider: 'pathao',
                _amount: cost.amount,
                _zone: payload?.zone || null,
                _notes: `Pathao actual cost (${payload?.tracking_number})`,
              });
              if (rpcErr) throw new Error(rpcErr.message);
              expenseId = rpcData as string;
            }
            result = { ...cost, expense_id: expenseId };
          }
          else throw new Error(`Unknown action: ${action}`);
        }
        break;
      }
      case 'redx': {
        if (action === 'create_order') result = await redxCreateOrder(config, payload);
        else if (action === 'track') result = { events: await redxTrack(config, payload.tracking_number) };
        else if (action === 'fetch_actual_cost') {
          const cost = await fetchActualDeliveredCost('redx', config, payload?.tracking_number, supabaseAdmin);
          let expenseId: string | null = null;
          if (payload?.order_id && cost.amount && cost.amount > 0) {
            const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('apply_courier_api_cost', {
              _order_id: payload.order_id,
              _provider: 'redx',
              _amount: cost.amount,
              _zone: payload?.zone || null,
              _notes: `RedX actual cost (${payload?.tracking_number})`,
            });
            if (rpcErr) throw new Error(rpcErr.message);
            expenseId = rpcData as string;
          }
          result = { ...cost, expense_id: expenseId };
        }
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      case 'carrybee': {
        if (action === 'create_order') result = await carrybeeCreateOrder(config, payload);
        else if (action === 'track') result = { events: await carrybeeTrack(config, payload.tracking_number) };
        else if (action === 'fetch_actual_cost') {
          const cost = await fetchActualDeliveredCost('carrybee', config, payload?.tracking_number, supabaseAdmin);
          let expenseId: string | null = null;
          if (payload?.order_id && cost.amount && cost.amount > 0) {
            const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('apply_courier_api_cost', {
              _order_id: payload.order_id,
              _provider: 'carrybee',
              _amount: cost.amount,
              _zone: payload?.zone || null,
              _notes: `Carrybee actual cost (${payload?.tracking_number})`,
            });
            if (rpcErr) throw new Error(rpcErr.message);
            expenseId = rpcData as string;
          }
          result = { ...cost, expense_id: expenseId };
        }
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      default:
        return respond(false, { error: `Unknown provider: ${providerCode}` }, 'dispatch');
    }

    // Add a friendly note for Pathao sandbox so users know orders appear in the sandbox panel
    const isPathaoSandbox = providerCode === 'pathao' && pathaoEnvKey(config) === 'sandbox';

    const extra: Record<string, any> = {};
    if (isPathaoSandbox && action === 'create_order') {
      extra.sandbox = true;
      extra.sandbox_panel_url = 'https://merchant.pathao.com/courier/orders';
      extra.note = 'Sandbox order created. View it at https://merchant.pathao.com/courier/orders by logging in with test@pathao.com / lovePathao. Switch to LIVE in Courier Management → Pathao → Environment to dispatch to your real Pathao panel.';
      if (result?.used_store_fallback) {
        extra.note += ` (Configured Store ID was not found in sandbox — used Pathao test store #${result.resolved_store_id} instead.)`;
      }
    }

    return respond(true, { ...result, ...extra, data: result });
  } catch (error: any) {
    console.error('[shipping-provider]', stage, error);
    return respond(false, { error: error?.message || 'Unknown error' }, stage);
  }
});
