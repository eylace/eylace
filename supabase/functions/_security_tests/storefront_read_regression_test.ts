// Storefront read regression tests.
// Guards against accidental revokes / policy drops that would hide products
// from anonymous website visitors (which happened in the past).
//
// If any of these fail, DO NOT ship — the storefront is broken for guests.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ??
  "https://jmowninkqcfgwldyjeqo.supabase.co";
const ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptb3duaW5rcWNmZ3dsZHlqZXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTI2MzAsImV4cCI6MjA4NTU2ODYzMH0.EGU2yA5SjBnpM_PYbsYVGizl1OBTvlW59S-r-99Ifxw";

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const PUBLIC_TABLES = [
  "products_public",
  "categories",
  "brands",
  "sellers",
  "flash_deals",
  "category_discounts",
];

for (const table of PUBLIC_TABLES) {
  Deno.test(`anon can read from ${table}`, async () => {
    const supabase = anonClient();
    const { error } = await supabase.from(table).select("*").limit(1);
    assert(
      !error,
      `Storefront regression: anon cannot read ${table}: ${error?.message}`,
    );
  });
}

Deno.test("anon receives at least one active product from products_public", async () => {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("products_public")
    .select("id,is_active")
    .eq("is_active", true)
    .limit(1);
  assert(!error, `products_public read failed: ${error?.message}`);
  assert(
    (data?.length ?? 0) > 0,
    "products_public returned 0 active rows — storefront would appear empty",
  );
});