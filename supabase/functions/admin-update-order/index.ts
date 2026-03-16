import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, status, carrier, tracking_number } = await req.json();

    if (!orderId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to update order
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const updateData: any = { status, updated_at: new Date().toISOString() };
    
    if (carrier) updateData.carrier = carrier;
    if (tracking_number) updateData.tracking_number = tracking_number;
    
    if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
      updateData.estimated_delivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    // Add tracking event
    const statusDescriptions: Record<string, string> = {
      pending: 'Order has been placed and is awaiting processing',
      confirmed: 'Order has been confirmed and accepted',
      processing: 'Order is being prepared for shipment',
      shipped: `Order has been shipped${carrier ? ` via ${carrier}` : ''}${tracking_number ? ` (Tracking: ${tracking_number})` : ''}`,
      out_for_delivery: 'Order is out for delivery to your address',
      delivered: 'Order has been delivered',
      cancelled: 'Order has been cancelled',
    };

    await supabaseAdmin
      .from('order_tracking_events')
      .insert({
        order_id: orderId,
        status,
        description: statusDescriptions[status] || `Status updated to ${status}`,
      });

    // Get user email for notification
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, first_name')
      .eq('user_id', order.user_id)
      .single();

    // Send email notification for all status changes
    if (profile?.email && Deno.env.get('RESEND_API_KEY')) {
      try {
        const name = profile.first_name || 'there';
        const orderNum = order.order_number;

        const statusMessages: Record<string, { subject: string; body: string }> = {
          confirmed: {
            subject: `Your order #${orderNum} has been confirmed! ✅`,
            body: `Hi ${name},\n\nGreat news! Your order #${orderNum} has been confirmed and accepted. We will start processing it shortly.\n\nThank you for shopping with us!`
          },
          processing: {
            subject: `Your order #${orderNum} is being processed`,
            body: `Hi ${name},\n\nGreat news! Your order #${orderNum} is now being processed and will be shipped soon.\n\nThank you for shopping with us!`
          },
          shipped: {
            subject: `Your order #${orderNum} has been shipped! 🚚`,
            body: `Hi ${name},\n\nYour order #${orderNum} is on its way!${tracking_number ? `\n\nTracking Number: ${tracking_number}` : ''}${carrier ? `\nCarrier: ${carrier}` : ''}\n\nThank you for shopping with us!`
          },
          out_for_delivery: {
            subject: `Your order #${orderNum} is out for delivery! 📦`,
            body: `Hi ${name},\n\nExciting news! Your order #${orderNum} is out for delivery and will arrive soon. Please make sure someone is available to receive it.\n\nThank you for shopping with us!`
          },
          delivered: {
            subject: `Your order #${orderNum} has been delivered ✅`,
            body: `Hi ${name},\n\nYour order #${orderNum} has been delivered! We hope you love your purchase.\n\nThank you for shopping with us!`
          },
          cancelled: {
            subject: `Your order #${orderNum} has been cancelled`,
            body: `Hi ${name},\n\nWe're sorry to inform you that your order #${orderNum} has been cancelled. If you did not request this, please contact our support team.\n\nThank you for your understanding.`
          },
        };

        const emailContent = statusMessages[status];
        if (emailContent) {
          await resend.emails.send({
            from: 'Eylace <noreply@resend.dev>',
            to: [profile.email],
            subject: emailContent.subject,
            text: emailContent.body,
          });
          console.log(`Email notification sent for order ${orderNum} status: ${status}`);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }

    console.log(`Order ${orderId} updated to status: ${status}`);

    return new Response(
      JSON.stringify({ success: true, order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-update-order:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
