import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "eylace-mcp",
  title: "Eylace Storefront MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Eylace multi-vendor storefront. Use `search_products` to find items by keyword, `get_product` for full details by slug, and `list_categories` to browse the catalog structure.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProducts, getProduct, listCategories],
});