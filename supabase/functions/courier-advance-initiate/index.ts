import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/**
 * Initiate a courier-advance payment.
 * Body: { order_id?: string, gateway: 'bkash'|'nagad', zone?: string, shipping?: number }
 * - Computes amount via DB RPC `compute_courier_advance_amount`.
 * - Creates a `courier_advance_payments` row in `initiated` state.
 * - In MOCK mode (no gateway secrets) returns a fake redirect URL that POSTs to the webhook
 *   so the full flow can be exercised end-to-end without real credentials.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  try {
    const body = await req.json().catch(() => ({}));
    const gateway = String(body.gateway || '').toLowerCase();
    if (!['bkash', 'nagad'].includes(gateway)) return json(400, { error: 'gateway must be bkash|nagad' });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    // Resolve user from JWT (optional — guests allowed)
    let userId: string | null = null;
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
      userId = user?.id ?? null;
    }

    // Compute amount
    const { data: amt, error: aErr } = await supabase.rpc('compute_courier_advance_amount', {
      _zone: body.zone ?? null,
      _shipping: Number(body.shipping ?? 0),
    });
    if (aErr) return json(500, { error: aErr.message });
    const amount = Number(amt || 0);
    if (amount <= 0) return json(400, { error: 'Advance courier charge disabled or zero' });

    const txnRef = `ADV-${gateway.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { data: pid, error: cErr } = await supabase.rpc('create_courier_advance_payment', {
      _order_id: body.order_id ?? null,
      _user_id: userId,
      _gateway: gateway,
      _txn_ref: txnRef,
      _amount: amount,
    });
    if (cErr) return json(500, { error: cErr.message });

    // Live credentials check
    const liveSecret =
      gateway === 'bkash' ? Deno.env.get('BKASH_APP_KEY') : Deno.env.get('NAGAD_MERCHANT_ID');
    const mode = liveSecret ? 'live' : 'mock';

    // For now (no real creds yet) return a mock redirect URL that, when visited, lets
    // the customer simulate success/fail; the front-end calls back into the webhook.
    const projectRef = (Deno.env.get('SUPABASE_URL') || '').match(/https:\/\/([^.]+)/)?.[1];
    const webhookBase = `https://${projectRef}.functions.supabase.co/courier-advance-webhook`;

    return json(200, {
      payment_id: pid,
      txn_ref: txnRef,
      amount,
      gateway,
      mode,
      redirect_url: `${webhookBase}/${gateway}/mock-redirect?ref=${encodeURIComponent(txnRef)}&amount=${amount}`,
    });
  } catch (e) {
    console.error('[courier-advance-initiate]', e);
    return json(500, { error: (e as Error).message });
  }
});