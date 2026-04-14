const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeIp(ip: string): string {
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const headerNames = [
      'cf-connecting-ip',
      'x-forwarded-for',
      'x-real-ip',
      'fly-client-ip',
      'x-client-ip',
      'true-client-ip',
    ];

    let ip: string | null = null;

    for (const header of headerNames) {
      const value = req.headers.get(header);
      if (!value) continue;
      const candidate = value.split(',')[0].trim();
      if (candidate && candidate !== 'unknown') {
        const normalized = normalizeIp(candidate);
        if (!isPrivateIp(normalized)) {
          ip = normalized;
          break;
        }
      }
    }

    return new Response(
      JSON.stringify({ ip: ip || 'unknown' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch {
    return new Response(
      JSON.stringify({ ip: 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
