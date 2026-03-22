import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    
    let body = {}
    if (req.method !== 'GET') {
      try { body = await req.json() } catch { body = {} }
    }

    // Auth check
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    let isAdmin = false

    const adminClient = createClient(supabaseUrl, serviceKey)

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await adminClient.auth.getUser(token)
      if (user && !userError) {
        userId = user.id
        // Check admin role
        const { data: roleData } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .in('role', ['admin', 'super_admin'])
          .limit(1)
        isAdmin = (roleData && roleData.length > 0) || false
      }
    }

    const adminClient = createClient(supabaseUrl, serviceKey)

    // ========== JOIN ==========
    if (action === 'join' && req.method === 'POST') {
      if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

      // Check if already applied
      const { data: existing } = await adminClient.from('affiliates').select('id, status').eq('user_id', userId).maybeSingle()
      if (existing) {
        return new Response(JSON.stringify({ error: 'Already applied', status: existing.status }), { status: 400, headers: corsHeaders })
      }

      // Generate unique referral code
      const code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error } = await adminClient.from('affiliates').insert({
        user_id: userId,
        referral_code: code,
        status: 'pending',
        payment_method: body.payment_method || 'bkash',
        payment_details: body.payment_details || {},
      }).select().single()

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== TRACK CLICK ==========
    if (action === 'track-click' && req.method === 'POST') {
      const { referral_code, landing_page } = body

      const { data: affiliate } = await adminClient.from('affiliates').select('id').eq('referral_code', referral_code).eq('status', 'approved').maybeSingle()
      if (!affiliate) return new Response(JSON.stringify({ error: 'Invalid referral' }), { status: 404, headers: corsHeaders })

      await adminClient.from('affiliate_clicks').insert({
        affiliate_id: affiliate.id,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || '',
        landing_page: landing_page || '/',
      })

      // Increment click count
      await adminClient.rpc('increment_affiliate_clicks', { aff_id: affiliate.id }).catch(() => {
        // Fallback: manual update
        adminClient.from('affiliates').update({ total_clicks: affiliate.id }).eq('id', affiliate.id)
      })

      // Actually just do a raw update
      const { data: aff } = await adminClient.from('affiliates').select('total_clicks').eq('id', affiliate.id).single()
      if (aff) {
        await adminClient.from('affiliates').update({ total_clicks: (aff.total_clicks || 0) + 1 }).eq('id', affiliate.id)
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== RECORD CONVERSION ==========
    if (action === 'record-conversion' && req.method === 'POST') {
      const { referral_code, order_id, order_total } = body

      const { data: affiliate } = await adminClient.from('affiliates').select('id, commission_rate, total_conversions, total_earnings').eq('referral_code', referral_code).eq('status', 'approved').maybeSingle()
      if (!affiliate) return new Response(JSON.stringify({ error: 'Invalid affiliate' }), { status: 404, headers: corsHeaders })

      const commission = (order_total * affiliate.commission_rate) / 100

      await adminClient.from('affiliate_conversions').insert({
        affiliate_id: affiliate.id,
        order_id,
        order_total,
        commission_amount: commission,
        status: 'pending',
      })

      // Update affiliate stats
      await adminClient.from('affiliates').update({
        total_conversions: (affiliate.total_conversions || 0) + 1,
        total_earnings: (affiliate.total_earnings || 0) + commission,
      }).eq('id', affiliate.id)

      return new Response(JSON.stringify({ success: true, commission }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== GET STATS (for affiliate dashboard) ==========
    if (action === 'stats' && req.method === 'GET') {
      if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

      const { data: affiliate } = await adminClient.from('affiliates').select('*').eq('user_id', userId).maybeSingle()
      if (!affiliate) return new Response(JSON.stringify({ affiliate: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const { data: conversions } = await adminClient.from('affiliate_conversions').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(50)
      const { data: payouts } = await adminClient.from('affiliate_payouts').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(50)
      const { data: clicks } = await adminClient.from('affiliate_clicks').select('id, created_at, landing_page').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(100)

      return new Response(JSON.stringify({ affiliate, conversions: conversions || [], payouts: payouts || [], clicks: clicks || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== UPDATE SETTINGS (affiliate updates own payment info) ==========
    if (action === 'update-settings' && req.method === 'PUT') {
      if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

      const { payment_method, payment_details } = body
      const { error } = await adminClient.from('affiliates').update({
        payment_method,
        payment_details,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== REQUEST PAYOUT ==========
    if (action === 'request-payout' && req.method === 'POST') {
      if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

      const { data: affiliate } = await adminClient.from('affiliates').select('*').eq('user_id', userId).maybeSingle()
      if (!affiliate || affiliate.status !== 'approved') return new Response(JSON.stringify({ error: 'Not approved' }), { status: 403, headers: corsHeaders })

      const pendingBalance = (affiliate.total_earnings || 0) - (affiliate.total_paid || 0)
      if (pendingBalance < 500) return new Response(JSON.stringify({ error: 'Minimum payout is ৳500' }), { status: 400, headers: corsHeaders })

      const { error } = await adminClient.from('affiliate_payouts').insert({
        affiliate_id: affiliate.id,
        amount: pendingBalance,
        payment_method: affiliate.payment_method,
        status: 'pending',
      })

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true, amount: pendingBalance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== ADMIN: LIST ALL AFFILIATES ==========
    if (action === 'admin-list' && req.method === 'GET') {
      if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })

      const status = url.searchParams.get('status')
      let query = adminClient.from('affiliates').select('*, profiles!affiliates_user_id_fkey(first_name, last_name, email, phone)')

      if (status && status !== 'all') query = query.eq('status', status)
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        // Fallback without join
        const { data: fallback } = await adminClient.from('affiliates').select('*').order('created_at', { ascending: false })
        return new Response(JSON.stringify(fallback || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== ADMIN: UPDATE AFFILIATE ==========
    if (action === 'admin-update' && req.method === 'PUT') {
      if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })

      const { id, status, commission_rate, admin_notes } = body
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (status !== undefined) updateData.status = status
      if (commission_rate !== undefined) updateData.commission_rate = commission_rate
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes

      const { error } = await adminClient.from('affiliates').update(updateData).eq('id', id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== ADMIN: PROCESS PAYOUT ==========
    if (action === 'admin-payout' && req.method === 'PUT') {
      if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })

      const { payout_id, status, transaction_id, admin_notes } = body
      await adminClient.from('affiliate_payouts').update({
        status,
        transaction_id: transaction_id || null,
        admin_notes: admin_notes || null,
      }).eq('id', payout_id)

      // If completed, update affiliate total_paid
      if (status === 'completed') {
        const { data: payout } = await adminClient.from('affiliate_payouts').select('affiliate_id, amount').eq('id', payout_id).single()
        if (payout) {
          const { data: aff } = await adminClient.from('affiliates').select('total_paid').eq('id', payout.affiliate_id).single()
          if (aff) {
            await adminClient.from('affiliates').update({ total_paid: (aff.total_paid || 0) + payout.amount }).eq('id', payout.affiliate_id)
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== ADMIN: DELETE AFFILIATE ==========
    if (action === 'admin-delete' && req.method === 'DELETE') {
      if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })

      const id = url.searchParams.get('id')
      if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders })

      await adminClient.from('affiliates').delete().eq('id', id)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== ADMIN: ALL CONVERSIONS ==========
    if (action === 'admin-conversions' && req.method === 'GET') {
      if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })

      const { data } = await adminClient.from('affiliate_conversions').select('*, affiliates(referral_code, user_id)').order('created_at', { ascending: false }).limit(200)
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== ADMIN: ALL PAYOUTS ==========
    if (action === 'admin-payouts' && req.method === 'GET') {
      if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })

      const { data } = await adminClient.from('affiliate_payouts').select('*, affiliates(referral_code, user_id)').order('created_at', { ascending: false }).limit(200)
      return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ========== ADMIN: UPDATE CONVERSION STATUS ==========
    if (action === 'admin-update-conversion' && req.method === 'PUT') {
      if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })

      const { conversion_id, status } = body
      await adminClient.from('affiliate_conversions').update({ status }).eq('id', conversion_id)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
