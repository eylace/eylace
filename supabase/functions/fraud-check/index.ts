import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { customerEmail, customerPhone, customerName, orderHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an advanced e-commerce fraud detection AI analyst. You analyze customer behavior patterns to detect potential fraud.

Given customer information and their order history, provide a comprehensive fraud risk assessment in the following JSON structure. 
IMPORTANT: Return ONLY valid JSON, no markdown or extra text.

{
  "risk_score": <number 0-100, where 0 is safe and 100 is high fraud risk>,
  "risk_level": "<low|medium|high|critical>",
  "flags": [
    {
      "type": "<flag type like 'multiple_addresses', 'unusual_order_pattern', 'high_value_orders', 'rapid_orders', 'suspicious_payment', etc>",
      "severity": "<low|medium|high>",
      "description": "<clear description of the flag>"
    }
  ],
  "behavior_summary": "<2-3 sentence summary of the customer's overall behavior pattern>",
  "recommendations": ["<actionable recommendation 1>", "<recommendation 2>"],
  "order_pattern_analysis": {
    "avg_order_value": <number>,
    "order_frequency": "<description>",
    "common_categories": ["<category>"],
    "address_consistency": "<consistent|varies|suspicious>"
  }
}`;

    const userPrompt = `Analyze this customer for potential fraud:

Customer Info:
- Name: ${customerName || 'Unknown'}
- Email: ${customerEmail || 'Not provided'}
- Phone: ${customerPhone || 'Not provided'}

Order History (${orderHistory?.length || 0} orders):
${JSON.stringify(orderHistory || [], null, 2)}

Provide a detailed fraud risk assessment based on their ordering patterns, address changes, payment methods, order values, and frequency.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from AI response
    let analysis;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysis = JSON.parse(jsonMatch[1].trim());
    } catch {
      analysis = {
        risk_score: 0,
        risk_level: "low",
        flags: [],
        behavior_summary: content,
        recommendations: ["Unable to parse structured analysis. Review manually."],
        order_pattern_analysis: { avg_order_value: 0, order_frequency: "unknown", common_categories: [], address_consistency: "unknown" }
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fraud-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
