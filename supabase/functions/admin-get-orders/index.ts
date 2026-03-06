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
       .eq('role', 'admin')
       .single();
 
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
 
     // Fetch profiles for orders
     const userIds = [...new Set(orders?.map(o => o.user_id) || [])];
     const { data: profiles } = await supabaseAdmin
       .from('profiles')
       .select('user_id, first_name, last_name, email')
       .in('user_id', userIds);
 
     const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
 
     const ordersWithProfiles = orders?.map(order => ({
       ...order,
       profile: profileMap.get(order.user_id) || null
     }));
 
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