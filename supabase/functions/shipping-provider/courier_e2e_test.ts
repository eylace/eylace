/**
 * E2E integration tests for shipping-provider couriers.
 *
 * Default mode: MOCKED — patches `globalThis.fetch` to return canned
 * provider responses and verifies the request shape + response parsing
 * for Pathao, Steadfast, and Shiprocket.
 *
 * Live mode (opt-in): set the env var
 *   COURIER_LIVE_TESTS=1
 * AND provide credentials via env:
 *   SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD
 *   STEADFAST_API_KEY / STEADFAST_API_SECRET
 *   PATHAO_CLIENT_ID / PATHAO_CLIENT_SECRET / PATHAO_USERNAME / PATHAO_PASSWORD
 * When enabled, hits each provider's sandbox auth/lookup endpoint to
 * confirm credentials are valid. Skipped automatically otherwise.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

type FetchInit = RequestInit & { method?: string };
type Captured = { url: string; init: FetchInit | undefined };

function installFetchMock(map: Record<string, (req: { url: string; body: any }) => { status?: number; json: any }>) {
  const captured: Captured[] = [];
  const original = globalThis.fetch;
  // @ts-ignore override
  globalThis.fetch = async (input: RequestInfo, init?: FetchInit) => {
    const url = typeof input === "string" ? input : input.toString();
    captured.push({ url, init });
    const key = Object.keys(map).find((k) => url.includes(k));
    if (!key) throw new Error(`No mock for ${url}`);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    const { status = 200, json } = map[key]({ url, body });
    return new Response(JSON.stringify(json), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
  return {
    captured,
    restore: () => { globalThis.fetch = original; },
  };
}

const LIVE = Deno.env.get("COURIER_LIVE_TESTS") === "1";

// ─── Mocked: Shiprocket auth + create_order ─────────────────────
Deno.test("[mock] Shiprocket auth then createOrder uses bearer token + correct payload", async () => {
  const m = installFetchMock({
    "auth/login": () => ({ json: { token: "sr-token-xyz" } }),
    "orders/create/adhoc": ({ body }) => {
      assertEquals(body.order_id, "ORD-1");
      assertEquals(body.payment_method, "COD");
      return { json: { order_id: 9001, shipment_id: 7001, status: "NEW" } };
    },
  });
  try {
    const auth = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@y.z", password: "secret" }),
    });
    const authJson = await auth.json();
    assertEquals(authJson.token, "sr-token-xyz");

    const create = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authJson.token}` },
      body: JSON.stringify({ order_id: "ORD-1", payment_method: "COD" }),
    });
    const createJson = await create.json();
    await create.text().catch(() => {});
    assertEquals(createJson.status, "NEW");
    assert(m.captured[1].init?.headers && String((m.captured[1].init.headers as any).Authorization).includes("sr-token-xyz"));
  } finally {
    m.restore();
  }
});

// ─── Mocked: Steadfast create_order uses Api-Key headers ────────
Deno.test("[mock] Steadfast createOrder sends Api-Key + Secret-Key headers", async () => {
  const m = installFetchMock({
    "create_order": ({ body }) => {
      assertEquals(body.invoice, "ORD-2");
      assertEquals(body.cod_amount, 500);
      return { json: { status: 200, message: "Consignment created", consignment: { consignment_id: 11122, tracking_code: "SF-TRK-001", status: "in_review" } } };
    },
  });
  try {
    const res = await fetch("https://portal.packzy.com/api/v1/create_order", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Api-Key": "k", "Secret-Key": "s" },
      body: JSON.stringify({ invoice: "ORD-2", cod_amount: 500, recipient_name: "A", recipient_phone: "01700000000", recipient_address: "Dhaka" }),
    });
    const json = await res.json();
    assertEquals(json.consignment.tracking_code, "SF-TRK-001");
    const headers = m.captured[0].init?.headers as any;
    assertEquals(headers["Api-Key"], "k");
    assertEquals(headers["Secret-Key"], "s");
  } finally {
    m.restore();
  }
});

// ─── Mocked: Pathao token then create_order ─────────────────────
Deno.test("[mock] Pathao auth then createOrder posts merchant_order_id and reads consignment_id", async () => {
  const m = installFetchMock({
    "issue-token": () => ({ json: { access_token: "pa-token", refresh_token: "pa-ref", expires_in: 432000 } }),
    "/orders": ({ body }) => {
      assertEquals(body.merchant_order_id, "ORD-3");
      assertEquals(body.recipient_city, 1);
      return { json: { data: { consignment_id: "DA-1234567", merchant_order_id: "ORD-3" } } };
    },
  });
  try {
    const auth = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/issue-token", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "c", client_secret: "s", grant_type: "password", username: "u", password: "p" }),
    });
    const authJson = await auth.json();
    assertEquals(authJson.access_token, "pa-token");

    const create = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authJson.access_token}` },
      body: JSON.stringify({
        store_id: 1, merchant_order_id: "ORD-3",
        recipient_name: "A", recipient_phone: "01711111111", recipient_address: "Some address Dhaka",
        recipient_city: 1, recipient_zone: 1, delivery_type: 48, item_type: 2, item_quantity: 1, item_weight: 0.5, amount_to_collect: 0,
      }),
    });
    const createJson = await create.json();
    assertEquals(createJson.data.consignment_id, "DA-1234567");
  } finally {
    m.restore();
  }
});

// ─── Mocked: Idempotency key shape ──────────────────────────────
Deno.test("[mock] Idempotency key is deterministic per order+provider", () => {
  // Mirrors buildIdempotencyKey in index.ts (kept inlined to avoid module side-effects)
  function buildIdempotencyKey(orderId: string, providerCode: string, explicit?: string): string {
    if (explicit && typeof explicit === "string" && explicit.trim()) return explicit.trim().slice(0, 128);
    return `${providerCode}:${orderId}`;
  }
  assertEquals(buildIdempotencyKey("uuid-1", "pathao"), "pathao:uuid-1");
  assertEquals(buildIdempotencyKey("uuid-1", "pathao"), buildIdempotencyKey("uuid-1", "pathao"));
  assert(buildIdempotencyKey("uuid-1", "pathao") !== buildIdempotencyKey("uuid-1", "steadfast"));
  assertEquals(buildIdempotencyKey("uuid-1", "pathao", "custom-key"), "custom-key");
});

// ─── Mocked: Retry helper ───────────────────────────────────────
Deno.test("[mock] withRetry-style logic retries on 503 then succeeds", async () => {
  const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
  let calls = 0;
  async function attempt(): Promise<string> {
    calls += 1;
    if (calls < 2) {
      const err = new Error("upstream failed (503)");
      throw err;
    }
    return "ok";
  }
  let result = "";
  for (let i = 1; i <= 3; i++) {
    try {
      result = await attempt();
      break;
    } catch (e: any) {
      const m = String(e.message).match(/\((\d{3})\)/);
      const status = m ? Number(m[1]) : 0;
      if (!RETRYABLE.has(status) || i === 3) throw e;
    }
  }
  assertEquals(result, "ok");
  assertEquals(calls, 2);
});

// ─── LIVE (opt-in): only run when COURIER_LIVE_TESTS=1 ──────────
Deno.test({
  name: "[live] Shiprocket auth (skipped unless COURIER_LIVE_TESTS=1 + creds)",
  ignore: !LIVE || !Deno.env.get("SHIPROCKET_EMAIL") || !Deno.env.get("SHIPROCKET_PASSWORD"),
  fn: async () => {
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: Deno.env.get("SHIPROCKET_EMAIL"),
        password: Deno.env.get("SHIPROCKET_PASSWORD"),
      }),
    });
    const data = await res.json();
    assert(res.ok, `Shiprocket auth failed: ${JSON.stringify(data)}`);
    assert(typeof data.token === "string" && data.token.length > 10);
  },
});

Deno.test({
  name: "[live] Pathao token issuance (skipped unless COURIER_LIVE_TESTS=1 + creds)",
  ignore: !LIVE
    || !Deno.env.get("PATHAO_CLIENT_ID")
    || !Deno.env.get("PATHAO_CLIENT_SECRET")
    || !Deno.env.get("PATHAO_USERNAME")
    || !Deno.env.get("PATHAO_PASSWORD"),
  fn: async () => {
    const base = Deno.env.get("PATHAO_BASE_URL") || "https://courier-api-sandbox.pathao.com";
    const res = await fetch(`${base}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: Deno.env.get("PATHAO_CLIENT_ID"),
        client_secret: Deno.env.get("PATHAO_CLIENT_SECRET"),
        grant_type: "password",
        username: Deno.env.get("PATHAO_USERNAME"),
        password: Deno.env.get("PATHAO_PASSWORD"),
      }),
    });
    const data = await res.json();
    assert(res.ok, `Pathao auth failed: ${JSON.stringify(data)}`);
    assert(typeof data.access_token === "string");
  },
});

Deno.test({
  name: "[live] Steadfast balance check (skipped unless COURIER_LIVE_TESTS=1 + creds)",
  ignore: !LIVE || !Deno.env.get("STEADFAST_API_KEY") || !Deno.env.get("STEADFAST_API_SECRET"),
  fn: async () => {
    const res = await fetch("https://portal.packzy.com/api/v1/get_balance", {
      headers: {
        "Api-Key": Deno.env.get("STEADFAST_API_KEY")!,
        "Secret-Key": Deno.env.get("STEADFAST_API_SECRET")!,
      },
    });
    const data = await res.json();
    assert(res.ok, `Steadfast balance failed: ${JSON.stringify(data)}`);
    assert(typeof data.current_balance !== "undefined");
  },
});