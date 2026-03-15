import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache exchange rates for 10 minutes
let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base = 'USD', targets = ['BDT'] } = await req.json().catch(() => ({ base: 'USD', targets: ['BDT'] }));

    // Check cache
    if (cachedRates && (Date.now() - cachedRates.timestamp) < CACHE_TTL) {
      return new Response(JSON.stringify({ 
        success: true, 
        base,
        rates: cachedRates.rates,
        cached: true,
        updated_at: new Date(cachedRates.timestamp).toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from free API (exchangerate-api.com free tier, no key needed)
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API failed [${response.status}]`);
    }

    const data = await response.json();
    
    if (data.result !== 'success') {
      throw new Error('Exchange rate API returned error');
    }

    const rates: Record<string, number> = {};
    for (const target of targets) {
      if (data.rates[target]) {
        rates[target] = data.rates[target];
      }
    }
    // Also include base rate
    rates[base] = 1;

    // Also get reverse rates (e.g., BDT->USD)
    const allCurrencies = [base, ...targets];
    for (const currency of allCurrencies) {
      if (data.rates[currency]) {
        rates[currency] = data.rates[currency];
      }
    }

    cachedRates = { rates, timestamp: Date.now() };

    return new Response(JSON.stringify({ 
      success: true, 
      base,
      rates,
      cached: false,
      updated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Exchange rate error:', error);
    
    // Fallback rates if API fails
    const fallbackRates: Record<string, number> = {
      USD: 1,
      BDT: 110.50,
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.12,
      AED: 3.67,
    };

    return new Response(JSON.stringify({ 
      success: true, 
      rates: fallbackRates,
      cached: false,
      fallback: true,
      updated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
