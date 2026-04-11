import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      console.error('RESEND_API_KEY or LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Missing order_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order and verify ownership
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('first_name, email')
      .eq('user_id', user.id)
      .single();

    const customerName = profile?.first_name || 'Customer';
    const customerEmail = profile?.email || user.email;

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'No email found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build items HTML
    const itemsHtml = (order.order_items || [])
      .map((item: any) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">
            <strong>${item.product_name}</strong><br/>
            <span style="color:#666;font-size:13px;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">
            ৳${Number(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>`)
      .join('');

    const addr = order.shipping_address || {};

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#1a2d47;padding:32px;text-align:center;">
          <h1 style="color:#ff8c00;margin:0;font-size:28px;">Eylace</h1>
          <p style="color:#ffffff;margin:8px 0 0;font-size:14px;">Your trusted shopping destination</p>
        </div>
        <div style="padding:32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#e8f5e9;border-radius:50%;padding:16px;margin-bottom:12px;">
              <span style="font-size:32px;">✅</span>
            </div>
            <h2 style="color:#1a2d47;margin:0;">Order Confirmed!</h2>
          </div>
          <p style="color:#666;font-size:15px;line-height:1.6;">
            Hi ${customerName},<br/><br/>
            Thank you for your order! We've received your order and will begin processing it shortly.
            You'll receive updates as your order progresses.
          </p>
          <div style="background:#fafafa;border-radius:8px;padding:16px;margin:20px 0;">
            <h3 style="margin:0 0 4px;color:#1a2d47;font-size:16px;">Order #${order.order_number}</h3>
            <p style="margin:0 0 12px;color:#999;font-size:13px;">Placed on ${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <table style="width:100%;border-collapse:collapse;">
              ${itemsHtml}
            </table>
            <div style="margin-top:12px;padding-top:12px;border-top:2px solid #eee;">
              <table style="width:100%;font-size:14px;">
                <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="text-align:right;">৳${Number(order.subtotal).toFixed(2)}</td></tr>
                <tr><td style="padding:4px 0;color:#666;">Shipping</td><td style="text-align:right;">৳${Number(order.shipping).toFixed(2)}</td></tr>
                <tr><td style="padding:4px 0;color:#666;">Tax</td><td style="text-align:right;">৳${Number(order.tax).toFixed(2)}</td></tr>
                ${order.discount > 0 ? `<tr><td style="padding:4px 0;color:#22c55e;">Discount</td><td style="text-align:right;color:#22c55e;">-৳${Number(order.discount).toFixed(2)}</td></tr>` : ''}
                <tr><td style="padding:8px 0 0;font-weight:bold;font-size:16px;color:#1a2d47;border-top:1px solid #ddd;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:bold;font-size:16px;color:#1a2d47;border-top:1px solid #ddd;">৳${Number(order.total).toFixed(2)}</td></tr>
              </table>
            </div>
          </div>
          ${addr.address ? `
          <div style="background:#f0f7ff;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-size:14px;color:#333;"><strong>📦 Shipping To:</strong></p>
            <p style="margin:4px 0 0;font-size:14px;color:#666;">${addr.firstName || ''} ${addr.lastName || ''}</p>
            <p style="margin:2px 0 0;font-size:14px;color:#666;">${addr.address}${addr.apartment ? ', ' + addr.apartment : ''}</p>
            <p style="margin:2px 0 0;font-size:14px;color:#666;">${addr.city || ''}${addr.state ? ', ' + addr.state : ''} ${addr.zipCode || ''}</p>
          </div>` : ''}
          <div style="background:#fff8e1;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-size:14px;color:#333;"><strong>💳 Payment:</strong> ${order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method?.toUpperCase()}</p>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="https://grand-mall-emporium.lovable.app/orders" style="display:inline-block;padding:14px 36px;background:#ff8c00;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Track Your Order</a>
          </div>
        </div>
        <div style="background:#f5f5f5;padding:20px;text-align:center;">
          <p style="margin:0;color:#999;font-size:12px;">© 2026 Eylace. All rights reserved.</p>
          <p style="margin:4px 0 0;color:#999;font-size:12px;">You're receiving this because you placed an order on Eylace.</p>
        </div>
      </div>
    </body>
    </html>`;

    // Send email via Resend through connector gateway
    const resendRes = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Eylace <onboarding@resend.dev>',
        to: [customerEmail],
        subject: `Order Confirmed! ✅ - Order #${order.order_number}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error('Resend error:', resendData);
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    console.log(`Order confirmation email sent to ${customerEmail} for order ${order.order_number}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send confirmation email' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
