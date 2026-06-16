import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/send-otp`;

async function callSendOtp(body: unknown) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: res.status, json, text };
}

// Each invalid phone must be rejected with HTTP 400 before any DB insert happens.
const INVALID_PHONES: Array<[string, unknown]> = [
  ["empty string", ""],
  ["whitespace only", "   "],
  ["too short (9 digits)", "123456789"],
  ["too long (16 digits)", "1234567890123456"],
  ["letters", "abcdefghij"],
  ["mixed letters and digits", "12345abcde"],
  ["sql-injection attempt", "1' OR '1'='1"],
  ["html/script payload", "<script>alert(1)</script>"],
  ["leading + with letters", "+notaphone"],
  ["double plus prefix", "++12345678901"],
  ["null", null],
  ["number type (not string)", 1234567890],
  ["object", { foo: "bar" }],
];

for (const [label, value] of INVALID_PHONES) {
  Deno.test(`send-otp rejects invalid phone: ${label}`, async () => {
    const { status, json } = await callSendOtp({ phone: value });
    assertEquals(status, 400, `expected 400 for ${label}, got ${status}`);
    assert(json?.error, `expected error message for ${label}`);
  });
}

Deno.test("send-otp accepts a valid E.164 phone end-to-end", async () => {
  // Use a uniquely-suffixed valid number so each test run hits the cooldown path
  // only if a previous run is recent. We accept either 200 (sent / queued) or
  // 429 (rate-limited from a prior run) or 500 (provider not configured in test
  // env) — what we are asserting is that validation passed (i.e. NOT 400).
  const suffix = String(Date.now()).slice(-6);
  const phone = `+1555${suffix}0`; // 11 digits after +, length 12 — within bounds
  const { status } = await callSendOtp({ phone });
  assert(status !== 400, `valid phone was incorrectly rejected with 400`);
  assert(
    [200, 429, 500].includes(status),
    `unexpected status ${status} for valid phone`,
  );
});

Deno.test("send-otp accepts a plain 10-digit phone (no plus)", async () => {
  const suffix = String(Date.now()).slice(-6);
  const phone = `5${suffix}000`; // 10 digits
  const { status } = await callSendOtp({ phone });
  assert(status !== 400, `valid 10-digit phone was incorrectly rejected`);
});