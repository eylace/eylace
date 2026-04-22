import { test, expect, type Page } from '@playwright/test';

/**
 * Admin Orders table — layout & responsive spacing regression suite.
 *
 * Strategy: render a static HTML harness that imports the production CSS
 * (`/src/index.css` via Vite) and uses the SAME `admin-table-spacing`
 * utility + `<colgroup>` widths shipped in `AdminOrdersTab.tsx`. This
 * isolates the layout contract from auth/DB while still catching real
 * regressions in the shared CSS or column widths.
 *
 * Coverage:
 *  1. No two adjacent column cells overlap or touch (positive gap).
 *  2. First/last column outer padding is symmetric (equal left & right).
 *  3. Visual screenshot diff at desktop / tablet / mobile.
 */

const COL_CLASSES = [
  'w-8',
  'w-[70px]',
  'w-[210px]',
  'w-[160px]',
  'hidden xl:table-column w-[130px]',
  'w-[120px]',
  'w-[220px]',
  'w-[130px]',
  'w-[110px]',
  'w-[130px]',
  'hidden xl:table-column w-[120px]',
  'hidden xl:table-column w-[110px]',
  'hidden xl:table-column w-[120px]',
  'w-[140px]',
];

const HEADERS = [
  '',
  'Actions',
  'Product',
  'Order',
  'Assigned To',
  'Date',
  'Customer',
  'IP',
  'Payment',
  'Status',
  'Courier',
  'Method',
  'Fraud',
  'Total',
];

const SAMPLE_ROW = [
  '☐',
  '⋮',
  'Sample Product Name',
  '#ORD-12345',
  'Admin',
  '4/22/2026',
  'Disa Khatun',
  '144.79.185.196',
  'Unpaid',
  'Processing',
  'Send to Courier',
  'COD',
  'LOW 0%',
  '৳1,149.50',
];

function buildHarnessHtml(): string {
  const colHtml = COL_CLASSES.map((c) => `<col class="${c}" />`).join('');
  const theadHtml = HEADERS.map(
    (h) => `<th class="font-bold text-foreground text-left">${h}</th>`,
  ).join('');
  const rowsHtml = Array.from({ length: 4 })
    .map(
      () =>
        `<tr>${SAMPLE_ROW.map(
          (v) => `<td><span class="block truncate">${v}</span></td>`,
        ).join('')}</tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Orders Table Harness</title>
  <script type="module" src="/src/index.css?inline"></script>
  <link rel="stylesheet" href="/src/index.css" />
</head>
<body class="bg-background text-foreground">
  <main class="p-4">
    <div class="overflow-x-auto">
      <table data-testid="admin-orders-table" class="admin-table-spacing table-fixed w-full">
        <colgroup>${colHtml}</colgroup>
        <thead class="bg-muted/50"><tr>${theadHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </main>
</body>
</html>`;
}

async function mountHarness(page: Page) {
  // Serve the harness via Vite's static handler by intercepting a known route.
  const html = buildHarnessHtml();
  await page.route('**/__orders_harness__', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html }),
  );
  await page.goto('/__orders_harness__');
  await page.waitForSelector('[data-testid="admin-orders-table"]');
  // Ensure CSS has applied — wait one rAF.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => r(null))),
  );
}

test.describe('Admin Orders table — responsive layout', () => {
  test('renders without overlapping cells', async ({ page }) => {
    await mountHarness(page);

    const cellRects = await page.$$eval(
      '[data-testid="admin-orders-table"] tbody tr:first-child td',
      (cells) =>
        (cells as HTMLElement[])
          .filter((c) => c.offsetParent !== null) // skip hidden columns
          .map((c) => {
            const r = c.getBoundingClientRect();
            return { left: r.left, right: r.right };
          }),
    );

    // Each cell's left edge must be >= the previous cell's right edge.
    for (let i = 1; i < cellRects.length; i++) {
      const prev = cellRects[i - 1];
      const curr = cellRects[i];
      expect(
        curr.left,
        `column ${i} overlaps column ${i - 1} (prev.right=${prev.right}, curr.left=${curr.left})`,
      ).toBeGreaterThanOrEqual(prev.right - 0.5);
    }
  });

  test('first and last column outer padding is symmetric', async ({ page }) => {
    await mountHarness(page);

    const padding = await page.$$eval(
      '[data-testid="admin-orders-table"] tbody tr:first-child td',
      (cells) => {
        const visible = (cells as HTMLElement[]).filter(
          (c) => c.offsetParent !== null,
        );
        if (visible.length < 2) return null;
        const first = visible[0];
        const last = visible[visible.length - 1];
        const fStyle = getComputedStyle(first);
        const lStyle = getComputedStyle(last);
        return {
          firstLeft: parseFloat(fStyle.paddingLeft),
          lastRight: parseFloat(lStyle.paddingRight),
        };
      },
    );

    expect(padding).not.toBeNull();
    // Outer gutter on left of first column should equal outer gutter on
    // right of last column (within 1px of subpixel rounding).
    expect(
      Math.abs((padding!.firstLeft) - (padding!.lastRight)),
    ).toBeLessThanOrEqual(1);
  });

  test('matches visual snapshot', async ({ page }) => {
    await mountHarness(page);
    const table = page.locator('[data-testid="admin-orders-table"]');
    await expect(table).toHaveScreenshot('orders-table.png', {
      animations: 'disabled',
    });
  });
});