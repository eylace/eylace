import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bkash-signature, x-nagad-signature',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Routes:
 *   POST /bkash         — body: { paymentID, trxID, transactionStatus, amount, merchantInvoiceNumber }
 *                         header: x-bkash-signature = HMAC-SHA256(BKASH_WEBHOOK_SECRET, raw body)
 *   POST /nagad         — body: { order_id, payment_ref_id, status, amount }
 *                         header: x-nagad-signature = HMAC-SHA256(NAGAD_WEBHOOK_SECRET, raw body)
 *   GET  /<gw>/mock-redirect?ref=...&amount=...&result=success|fail
 *                         — used in mock mode to drive the full flow without real gateway creds.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // last two segments after function name might be: ['courier-advance-webhook', 'bkash'] or [..., 'bkash', 'mock-redirect']
  const gateway = (parts.find((p) => ['bkash', 'nagad'].includes(p)) || '').toLowerCase();
  const isMockRedirect = parts.includes('mock-redirect');

  if (!['bkash', 'nagad'].includes(gateway)) return json(404, { error: 'Unknown gateway' });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // ── Mock-redirect helper for end-to-end testing without real gateway ──
  if (isMockRedirect && req.method === 'GET') {
    const ref = url.searchParams.get('ref') || '';
    const amount = Number(url.searchParams.get('amount') || 0);
    const result = url.searchParams.get('result');
    if (!ref) return new Response('Missing ref', { status: 400 });

    if (result === 'success' || result === 'fail') {
      await supabase.rpc('record_courier_advance_event', {
        _gateway: gateway,
        _txn_ref: ref,
        _status: result === 'success' ? 'success' : 'failed',
        _gateway_payment_id: `MOCK-${Date.now()}`,
        _amount: amount,
        _raw: { mock: true, result },
      });
      return new Response(
        `<html><body style="font-family:sans-serif;padding:24px"><h2>${result === 'success' ? '✅ Payment successful' : '❌ Payment failed'}</h2><p>You can close this window.</p><script>setTimeout(()=>window.close(),1500)</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } },
      );
    }
    return new Response(
      `<html><body style="font-family:sans-serif;padding:24px;text-align:center">
        <h2>Mock ${gateway.toUpperCase()} Payment</h2>
        <p>Ref: <code>${ref}</code> · Amount: <strong>৳${amount}</strong></p>
        <p>
          <a href="?ref=${encodeURIComponent(ref)}&amount=${amount}&result=success" style="background:#16a34a;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;margin-right:8px">Pay successfully</a>
          <a href="?ref=${encodeURIComponent(ref)}&amount=${amount}&result=fail" style="background:#dc2626;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">Simulate failure</a>
        </p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } },
    );
  }

  if (req.method !== 'POST') return json(405, { error: 'POST required' });

  const raw = await req.text();

  // Signature verification (skipped in mock mode where no secret configured)
  const secret = gateway === 'bkash'
    ? Deno.env.get('BKASH_WEBHOOK_SECRET')
    : Deno.env.get('NAGAD_WEBHOOK_SECRET');

  if (secret) {
    const sig = req.headers.get(`x-${gateway}-signature`) || '';
    const expected = await hmacHex(secret, raw);
    if (sig.toLowerCase() !== expected.toLowerCase()) {
      return json(401, { error: 'Bad signature' });
    }
  }

  let body: any;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'Invalid JSON' }); }

  // Normalize per gateway
  let txnRef = '', status = '', gatewayPaymentId: string | null = null, amount: number | null = null;
  if (gateway === 'bkash') {
    txnRef = body.merchantInvoiceNumber || body.payerReference || '';
    status = (body.transactionStatus || body.statusCode === '0000' ? 'success' : body.transactionStatus) || '';
    gatewayPaymentId = body.trxID || body.paymentID || null;
    amount = body.amount != null ? Number(body.amount) : null;
    // map common bKash strings
    if (/completed|success/i.test(status)) status = 'success';
    else if (/fail/i.test(status)) status = 'failed';
    else if (/cancel/i.test(status)) status = 'cancelled';
  } else {
    txnRef = body.order_id || body.merchant_order_id || body.payment_ref_id || '';
    status = (body.status || '').toString();
    gatewayPaymentId = body.payment_ref_id || body.issuer_payment_ref || null;
    amount = body.amount != null ? Number(body.amount) : null;
    if (/success|completed/i.test(status)) status = 'success';
    else if (/fail|abort/i.test(status)) status = 'failed';
    else if (/cancel/i.test(status)) status = 'cancelled';
  }

  if (!txnRef || !status) return json(400, { error: 'Missing txn_ref or status' });

  const { data, error } = await supabase.rpc('record_courier_advance_event', {
    _gateway: gateway,
    _txn_ref: txnRef,
    _status: status,
    _gateway_payment_id: gatewayPaymentId,
    _amount: amount,
    _raw: body,
  });
  if (error) return json(200, { ok: false, error: error.message });
  return json(200, { ok: true, payment_id: data });
});