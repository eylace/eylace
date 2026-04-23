import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Use a per-user client so the RPC runs with the caller's auth.uid().
    // The RPC itself enforces the order-ownership check and returns the URL
    // ONLY when the authenticated user owns a fulfilled order containing
    // the requested product.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: claims, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace('Bearer ', ''),
    )
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { product_id, order_id } = await req.json()
    if (!product_id || !order_id) {
      return new Response(JSON.stringify({ error: 'product_id and order_id are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await userClient.rpc('get_digital_download_url', {
      _product_id: product_id,
      _order_id: order_id,
    })

    if (error) {
      // RPC raises 42501 ("Not authorized") for ownership failures
      const status = String(error.code) === '42501' ? 403 : 500
      return new Response(JSON.stringify({ error: error.message }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row?.download_url) {
      return new Response(JSON.stringify({ error: 'Digital file not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      download_url: row.download_url,
      product_name: row.product_name,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
