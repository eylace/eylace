import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // User client to get user
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admin client for privileged ops
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { coupon_id, order_id } = await req.json();

    if (!coupon_id || !order_id) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate order belongs to the authenticated user
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, subtotal')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch and validate coupon server-side
    const { data: coupon, error: couponError } = await adminClient
      .from('coupons')
      .select('*')
      .eq('id', coupon_id)
      .single();

    if (couponError || !coupon) {
      return new Response(JSON.stringify({ error: 'Coupon not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check coupon is active
    if (!coupon.is_active) {
      return new Response(JSON.stringify({ error: 'Coupon is not active' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Coupon has expired' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return new Response(JSON.stringify({ error: 'Coupon usage limit reached' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if user already used this coupon
    const { data: existingUsage } = await adminClient
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', coupon_id)
      .eq('user_id', user.id)
      .limit(1);

    if (existingUsage && existingUsage.length > 0) {
      return new Response(JSON.stringify({ error: 'You have already used this coupon' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check min order amount
    const subtotal = Number(order.subtotal);
    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
      return new Response(JSON.stringify({ error: `Minimum order amount is ${coupon.min_order_amount}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Calculate discount server-side
    let discountAmount: number;
    if (coupon.discount_type === 'percentage') {
      discountAmount = subtotal * (coupon.discount_value / 100);
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else {
      discountAmount = coupon.discount_value;
    }
    discountAmount = Math.min(discountAmount, subtotal);

    // Record usage
    await adminClient.from('coupon_usage').insert({
      coupon_id,
      user_id: user.id,
      order_id,
      discount_amount: discountAmount,
    });

    // Increment used_count
    await adminClient.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon_id);

    return new Response(JSON.stringify({ success: true, discount_amount: discountAmount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
