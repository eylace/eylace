import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ product_ids: [], ai_message: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active products for AI context
    const { data: products, error: dbError } = await supabase
      .from("products_public")
      .select("id, name, description, price, original_price, category_id, rating, stock, is_flash_sale, is_digital, categories(name)")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(500);

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to fetch products");
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ product_ids: [], ai_message: "No products available yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build product catalog summary for AI
    const catalogSummary = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      original_price: p.original_price,
      category: p.categories?.name || "Uncategorized",
      rating: p.rating,
      stock: p.stock,
      flash_sale: p.is_flash_sale,
      digital: p.is_digital,
      desc_snippet: (p.description || "").slice(0, 80),
    }));

    // Call Lovable AI with tool calling to extract structured results
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a smart e-commerce product search assistant. You understand natural language queries in English and Bangla.

Given a user's search query and a product catalog, find the most relevant products. Consider:
- Semantic meaning (e.g., "something for gaming" → gaming products)
- Price intent (e.g., "cheap phones" → low price phones)
- Category matching (e.g., "electronics" → all electronics)
- Quality signals (e.g., "best" → high rated products)
- Bangla queries (e.g., "সস্তা ফোন" → cheap phones)

Always use the search_products tool to return results.`,
          },
          {
            role: "user",
            content: `Search query: "${query.trim().slice(0, 200)}"

Product catalog:
${JSON.stringify(catalogSummary)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_products",
              description: "Return matching product IDs and a helpful message for the customer",
              parameters: {
                type: "object",
                properties: {
                  product_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of matching product IDs, ordered by relevance. Max 20.",
                  },
                  ai_message: {
                    type: "string",
                    description: "A short, helpful message to the customer about the results. In the same language as the query. Max 100 chars.",
                  },
                },
                required: ["product_ids", "ai_message"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "search_products" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI is busy, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // Fallback: simple text search
      const lowerQuery = query.toLowerCase();
      const fallbackIds = products
        .filter((p: any) => p.name.toLowerCase().includes(lowerQuery))
        .slice(0, 10)
        .map((p: any) => p.id);
      return new Response(JSON.stringify({ product_ids: fallbackIds, ai_message: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      product_ids: result.product_ids || [],
      ai_message: result.ai_message || "",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
