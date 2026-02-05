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
 
     const { reviewId } = await req.json();
 
     if (!reviewId) {
       return new Response(
         JSON.stringify({ error: 'Missing reviewId' }),
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
 
     // Use service role to delete review
     const supabaseAdmin = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     );
 
     const { error: deleteError } = await supabaseAdmin
       .from('product_reviews')
       .delete()
       .eq('id', reviewId);
 
     if (deleteError) {
       console.error('Error deleting review:', deleteError);
       throw deleteError;
     }
 
     console.log(`Review ${reviewId} deleted by admin ${userId}`);
 
     return new Response(
       JSON.stringify({ success: true }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Error in admin-delete-review:', error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });