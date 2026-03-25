import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const body = await req.json();
      const action = body._action || body.action;
      
      if (action === 'update' || action === 'put') {
        return await handleUpdate(supabaseAdmin, body);
      } else if (action === 'delete') {
        return await handleDelete(supabaseAdmin, body);
      }
      // Default: treat as GET (fetch all returns)
      return await handleGet(supabaseAdmin);
    }

    if (req.method === 'GET') {
      return await handleGet(supabaseAdmin);
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      return await handleUpdate(supabaseAdmin, body);
    }

    if (req.method === 'DELETE') {
      const body = await req.json();
      return await handleDelete(supabaseAdmin, body);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-manage-returns:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGet(supabaseAdmin: any) {
  const { data: returns, error } = await supabaseAdmin
    .from('return_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const orderIds = [...new Set(returns?.map((r: any) => r.order_id) || [])];
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, user_id')
    .in('id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']);

  const itemIds = returns?.map((r: any) => r.order_item_id).filter(Boolean) || [];
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('id, product_name, product_image, price, quantity')
    .in('id', itemIds.length ? itemIds : ['00000000-0000-0000-0000-000000000000']);

  const userIds = [...new Set(returns?.map((r: any) => r.user_id) || [])];
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('user_id, first_name, last_name, email')
    .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

  const orderMap = new Map(orders?.map((o: any) => [o.id, o]) || []);
  const itemMap = new Map(items?.map((i: any) => [i.id, i]) || []);
  const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

  const enriched = returns?.map((r: any) => ({
    ...r,
    order: orderMap.get(r.order_id) || null,
    item: itemMap.get(r.order_item_id) || null,
    profile: profileMap.get(r.user_id) || null,
  }));

  return new Response(JSON.stringify({ returns: enriched }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleUpdate(supabaseAdmin: any, body: any) {
  const { id, status, admin_notes, refund_amount } = body;
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing return request id' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updateData.status = status;
  if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
  if (refund_amount !== undefined) updateData.refund_amount = refund_amount;
  if (status === 'refunded' || status === 'rejected') {
    updateData.resolved_at = new Date().toISOString();
  }

  console.log('Updating return request:', id, 'with data:', JSON.stringify(updateData));

  const { data, error } = await supabaseAdmin
    .from('return_requests')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Update error:', error);
    throw error;
  }

  console.log('Update successful:', JSON.stringify(data));

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleDelete(supabaseAdmin: any, body: any) {
  const { error } = await supabaseAdmin
    .from('return_requests')
    .delete()
    .eq('id', body.id);

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
