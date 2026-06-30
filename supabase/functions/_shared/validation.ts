// Centralized input validation + sanitization for edge functions.
// Import with: import { z, sanitize, parseBody } from "../_shared/validation.ts";

export { z } from "https://esm.sh/zod@3.23.8";
import { z as zod } from "https://esm.sh/zod@3.23.8";

/** Strip HTML tags and dangerous protocols. */
export function sanitizeText(input: unknown, maxLen = 1000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<\/?[^>]+>/g, "")           // strip tags
    .replace(/javascript:/gi, "")          // strip protocol injections
    .replace(/on\w+\s*=/gi, "")            // strip inline event handlers
    .replace(/[\u0000-\u001F\u007F]/g, "") // strip control chars
    .trim()
    .slice(0, maxLen);
}

/** Sanitize a free-form search filter (alphanumerics + a few safe chars). */
export function sanitizeSearchTerm(input: unknown, maxLen = 100): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^\p{L}\p{N}\s\-_.@]/gu, "").trim().slice(0, maxLen);
}

/** Escape HTML for safe embedding inside emails / templated responses. */
export function escapeHtml(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Common reusable schema atoms. */
export const Schemas = {
  uuid: zod.string().uuid(),
  phoneE164: zod.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone"),
  email: zod.string().email().max(255),
  shortText: (max = 255) => zod.string().trim().min(1).max(max),
  url: zod.string().url().max(2048),
  // Affiliate application
  affiliateApplication: zod.object({
    full_name: zod.string().trim().min(2).max(120),
    phone: zod.string().regex(/^\+?[0-9]{10,15}$/),
    address: zod.string().trim().min(2).max(500),
    website: zod.string().url().max(2048).optional().or(zod.literal("")),
    audience_size: zod.coerce.number().int().min(0).max(1_000_000_000).optional(),
    marketing_channels: zod.array(zod.string().max(80)).max(20).optional(),
    bio: zod.string().max(2000).optional(),
    payout_method: zod.enum(["bkash", "nagad", "bank", "rocket"]).optional(),
    payout_account: zod.string().max(120).optional(),
    accept_terms: zod.literal(true),
  }),
  // Generic search filter
  searchFilter: zod.object({
    q: zod.string().max(200).optional(),
    category: zod.string().max(120).optional(),
    min_price: zod.coerce.number().min(0).optional(),
    max_price: zod.coerce.number().min(0).optional(),
    sort: zod.enum(["newest", "price_asc", "price_desc", "popular"]).optional(),
    page: zod.coerce.number().int().min(1).max(1000).optional(),
  }),
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Parse JSON body against a Zod schema. Returns either the parsed value or a Response to send back. */
export async function parseBody<T extends zod.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ ok: true; data: zod.infer<T> } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      ),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Basic CSRF guard: require an explicit Origin header match for state-changing requests. */
export function assertSameOrigin(req: Request, allowedOrigins: string[]): Response | null {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return null;
  const origin = req.headers.get("origin") || "";
  if (!origin) return null; // server-to-server (webhooks) — handled by signature checks elsewhere
  if (allowedOrigins.length === 0) return null;
  if (!allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  return null;
}