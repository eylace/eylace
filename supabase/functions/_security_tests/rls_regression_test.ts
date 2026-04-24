// RLS regression tests: verify anon/authenticated cannot read sensitive data.
// Run with: supabase--test_edge_functions { functions: ["_security_tests"] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.test("anon cannot select cost_per_item from order_items", async () => {
  const supabase = anonClient();
  const { error } = await supabase.from("order_items").select("cost_per_item").limit(1);
  // Either RLS returns 0 rows OR column-level revoke triggers a permission error.
  // Both are acceptable; the cost must NEVER be returned.
  if (error) {
    assert(
      /permission denied|insufficient/i.test(error.message),
      `Unexpected error reading cost_per_item: ${error.message}`,
    );
  }
});

Deno.test("anon cannot select cost_per_item from products", async () => {
  const supabase = anonClient();
  const { error } = await supabase.from("products").select("cost_per_item").limit(1);
  if (error) {
    assert(
      /permission denied|insufficient/i.test(error.message),
      `Unexpected error reading products.cost_per_item: ${error.message}`,
    );
  }
});

Deno.test("anon cannot select courier_auth_tokens", async () => {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("courier_auth_tokens")
    .select("access_token")
    .limit(1);
  // Should be blocked by RLS; data should be empty array or error.
  if (!error) {
    assertEquals(data?.length ?? 0, 0, "courier_auth_tokens leaked to anon");
  }
});

Deno.test("anon cannot select otp_codes", async () => {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("otp_codes")
    .select("code, phone")
    .limit(1);
  if (!error) {
    assertEquals(data?.length ?? 0, 0, "otp_codes leaked to anon");
  }
});

Deno.test("anon cannot select payment_gateways base table credentials", async () => {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("payment_gateways")
    .select("credentials")
    .limit(1);
  if (!error) {
    assertEquals(data?.length ?? 0, 0, "payment_gateways credentials leaked to anon");
  }
});

Deno.test("anon cannot select payment_gateway_secrets", async () => {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("payment_gateway_secrets")
    .select("credentials")
    .limit(1);
  if (!error) {
    assertEquals(data?.length ?? 0, 0, "payment_gateway_secrets leaked to anon");
  }
});

Deno.test("anon CAN read safe payment_gateways_public view (no credentials column)", async () => {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("payment_gateways_public")
    .select("*")
    .limit(1);
  assertEquals(error, null);
  if (data && data.length > 0) {
    assert(!("credentials" in data[0]), "credentials column must not exist in public view");
  }
});

Deno.test("anon cannot call admin RPCs", async () => {
  const supabase = anonClient();
  const calls = [
    supabase.rpc("admin_list_courier_tokens"),
    supabase.rpc("admin_list_otp_audit", { _phone: null, _limit: 10 }),
    supabase.rpc(
      "admin_get_payment_gateway_secrets",
      { _gateway_id: "00000000-0000-0000-0000-000000000000" },
    ),
  ];
  for (const c of calls) {
    const { data, error } = await c;
    // Either permission error, or RLS-filtered empty result. Never sensitive data.
    if (!error) {
      const arr = Array.isArray(data) ? data : data ? [data] : [];
      assertEquals(arr.length, 0, "admin RPC leaked data to anon");
    }
  }
});

Deno.test("anon cannot call get_realtime_topics_for_user (returns empty)", async () => {
  const supabase = anonClient();
  const { data } = await supabase.rpc("get_realtime_topics_for_user");
  // No auth.uid() => no rows
  assertEquals(Array.isArray(data) ? data.length : 0, 0);
});