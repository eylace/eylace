import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_ROLES = [
  'super_admin', 'admin', 'product_manager', 'order_manager',
  'vendor_manager', 'customer_manager', 'content_manager',
  'marketing_manager', 'finance_manager', 'support_manager', 'moderator',
];

function extractClientIp(req: Request): string | null {
  const headers = [
    'cf-connecting-ip',
    'x-forwarded-for',
    'x-real-ip',
    'fly-client-ip',
    'x-client-ip',
    'true-client-ip',
  ];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (!value) continue;

    // x-forwarded-for can be comma-separated; take first
    const ip = value.split(',')[0].trim();
    if (ip && ip !== 'unknown' && !isPrivateIp(ip)) {
      return normalizeIp(ip);
    }
  }

  return null;
}

function normalizeIp(ip: string): string {
  // Strip IPv4-mapped IPv6 prefix
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  // Simple check for common private ranges
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const {
      order_number,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      payment_method,
      shipping_address,
      guest_email,
      guest_phone,
      items,
    } = body;

    // Validate required fields
    if (!order_number || subtotal == null || total == null || !payment_method || !items?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required order fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 1. Detect real IP
    const customerIp = extractClientIp(req);

    // 2. Check if IP is blocked
    if (customerIp) {
      const { data: blocked } = await supabaseAdmin
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', customerIp)
        .limit(1);

      if (blocked && blocked.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Your IP address has been restricted from placing orders.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // 3. Resolve user identity from JWT (if present)
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        // Check if user has admin/privileged role — if so, treat as guest order
        const { data: roles } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ADMIN_ROLES)
          .limit(1);

        const isAdmin = roles && roles.length > 0;

        // Check for implicit guest (phone OTP alias)
        const isImplicitGuest = user.email && /^phone_\d+@phone\.local$/i.test(user.email);

        if (!isAdmin && !isImplicitGuest) {
          userId = user.id;
        }
      }
    }

    // 4. Create order
    const orderPayload: Record<string, unknown> = {
      order_number,
      status: 'pending',
      subtotal,
      shipping: shipping ?? 0,
      tax: tax ?? 0,
      discount: discount ?? 0,
      total,
      payment_method,
      shipping_address: shipping_address ?? null,
      customer_ip: customerIp,
      user_id: userId,
    };

    // For guest orders, set contact fields
    if (!userId) {
      orderPayload.guest_email = guest_email || null;
      orderPayload.guest_phone = guest_phone || null;
    }

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order: ' + orderError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 5. Create order items
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image || null,
      price: item.price,
      quantity: item.quantity,
      variations: item.variations || null,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      // Still return order since it was created
      return new Response(
        JSON.stringify({ order: orderData, items_error: itemsError.message }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        order: orderData,
        is_guest: !userId,
        customer_ip: customerIp,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Checkout create order error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
