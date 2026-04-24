import { describe, it, expect } from 'vitest';

/**
 * Mirror of the server-side `validate_product_seo()` Postgres trigger.
 * Keep these rules in sync with:
 *   supabase/migrations/20260424035649_*.sql
 *
 * We test them as a pure function here so CI catches accidental regressions
 * without needing live DB access. The Playwright security-regression suite
 * additionally exercises the real trigger when a service-role key is present.
 */
export type SeoInput = {
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  tags?: string[] | null;
};

export const validateProductSeo = (input: SeoInput): { ok: true } | { ok: false; field: string; message: string } => {
  if (input.meta_title != null && input.meta_title.length > 70) {
    return { ok: false, field: 'meta_title', message: `Meta title must be 70 characters or less (got ${input.meta_title.length}).` };
  }
  if (input.meta_description != null && input.meta_description.length > 200) {
    return { ok: false, field: 'meta_description', message: `Meta description must be 200 characters or less (got ${input.meta_description.length}).` };
  }
  if (input.canonical_url != null && input.canonical_url.trim().length > 0 && !/^https?:\/\//i.test(input.canonical_url)) {
    return { ok: false, field: 'canonical_url', message: 'Canonical URL must start with http:// or https://' };
  }
  if (input.tags != null && input.tags.length > 30) {
    return { ok: false, field: 'tags', message: `Tags list cannot contain more than 30 entries (got ${input.tags.length}).` };
  }
  return { ok: true };
};

describe('Product SEO server-side validation rules', () => {
  describe('meta_title length', () => {
    it('accepts a title at the 70-char limit', () => {
      const r = validateProductSeo({ meta_title: 'a'.repeat(70) });
      expect(r.ok).toBe(true);
    });

    it('rejects a title longer than 70 chars', () => {
      const r = validateProductSeo({ meta_title: 'a'.repeat(71) });
      expect(r.ok).toBe(false);
      expect((r as { ok: false; field: string }).field).toBe('meta_title');
    });

    it('allows null/empty meta_title', () => {
      expect(validateProductSeo({ meta_title: null }).ok).toBe(true);
      expect(validateProductSeo({ meta_title: '' }).ok).toBe(true);
    });
  });

  describe('meta_description length', () => {
    it('accepts a description at the 200-char limit', () => {
      const r = validateProductSeo({ meta_description: 'a'.repeat(200) });
      expect(r.ok).toBe(true);
    });

    it('rejects a description longer than 200 chars', () => {
      const r = validateProductSeo({ meta_description: 'a'.repeat(201) });
      expect(r.ok).toBe(false);
      expect((r as { ok: false; field: string }).field).toBe('meta_description');
    });
  });

  describe('canonical_url format', () => {
    it('accepts an https URL', () => {
      expect(validateProductSeo({ canonical_url: 'https://shop.example.com/product/x' }).ok).toBe(true);
    });
    it('accepts an http URL', () => {
      expect(validateProductSeo({ canonical_url: 'http://shop.example.com/product/x' }).ok).toBe(true);
    });
    it('rejects a URL without protocol', () => {
      const r = validateProductSeo({ canonical_url: 'shop.example.com/product/x' });
      expect(r.ok).toBe(false);
      expect((r as { ok: false; field: string }).field).toBe('canonical_url');
    });
    it('rejects javascript: URLs', () => {
      const r = validateProductSeo({ canonical_url: 'javascript:alert(1)' });
      expect(r.ok).toBe(false);
    });
    it('treats whitespace-only as empty (allowed)', () => {
      expect(validateProductSeo({ canonical_url: '   ' }).ok).toBe(true);
    });
  });

  describe('tags count', () => {
    it('accepts up to 30 tags', () => {
      const r = validateProductSeo({ tags: Array.from({ length: 30 }, (_, i) => `tag-${i}`) });
      expect(r.ok).toBe(true);
    });
    it('rejects more than 30 tags', () => {
      const r = validateProductSeo({ tags: Array.from({ length: 31 }, (_, i) => `tag-${i}`) });
      expect(r.ok).toBe(false);
      expect((r as { ok: false; field: string }).field).toBe('tags');
    });
    it('allows empty tag list', () => {
      expect(validateProductSeo({ tags: [] }).ok).toBe(true);
      expect(validateProductSeo({ tags: null }).ok).toBe(true);
    });
  });

  describe('combined valid input', () => {
    it('passes for a realistic SEO payload', () => {
      const r = validateProductSeo({
        meta_title: 'Wireless Headphones — Brand X | Audio Store',
        meta_description: 'Premium wireless over-ear headphones with active noise cancellation, 30-hour battery life, and fast charging. Free shipping in BD.',
        canonical_url: 'https://eylace.com/product/wireless-headphones',
        tags: ['audio', 'headphones', 'wireless', 'bluetooth'],
      });
      expect(r.ok).toBe(true);
    });
  });
});
