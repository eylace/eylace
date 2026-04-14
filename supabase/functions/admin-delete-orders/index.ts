import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ORDER_ACCESS_ROLES = ['super_admin', 'admin', 'order_manager', 'support_manager', 'moderator'];

const normalizeOrderIds = (payload: { orderId?: unknown; orderIds?: unknown }) => {
  const rawIds = Array.isArray(payload.orderIds)
    ? payload.orderIds
    : payload.orderId
      ? [payload.orderId]
      : [];

  return [...new Set(
    rawIds
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean),
  )];
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderIds = normalizeOrderIds(body);

    if (orderIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing orderIds' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: roleRows, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ORDER_ACCESS_ROLES)
      .limit(1);

    if (roleError) {
      console.error('Error checking admin delete access role:', roleError);
    }

    if (roleError || !roleRows || roleRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: deletedOrders, error: deleteError } = await supabaseAdmin
      .from('orders')
      .delete()
      .in('id', orderIds)
      .select('id, order_number');

    if (deleteError) {
      console.error('Error deleting orders:', deleteError);
      throw deleteError;
    }

    const deletedIds = deletedOrders?.map((order) => order.id) ?? [];

    if (deletedIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No matching orders found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Deleted ${deletedIds.length} order(s) by admin ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, deletedIds, deletedCount: deletedIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in admin-delete-orders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});