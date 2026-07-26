import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description: "Search active products in the Eylace catalog by keyword. Returns name, price, stock, slug, and description.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Search term to match against product name or description."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const max = limit ?? 10;
    // Escape PostgREST-significant characters to prevent filter injection via .or()
    const safeQuery = query.replace(/[,()*.\\]/g, " ").replace(/%/g, "").trim().slice(0, 100);
    if (!safeQuery) {
      return {
        content: [{ type: "text", text: JSON.stringify([], null, 2) }],
        structuredContent: { products: [] },
      };
    }
    const { data, error } = await supabase
      .from("products")
      .select("name, price, stock, slug, description")
      .eq("is_active", true)
      .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
      .limit(max);
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});