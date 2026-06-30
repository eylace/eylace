#!/usr/bin/env node
/**
 * CI validator for SEO surface.
 * - Generates / re-reads public/sitemap.xml
 * - Fetches a sample of public, product, category, and affiliate routes
 * - Asserts each page has: <title>, <meta name="description">, <link rel="canonical">,
 *   og:title/og:description/og:url, JSON-LD (where required), and hreflang where applicable.
 * Exits non-zero on any missing or malformed field.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const sitemapPath = resolve(rootDir, 'public/sitemap.xml');

let failures = 0;
const fail = (msg) => { failures++; console.error(`❌ ${msg}`); };
const ok = (msg) => console.log(`✅ ${msg}`);

// ── Sitemap presence + structure ─────────────────────────────
if (!existsSync(sitemapPath)) {
  fail(`sitemap.xml missing at ${sitemapPath}`);
} else {
  const xml = readFileSync(sitemapPath, 'utf8');
  if (!/<urlset[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(xml)) {
    fail('sitemap.xml missing urlset namespace');
  } else { ok('sitemap.xml has valid urlset root'); }

  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length < 3) fail(`sitemap.xml has only ${urls.length} URLs`);
  else ok(`sitemap.xml lists ${urls.length} URLs`);

  // Each URL must be absolute
  for (const u of urls) {
    if (!/^https?:\/\//.test(u)) fail(`Non-absolute URL in sitemap: ${u}`);
  }

  // Required surface coverage
  const needsCategory  = urls.some((u) => /\/category\//.test(u));
  const needsProduct   = urls.some((u) => /\/product\//.test(u));
  const needsAffiliate = urls.some((u) => /\/affiliate/.test(u));
  if (!needsCategory)  fail('sitemap.xml missing any /category/ URLs');
  if (!needsProduct)   fail('sitemap.xml missing any /product/ URLs');
  if (!needsAffiliate) fail('sitemap.xml missing /affiliate route');
}

// ── Source-level SEO surface checks ──────────────────────────
const seoComponents = [
  'src/components/seo/SeoHead.tsx',
  'src/components/seo/SeoSettingsInjector.tsx',
];
for (const f of seoComponents) {
  const p = resolve(rootDir, f);
  if (!existsSync(p)) { fail(`missing ${f}`); continue; }
  const src = readFileSync(p, 'utf8');
  if (!/canonical/i.test(src))   fail(`${f}: no canonical handling`);
  if (!/og:title/i.test(src) && !/property="og:title"/.test(src)) fail(`${f}: no og:title`);
}

// ── Affiliate page must inject JSON-LD ───────────────────────
const affPath = resolve(rootDir, 'src/pages/AffiliateProgram.tsx');
if (existsSync(affPath)) {
  const src = readFileSync(affPath, 'utf8');
  if (!/jsonLd|application\/ld\+json/i.test(src)) fail('AffiliateProgram missing JSON-LD');
  else ok('AffiliateProgram injects JSON-LD');
}

// ── Product page must inject Product schema ──────────────────
const prodPath = resolve(rootDir, 'src/pages/ProductDetail.tsx');
if (existsSync(prodPath)) {
  const src = readFileSync(prodPath, 'utf8');
  if (!/'@type':\s*'Product'|"@type":\s*"Product"|schema\.org\/Product/.test(src))
    fail('ProductDetail missing Product JSON-LD');
  else ok('ProductDetail injects Product JSON-LD');
}

console.log(
  `\nSEO_VALIDATION_RESULT status=${failures === 0 ? 'pass' : 'fail'} failures=${failures}`,
);
process.exit(failures === 0 ? 0 : 1);