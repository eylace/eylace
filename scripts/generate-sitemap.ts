// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Pulls dynamic routes (products, categories) from Supabase using the public anon key.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://eylace.lovable.app";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://jmowninkqcfgwldyjeqo.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptb3duaW5rcWNmZ3dsZHlqZXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTI2MzAsImV4cCI6MjA4NTU2ODYzMH0.EGU2yA5SjBnpM_PYbsYVGizl1OBTvlW59S-r-99Ifxw";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/categories", changefreq: "weekly", priority: "0.9" },
  { path: "/deals", changefreq: "daily", priority: "0.8" },
  { path: "/flash-sale", changefreq: "daily", priority: "0.8" },
  { path: "/best-sellers", changefreq: "weekly", priority: "0.8" },
  { path: "/new-arrivals", changefreq: "weekly", priority: "0.8" },
  { path: "/trending", changefreq: "weekly", priority: "0.8" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/blog/online-shopping-comparison-bangladesh", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
  { path: "/shipping", changefreq: "monthly", priority: "0.5" },
  { path: "/returns", changefreq: "monthly", priority: "0.5" },
  { path: "/track-order", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
  { path: "/seller-center", changefreq: "monthly", priority: "0.5" },
  { path: "/sell", changefreq: "monthly", priority: "0.5" },
  { path: "/seller-policies", changefreq: "monthly", priority: "0.4" },
  { path: "/seller-support", changefreq: "monthly", priority: "0.4" },
  { path: "/delivery-partner", changefreq: "monthly", priority: "0.4" },
  { path: "/affiliate", changefreq: "monthly", priority: "0.5" },
  { path: "/advertise", changefreq: "monthly", priority: "0.4" },
  { path: "/careers", changefreq: "monthly", priority: "0.4" },
];

async function fetchDynamic(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const [products, categories] = await Promise.all([
      supabase.from("products").select("slug, updated_at").eq("is_active", true).limit(2000),
      supabase.from("categories").select("slug, updated_at").limit(500),
    ]);
    products.data?.forEach((p: { slug: string; updated_at: string }) => {
      if (p.slug) entries.push({
        path: `/product/${p.slug}`,
        lastmod: p.updated_at?.split("T")[0],
        changefreq: "weekly",
        priority: "0.7",
      });
    });
    categories.data?.forEach((c: { slug: string; updated_at: string }) => {
      if (c.slug) entries.push({
        path: `/category/${c.slug}`,
        lastmod: c.updated_at?.split("T")[0],
        changefreq: "weekly",
        priority: "0.7",
      });
    });
  } catch (err) {
    console.warn("[sitemap] dynamic fetch failed; emitting static-only sitemap.", err);
  }
  return entries;
}

function build(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const dynamic = await fetchDynamic();
  const all = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), build(all));
  console.log(`sitemap.xml written (${all.length} entries)`);
}

main();