 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
 
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
    address: normalizeText(address.address),
    apartment: normalizeText(address.apartment),
    city: normalizeText(address.city),
    state: normalizeText(address.state),
    zip_code: normalizeText(address.zip_code ?? address.zipCode),
    country: normalizeText(address.country),
  };
};
 
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

      const userId = user.id;
 
     // Check if user is admin
      const { data: roleData, error: roleError } = await supabaseClient
       .from('user_roles')
       .select('role')
       .eq('user_id', userId)
        .in('role', ORDER_ACCESS_ROLES)
        .maybeSingle();
 
     if (roleError || !roleData) {
       return new Response(
         JSON.stringify({ error: 'Forbidden - Admin access required' }),
         { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Use service role to fetch all orders
     const supabaseAdmin = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     );
 
     const { data: orders, error: ordersError } = await supabaseAdmin
       .from('orders')
       .select(`
         *,
         items:order_items(*)
       `)
       .order('created_at', { ascending: false });
 
     if (ordersError) {
       console.error('Error fetching orders:', ordersError);
       throw ordersError;
     }
 
      // Fetch profiles for orders (only for non-guest orders)
      const userIds = [...new Set(orders?.filter(o => o.user_id).map(o => o.user_id) || [])];
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
           .select('user_id, first_name, last_name, email, phone')
          .in('user_id', userIds);
        profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      }

       const ordersWithProfiles = orders?.map(order => {
         const profile = order.user_id ? profileMap.get(order.user_id) : null;
         const shippingAddress = normalizeShippingAddress(order.shipping_address);

         return {
           ...order,
           shipping_address: shippingAddress,
           profile: {
             first_name: profile?.first_name || shippingAddress.first_name || 'Guest',
             last_name: profile?.last_name || shippingAddress.last_name || '',
             email: profile?.email || order.guest_email || shippingAddress.email || 'N/A',
             phone: profile?.phone || order.guest_phone || shippingAddress.phone || null,
           },
         };
       });
 
     console.log(`Fetched ${orders?.length || 0} orders for admin`);
 
     return new Response(
       JSON.stringify({ orders: ordersWithProfiles }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Error in admin-get-orders:', error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });