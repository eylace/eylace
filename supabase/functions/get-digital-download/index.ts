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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify the user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { product_id } = await req.json()
    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user has a completed order containing this product
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select('id, order_id, orders!inner(user_id, status)')
      .eq('product_id', product_id)
      .eq('orders.user_id', user.id)
      .in('orders.status', ['delivered', 'completed', 'shipped', 'processing'])
      .limit(1)

    if (orderError) {
      console.error('Order check error:', orderError)
      return new Response(JSON.stringify({ error: 'Failed to verify purchase' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!orderItems || orderItems.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid purchase found for this product' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the digital file URL (using service role to bypass RLS/view)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('digital_file_url, name')
      .eq('id', product_id)
      .eq('is_digital', true)
      .single()

    if (productError || !product?.digital_file_url) {
      return new Response(JSON.stringify({ error: 'Digital file not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ 
      download_url: product.digital_file_url,
      product_name: product.name 
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
