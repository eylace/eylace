import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/check-blocked-ip`;

async function call(body: unknown, opts: { auth?: string | null } = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
  const auth = opts.auth === undefined ? `Bearer ${SUPABASE_ANON_KEY}` : opts.auth;
  if (auth) headers["Authorization"] = auth;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: res.status, json };
}

Deno.test("check-blocked-ip rejects requests without Authorization header (401)", async () => {
  const { status, json } = await call({ ip: "8.8.8.8" }, { auth: null });
  assertEquals(status, 401);
  assertEquals(json?.isBlocked, false);
  assert(json?.error, "expected error message in unauthorized response");
});

Deno.test("check-blocked-ip rejects malformed Authorization header (401)", async () => {
  const { status } = await call({ ip: "8.8.8.8" }, { auth: "NotBearer xyz" });
  assertEquals(status, 401);
});

// With auth present but malformed IP, the function must NOT leak block status
// (it short-circuits to { isBlocked: false } with 200) and must not query the DB.
const INVALID_IPS = [
  ["empty string", ""],
  ["unknown sentinel", "unknown"],
  ["non-string number", 12345],
  ["null", null],
  ["letters", "hello-world"],
  ["too long", "a".repeat(46)],
  ["sql injection", "1.1.1.1' OR '1'='1"],
];

for (const [label, ip] of INVALID_IPS) {
  Deno.test(`check-blocked-ip safely handles invalid IP: ${label}`, async () => {
    const { status, json } = await call({ ip });
    assertEquals(status, 200);
    assertEquals(json?.isBlocked, false);
    // Should never expose a `reason` field for invalid inputs.
    assert(json?.reason === undefined);
  });
}

Deno.test("check-blocked-ip allows a valid, non-blocked IPv4 through normally", async () => {
  // 203.0.113.0/24 is TEST-NET-3 — guaranteed not to appear in any real block list.
  const { status, json } = await call({ ip: "203.0.113.42" });
  assertEquals(status, 200);
  assertEquals(json?.isBlocked, false);
  // Response shape must only contain `isBlocked` for unauthenticated-class callers.
  assert(json?.reason === undefined, "reason must not leak to caller");
});

Deno.test("check-blocked-ip accepts a valid IPv6 format", async () => {
  const { status, json } = await call({ ip: "2001:db8::1" });
  assertEquals(status, 200);
  assertEquals(json?.isBlocked, false);
});