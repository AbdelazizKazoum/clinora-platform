# Odontogram Integration — Completion Notes (ODONTO-16)

Status: ODONTO-01 through ODONTO-15 are complete and this document records the
ODONTO-16 release gate evidence. Date: 2026-08-19.

## Scope verified

The independent visualization lane (ODONTO-01..13), the Treatment mapper
(ODONTO-14), and the integrated `/visits/new` workspace (ODONTO-15) are
implemented. This gate adds the focused e2e flow, the integrated performance
delta, the provenance audit, and this completion record.

## Verification commands and results

### Frontend gates

```sh
pnpm nx test frontend
pnpm nx lint frontend
pnpm nx build frontend --skip-nx-cache
```

- Build: passed on 2026-08-19 (Next.js 16.2.3, `/visits/new` served on demand).
- Test: passed on the finished tree — 73 suites / 551 tests green.
- Lint: passed — 0 errors, 8 pre-existing warnings.
- One pre-existing type error unrelated to odontogram was found by the build
  gate and fixed minimally: `QueueStatus` was used in
  `waiting-room-entry-card.tsx` without being imported. Fix is a one-line type
  import; no behavioral change.

### Test defects found and fixed by this gate

The `test` gate surfaced two pre-existing failures that were blocking a green
suite on `HEAD`; both were fixed minimally and are unrelated to odontogram
behavior:

1. `renderer-performance.spec.ts` (`keeps copied source asset transfer size
   explicit`) expected 416,455 bytes for the copied SVG assets. The audited
   byte-identical copies total 413,445 bytes (matches the integration plan and
   the recorded SHA-256 hashes); the expectation and its "PARITY-02
   re-baseline" comment were corrected to 413,445.
2. `waiting-room-page.spec.tsx` had six tests exercising card-menu actions
   (`Mark done`, `Move up`, `Move to chair`, `Correct to Arrived`) that commit
   `21f003f` ("simplify entry card") intentionally removed. The tests were
   reconciled with the current drag-board UI: the offline-disable and
   SSE-disconnection tests now assert on `Edit notes` (the surviving card
   action), the manual keyboard reorder test was removed (drag reorder is
   covered by the existing drag tests), the menu-driven column move became a
   drag-based `WAITING → DONE` move, and the correction workflow was rewritten
   as the drag-based backward move `WAITING → ARRIVED`. No production code
   changed.

### E2E

```sh
pnpm exec nx run frontend-e2e:e2e -- --project=chromium
```

- `src/staff-access.spec.ts` (existing): passed.
- `src/odontogram.spec.ts` (new): 2 tests passed.
  1. Unauthenticated `/visits/new` redirects to `/auth/split/sign-in`.
     `/visits/new` has no server-side proxy capability rule yet, so the
     redirect is performed client-side by `RequireAuth` (no `callbackUrl`),
     matching current architecture.
  2. Authenticated flow: the chart renders 32 tooth options, the mock visit's
     planned root-canal act on tooth 36 appears as a planned visual layer,
     clicking tooth 26 drives Treatment-owned selection, keyboard
     ArrowRight navigation moves to tooth 27, planning a direct-filling act
     shows the success feedback, and tooth 27 then shows the projected
     planned layer.
- The authenticated test signs a real Auth.js session cookie with
  `next-auth/jwt` `encode` using the dev `AUTH_SECRET` from
  `apps/frontend/.env.local` (or `AUTH_SECRET` env). This requires the
  `next-auth` devDependency added to `apps/frontend-e2e/package.json`
  (version-matched to the frontend, `5.0.0-beta.32`). No frontend production
  dependency changed.

## Performance results

Recorded in `ODONTOGRAM_PERFORMANCE_NOTES.md` ("Integrated /visits/new route
delta (ODONTO-16)").

- Odontogram code-split chunks on the route: 141,176 raw bytes / 39,785 gzip.
- Public SVG assets: unchanged 413,445 bytes, 6 fetches (4 side + 2 occlusal).
- Browser profile (warm dev server, chromium): LCP 900 ms, 52 template roots
  (32 side + 20 occlusal), no occlusal fetches in side-only usage.
- Accepted: the route stays within the ODONTO-13 approved baseline.

## Provenance audit

- Source/copy SHA-256 hashes match for all six tooth SVGs:
  `11.svg` `83db8558…bde11`, `13.svg` `87ccfddb…ddc62`, `14.svg`
  `7d8f63a3…bef18`, `16.svg` `e75d3e88…b0d4`, `14_occl.svg`
  `3cba976f…4d04b`, `16_occl.svg` `268f59d2…c13e`.
- Embedded upstream author/license comments are intact (byte-identical copies).
- `apps/frontend/public/odontogram/LICENSE.react-advanced-odontogram.txt`
  contains the full MIT text.
- `apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md` is present.
- The legacy reference tree is unchanged: `git status`/`git diff` for `legacy/`
  is empty.
- No runtime import from `legacy/` or the published package exists anywhere in
  `apps/`; the only textual references are in the provenance notice
  documentation.
- No production dependency was added. The only manifest change is the
  `next-auth` devDependency in `apps/frontend-e2e`; the frontend app manifest
  is unchanged. The lockfile also refreshed stale peer resolutions
  (`sass` variant) as a side effect of the install; the production build passes
  with the refreshed lockfile.

## Residual deferred scope (unchanged from plan and parity roadmap)

- Primary/mixed dentition visuals beyond the approved v1 contract.
- Periodontal charting in the odontogram renderer (separate workspace exists;
  parity roadmap owns it).
- FHIR conversion, PDF/image export, embedded fonts, plugins, and the legacy
  settings/theme system.
- Direct SVG-region anatomical surface hit-testing.
- Planned-implant and subcrown-caries visuals.
- Server-side route/action authorization for `/visits/new` is still undefined
  (`RequireAuth` is a client gate). Treatment/security owners must define and
  enforce it at the owning backend boundary before clinical use.

## Accepted limitations

- The browser timing profile uses the dev server (unminified chunks) as an
  upper bound; production cost is the chunk table in the performance notes.
- The e2e flow runs on chromium; firefox/webkit projects exist in the Playwright
  config but their browsers are not installed on this workstation.
- The integrated route still runs on the mock Treatment workspace (no real
  BFF/API persistence). Re-run this gate when real persistence replaces the
  mock.

## Pending human approval

- Product/clinical visual review of every approved v1 condition and the
  existing/planned presentation against the source assets.
- Acceptance of the recorded integrated performance delta.
- Treatment authorization policy definition (server-side).

## Commands used in this gate

```sh
pnpm exec nx run frontend-e2e:e2e -- --project=chromium
pnpm nx build frontend --skip-nx-cache
sha256sum legacy/react-advanced-odontogram/React-Odontogram-Modul-main/src/assets/teeth-svgs/*.svg
sha256sum apps/frontend/public/odontogram/teeth/*.svg
```