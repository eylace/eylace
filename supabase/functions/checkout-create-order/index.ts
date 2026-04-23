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
      shipping: clientShipping,
      tax: clientTax,
      discount: clientDiscount,
      total,
      payment_method,
      shipping_address,
      guest_email,
      guest_phone,
      items,
    } = body;

    // Validate required fields
    if (!order_number || total == null || !payment_method || !items?.length) {
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
      // Placeholder amounts — overwritten after server-side price validation below.
      subtotal: 0,
      shipping: 0,
      tax: 0,
      discount: 0,
      total: 0,
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

    // 5. Fetch cost_per_item from products (for accurate historical profit calc)
    const productIds = Array.from(new Set(items.map((i: any) => i.product_id).filter(Boolean)));
    if (productIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid items: missing product_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const priceMap = new Map<string, { price: number; cost: number; name: string; image: string | null; active: boolean; stock: number | null }>();
    const { data: prodRows, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, name, price, original_price, cost_per_item, images, is_active, stock')
      .in('id', productIds as string[]);

    if (prodErr) {
      console.error('Product price lookup error:', prodErr);
      return new Response(
        JSON.stringify({ error: 'Failed to validate product prices' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    prodRows?.forEach((p: any) => {
      priceMap.set(String(p.id), {
        price: Number(p.price) || 0,
        cost: Number(p.cost_per_item) || 0,
        name: p.name,
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
        active: p.is_active !== false,
        stock: p.stock == null ? null : Number(p.stock),
      });
    });

    // Validate every item exists, is active, and use server-side prices
    let serverSubtotal = 0;
    const orderItems: Array<Record<string, unknown>> = [];
    for (const item of items) {
      const pid = String(item.product_id);
      const product = priceMap.get(pid);
      if (!product) {
        // Roll back: delete the order shell we just inserted
        await supabaseAdmin.from('orders').delete().eq('id', orderData.id);
        return new Response(
          JSON.stringify({ error: `Product not found: ${pid}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (!product.active) {
        await supabaseAdmin.from('orders').delete().eq('id', orderData.id);
        return new Response(
          JSON.stringify({ error: `Product unavailable: ${product.name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 0));
      // Stock validation: reject when requested qty exceeds available stock.
      // stock === null means "untracked" (digital/services) — allow.
      if (product.stock !== null && qty > product.stock) {
        await supabaseAdmin.from('orders').delete().eq('id', orderData.id);
        return new Response(
          JSON.stringify({ error: `Insufficient stock for ${product.name} (available: ${product.stock})` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const serverPrice = product.price;
      serverSubtotal += serverPrice * qty;
      orderItems.push({
        order_id: orderData.id,
        product_id: pid,
        product_name: product.name,
        product_image: product.image,
        price: serverPrice,
        cost_per_item: product.cost,
        quantity: qty,
        variations: item.variations || null,
      });
    }

    // Recompute totals server-side from authenticated prices
    const safeShipping = Math.max(0, Number(clientShipping) || 0);
    const safeTax = Math.max(0, Number(clientTax) || 0);
    const safeDiscount = Math.max(0, Number(clientDiscount) || 0);
    const serverTotal = Math.max(0, serverSubtotal + safeShipping + safeTax - safeDiscount);

    // Reject if client-submitted total deviates by more than 1 unit (rounding tolerance)
    if (Math.abs(Number(total) - serverTotal) > 1) {
      await supabaseAdmin.from('orders').delete().eq('id', orderData.id);
      console.warn('Price tampering detected', { clientTotal: total, serverTotal });
      return new Response(
        JSON.stringify({ error: 'Order total mismatch — please refresh your cart and try again' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Update the order shell with verified server-side amounts
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .update({
        subtotal: serverSubtotal,
        shipping: safeShipping,
        tax: safeTax,
        discount: safeDiscount,
        total: serverTotal,
      })
      .eq('id', orderData.id)
      .select()
      .single();

    const finalOrder = updatedOrder ?? { ...orderData, subtotal: serverSubtotal, shipping: safeShipping, tax: safeTax, discount: safeDiscount, total: serverTotal };

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      // Still return order since it was created
      return new Response(
        JSON.stringify({ order: finalOrder, items_error: itemsError.message }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        order: finalOrder,
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
