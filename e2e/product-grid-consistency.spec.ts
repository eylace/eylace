import { test, expect, Page } from '@playwright/test';

/**
 * Product grid layout regression test.
 *
 * For every public product listing route we:
 *   1. Wait for the grid to render.
 *   2. Verify cards have equal row-height (CSS grid items-stretch).
 *   3. Verify the action button row (Add/Buy/Book) sits at the same
 *      bottom offset for every card in a row (no broken alignment).
 *
 * Runs at desktop / tablet / mobile viewports via playwright.config.ts
 * projects, so breakpoint regressions surface immediately.
 */

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/deals', name: 'deals' },
  { path: '/trending', name: 'trending' },
  { path: '/new-arrivals', name: 'new-arrivals' },
  { path: '/flash-sale', name: 'flash-sale' },
  { path: '/search', name: 'search' },
];

const PIXEL_TOLERANCE = 2; // 2px rounding/sub-pixel tolerance

async function getGridCardMetrics(page: Page) {
  return page.evaluate(() => {
    const grids = Array.from(
      document.querySelectorAll<HTMLElement>('[class*="grid-cols-2"]'),
    ).filter((g) => g.querySelectorAll('img').length >= 2);
    if (grids.length === 0) return [] as Array<{ heights: number[]; bottoms: number[] }>;

    return grids.slice(0, 3).map((grid) => {
      const cards = Array.from(grid.children) as HTMLElement[];
      const heights = cards.map((c) => Math.round(c.getBoundingClientRect().height));
      // Find a button-like element (Add / Buy / Book) in each card and
      // measure its bottom offset relative to the card.
      const bottoms = cards.map((c) => {
        const btn = c.querySelector('button');
        if (!btn) return -1;
        const cardRect = c.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        return Math.round(cardRect.bottom - btnRect.bottom);
      });
      return { heights, bottoms };
    });
  });
}

for (const route of ROUTES) {
  test(`product grid consistency: ${route.name}`, async ({ page }) => {
    await page.goto(route.path);
    // Wait for any product image — grids may be lazy-loaded.
    await page
      .waitForSelector('img[alt]', { timeout: 15_000 })
      .catch(() => null);
    // Allow images to settle so card height stabilizes.
    await page.waitForTimeout(500);

    const metricsPerGrid = await getGridCardMetrics(page);
    if (metricsPerGrid.length === 0) {
      test.skip(true, `No product grids rendered on ${route.path}`);
      return;
    }

    for (const { heights, bottoms } of metricsPerGrid) {
      if (heights.length < 2) continue;
      // Group cards into rows of 2 (mobile breakpoint baseline).
      for (let i = 0; i < heights.length - 1; i += 2) {
        const h1 = heights[i];
        const h2 = heights[i + 1];
        expect(
          Math.abs(h1 - h2),
          `Card heights differ in same row (${h1} vs ${h2}) on ${route.path}`,
        ).toBeLessThanOrEqual(PIXEL_TOLERANCE);

        const b1 = bottoms[i];
        const b2 = bottoms[i + 1];
        if (b1 >= 0 && b2 >= 0) {
          expect(
            Math.abs(b1 - b2),
            `Action-button bottom offset differs (${b1} vs ${b2}) on ${route.path}`,
          ).toBeLessThanOrEqual(PIXEL_TOLERANCE);
        }
      }
    }
  });
}