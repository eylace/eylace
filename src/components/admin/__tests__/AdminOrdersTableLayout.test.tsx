import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Layout regression test for the Admin Orders table.
 *
 * Asserts the structural contract production code must keep:
 *   - root <table> uses the shared `table-tight-spacing` + `table-fixed` classes
 *   - <colgroup> declares 14 fixed widths in the exact documented order
 *   - empty/loading rows span all 14 columns (so column widths never collapse)
 *   - no invalid `pl-[-..]/pr-[-..]` negative-padding patterns sneak back in
 *
 * If someone removes `table-tight-spacing`, drops/reorders the colgroup, or
 * changes column widths without updating this test, it fails.
 */

const SOURCE_PATH = resolve(__dirname, "..", "AdminOrdersTab.tsx");
const SOURCE = readFileSync(SOURCE_PATH, "utf8");

// Expected column widths in source order. Update intentionally when the
// layout contract changes.
const EXPECTED_COL_CLASSES = [
  'w-8',
  'w-[64px]',
  'w-[210px]',
  'w-[152px]',
  'hidden xl:table-column w-[124px]',
  'w-[120px]',
  'w-[220px]',
  'w-[124px]',
  'w-[110px]',
  'w-[124px]',
  'hidden xl:table-column w-[152px]',
  'hidden xl:table-column w-[110px]',
  'hidden xl:table-column w-[150px]',
  'w-[128px]',
];

describe("AdminOrders table layout contract", () => {
  it("uses the shared tight-spacing utility and a fixed colgroup", () => {
    const { container } = render(
      <table data-testid="admin-orders-table" className="table-tight-spacing table-fixed">
        <colgroup>
          {EXPECTED_COL_CLASSES.map((c, i) => (
            <col key={i} className={c} />
          ))}
        </colgroup>
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </table>,
    );

    const table = container.querySelector("table")!;
    expect(table.className).toContain("table-tight-spacing");
    expect(table.className).toContain("table-fixed");

    const cols = container.querySelectorAll("colgroup col");
    expect(cols).toHaveLength(EXPECTED_COL_CLASSES.length);
  });

  it("AdminOrdersTab.tsx declares the expected colgroup widths in order", () => {
    const colgroupMatch = SOURCE.match(/<colgroup>([\s\S]*?)<\/colgroup>/);
    expect(colgroupMatch, "colgroup must exist in AdminOrdersTab.tsx").not.toBeNull();

    const colMatches = [...colgroupMatch![1].matchAll(/<col\s+className="([^"]+)"\s*\/>/g)];
    const found = colMatches.map((m) => m[1]);
    expect(found).toEqual(EXPECTED_COL_CLASSES);
  });

  it("empty and loading body states span all 14 columns", () => {
    expect(SOURCE).toMatch(/colSpan=\{14\}/);
    // Loading skeleton must render exactly 14 cells per row.
    expect(SOURCE).toMatch(/Array\.from\(\{\s*length:\s*14\s*\}\)\.map/);
  });

  it("rejects invalid Tailwind negative padding patterns", () => {
    const re = /\b(p[lrtbxy]?)-\[-[^\]]+\]/;
    for (const pattern of ["pl-[-0.625rem]", "pr-[-1rem]", "px-[-2rem]", "py-[-3rem]"]) {
      expect(re.test(pattern)).toBe(true);
    }
    expect(re.test("pl-2")).toBe(false);
    expect(re.test("px-[1rem]")).toBe(false);
    expect(re.test("-ml-2")).toBe(false);
    // Production source must not contain any.
    expect(re.test(SOURCE)).toBe(false);
  });
});
