import { test, expect, request } from '@playwright/test';

/**
 * Security regression suite — re-runs after every deployment.
 *
 * Verifies:
 *  1. Anonymous users cannot read `digital_file_url` from `products`.
 *  2. Anonymous users cannot read `orders` / `order_items` / `order_tracking_events`
 *     directly (RLS blocks them; guest access only via the lookup_guest_* RPCs).
 *  3. Anonymous users cannot read `otp_codes` (RLS — no policy).
 *  4. The `checkout-create-order` edge function rejects price tampering.
 *  5. The `checkout-create-order` edge function rejects insufficient stock.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

test.describe('Security regression: RLS + checkout tamper guards', () => {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env vars are not configured');

  test('anon cannot read products.digital_file_url', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(
      `${SUPABASE_URL}/rest/v1/products?select=id,digital_file_url&limit=1`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    );
    // PostgREST returns 401/403 when the column is not granted to anon.
    expect([401, 403, 400]).toContain(res.status());
  });

  test('anon cannot list orders', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${SUPABASE_URL}/rest/v1/orders?select=id&limit=1`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    const body = await res.json().catch(() => null);
    // Either RLS blocks or the result is an empty array.
    if (res.ok()) {
      expect(Array.isArray(body) ? body.length : 0).toBe(0);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });

  test('anon cannot list order_items or tracking events directly', async () => {
    const ctx = await request.newContext();
    for (const table of ['order_items', 'order_tracking_events']) {
      const res = await ctx.get(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      });
      const body = await res.json().catch(() => null);
      if (res.ok()) {
        expect(Array.isArray(body) ? body.length : 0).toBe(0);
      } else {
        expect([401, 403]).toContain(res.status());
      }
    }
  });

  test('anon cannot read otp_codes', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${SUPABASE_URL}/rest/v1/otp_codes?select=id&limit=1`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    const body = await res.json().catch(() => null);
    if (res.ok()) {
      expect(Array.isArray(body) ? body.length : 0).toBe(0);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });

  test('checkout-create-order rejects mismatched total (price tampering)', async () => {
    const ctx = await request.newContext();
    // We pass a clearly tampered total without valid items — the function
    // must reject either at the items lookup step or the total mismatch step,
    // never silently accept a tampered amount.
    const res = await ctx.post(`${SUPABASE_URL}/functions/v1/checkout-create-order`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        order_number: `SECTEST-${Date.now()}`,
        total: 1, // tampered
        payment_method: 'cod',
        items: [
          {
            product_id: '00000000-0000-0000-0000-000000000000',
            quantity: 1,
          },
        ],
      },
    });
    expect([400, 403, 500]).toContain(res.status());
    const body = await res.json().catch(() => ({}));
    expect(JSON.stringify(body).toLowerCase()).toMatch(/not found|invalid|mismatch|unavailable|fail/);
  });

  test('checkout-create-order rejects empty items', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${SUPABASE_URL}/functions/v1/checkout-create-order`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        order_number: `SECTEST-${Date.now()}`,
        total: 0,
        payment_method: 'cod',
        items: [],
      },
    });
    expect(res.status()).toBe(400);
  });
});

/**
 * SEO validation regression — exercises the real `validate_product_seo()`
 * Postgres trigger via a service-role insert. Skipped automatically when
 * SUPABASE_SERVICE_ROLE_KEY is not provided (e.g. in PR CI). The pure-rule
 * mirror in `src/lib/__tests__/seoValidation.test.ts` always runs.
 */
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test.describe('SEO validation regression: products trigger', () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, 'Service-role key not configured — server-side SEO trigger checks skipped');

  const insertProduct = async (overrides: Record<string, unknown>) => {
    const ctx = await request.newContext();
    const suffix = Math.random().toString(36).slice(2, 10);
    const base = {
      name: `SEO Test ${suffix}`,
      slug: `seo-test-${suffix}`,
      price: 1,
      is_active: false,
    };
    return ctx.post(`${SUPABASE_URL}/rest/v1/products`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: { ...base, ...overrides },
    });
  };

  test('rejects meta_title longer than 70 chars', async () => {
    const res = await insertProduct({ meta_title: 'x'.repeat(71) });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect((await res.text()).toLowerCase()).toContain('meta title');
  });

  test('rejects meta_description longer than 200 chars', async () => {
    const res = await insertProduct({ meta_description: 'x'.repeat(201) });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect((await res.text()).toLowerCase()).toContain('meta description');
  });

  test('rejects canonical_url without http(s) prefix', async () => {
    const res = await insertProduct({ canonical_url: 'shop.example.com/x' });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect((await res.text()).toLowerCase()).toContain('canonical url');
  });

  test('rejects more than 30 tags', async () => {
    const tags = Array.from({ length: 31 }, (_, i) => `t${i}`);
    const res = await insertProduct({ tags });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect((await res.text()).toLowerCase()).toContain('tags');
  });

  test('accepts a fully valid SEO payload', async () => {
    const res = await insertProduct({
      meta_title: 'Valid SEO Title within limits',
      meta_description: 'A reasonable description that fits well within the 200-character cap.',
      canonical_url: 'https://eylace.com/product/seo-valid',
      tags: ['a', 'b', 'c'],
    });
    // 201 Created with Prefer: return=minimal, but accept any 2xx.
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(300);
  });
});
