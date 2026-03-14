import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch products with order data
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, stock, rating, review_count, is_active, created_at, category_id, categories(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, price")
      .limit(1000);

    const summary = {
      totalProducts: products?.length || 0,
      totalOrders: orders?.length || 0,
      totalRevenue: orders?.reduce((s, o) => s + Number(o.total), 0) || 0,
      topProducts: (() => {
        const sales: Record<string, { name: string; qty: number; revenue: number }> = {};
        orderItems?.forEach((item) => {
          if (!sales[item.product_id]) sales[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 };
          sales[item.product_id].qty += item.quantity;
          sales[item.product_id].revenue += item.quantity * Number(item.price);
        });
        return Object.entries(sales)
          .sort((a, b) => b[1].qty - a[1].qty)
          .slice(0, 10)
          .map(([id, d]) => ({ id, ...d }));
      })(),
      lowStockProducts: products?.filter((p) => (p.stock || 0) < 5).map((p) => ({ name: p.name, stock: p.stock })) || [],
      ordersByStatus: orders?.reduce((acc: Record<string, number>, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {}) || {},
    };

    const prompt = `You are an expert e-commerce business analyst. Analyze the following sales data and provide actionable insights in both Bangla and English.

DATA:
- Total Products: ${summary.totalProducts}
- Total Orders: ${summary.totalOrders}
- Total Revenue: $${summary.totalRevenue.toFixed(2)}
- Top Selling Products: ${JSON.stringify(summary.topProducts)}
- Low Stock Products: ${JSON.stringify(summary.lowStockProducts)}
- Orders by Status: ${JSON.stringify(summary.ordersByStatus)}

Provide analysis in this format:

## 📊 সেলস বিশ্লেষণ (Sales Analysis)

### 🏆 টপ পারফর্মিং প্রোডাক্ট
[Analysis of top products]

### ⚠️ সতর্কতা ও সুপারিশ
[Warnings about low stock, underperforming products]

### 📈 গ্রোথ সুপারিশ
[Growth recommendations]

### 💡 অ্যাকশনেবল ইনসাইটস
[Specific actionable steps]`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a professional e-commerce analyst. Provide data-driven insights." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ analysis, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
