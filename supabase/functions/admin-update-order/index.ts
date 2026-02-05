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
     const token = authHeader.replace('Bearer ', '');
     const { data: claims, error: claimsError } = await supabaseClient.auth.getClaims(token);
     
     if (claimsError || !claims?.claims?.sub) {
       return new Response(
         JSON.stringify({ error: 'Unauthorized' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const userId = claims.claims.sub;
 
     // Check if user is admin
     const { data: roleData, error: roleError } = await supabaseClient
       .from('user_roles')
       .select('role')
       .eq('user_id', userId)
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
       processing: 'Order is being prepared for shipment',
       shipped: `Order has been shipped${carrier ? ` via ${carrier}` : ''}${tracking_number ? ` (Tracking: ${tracking_number})` : ''}`,
       out_for_delivery: 'Order is out for delivery',
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
 
     // Send email notification
     if (profile?.email && Deno.env.get('RESEND_API_KEY')) {
       try {
         const statusMessages: Record<string, { subject: string; body: string }> = {
           processing: {
             subject: `Your order #${order.order_number} is being processed`,
             body: `Hi ${profile.first_name || 'there'},\n\nGreat news! Your order #${order.order_number} is now being processed and will be shipped soon.\n\nThank you for shopping with us!`
           },
           shipped: {
             subject: `Your order #${order.order_number} has been shipped!`,
             body: `Hi ${profile.first_name || 'there'},\n\nYour order #${order.order_number} is on its way!${tracking_number ? `\n\nTracking Number: ${tracking_number}` : ''}${carrier ? `\nCarrier: ${carrier}` : ''}\n\nThank you for shopping with us!`
           },
           delivered: {
             subject: `Your order #${order.order_number} has been delivered`,
             body: `Hi ${profile.first_name || 'there'},\n\nYour order #${order.order_number} has been delivered! We hope you love your purchase.\n\nThank you for shopping with us!`
           },
         };
 
         const emailContent = statusMessages[status];
         if (emailContent) {
           await resend.emails.send({
             from: 'ShopHub <noreply@resend.dev>',
             to: [profile.email],
             subject: emailContent.subject,
             text: emailContent.body,
           });
           console.log(`Email notification sent for order ${order.order_number} status: ${status}`);
         }
       } catch (emailError) {
         console.error('Error sending email notification:', emailError);
         // Don't fail the request if email fails
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