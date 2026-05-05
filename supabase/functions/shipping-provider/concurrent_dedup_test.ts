/**
 * Concurrent-dispatch idempotency test.
 *
 * Simulates the dedup logic that protects against double "Send to Courier"
 * clicks for the same (order, provider, idempotency_key). Uses a tiny
 * in-memory model of:
 *   1. `try_acquire_dispatch_slot` (unique-key insert into in-flight table)
 *   2. successful-dispatch row in `courier_dispatch_log`
 *
 * This mirrors the SQL functions added in the migration so the logic can
 * be exercised without a DB.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

function makeStore() {
  const inflight = new Set<string>();
  const completed = new Map<string, string>(); // key -> tracking
  const slot = (orderId: string, provider: string, key: string) => `${orderId}|${provider}|${key}`;
  return {
    async tryAcquire(orderId: string, provider: string, key: string) {
      const k = slot(orderId, provider, key);
      if (inflight.has(k) || completed.has(k)) return false;
      inflight.add(k);
      return true;
    },
    async release(orderId: string, provider: string, key: string) {
      inflight.delete(slot(orderId, provider, key));
    },
    async existingSuccess(orderId: string, provider: string, key: string) {
      return completed.get(slot(orderId, provider, key));
    },
    async markSuccess(orderId: string, provider: string, key: string, tracking: string) {
      completed.set(slot(orderId, provider, key), tracking);
    },
  };
}

async function dispatch(store: ReturnType<typeof makeStore>, orderId: string, provider: string, key: string, doWork: () => Promise<string>) {
  const dup = await store.existingSuccess(orderId, provider, key);
  if (dup) return { ok: true, duplicate: true, tracking: dup };
  const acquired = await store.tryAcquire(orderId, provider, key);
  if (!acquired) return { ok: false, inflight: true };
  try {
    const tracking = await doWork();
    await store.markSuccess(orderId, provider, key, tracking);
    return { ok: true, tracking };
  } finally {
    await store.release(orderId, provider, key);
  }
}

Deno.test("concurrent dispatch: only one wins, others are blocked or deduped", async () => {
  const store = makeStore();
  let workCalls = 0;
  const doWork = async () => {
    workCalls++;
    await new Promise(r => setTimeout(r, 30));
    return "DA-12345";
  };
  const results = await Promise.all(
    Array.from({ length: 10 }, () => dispatch(store, "order-1", "pathao", "pathao:order-1", doWork)),
  );
  const winners = results.filter(r => r.ok && !r.duplicate);
  const blocked = results.filter(r => !r.ok && r.inflight);
  assertEquals(workCalls, 1, "Provider API must be called exactly once");
  assertEquals(winners.length, 1, "Exactly one dispatch should succeed as the original");
  assert(blocked.length >= 1, "Concurrent attempts should be blocked by inflight guard");
  assertEquals(winners[0].tracking, "DA-12345");
});

Deno.test("sequential retry after success returns duplicate, not new dispatch", async () => {
  const store = makeStore();
  let workCalls = 0;
  const doWork = async () => { workCalls++; return "TRK-1"; };

  const first = await dispatch(store, "o", "steadfast", "steadfast:o", doWork);
  const second = await dispatch(store, "o", "steadfast", "steadfast:o", doWork);
  const third = await dispatch(store, "o", "steadfast", "steadfast:o", doWork);

  assertEquals(workCalls, 1);
  assert(first.ok && !first.duplicate);
  assert(second.ok && second.duplicate);
  assert(third.ok && third.duplicate);
  assertEquals(second.tracking, "TRK-1");
});

Deno.test("different idempotency keys for the same order are NOT deduped", async () => {
  const store = makeStore();
  let workCalls = 0;
  const doWork = async () => { workCalls++; return `TRK-${workCalls}`; };
  const a = await dispatch(store, "o", "pathao", "pathao:o", doWork);
  const b = await dispatch(store, "o", "pathao", "pathao:o:retry-2", doWork);
  assertEquals(workCalls, 2);
  assert(a.ok && b.ok);
});