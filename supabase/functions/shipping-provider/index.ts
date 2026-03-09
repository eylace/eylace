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
      order_items: order.items.map((item: any) => ({
        name: item.name,
        sku: item.sku || item.id,
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.subtotal,
      length: parseFloat(config.defaultLength),
      breadth: parseFloat(config.defaultWidth),
      height: parseFloat(config.defaultHeight),
      weight: parseFloat(config.defaultWeight),
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
async function steadfastCreateOrder(apiKey: string, apiSecret: string, order: any) {
  const res = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
      'Secret-Key': apiSecret,
    },
    body: JSON.stringify({
      invoice: order.order_number,
      recipient_name: order.customer_name,
      recipient_phone: order.phone,
      recipient_address: order.address,
      cod_amount: order.payment_method === 'cod' ? order.total : 0,
      note: order.note || '',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Steadfast order failed: ${JSON.stringify(data)}`);
  return data;
}

async function steadfastTrack(apiKey: string, apiSecret: string, trackingNumber: string) {
  const res = await fetch(`https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/${trackingNumber}`, {
    headers: { 'Api-Key': apiKey, 'Secret-Key': apiSecret },
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

async function steadfastCheckRate(_apiKey: string, _apiSecret: string, payload: any) {
  // Steadfast doesn't have a public rate API; return flat rate estimate
  const insideDhaka = payload.delivery_postcode?.startsWith('12') || payload.delivery_postcode?.startsWith('13');
  const rate = insideDhaka ? 60 : 120;
  return [{
    provider: 'Steadfast',
    service: insideDhaka ? 'Inside Dhaka' : 'Outside Dhaka',
    rate,
    estimated_days: insideDhaka ? '1-2' : '2-5',
  }];
}

// ─── Pathao ─────────────────────────────────────────────────
async function pathaoAuth(clientId: string, clientSecret: string) {
  const res = await fetch('https://api-hermes.pathao.com/aladdin/api/v1/issue-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Pathao auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function pathaoCreateOrder(token: string, order: any, config: ProviderConfig) {
  const res = await fetch('https://api-hermes.pathao.com/aladdin/api/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      store_id: config.pickupLocation,
      merchant_order_id: order.order_number,
      recipient_name: order.customer_name,
      recipient_phone: order.phone,
      recipient_address: order.address,
      recipient_city: order.city_id || 1,
      recipient_zone: order.zone_id || 1,
      recipient_area: order.area_id || 1,
      delivery_type: 48,
      item_type: 2,
      item_quantity: order.items?.length || 1,
      item_weight: parseFloat(config.defaultWeight),
      amount_to_collect: order.payment_method === 'cod' ? order.total : 0,
      special_instruction: order.note || '',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Pathao order failed: ${JSON.stringify(data)}`);
  return data;
}

async function pathaoTrack(token: string, consignmentId: string) {
  const res = await fetch(`https://api-hermes.pathao.com/aladdin/api/v1/orders/${consignmentId}`, {
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

async function pathaoCheckRate(token: string, payload: any) {
  const res = await fetch('https://api-hermes.pathao.com/aladdin/api/v1/merchant/price-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      store_id: payload.store_id || 1,
      item_type: 2,
      delivery_type: 48,
      item_weight: payload.weight || 0.5,
      recipient_city: payload.recipient_city || 1,
      recipient_zone: payload.recipient_zone || 1,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Pathao rate check failed: ${JSON.stringify(data)}`);
  return [{
    provider: 'Pathao',
    service: 'Standard Delivery',
    rate: data?.data?.price || 0,
    estimated_days: '1-3',
  }];
}

// ─── Main Handler ───────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, provider: providerCode, payload } = await req.json();

    // Load provider config
    const { data: settingsData } = await supabaseAdmin
      .from('system_settings').select('value').eq('key', 'shipping_providers_config').single();

    const providers: ProviderConfig[] = (settingsData?.value as any) || [];
    const config = providers.find((p) => p.id === providerCode);

    if (!config || !config.enabled) {
      return new Response(JSON.stringify({ error: `Provider ${providerCode} not configured or disabled` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        if (action === 'create_order') result = await steadfastCreateOrder(config.apiKey, config.apiSecret, payload);
        else if (action === 'track') result = { events: await steadfastTrack(config.apiKey, config.apiSecret, payload.tracking_number) };
        else if (action === 'check_rate') result = { rates: await steadfastCheckRate(config.apiKey, config.apiSecret, payload) };
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      case 'pathao': {
        const token = await pathaoAuth(config.apiKey, config.apiSecret);
        if (action === 'create_order') result = await pathaoCreateOrder(token, payload, config);
        else if (action === 'track') result = { events: await pathaoTrack(token, payload.tracking_number) };
        else if (action === 'check_rate') result = { rates: await pathaoCheckRate(token, payload) };
        else throw new Error(`Unknown action: ${action}`);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${providerCode}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Shipping provider error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
