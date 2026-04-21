import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ORDER_ACCESS_ROLES = ['super_admin', 'admin', 'order_manager', 'support_manager', 'moderator'];

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeShippingAddress = (shippingAddress: unknown) => {
  const address = typeof shippingAddress === 'object' && shippingAddress !== null
    ? shippingAddress as Record<string, unknown>
    : {};

  return {
    first_name: normalizeText(address.first_name ?? address.firstName),
    last_name: normalizeText(address.last_name ?? address.lastName),
    email: normalizeText(address.email),
    phone: normalizeText(address.phone),
  };
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

    const { orderId, status, carrier, tracking_number, shipping_address, reason, actor_role: actorRoleOverride } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId' }),
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

    // Check if user has at least one allowed admin role
    const { data: roleRows, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ORDER_ACCESS_ROLES)
      .limit(1);

    if (roleError) {
      console.error('Error checking admin update access role:', roleError);
    }

    if (roleError || !roleRows || roleRows.length === 0) {
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

    const updateData: any = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (carrier) updateData.carrier = carrier;
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (shipping_address && typeof shipping_address === 'object') updateData.shipping_address = shipping_address;

    if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
      updateData.estimated_delivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    // Auto-track who is performing this action (Assigned To)
    try {
      const { data: roleInfo } = await supabaseAdmin
        .rpc('get_user_role_and_name', { _user_id: user.id });
      const info = Array.isArray(roleInfo) ? roleInfo[0] : roleInfo;
      if (info) {
        updateData.assigned_user_id = user.id;
        updateData.assigned_user_name = info.display_name || 'Unknown';
        updateData.assigned_role = info.role_name || 'admin';
        updateData.assigned_at = new Date().toISOString();
      }
    } catch (e) {
      console.warn('Could not resolve user role for assignment:', e);
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
      packaging: 'Order items are being packaged',
      ready_to_ship: 'Order is packed and ready for courier pickup',
      sent_to_courier: `Order handed over to courier${carrier ? ` (${carrier})` : ''}`,
      shipped: `Order has been shipped${carrier ? ` via ${carrier}` : ''}${tracking_number ? ` (Tracking: ${tracking_number})` : ''}`,
      out_for_delivery: 'Order is out for delivery to your address',
      delivered: 'Order has been delivered',
      completed: 'Order has been completed',
      fulfilled: 'Order has been fully fulfilled',
      returned: 'Order has been returned by the customer',
      refunded: 'Refund has been processed for this order',
      failed: 'Order delivery has failed',
      cancelled: 'Order has been cancelled',
    };

    if (status) {
      const actorName = updateData.assigned_user_name || 'Admin';
      const actorRole = actorRoleOverride || updateData.assigned_role || 'admin';
      const baseDescription = statusDescriptions[status] || `Status updated to ${status}`;
      const reasonSuffix = reason ? ` — Reason: ${reason}` : '';
      const actorSuffix = ` (by ${actorName} · ${actorRole})`;
      await supabaseAdmin
        .from('order_tracking_events')
        .insert({
          order_id: orderId,
          status,
          description: `${baseDescription}${reasonSuffix}${actorSuffix}`,
          location: actorRole,
        });
    }

    // Get user email for notification
    const shippingAddress = normalizeShippingAddress(order.shipping_address);
    let profile: { email: string | null; first_name: string | null } | null = null;

    if (order.user_id) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('email, first_name')
        .eq('user_id', order.user_id)
        .maybeSingle();

      profile = profileData;
    }

    const recipientEmail = profile?.email || order.guest_email || shippingAddress.email;
    const recipientName = profile?.first_name || shippingAddress.first_name || 'there';

    // Send email notification for all status changes
    if (recipientEmail && Deno.env.get('RESEND_API_KEY')) {
      try {
        const name = recipientName;
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

        const emailContent = status ? statusMessages[status] : null;
        if (emailContent) {
          await resend.emails.send({
            from: 'Eylace <noreply@resend.dev>',
            to: [recipientEmail],
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
