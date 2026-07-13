import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pathao-signature, x-shiprocket-signature',
};

const json = (status: number, body: any) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Webhook receiver for courier providers.
 * Routes:
 *   POST  /pathao      — body: Pathao webhook event JSON
 *   POST  /steadfast   — body: Steadfast webhook event JSON
 *   POST  /shiprocket  — body: Shiprocket webhook event JSON
 * Auth:
 *   Pathao     → header `X-PATHAO-SIGNATURE` = HMAC-SHA256(secret, raw body)
 *   Shiprocket → header `X-Shiprocket-Signature` MUST equal SHIPROCKET_WEBHOOK_TOKEN
 *   Steadfast  → has no signature; require `?token=` query param matching STEADFAST_WEBHOOK_TOKEN
 * Response: { ok, event_id }
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const provider = url.pathname.split('/').filter(Boolean).pop()?.toLowerCase() || '';
    if (!['pathao', 'steadfast', 'shiprocket'].includes(provider)) {
      return json(404, { ok: false, error: 'Unknown provider path' });
    }
    if (req.method !== 'POST') return json(405, { ok: false, error: 'POST required' });

    const raw = await req.text();

    // ─── Verify signature ──────────────────────────────────────
    if (provider === 'pathao') {
      const secret = Deno.env.get('PATHAO_WEBHOOK_SECRET') || '';
      const sig = req.headers.get('x-pathao-signature') || '';
      if (!secret || !sig) return json(401, { ok: false, error: 'Missing signature' });
      const expected = await hmacHex(secret, raw);
      if (sig.toLowerCase() !== expected.toLowerCase()) return json(401, { ok: false, error: 'Bad signature' });
    } else if (provider === 'shiprocket') {
      const token = Deno.env.get('SHIPROCKET_WEBHOOK_TOKEN') || '';
      const got = req.headers.get('x-shiprocket-signature') || url.searchParams.get('token') || '';
      if (!token || got !== token) return json(401, { ok: false, error: 'Bad token' });
    } else if (provider === 'steadfast') {
      const token = Deno.env.get('STEADFAST_WEBHOOK_TOKEN') || '';
      const got = url.searchParams.get('token') || '';
      if (!token || got !== token) return json(401, { ok: false, error: 'Bad token' });
    }

    let body: any;
    try { body = JSON.parse(raw); } catch { return json(400, { ok: false, error: 'Invalid JSON' }); }

    // ── Replay protection ─────────────────────────────────────
    const tsRaw = body?.timestamp ?? body?.event_time ?? body?.updated_at ?? body?.datetime ?? null;
    if (tsRaw != null) {
      const t = typeof tsRaw === 'number' ? tsRaw : Date.parse(String(tsRaw));
      const ms = t < 1e12 ? t * 1000 : t;
      if (Number.isFinite(ms) && Math.abs(Date.now() - ms) > 10 * 60 * 1000) {
        return json(401, { ok: false, error: 'Stale webhook event' });
      }
    }
    const sha256Hex = async (s: string) => {
      const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
    };
    const payloadHash = await sha256Hex(raw);
    const eventId: string = String(
      body?.event_id ?? body?.eventId ?? body?.webhook_id ?? body?.notification_id ??
      body?.id ?? body?.consignment_id ?? body?.awb ?? body?.tracking_code ?? '',
    ) || payloadHash;

    const supabaseIdem = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );
    const { error: dupErr } = await supabaseIdem
      .from('webhook_idempotency')
      .insert({ gateway: provider, external_event_id: `${eventId}:${payloadHash.slice(0, 16)}`, payload_hash: payloadHash });
    if (dupErr) {
      if ((dupErr as any).code === '23505') {
        return json(200, { ok: true, duplicate: true });
      }
      console.error('[webhook_idempotency insert]', dupErr);
      return json(500, { ok: false, error: 'Idempotency store failure' });
    }

    // ─── Normalize event payload across providers ──────────────
    let tracking = '', status = '', location: string | undefined, description: string | undefined;
    if (provider === 'pathao') {
      tracking = body?.consignment_id || body?.merchant_order_id || body?.data?.consignment_id || '';
      status = body?.order_status || body?.status || body?.event || '';
      location = body?.recipient_city || body?.area || undefined;
      description = body?.message || body?.note || undefined;
    } else if (provider === 'steadfast') {
      tracking = body?.tracking_code || body?.consignment_id || body?.invoice || '';
      status = body?.status || body?.delivery_status || '';
      location = body?.recipient_city || undefined;
      description = body?.note || undefined;
    } else if (provider === 'shiprocket') {
      tracking = body?.awb || body?.shipment_id || body?.order_id || '';
      status = body?.current_status || body?.status || '';
      location = body?.current_location || body?.location || undefined;
      description = body?.activity || body?.remark || undefined;
    }
    if (!tracking || !status) return json(400, { ok: false, error: 'Missing tracking_number or status' });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase.rpc('courier_webhook_apply_event', {
      _provider: provider,
      _tracking_number: String(tracking),
      _courier_status: String(status),
      _location: location ?? null,
      _description: description ?? null,
      _raw: body,
    });
    if (error) return json(200, { ok: false, error: error.message });
    return json(200, { ok: true, event_id: data });
  } catch (e: any) {
    console.error('[courier-webhook]', e);
    return json(200, { ok: false, error: e?.message || 'Internal error' });
  }
});