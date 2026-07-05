import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description: "Fetch a single active product by its slug, including price, stock, description and images.",
  inputSchema: {
    slug: z.string().trim().min(1).describe("Product slug, e.g. 'mens-silk-tie-navy'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from("products")
      .select("name, price, stock, slug, description, images, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .limit(1);
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    const product = data?.[0];
    if (!product) {
      return { content: [{ type: "text", text: "Product not found" }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
      structuredContent: { product },
    };
  },
});