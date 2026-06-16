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
    // Require an Authorization header (anon JWT from the storefront session is sufficient).
    // This prevents the endpoint from being used as an unauthenticated oracle to probe
    // the block list at scale.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ isBlocked: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { ip } = await req.json();

    // Basic input validation: must be a plausible IPv4/IPv6 string.
    const ipRegex = /^[0-9a-fA-F:.]{3,45}$/;
    if (!ip || typeof ip !== 'string' || ip === 'unknown' || !ipRegex.test(ip)) {
      return new Response(
        JSON.stringify({ isBlocked: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabaseAdmin
      .from('blocked_ips')
      .select('id, reason')
      .eq('ip_address', ip)
      .limit(1);

    if (error) {
      console.error('Error checking blocked IP:', error);
      return new Response(
        JSON.stringify({ isBlocked: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const isBlocked = data && data.length > 0;

    return new Response(
      // Do NOT expose admin-written `reason` to unauthenticated callers — it
      // leaks internal security intelligence. Authoritative blocking still
      // happens inside `checkout-create-order`.
      JSON.stringify({ isBlocked }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ isBlocked: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
