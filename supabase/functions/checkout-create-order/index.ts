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
      shipping: _clientShippingIgnored,
      tax: _clientTaxIgnored,
      coupon_code,
      total,
      payment_method,
      shipping_address,
      guest_email,
      guest_phone,
      items,
      advance_courier_payment_ref,
      advance_courier_amount: _clientAdvanceAmountIgnored,
      carrier: clientCarrier,
      delivery_zone: clientZone,
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

    // Optional: advance courier-charge prepaid online (COD orders).
    // Verify the referenced payment actually completed successfully and
    // read the trusted amount from the DB — never from the client body.
    let verifiedAdvanceAmount = 0;
    if (advance_courier_payment_ref) {
      const ref = String(advance_courier_payment_ref);
      const { data: advPayment, error: advErr } = await supabaseAdmin
        .from('courier_advance_payments')
        .select('id, amount, status, order_id')
        .eq('txn_ref', ref)
        .maybeSingle();
      if (advErr || !advPayment || advPayment.status !== 'success') {
        return new Response(
          JSON.stringify({ error: 'Advance courier payment not verified' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (advPayment.order_id) {
        return new Response(
          JSON.stringify({ error: 'Advance courier payment already used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      verifiedAdvanceAmount = Math.max(0, Number(advPayment.amount) || 0);
      orderPayload.advance_courier_payment_ref = ref;
      orderPayload.advance_courier_amount = verifiedAdvanceAmount;
    }

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
    // Shipping is authoritative server-side via courier_expense_settings
    // Customer delivery charge (same rule the checkout page shows): inside Dhaka 80, else 150.
    const cityRaw = String(shipping_address?.city ?? shipping_address?.district ?? '').trim().toLowerCase();
    const zone = clientZone === 'inside_dhaka' || clientZone === 'outside_dhaka'
      ? clientZone
      : (cityRaw === 'dhaka' ? 'inside_dhaka' : 'outside_dhaka');
    const safeShipping = zone === 'inside_dhaka' ? 80 : 150;
    void clientCarrier;
    // Tax is not client-supplied. If a future config introduces tax, compute it
    // server-side from system_settings here.
    const safeTax = 0;

    // Server-side coupon validation — never trust client-supplied discount
    let safeDiscount = 0;
    if (coupon_code && typeof coupon_code === 'string') {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon_code)
        .eq('is_active', true)
        .maybeSingle();
      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
        const underLimit = !coupon.usage_limit || (coupon.used_count || 0) < coupon.usage_limit;
        const meetsMin = !coupon.min_order_amount || serverSubtotal >= Number(coupon.min_order_amount);
        if (notExpired && underLimit && meetsMin) {
          let d = coupon.discount_type === 'percentage'
            ? serverSubtotal * (Number(coupon.discount_value) / 100)
            : Number(coupon.discount_value);
          if (coupon.max_discount && d > Number(coupon.max_discount)) d = Number(coupon.max_discount);
          safeDiscount = Math.max(0, Math.min(d, serverSubtotal));
        }
      }
    }

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
      // Roll back the order shell and return a generic error — do not leak
      // internal database error messages to the client.
      await supabaseAdmin.from('orders').delete().eq('id', orderData.id);
      return new Response(
        JSON.stringify({ error: 'Failed to save order items. Please try again or contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Link the verified advance payment to the created order so it cannot be reused.
    if (advance_courier_payment_ref) {
      await supabaseAdmin
        .from('courier_advance_payments')
        .update({ order_id: orderData.id })
        .eq('txn_ref', String(advance_courier_payment_ref))
        .is('order_id', null);
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
