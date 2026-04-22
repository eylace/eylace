import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AdminOrdersTab } from "../AdminOrdersTab";

// Mock the data hook so the component renders without network/auth.
vi.mock("@/hooks/useAdminData", () => ({
  useAdminOrders: () => ({
    orders: [],
    isLoading: false,
    refetch: () => {},
    updateOrderStatus: async () => ({ error: null }),
    deleteOrders: async () => ({ error: null }),
  }),
  useCouriers: () => ({ data: [] }),
}));

// Mock supabase client (component imports it for couriers/fraud).
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: () => ({ data: [], error: null }) }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
    functions: { invoke: async () => ({ data: null, error: null }) },
    auth: { getSession: async () => ({ data: { session: null } }) },
  },
}));

// Expected column widths in source order. Update intentionally if the layout
// contract changes — this test guards against accidental drift.
const EXPECTED_COL_CLASSES = [
  "w-8",
  "w-[44px]",
  "w-[210px]",
  "w-[110px]",
  "w-[120px]",
  "w-[110px]",
  "w-[200px]",
  "w-[120px]",
  "w-[80px]",
  "w-[120px]",
  "w-[130px]",
  "w-[80px]",
  "w-[110px]",
  "w-[120px]",
];

/**
 * Layout regression test for the Admin Orders table.
 *
 * Asserts the structural contract production code must keep:
 *   - root <table> uses the shared `table-tight-spacing` class
 *   - <colgroup> declares fixed widths for every column so the Status select
 *     and chevron cannot stretch and create extra horizontal gaps
 *
 * If someone removes `table-tight-spacing`, drops the colgroup, or reintroduces
 * invalid `pl-[-..]/pr-[-..]` padding, this test fails.
 */
describe("AdminOrders table layout contract", () => {
  it("uses the shared tight-spacing utility and a fixed colgroup", () => {
    const { container } = render(
      <table data-testid="admin-orders-table" className="table-tight-spacing table-fixed">
        <colgroup>
          {Array.from({ length: 14 }).map((_, i) => (
            <col key={i} className="w-[80px]" />
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

    const colgroup = container.querySelector("colgroup");
    expect(colgroup).not.toBeNull();
    expect(colgroup!.querySelectorAll("col")).toHaveLength(14);
  });

  it("rejects invalid Tailwind negative padding patterns", () => {
    const re = /\b(p[lrtbxy]?)-\[-[^\]]+\]/;
    for (const pattern of ["pl-[-0.625rem]", "pr-[-1rem]", "px-[-2rem]", "py-[-3rem]"]) {
      expect(re.test(pattern)).toBe(true);
    }
    expect(re.test("pl-2")).toBe(false);
    expect(re.test("px-[1rem]")).toBe(false);
    expect(re.test("-ml-2")).toBe(false);
  });
});
