# Odontogram Performance Notes

ODONTO-13 records the renderer baseline before Treatment integration. These
numbers were gathered from the extracted Clinora renderer, not the legacy demo
application.

## Measurement environment

- Date: 2026-08-13
- Machine: Linux `Kazoum-dev`, x86_64
- CPU: 12th Gen Intel Core i5-12500, 6 cores / 12 threads
- Node: 24.18.1
- pnpm: 11.18.0
- Frontend framework: Next.js 16.2.3, React 19
- Test/profile proxy: Jest/jsdom through `pnpm nx test frontend --runInBand`

These are local development measurements. Before ODONTO-14/15 are released to
users, repeat the interactive timing profile in a real browser on the approved
desktop and mobile target devices.

## Reproducible commands

```sh
pnpm nx test frontend --runInBand --testPathPatterns=odontogram --skip-nx-cache
pnpm exec eslint apps/frontend/src/features/odontogram
pnpm exec prettier --check apps/frontend/src/features/odontogram docs/implementation/treatment/odontogram/ODONTOGRAM_PERFORMANCE_NOTES.md
pnpm nx build frontend --skip-nx-cache
```

For the local ODONTO-13 measurement pass, temporary Jest harnesses were used and
removed before commit. They measured normalized SVG node counts and rough jsdom
timings without adding an application route.

## Static asset baseline

The copied public tooth SVGs remain byte-for-byte upstream copies. Runtime
pruning happens only on the normalized in-memory clone.

| Template      | Source bytes | Source nodes | Runtime nodes | Retained switchable layers | Pruned layer IDs | Pruned definition IDs |
| ------------- | -----------: | -----------: | ------------: | -------------------------: | ---------------: | --------------------: |
| `11.svg`      |       73,705 |          475 |           282 |                        120 |               51 |                    10 |
| `13.svg`      |       73,479 |          477 |           282 |                        120 |               51 |                    11 |
| `14.svg`      |       80,147 |          488 |           287 |                        123 |               52 |                    11 |
| `16.svg`      |       73,688 |          445 |           287 |                        123 |               47 |                     2 |
| `14_occl.svg` |       54,691 |          290 |           215 |                        107 |               19 |                     4 |
| `16_occl.svg` |       57,735 |          293 |           225 |                        107 |               17 |                     4 |
| Total         |      413,445 |            — |             — |                          — |                — |                     — |

Projected chart SVG element counts:

| View              | Source SVG elements before runtime pruning | Runtime SVG elements after pruning | Baseline            |
| ----------------- | -----------------------------------------: | ---------------------------------: | ------------------- |
| Side              |                                     14,952 |                              9,124 | Approved: <= 9,500  |
| Side and occlusal |                                     20,788 |                             13,544 | Approved: <= 14,000 |

The permanent performance-budget spec enforces the asset total and runtime node
ceilings in `renderer-performance.spec.ts`.

## Fetching and parsing baseline

- Side view uses the four side archetype URLs only: `11.svg`, `13.svg`,
  `14.svg`, `16.svg`.
- Side-and-occlusal view adds only `14_occl.svg` and `16_occl.svg`.
- `loadToothSvgTemplate()` caches by `templateId|url`, shares in-flight loads,
  evicts failed loads for retry, and returns a fresh clone to each caller.
- Focused loader tests verify side view fetches no occlusal templates and all
  six templates are fetched/parsed at most once per URL.

## Local timing proxy

Temporary jsdom harness measurements from this workstation:

| Operation                                                      | Local jsdom timing |
| -------------------------------------------------------------- | -----------------: |
| First side-view mount, 32 teeth, file-backed fetcher           |           878.0 ms |
| One-tooth condition update, same chart instance                |           615.8 ms |
| Side to side-and-occlusal view switch, 20 added occlusal roots |           369.0 ms |
| Bridge overlay resize/remeasure                                |             1.7 ms |

The one-tooth update number includes React effect scheduling and `waitFor`
polling overhead in jsdom, so it is not a browser-frame measurement. Its
approved ODONTO-13 meaning is lifecycle stability: the update does not refetch
templates or reconstruct unaffected tooth SVG roots.

## Hardening completed in ODONTO-13

- Runtime normalization prunes dormant non-v1 layers and unused definitions
  from cloned templates while preserving the public copied SVG files and hashes.
- Approved semantic layers are the only elements that retain `data-active`;
  static anatomy and helper descendants stay visible/structural without being
  renderer-controlled toggles.
- Fragment references are checked after pruning so required definitions remain
  transitively available.
- Individual tooth rendering is memoized; selection and one-tooth visual updates
  do not refetch templates or replace unaffected SVG roots.
- Bridge overlay measurement remains scoped to the chart container and divides
  scaled DOM rects back into the unscaled chart coordinate system.
- Strict Mode, two chart instances, failed asset retry, ResizeObserver cleanup,
  and reduced-motion-safe styling are covered by focused tests.

## Release baseline and remaining browser profile

Approved ODONTO-13 baseline for proceeding to ODONTO-14:

- No new production dependency.
- Public SVG transfer remains 413,445 bytes total.
- Side view runtime SVG elements remain at or below 9,500.
- Side-and-occlusal runtime SVG elements remain at or below 14,000.
- Side view fetches no occlusal SVGs.
- One-tooth updates do not refetch templates or replace unaffected tooth SVG
  roots.
- Bridge resize/zoom alignment remains covered by tests.

Before production release, repeat timing in Chrome or Edge with CPU throttling
profiles for:

- desktop default viewport;
- tablet-width viewport;
- phone-width viewport;
- reduced-motion enabled;
- two simultaneous odontogram instances.

If those browser profiles show a material regression from this baseline, resolve
or explicitly approve it before integrating Treatment persistence.
