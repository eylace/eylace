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
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  storeId?: string;
  // Carrybee
  clientContext?: string;
}

// Helper to always reply 200 with structured payload (so the client can read error messages)
function respond(ok: boolean, payload: Record<string, any>, stage?: string) {
  return new Response(
    JSON.stringify({ ok, ...(stage ? { stage } : {}), ...payload }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

const trimSlash = (u: string) => (u || '').replace(/\/+$/, '');

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
async function pathaoAuth(config: ProviderConfig) {
  const base = trimSlash(config.apiUrl) || 'https://api-hermes.pathao.com';
  const clientId = config.clientId || config.apiKey;
  const clientSecret = config.clientSecret || config.apiSecret;
  if (!clientId || !clientSecret) throw new Error('Pathao: Client ID & Client Secret are required');

  // Try password grant if username/password supplied (Pathao standard)
  const body: any = {
    client_id: clientId,
    client_secret: clientSecret,
  };
  if (config.username && config.password) {
    body.username = config.username;
    body.password = config.password;
    body.grant_type = 'password';
  } else {
    body.grant_type = 'client_credentials';
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
  return data.access_token as string;
}

async function pathaoCreateOrder(token: string, order: any, config: ProviderConfig) {
  const base = trimSlash(config.apiUrl) || 'https://api-hermes.pathao.com';
  const storeId = order.store_id || config.storeId || config.pickupLocation;
  if (!storeId) throw new Error('Pathao: Store ID is required');

  const res = await fetch(`${base}/aladdin/api/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      store_id: Number(storeId),
      merchant_order_id: order.order_number,
      recipient_name: order.recipient_name || order.customer_name,
      recipient_phone: order.recipient_phone || order.phone,
      recipient_address: order.recipient_address || order.address,
      recipient_city: Number(order.recipient_city || order.city_id || 1),
      recipient_zone: Number(order.recipient_zone || order.zone_id || 1),
      recipient_area: Number(order.recipient_area || order.area_id || 1),
      delivery_type: 48,
      item_type: 2,
      item_quantity: Number(order.item_quantity || 1),
      item_weight: Number(order.item_weight || config.defaultWeight || 0.5),
      amount_to_collect: Number(order.amount_to_collect ?? (order.payment_method === 'cod' ? order.total : 0)) || 0,
      item_description: order.item_description || 'Products',
      special_instruction: order.note || '',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Pathao order failed (${res.status}): ${data?.message || JSON.stringify(data)}`);
  }
  const inner = data?.data || data;
  return {
    ...data,
    consignment_id: inner?.consignment_id || inner?.order_id,
    tracking_code: inner?.consignment_id || inner?.order_id,
  };
}

async function pathaoTrack(token: string, consignmentId: string, config: ProviderConfig) {
  const base = trimSlash(config.apiUrl) || 'https://api-hermes.pathao.com';
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
    const { data: roleData } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', user.id)
      .in('role', ['admin', 'super_admin']).limit(1);
    if (!roleData || roleData.length === 0) return respond(false, { error: 'Forbidden: admin role required' }, 'check_role');

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
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      case 'pathao': {
        const token = await pathaoAuth(config);
        if (action === 'create_order') result = await pathaoCreateOrder(token, payload, config);
        else if (action === 'track') result = { events: await pathaoTrack(token, payload.tracking_number, config) };
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      case 'redx': {
        if (action === 'create_order') result = await redxCreateOrder(config, payload);
        else if (action === 'track') result = { events: await redxTrack(config, payload.tracking_number) };
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      case 'carrybee': {
        if (action === 'create_order') result = await carrybeeCreateOrder(config, payload);
        else if (action === 'track') result = { events: await carrybeeTrack(config, payload.tracking_number) };
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      default:
        return respond(false, { error: `Unknown provider: ${providerCode}` }, 'dispatch');
    }

    return respond(true, { ...result, data: result });
  } catch (error: any) {
    console.error('[shipping-provider]', stage, error);
    return respond(false, { error: error?.message || 'Unknown error' }, stage);
  }
});
