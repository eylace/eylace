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
    const { ip } = await req.json();
    
    if (!ip || ip === 'unknown') {
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
      JSON.stringify({ isBlocked, reason: isBlocked ? data[0].reason : null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ isBlocked: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
