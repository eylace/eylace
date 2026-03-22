import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    let body: any = {}
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
        const { data: roleData } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .in('role', ['admin', 'super_admin'])
          .limit(1)
        isAdmin = !!(roleData && roleData.length > 0)
      }
    }

    // Helper: enrich affiliates with profile data
    const enrichWithProfiles = async (affiliates: any[]) => {
      if (!affiliates || affiliates.length === 0) return affiliates
      const userIds = [...new Set(affiliates.map(a => a.user_id))]
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('user_id, first_name, last_name, email, phone, avatar_url, city, address')
        .in('user_id', userIds)
      const profileMap: Record<string, any> = {}
      if (profiles) profiles.forEach(p => { profileMap[p.user_id] = p })
      return affiliates.map(a => ({ ...a, profile: profileMap[a.user_id] || null }))
    }

    // ========== JOIN ==========
    if (action === 'join' && req.method === 'POST') {
      if (!userId) return json({ error: 'Unauthorized' }, 401)

      const { data: existing } = await adminClient.from('affiliates').select('id, status').eq('user_id', userId).maybeSingle()
      if (existing) return json({ error: 'Already applied', status: existing.status }, 400)

      const code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error } = await adminClient.from('affiliates').insert({
        user_id: userId,
        referral_code: code,
        status: 'pending',
        payment_method: body.payment_method || 'bkash',
        payment_details: body.payment_details || {},
      }).select().single()

      if (error) return json({ error: error.message }, 500)
      return json(data)
    }

    // ========== TRACK CLICK ==========
    if (action === 'track-click' && req.method === 'POST') {
      const { referral_code, landing_page } = body
      const { data: affiliate } = await adminClient.from('affiliates').select('id').eq('referral_code', referral_code).eq('status', 'approved').maybeSingle()
      if (!affiliate) return json({ error: 'Invalid referral' }, 404)

      await adminClient.from('affiliate_clicks').insert({
        affiliate_id: affiliate.id,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || '',
        landing_page: landing_page || '/',
      })

      const { data: aff } = await adminClient.from('affiliates').select('total_clicks').eq('id', affiliate.id).single()
      if (aff) {
        await adminClient.from('affiliates').update({ total_clicks: (aff.total_clicks || 0) + 1 }).eq('id', affiliate.id)
      }

      return json({ success: true })
    }

    // ========== RECORD CONVERSION ==========
    if (action === 'record-conversion' && req.method === 'POST') {
      const { referral_code, order_id, order_total } = body
      const { data: affiliate } = await adminClient.from('affiliates').select('id, commission_rate, total_conversions, total_earnings').eq('referral_code', referral_code).eq('status', 'approved').maybeSingle()
      if (!affiliate) return json({ error: 'Invalid affiliate' }, 404)

      const commission = (order_total * affiliate.commission_rate) / 100

      await adminClient.from('affiliate_conversions').insert({
        affiliate_id: affiliate.id,
        order_id,
        order_total,
        commission_amount: commission,
        status: 'pending',
      })

      await adminClient.from('affiliates').update({
        total_conversions: (affiliate.total_conversions || 0) + 1,
        total_earnings: (affiliate.total_earnings || 0) + commission,
      }).eq('id', affiliate.id)

      return json({ success: true, commission })
    }

    // ========== GET STATS ==========
    if (action === 'stats' && req.method === 'GET') {
      if (!userId) return json({ error: 'Unauthorized' }, 401)

      const { data: affiliate } = await adminClient.from('affiliates').select('*').eq('user_id', userId).maybeSingle()
      if (!affiliate) return json({ affiliate: null })

      const [{ data: conversions }, { data: payouts }, { data: clicks }] = await Promise.all([
        adminClient.from('affiliate_conversions').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(50),
        adminClient.from('affiliate_payouts').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(50),
        adminClient.from('affiliate_clicks').select('id, created_at, landing_page').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(100),
      ])

      return json({ affiliate, conversions: conversions || [], payouts: payouts || [], clicks: clicks || [] })
    }

    // ========== UPDATE SETTINGS ==========
    if (action === 'update-settings' && req.method === 'PUT') {
      if (!userId) return json({ error: 'Unauthorized' }, 401)
      const { payment_method, payment_details } = body
      const { error } = await adminClient.from('affiliates').update({
        payment_method, payment_details, updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    // ========== REQUEST PAYOUT ==========
    if (action === 'request-payout' && req.method === 'POST') {
      if (!userId) return json({ error: 'Unauthorized' }, 401)
      const { data: affiliate } = await adminClient.from('affiliates').select('*').eq('user_id', userId).maybeSingle()
      if (!affiliate || affiliate.status !== 'approved') return json({ error: 'Not approved' }, 403)

      const pendingBalance = (affiliate.total_earnings || 0) - (affiliate.total_paid || 0)
      if (pendingBalance < 500) return json({ error: 'Minimum payout is ৳500' }, 400)

      const { error } = await adminClient.from('affiliate_payouts').insert({
        affiliate_id: affiliate.id, amount: pendingBalance,
        payment_method: affiliate.payment_method, status: 'pending',
      })
      if (error) return json({ error: error.message }, 500)
      return json({ success: true, amount: pendingBalance })
    }

    // ========== ADMIN: LIST ALL AFFILIATES ==========
    if (action === 'admin-list' && req.method === 'GET') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)

      const status = url.searchParams.get('status')
      let query = adminClient.from('affiliates').select('*')
      if (status && status !== 'all') query = query.eq('status', status)
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) return json({ error: error.message }, 500)

      const enriched = await enrichWithProfiles(data || [])
      return json(enriched)
    }

    // ========== ADMIN: GET SINGLE AFFILIATE DETAILS ==========
    if (action === 'admin-detail' && req.method === 'GET') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)

      const id = url.searchParams.get('id')
      if (!id) return json({ error: 'Missing id' }, 400)

      const { data: affiliate } = await adminClient.from('affiliates').select('*').eq('id', id).single()
      if (!affiliate) return json({ error: 'Not found' }, 404)

      // Get profile
      const { data: profile } = await adminClient.from('profiles').select('*').eq('user_id', affiliate.user_id).maybeSingle()

      // Get clicks, conversions, payouts
      const [{ data: clicks }, { data: conversions }, { data: payouts }] = await Promise.all([
        adminClient.from('affiliate_clicks').select('*').eq('affiliate_id', id).order('created_at', { ascending: false }).limit(200),
        adminClient.from('affiliate_conversions').select('*').eq('affiliate_id', id).order('created_at', { ascending: false }).limit(200),
        adminClient.from('affiliate_payouts').select('*').eq('affiliate_id', id).order('created_at', { ascending: false }).limit(100),
      ])

      return json({
        affiliate, profile,
        clicks: clicks || [], conversions: conversions || [], payouts: payouts || [],
      })
    }

    // ========== ADMIN: UPDATE AFFILIATE ==========
    if (action === 'admin-update' && req.method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)

      const { id, status, commission_rate, admin_notes } = body
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (status !== undefined) updateData.status = status
      if (commission_rate !== undefined) updateData.commission_rate = commission_rate
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes

      const { error } = await adminClient.from('affiliates').update(updateData).eq('id', id)
      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    // ========== ADMIN: PROCESS PAYOUT ==========
    if (action === 'admin-payout' && req.method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)

      const { payout_id, status, transaction_id, admin_notes } = body
      await adminClient.from('affiliate_payouts').update({
        status, transaction_id: transaction_id || null, admin_notes: admin_notes || null,
      }).eq('id', payout_id)

      if (status === 'completed') {
        const { data: payout } = await adminClient.from('affiliate_payouts').select('affiliate_id, amount').eq('id', payout_id).single()
        if (payout) {
          const { data: aff } = await adminClient.from('affiliates').select('total_paid').eq('id', payout.affiliate_id).single()
          if (aff) {
            await adminClient.from('affiliates').update({ total_paid: (aff.total_paid || 0) + payout.amount }).eq('id', payout.affiliate_id)
          }
        }
      }

      return json({ success: true })
    }

    // ========== ADMIN: DELETE AFFILIATE ==========
    if (action === 'admin-delete' && req.method === 'DELETE') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const id = url.searchParams.get('id')
      if (!id) return json({ error: 'Missing id' }, 400)

      // Delete related records first
      await adminClient.from('affiliate_clicks').delete().eq('affiliate_id', id)
      await adminClient.from('affiliate_conversions').delete().eq('affiliate_id', id)
      await adminClient.from('affiliate_payouts').delete().eq('affiliate_id', id)
      await adminClient.from('affiliates').delete().eq('id', id)
      return json({ success: true })
    }

    // ========== ADMIN: ALL CONVERSIONS ==========
    if (action === 'admin-conversions' && req.method === 'GET') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const { data } = await adminClient.from('affiliate_conversions').select('*, affiliates(referral_code, user_id)').order('created_at', { ascending: false }).limit(200)
      return json(data || [])
    }

    // ========== ADMIN: ALL PAYOUTS ==========
    if (action === 'admin-payouts' && req.method === 'GET') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const { data } = await adminClient.from('affiliate_payouts').select('*, affiliates(referral_code, user_id)').order('created_at', { ascending: false }).limit(200)
      return json(data || [])
    }

    // ========== ADMIN: UPDATE CONVERSION STATUS ==========
    if (action === 'admin-update-conversion' && req.method === 'PUT') {
      if (!isAdmin) return json({ error: 'Forbidden' }, 403)
      const { conversion_id, status } = body
      await adminClient.from('affiliate_conversions').update({ status }).eq('id', conversion_id)
      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('affiliate-manage error:', err)
    return json({ error: err.message || 'Internal error' }, 500)
  }
})
