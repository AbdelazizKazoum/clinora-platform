# Third-Party Notices

This source-repository notice records third-party material adapted for Clinora's odontogram feature. It is repository documentation; the distributable MIT license text is kept at `apps/frontend/public/odontogram/LICENSE.react-advanced-odontogram.txt`.

## React Advanced Odontogram

- Project: React Advanced Odontogram
- Source repository: https://github.com/ZoliQua/React-Odontogram-Modul
- Local reference snapshot: `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/`
- Declared package version in the local snapshot: 2.4.0
- Tooth SVG artwork version declared in each copied SVG comment: 2.5.0
- Author: Zoltán Dul
- Copyright notice: Copyright (c) 2026 Zoltán Dul
- License: MIT
- Citation request in upstream README/CITATION: DOI 10.5281/zenodo.21156787

No reliable Git commit was found that ties the local declared-2.4.0 snapshot to the generated documentation commit links, so Clinora identifies the imported material by the local reference path and source-file provenance above.

The package snapshot version and tooth SVG artwork version have distinct version scopes. Clinora records both and does not relabel the copied assets.

### ODONTO-02 Adapted Files

- `apps/frontend/src/features/odontogram/rendering/tooth-layout.ts` adapts the permanent tooth ordering, side-template assignment, mirror flag, and rotation metadata from `src/odontogram.ts`.
- `apps/frontend/src/features/odontogram/utils/tooth-numbering.ts` adapts the permanent FDI, Universal, and Palmer numbering formulas from `src/utils/numbering.ts`.
- `apps/frontend/src/features/odontogram/rendering/svg-template-loader.ts` adapts the trusted-template normalization concepts from `src/odontogram.ts`, including the switchable-layer `data-active` defaults and inline `display:none` conversion. It does not copy the legacy singleton renderer, DOM event wiring, Vite `?raw` imports, or application state.
- `apps/frontend/src/features/odontogram/components/odontogram-tooth.tsx` adapts the legacy per-template mirror and rotation behavior from `src/odontogram.ts` into an instance-scoped React component. It does not copy legacy chart state, global selectors, control-panel wiring, or clinical condition activation.

### ODONTO-03 Copied SVG Assets

The following files were copied byte-for-byte from `src/assets/teeth-svgs/` to `apps/frontend/public/odontogram/teeth/`. Each copied SVG retains its embedded upstream MIT attribution comment.

| File          | Size bytes | SHA-256                                                            |
| ------------- | ---------: | ------------------------------------------------------------------ |
| `11.svg`      |     73,705 | `83db8558718d419d40221bd78ac01be7301934ec9a5789357531c23d7c7bde11` |
| `13.svg`      |     73,479 | `87ccfddbb04d5d4cb67abacfedbb0a3e9fbaa502929f180245c00367ffaddc62` |
| `14.svg`      |     80,147 | `7d8f63a3e42960c0e8c39463aedb45f28a03194eecc76c278770e74bca6bef18` |
| `16.svg`      |     73,688 | `e75d3e88f3d7ecf6bf10f209039f7dc0a3caa775a5874f80e098d2c5e189b0d4` |
| `14_occl.svg` |     54,691 | `3cba976ff9392f21369c513da9455448b8685d6868fac125bf2758131149d04b` |
| `16_occl.svg` |     57,735 | `268f59d200f0194663eec9136c5a8c2b833501e65623ec29693ca4672ca1c13e` |

Primary-tooth display remapping, renderer state, Vite raw-SVG loading, periodontal logic, FHIR import/export, plugin support, and PDF/font export code were not migrated.

No logo, toolbar icon, screenshot, translated README, generated documentation asset, font subset, ISO PDF, DOI badge, or other legacy asset was copied for ODONTO-03.

### ODONTO-10 Adapted Files

- `apps/frontend/src/features/odontogram/rendering/restoration-layers.ts` adapts the fixed-restoration material matrix and layer-composition rules from `src/registry/restorations.ts`. Clinora narrowed the adaptation to the approved visual renderer contract for crown, inlay, onlay, and veneer layers, including telescope crown child-layer activation. Legacy UI options, bridge rendering, removable prosthesis choices, FHIR, and clinical workflow logic were not migrated in this task.

### ODONTO-11 Adapted Files

- `apps/frontend/src/features/odontogram/rendering/bridge-layout.ts` adapts the bridge span and saddle-bar geometry concepts from `src/bridgeOverlay.ts`. Clinora adds explicit `bridgeId` grouping before adjacency detection so neighboring independent bridges do not merge, and keeps the logic pure for deterministic tests.
- `apps/frontend/src/features/odontogram/components/bridge-overlay.tsx` adapts the bridge overlay rendering into an instance-scoped React component using a caller-provided chart container ref and scoped anchor queries. Legacy fixed IDs, document-level selectors, body/global overlay behavior, and singleton chart state were not migrated.
- `apps/frontend/src/features/odontogram/rendering/restoration-layers.ts` now also adapts the bridge unit crown-plus-connector layer composition needed by bridge abutments and pontics, while leaving bridge workflow/business eligibility to the Clinora Treatment domain.

### ODONTO-13 Adapted Files

- `apps/frontend/src/features/odontogram/rendering/svg-template-loader.ts` now prunes dormant non-v1 layers and unused definitions from the normalized runtime clone after adapting the legacy switchable-layer normalization concepts. The public copied SVG files remain byte-for-byte upstream copies; no new legacy assets were copied.

### PARITY-01 Adapted Inventories

- `apps/frontend/src/features/treatment/model/treatment-capabilities.ts` adapts the reviewed clinical-axis names, special per-surface fields, applicability notes, lifecycle projection support, and record-only distinctions from `src/registry/axes.ts`, `src/registry/restorations.ts`, `src/registry/svgLayers.ts`, and `src/fhir/codesystems.ts`. It is an inert Treatment capability inventory and does not copy the legacy store, persistence, FHIR, UI, or renderer implementation.
- `apps/frontend/src/features/treatment/model/treatment-inputs.ts` adapts the legacy restorative, periodontal, index-surface, and furcation geometry distinctions into serializable Clinora input contracts with a runtime UI boundary validator. It does not import or execute legacy code.
- No new legacy SVG layer was activated by PARITY-01. The existing approved runtime manifest remains unchanged.

### PARITY-02 Adapted Files

- `apps/frontend/src/features/odontogram/model/odontogram.ts` adapts the
  reviewed structural, primary-dentition, planned-implant, and prosthesis visual
  DTO concepts while keeping lifecycle/business eligibility in Treatment.
- `apps/frontend/src/features/odontogram/utils/tooth-numbering.ts` adapts the
  upstream primary FDI and Universal display remapping while preserving the
  permanent-position identity used by Clinora.
- `apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.ts`
  adapts the structural and implant/prosthesis layer compositions from
  `src/odontogram.ts`, `src/registry/svgLayers.ts`, and
  `src/__tests__/prosthesis-render.test.ts`. The renderer remains controlled and
  instance-scoped; it does not import the legacy store or decide Treatment
  eligibility.
- `apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.ts`
  maps Treatment findings and acts into those visual conditions, including
  deterministic planned/completed/cancelled implant lifecycle behavior and
  stable prosthesis group IDs.
- The six copied SVG assets were not changed. The approved runtime layer
  manifest was expanded only for the reviewed PARITY-02 layers, and the
  renderer performance fixture was re-baselined to the measured normalized
  node/asset totals.
