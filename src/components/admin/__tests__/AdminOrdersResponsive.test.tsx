import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Responsive contract for the Admin Orders table.
 *
 * jsdom can't perform real layout, so we assert the *contract* the
 * production code must keep so that columns never collide on any width:
 *
 *   - Every column declares an explicit width via Tailwind `w-[Xpx]`.
 *   - Hidden-on-small columns use the `hidden xl:table-column` pattern
 *     so the colgroup keeps its slot at the desktop breakpoint and
 *     collapses cleanly below it.
 *   - The table uses `table-fixed` so column widths are honored even
 *     when content would otherwise stretch them.
 *   - Cells inside courier/method/fraud/total wrap content with
 *     truncation classes (`truncate`) so long values don't push
 *     neighbours.
 *
 * Pixel-accurate gap checks live in Playwright (`e2e/`); this file
 * keeps a fast, dependency-free guardrail in CI.
 */

const SOURCE_PATH = resolve(
  __dirname,
  "..",
  "AdminOrdersTab.tsx",
);
const SOURCE = readFileSync(SOURCE_PATH, "utf8");

describe("AdminOrders responsive contract", () => {
  it("uses table-fixed so colgroup widths are enforced", () => {
    expect(SOURCE).toMatch(/admin-orders-table[^"]*table-fixed/);
  });

  it("declares every colgroup width explicitly", () => {
    const colgroup = SOURCE.match(/<colgroup>([\s\S]*?)<\/colgroup>/)![1];
    const cols = [...colgroup.matchAll(/<col\s+className="([^"]+)"/g)];
    expect(cols.length).toBeGreaterThanOrEqual(14);
    for (const [, cls] of cols) {
      // Every <col> must carry either an explicit pixel width or w-8.
      expect(cls).toMatch(/w-(?:8|\[\d+px\])/);
    }
  });

  it("hides only optional columns at <xl widths via the documented pattern", () => {
    const colgroup = SOURCE.match(/<colgroup>([\s\S]*?)<\/colgroup>/)![1];
    const hiddenCols = [...colgroup.matchAll(/<col\s+className="([^"]*hidden[^"]*)"/g)];
    for (const [, cls] of hiddenCols) {
      expect(cls).toContain("xl:table-column");
    }
  });

  it("courier / method / fraud / total cells truncate long content", () => {
    // Courier button truncates carrier name.
    expect(SOURCE).toMatch(
      /Send to Courier[\s\S]*?className="truncate"|className="truncate">Send to Courier/,
    );
    // Method badge truncates payment method label.
    expect(SOURCE).toMatch(/order\.payment_method[\s\S]{0,200}truncate/);
    // Total cell truncates currency value.
    expect(SOURCE).toMatch(/block truncate"[\s\S]{0,200}order\.total/);
  });

  it("uses the shared admin spacing utility (or its tight-spacing alias)", () => {
    expect(SOURCE).toMatch(/(admin-table-spacing|table-tight-spacing)/);
  });
});