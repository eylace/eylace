# E2E Tests

Playwright tests covering layout/responsive regressions for the admin panel.

## Run

```
npx playwright test                     # all projects (desktop/tablet/mobile)
npx playwright test --project=desktop   # one viewport
npx playwright test --update-snapshots  # refresh visual baselines (intentional)
```

The first run will boot Vite via the `webServer` block in
`playwright.config.ts`. Snapshots are stored alongside the spec under
`__screenshots__/`.

## Authentication

The Orders table lives behind `/admin`. The fixture in
`admin-orders-table.spec.ts` mounts a self-contained HTML harness that
renders a representative table using the same CSS contract
(`admin-table-spacing` + the documented `<colgroup>` widths). This keeps
the tests deterministic and free of database/auth setup while still
catching:

- Column overlaps (adjacent cell bounding boxes touching/overlapping).
- Equal left/right gutters.
- Visual diffs (screenshots) at desktop / tablet / mobile widths.