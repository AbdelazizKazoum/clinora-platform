# Clinora Odontogram Integration Plan

Status: analysis complete; implementation has not started

Plan date: 2026-08-12

Legacy snapshot inspected: React Advanced Odontogram 2.4.0 under
legacy/react-advanced-odontogram/React-Odontogram-Modul-main/

This document is the implementation authority for the odontogram integration.
It must be read together with the repository-root AGENTS.md,
apps/frontend/AGENTS.md, and docs/architecture/frontend.md before executing an
ODONTO task.

## 1. Executive Summary

The downloaded project is a complete standalone dental-charting application,
not a reusable Clinora Treatment module. Its valuable core is an SVG-based
visualization system: six detailed tooth templates, a 32-position FDI layout,
named SVG layers for conditions and restorations, tooth-number formatting, and
some useful pure layout/composition rules. The live chart is not Canvas, 3D,
Three.js, React Three Fiber, Drei, or WebGL. React renders the surrounding
application shell, while a roughly 10,000-line imperative module parses and
clones SVG markup, mutates module-global state, wires DOM events, and switches
named SVG layers.

Clinora should selectively extract that visual knowledge into an independent
feature at apps/frontend/src/features/odontogram/. It should not install or
embed the published package and must never import from legacy/ at runtime.

The proposed integration will:

- keep the six MIT-licensed tooth SVG archetypes and their layer vocabulary;
- adapt tooth ordering, transformations, numbering, layer composition,
  accessibility, selection, surface notation, and bridge geometry into small,
  strict TypeScript modules;
- expose controlled React visual data and interaction callbacks;
- replace the singleton state, global DOM queries, global stylesheet,
  application shell, action panels, settings, dialogs, theme system, and
  persistence with Clinora-owned equivalents;
- exclude periodontal charting, FHIR, PDF/image export, bundled fonts,
  plugins, tours, demo assets, and localStorage from the initial integration;
- require no new production dependency for the planned visualization scope.

The dependency direction will be:

~~~text
Treatment-owned data and workflow
              |
              v
Treatment-owned visual mapper
              |
              v
Odontogram public visual model
              |
              v
Controlled odontogram components
              |
              v
Scoped SVG template renderer
~~~

The current repository does not yet contain a real Treatment feature, visit
model, treatment-act model, Treatment API, or Treatment persistence workflow.
Therefore the visualization feature can be built and tested independently,
but the Treatment mapper and route integration must wait for real Treatment
contracts. No speculative Treatment models should be created to unblock this
plan.

## 2. Clinora Frontend Architecture

### 2.1 Sources inspected

The decisions in this plan are based on the current repository, specifically:

- AGENTS.md;
- apps/frontend/AGENTS.md;
- docs/architecture/frontend.md;
- docs/architecture/nx-monorepo-guide.md;
- current App Router routes, frontend features, styles, tests, and workspace
  configuration;
- the current Treatment and visit placeholders;
- the waiting-room-to-Treatment handoff;
- ignored build artifacts from a discarded odontogram experiment, used only as
  historical evidence.

Repository instructions take precedence over the approximate structure and
styling assumptions in the integration request.

### 2.2 Architecture that actually exists

Clinora's frontend is a Next.js App Router application in an Nx monorepo. It
uses pnpm, Next.js 16.2.3, React 19, strict TypeScript 6, Jest 30, Bootstrap
5.3, React Bootstrap, Sass, and Ubold-derived global styling. There is no
Tailwind setup in the current frontend.

The established conventions are:

- routes under apps/frontend/src/app are thin composition points;
- feature-specific UI, models, hooks, API code, schemas, state, and utilities
  remain under apps/frontend/src/features/<feature>/;
- a feature exposes its supported surface through index.ts;
- cross-feature consumers import from the public feature entry point, never
  another feature's internal paths;
- Server Components are the default and client boundaries stay as low as
  practical;
- TanStack Query owns server state and API synchronization;
- transient UI state remains local; Zustand is used only when a real
  cross-component workflow requires it;
- DTO conversion occurs at the API boundary and pure TypeScript mappers/rules
  are preferred;
- feature-local CSS/SCSS Modules use Clinora/Ubold/Bootstrap variables;
- files use kebab-case, while components and types use PascalCase;
- code moves to libs/frontend/ only after genuine cross-application reuse is
  demonstrated;
- no frontend Clean Architecture, repositories, use cases, dependency
  injection, CQRS bus, or backend-style domain/application/infrastructure
  folders should be introduced.

Representative current features are appointments, patients, staff, and
waiting-room. They create only the folders they need. Odontogram therefore
does not need api/, hooks/, schemas/, stores/, pages/, or adapters/ merely to
look like a mature business feature.

The full Ubold reference contains no matching dental, clinical-treatment, or
odontogram screen. Future Treatment composition should therefore follow
existing Clinora cards, spacing, controls, and responsive patterns while using
Ubold only as the design-language reference.

Nx infers the frontend build, lint, test, development, and start targets. The
relevant verification commands for future tasks are:

~~~bash
pnpm nx test frontend
pnpm nx lint frontend
pnpm nx build frontend --skip-nx-cache
~~~

Focused tests may use the frontend Jest target with an odontogram path pattern.
The current workspace exposes no separate frontend typecheck target; the Next
build is the production type-check gate.

### 2.3 Current Treatment reality

Despite the wording of the request, there is no tracked Treatment
implementation to integrate with today:

- apps/frontend/src/features/treatment/ contains no source files;
- apps/frontend/src/app/(admin)/visits/page.tsx and
  apps/frontend/src/app/(admin)/visits/new/page.tsx are breadcrumb-only stubs;
- no Treatment models, treatment acts, plans, visits, API modules, hooks,
  stores, schemas, components, or public index exist;
- no Treatment/visit backend service or shared contract currently exists.

The implemented boundary closest to Treatment is:

apps/frontend/src/features/waiting-room/model/waiting-room-treatment.ts

It builds a typed /visits/new handoff containing patientId, appointmentId,
queueEntryId, chairId, and doctorId when the patient is in a chair. Existing
waiting-room documentation explicitly assigns consumption and validation of
that handoff to the future Treatment bounded context.

The mapper proposed later in this plan therefore belongs to Treatment once
Treatment has real models, for example:

apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.ts

That file must not be created with invented DTOs or acts.

### 2.4 Discarded experiment

Ignored .next source maps preserve evidence of a previous, no-longer-tracked
experiment that imported react-advanced-odontogram 2.1.0 into Treatment. It
rendered the package's full shell, loaded its whole global stylesheet, used a
MutationObserver to move body-level portals into a scoped container, and
explicitly had no persistence. The dependency is absent from the current
frontend manifest and root lockfile.

That experiment is not current architecture and contains no reusable source.
It demonstrates why the published shell is the wrong boundary: it brings its
own workflow and state, collides with Bootstrap/Ubold selectors, requires
global DOM repair, and produces a large client bundle. It must not be revived.

## 3. Legacy Odontogram Architecture

In this document, LEGACY_ROOT means:

legacy/react-advanced-odontogram/React-Odontogram-Modul-main/

### 3.1 Entry points and dependencies

~~~text
src/main.tsx
  Vite demo bootstrap using createRoot
           |
           v
src/App.tsx ---------------------------------------------------+
  standalone React application shell                           |
  toolbar, settings, controls, summaries, import/export, perio |
           |                                                   |
           v                                                   |
src/odontogram.ts                                              |
  singleton imperative engine, state, DOM, rendering, events   |
     |              |               |                |          |
     v              v               v                v          |
teeth SVGs     src/registry/*  bridgeOverlay.ts  i18n/theme     |
     |              |               |                |          |
     +--------------+---------------+----------------+----------+
                            |
                            v
              inline SVG and DOM in #toothGrid

src/index.ts
  library entry, imports global index.css, exports App as
  OdontogramShell plus the imperative engine API

Optional branches:
  persistence.ts ------------------------------> localStorage
  plugin.ts -> pluginSanitize.ts --------------> DOMPurify
  FHIR modules and registry adapters ----------> type-only fhir/r4
  PDF/perio export -> fonts/* -----------------> dynamic jsPDF
~~~

### 3.2 Major areas

| Area | Actual implementation |
| --- | --- |
| React shell | src/App.tsx is approximately 1,200 lines and renders the original top bar, controls, status/plan workflow, summaries, settings, export, notes, periodontal UI, and the empty chart mount point. |
| Rendering/state engine | src/odontogram.ts is approximately 10,102 lines. It owns module-level Maps, Sets, flags, DOM references, subscriptions, rendering, controls, selection, import/export, and much clinical state. |
| Public entry | src/index.ts imports the global stylesheet as a side effect and exports both the full shell and a broad imperative API. |
| Models/types | There is no small stable visual DTO. defaultState() returns a large mixed object. Strict mode is disabled, src/odontogram.ts defines an Any alias, and registry types fall back to broad records/any. |
| State management | React hooks in App mirror an imperative module singleton. There is no Redux, Zustand, or Context store. The README limits the implementation to one instance per page. |
| Hooks | There is no reusable rendering-hook layer. App uses built-in React hooks, and src/i18n/useI18n.ts is the only notable custom UI hook. |
| Visual assets | Six detailed tooth SVG templates contain base anatomy plus hidden named condition/restoration layers. Five toolbar icons, a logo, and a DOI badge serve the legacy application UI. |
| Condition registry | src/registry/ contains useful layer and restoration concepts, but axes.ts also mixes clinical rules, FHIR codes, labels, UI options, and SVG metadata. |
| Bridge rendering | src/bridgeOverlay.ts includes useful pure span/geometry functions plus an imperative, measured DOM overlay. |
| Numbering | src/utils/numbering.ts contains pure FDI, Universal, and Palmer formatting for permanent and primary teeth. |
| Persistence/API | There is no backend API. src/persistence.ts is optional localStorage; JSON/FHIR file import/export is local. |
| Optional subsystems | Periodontal charting, FHIR conversion, PDF/image export, embedded fonts, plugins, sanitization, tour, translations, and theme/settings are all coupled to the full app rather than required by the tooth renderer. |
| Tooling | Vite, Vitest, Tailwind/PostCSS build tooling, TypeDoc, API Extractor, and GitHub Pages support the standalone/package project. |

### 3.3 State and workflow coupling

The engine holds charts.status and charts.plan Maps, selectedTeeth, an active
tooth, settings, case metadata, periodontal data, and subscribers at module
scope. Individual mutable tooth records contain Sets and Maps for surfaces and
many fields for tooth presence, caries, fillings, restorations, pulp/endodontic
states, periodontal sites, orthodontics, notes, and plan flags.

Status/plan switching, lazy plan cloning, edit confirmation, proposed styling,
and status-versus-plan differences are business workflow embedded in the
renderer. Clinora must not copy those decisions. Treatment will decide what
the current data means and map it to a visual appearance; Odontogram will only
draw the supplied appearance.

App.tsx subscribes to the singleton and mirrors summaries and UI flags into
React state. Some panels stay mounted while hidden because the imperative
one-time event wiring does not tolerate normal React unmount/remount behavior.
Fixed IDs, document-level queries/listeners, global CSS, and module globals make
multiple instances and React Strict Mode fragile.

## 4. Rendering Engine Analysis

### 4.1 Rendering technology

The live chart uses inline SVG manipulated through browser DOM APIs. It does
not use Canvas, Three.js, React Three Fiber, Drei, WebGL, 3D models, cameras, or
orbit controls. Canvas, Image, XMLSerializer, Blob, and jsPDF appear only in
export paths.

The core files are:

- src/odontogram.ts: template selection, grid construction, state-to-layer
  rendering, selection, touch behavior, and most condition rules;
- src/assets/teeth-svgs/11.svg, 13.svg, 14.svg, and 16.svg: incisor, canine,
  premolar, and molar front/side archetypes;
- src/assets/teeth-svgs/14_occl.svg and 16_occl.svg: posterior occlusal
  archetypes;
- src/registry/svgLayers.ts and src/registry/svgActivate.ts: layer discovery
  and activation concepts;
- src/registry/restorations.ts: restoration/material validity and layer
  composition;
- src/bridgeOverlay.ts: multi-tooth bridge span and overlay geometry;
- src/utils/numbering.ts: display numbering.

### 4.2 Tooth representation and arch construction

src/odontogram.ts imports each SVG as a Vite-specific raw string. TOOTH_TEMPLATE
maps all 32 permanent FDI chart positions to the four anatomical archetypes.
The opposite quadrant mirrors an archetype horizontally and the lower arch
rotates it 180 degrees. Only premolar and molar positions receive real
occlusal templates; anterior positions receive placeholders.

buildGrid() uses DOMParser, normalizes initially hidden elements to
data-active="0", clones template markup, applies transforms, and builds six
rows:

1. upper tooth numbers;
2. upper front/side teeth;
3. upper occlusal views/placeholders;
4. lower occlusal views/placeholders;
5. lower front/side teeth;
6. lower tooth numbers.

The result is 32 front/side SVG clones plus 20 posterior occlusal clones. The
six source files total 413,445 bytes (approximately 403.8 KiB), and blindly
cloning every source element produces approximately 20,788 SVG elements before
transform groups and roughly 21,000 total chart nodes with wrappers/labels.
Promise-based setup does not move parsing or cloning off the main thread.

The proposed Clinora renderer should retain this efficient archetype mapping,
but React should own chart/tooth instances and props. A small renderer internal
to each tooth may still parse and mutate trusted SVG templates through a
scoped ref; manually translating that dense markup into JSX would add
maintenance cost without improving the feature boundary. ODONTO-03 first
normalizes the complete trusted templates for safety and symmetric layer
switching. Because the v1 allowlist is discovered and verified across
ODONTO-08 through ODONTO-11, evidence-backed pruning to base anatomy, approved
layers, and their referenced definitions happens only in ODONTO-13. The
adapted renderer must have no module-global clinical state, fixed document
IDs, or document-wide selectors.

### 4.3 Numbering

The chart's stable storage/layout keys are the 32 permanent FDI positions:

~~~text
Upper: 18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28
Lower: 48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38
~~~

Universal and Palmer are display formats derived from those positions. The
legacy engine also allows a primary tooth to occupy a corresponding permanent
position and remaps its displayed FDI quadrant from 1-4 to 5-8 for positions
1-5. A new model must therefore distinguish a stable chart position from a
displayed clinical tooth number.

The recommended first release supports the 32 permanent positions only.
Primary/mixed dentition should be a later explicit extension, not hidden in a
generic number type.

### 4.4 Surfaces

Restorative data uses five canonical surfaces:

~~~text
buccal | lingual | mesial | distal | occlusal
~~~

Display notation changes by context: occlusal is shown as incisal for anterior
teeth, buccal may be shown as labial for anterior teeth, and lingual may be
shown as palatal for upper teeth. The canonical stored surface must not change
when its display label changes.

Periodontal geometry is different: probing uses six sites, plaque uses four
surfaces, and furcation entrances vary by tooth. Those concepts must not be
collapsed into the five restorative surfaces. Periodontal charting is outside
the initial integration.

Critically, the legacy SVG paths are not clickable surface hit regions. The
SVG element has pointer-events disabled. Surface authoring occurs in a
separate HTML five-surface cross in the control panel and is applied to the
selected tooth or teeth. Clinora should first adapt that cross as a controlled
ToothSurfaceSelector. Direct anatomical surface hit-testing would be new
product and geometry work, not a migration task.

### 4.5 Conditions and visual states

Each tooth template contains base anatomy and many hidden groups/paths with
semantic IDs. applyStateToSvgSingle() clears a known layer set, derives visual
gates from the mutable tooth state, activates named layers, and applies
material colors or planned-state styling.

Examples include:

- caries and filling layers per canonical surface;
- ICDAS/CARS severity variants;
- subcaries when caries and a filling coexist on a surface;
- crown, bridge, inlay, onlay, veneer, and material layers;
- missing tooth, implant, pulp/endodontic, periapical, wear, discoloration,
  orthodontic, and other whole-tooth layers.

The full legacy condition catalogue is larger than Clinora's initial need.
The production layer registry should include only approved visual conditions,
with deterministic reset/precedence behavior and strict types. It must not
copy axes.ts wholesale because that file mixes rendering metadata with FHIR,
UI, i18n, applicability, and clinical workflow.

Bridge rendering is separate from per-tooth layers. The legacy overlay detects
adjacent bridge-marked positions, measures their tiles with
getBoundingClientRect(), and draws an absolutely positioned SVG connector.
Its lack of a bridge/group identity can merge two independent adjacent
bridges. Clinora's visual model must include an opaque bridgeId. An abutment
retains a present natural or implant base, while a pontic suppresses natural
tooth anatomy and displays a crown-shaped body plus connector. A valid group
stays within one arch, is contiguous, and has one material/appearance unless a
later visual contract defines an explicit mixed-material rule.

### 4.6 Selection and viewport behavior

A normal tile click replaces selection; Ctrl/Command-click toggles
multi-selection; the last clicked tooth becomes active. The side view,
occlusal view, and number label select the same position. Keyboard behavior
uses listbox/option semantics with Enter/Space, arrow navigation, and Escape.

This behavior is worth adapting, but selection must be controlled React state
owned by the consumer when it drives Treatment. The renderer should calculate
the next selection and emit it; it must not keep a singleton selectedTeeth
Set.

Mobile behavior is CSS-transform zoom, tap/long-press overlays, pinch handling,
and an arch switcher. There is no camera. A later Clinora viewport task may
adapt bounded CSS zoom and touch handling, but must replace body-level
popovers/context menus with scoped Clinora UI and clean up every observer and
listener.

Legacy hover is not a separate geometry engine. updateToothTooltip() derives a
clinical summary from the mixed tooth state and writes it into native title
attributes on side/occlusal tiles; touch uses separate overlays. Clinora should
not migrate that clinical-summary builder. Version 1 keeps local hover/focus
styling only. Any later tooltip must derive only from the visual contract (or
receive consumer-authored accessible text), work on keyboard focus as well as
hover, and stay scoped to Clinora UI.

## 5. Keep / Adapt / Replace / Remove Matrix

Classification describes the migration decision, not a runtime dependency on
the legacy directory.

| Legacy module/file | Classification | Destination | Reason |
| --- | --- | --- | --- |
| src/assets/teeth-svgs/11.svg, 13.svg, 14.svg, 16.svg | KEEP as source; ADAPT at runtime | apps/frontend/public/odontogram/teeth/ | All four files are used as the complete incisor/canine/premolar/molar source archetypes. Preserve byte-identical attribution/provenance, then normalize trusted clones and retain only approved runtime layers. |
| src/assets/teeth-svgs/14_occl.svg, 16_occl.svg | KEEP as source; ADAPT at runtime | apps/frontend/public/odontogram/teeth/ | Both files are used for the approved posterior occlusal view. Preserve source bytes, but load conditionally and normalize/prune runtime clones. |
| src/utils/numbering.ts | ADAPT | apps/frontend/src/features/odontogram/utils/tooth-numbering.ts | Pure useful FDI/Universal/Palmer logic; tighten types and initially expose permanent dentition only. |
| TOOTH_TEMPLATE and ALL_TEETH portions of src/odontogram.ts | ADAPT | rendering/tooth-layout.ts | Preserve arch order, archetype choice, mirror, and rotation as strict immutable metadata. |
| buildGrid/template parsing portions of src/odontogram.ts | ADAPT | rendering/svg-template-loader.ts and React components | Preserve trusted-template parsing concepts, but replace Vite imports, global grid mutation, fixed IDs, and global state. |
| applyStateToSvgSingle() concepts in src/odontogram.ts | ADAPT | rendering/tooth-layer-registry.ts and rendering/apply-tooth-visuals.ts | Extract only approved visual rules into small typed functions; do not copy the monolith. |
| src/registry/restorations.ts | ADAPT | rendering/restoration-layers.ts | Its pure matrix/composition logic is valuable, but UI options, unsupported materials, and business applicability must be trimmed. |
| src/registry/svgLayers.ts and src/registry/svgActivate.ts | ADAPT | rendering/tooth-layer-registry.ts | Retain layer reset/activation concepts with strict visual-only inputs. |
| src/registry/axes.ts, types.ts, validate.ts | ADAPT | Small model/rendering modules only where needed | Useful vocabulary exists, but these files mix FHIR, labels, UI, clinical gates, broad records, and any. Never copy wholesale. |
| Pure functions in src/bridgeOverlay.ts | ADAPT | rendering/bridge-layout.ts | Span/geometry logic is reusable after adding bridge identity and tests. |
| Imperative renderer in src/bridgeOverlay.ts | REPLACE | components/bridge-overlay.tsx | React owns the overlay, a scoped container, measurement, and ResizeObserver lifecycle. |
| Surface notation/buildSurfaceCross portions of src/odontogram.ts | ADAPT | utils/surface-notation.ts and components/tooth-surface-selector.tsx | Preserve canonical/display mapping and cross interaction using controlled React. |
| Selection/a11y logic in src/odontogram.ts | ADAPT | components and model/odontogram-selection.ts | Keep useful keyboard/multi-select behavior without global queries or singleton Sets. |
| updateToothTooltip()/getStateSummary() hover summary in src/odontogram.ts | REMOVE/DEFER | — | It exposes the mixed clinical state through native title text. V1 keeps visual hover/focus styling; any later accessible tooltip uses only public visual data or consumer text. |
| Chart markup in src/App.tsx | ADAPT | components/odontogram.tsx and odontogram-arch.tsx | Only the chart composition is relevant; it becomes a controlled Clinora component. |
| Full src/App.tsx shell and control panels | REPLACE | Future Treatment workspace and existing Clinora UI components | Treatment owns actions, workflow, patient context, and dialogs; Ubold/Bootstrap owns visual language. |
| src/index.css | REPLACE | components/odontogram.module.scss | The original global body, card, row, button, select, dark, and wildcard selectors would collide with Clinora. Extract renderer-only rules and tokens. |
| src/theme.ts | REPLACE | Clinora Bootstrap/Ubold CSS variables | It is a color reference, not a second theme system. |
| src/persistence.ts and JSON file persistence | REPLACE | Future Treatment BFF/API and TanStack Query hooks | localStorage and files cannot be the clinical source of truth. |
| src/i18n/* | REPLACE/DEFER | Clinora localization boundary when one is approved | Do not ship the 669,519-byte (approximately 653.8 KiB) legacy translation catalogue for initial rendering. |
| Relevant numbering, SVG, condition, restoration, bridge, touch, and a11y tests | ADAPT | Colocated Jest specs in the odontogram feature | Use selected tests/goldens as parity oracles; rewrite against the new public model and Jest setup. |
| src/main.tsx, src/index.ts, index.html | REMOVE | — | Vite demo/package entry and broad imperative public API are not part of Clinora. |
| SettingsModal.tsx, ExportOptionsModal.tsx, DualStateConfirm.tsx, tour.ts, status_extras.ts | REMOVE | — | Legacy application workflow and UI are outside the renderer boundary. |
| PerioChart.tsx, PerioSidebar.tsx, perio*.ts | REMOVE/DEFER | — | Periodontal charting is a separate capability and model, not an initial odontogram dependency. |
| src/fhir/* and registry FHIR adapters | REMOVE/DEFER | — | FHIR import/export is not rendering and should be separately owned if Clinora later requires it. |
| src/plugin.ts and src/pluginSanitize.ts | REMOVE/DEFER | — | Arbitrary SVG plugins are not required; removing them avoids DOMPurify and a security surface. |
| PDF/image exporters and src/fonts/* | REMOVE/DEFER | — | Not needed for visualization; embedded fonts have separate unresolved notice/provenance work. |
| src/assets/icon-svgs/*, src/assets/react-module-logo.png, src/assets/zenodo.21156787.svg | REMOVE | — | Original application branding/toolbar/DOI assets are unnecessary. |
| lang/*.md and docs/assets/* | REMOVE | — | Translated README files, 22 screenshots, and generated TypeDoc JS/CSS/SVG assets are documentation output, not production input. |
| iso/*.pdf | REMOVE | — | Standards references are unnecessary and include copyright/reproduction restrictions. |
| Vite, Vitest, Tailwind/PostCSS, TypeDoc, API Extractor, and deployment configs | REMOVE | — | Clinora already has Next/Nx/Jest/Sass tooling. |

## 6. License & Attribution

### 6.1 Source license

LEGACY_ROOT/LICENSE is the MIT License:

Copyright (c) 2026 Zoltán Dul

It permits use, copy, modification, distribution, sublicensing, and commercial
use. Its condition is that the copyright and permission notice be included in
all copies or substantial portions. This plan is an engineering assessment,
not legal advice.

Every production TypeScript/TSX source inspected has an upstream project and
author header. Every one of the six tooth SVGs has an embedded comment naming
Zoltan Dul, the year 2026, the MIT license, and the source project. Those
comments must remain intact.

Before or together with the first substantially adapted code in ODONTO-02:

1. preserve each copied SVG's embedded comment byte-for-byte;
2. preserve the upstream header on any file that substantially copies source,
   add a clear Clinora modification note, and do not imply original authorship;
3. add apps/frontend/public/odontogram/LICENSE.react-advanced-odontogram.txt
   containing the full upstream MIT text so the notice ships with the assets;
4. add
   apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md recording the
   upstream name, author, repository URL, local source version/path, copied or
   adapted files, modifications, and the public license location. This is
   source-repository provenance; the public full MIT file is the notice that
   Next distributes;
5. record SHA-256 hashes for the six source and copied SVGs during ODONTO-03;
6. keep legacy/ read-only and never make production imports from it.

The package and README identify version 2.4.0 and repository
https://github.com/ZoliQua/React-Odontogram-Modul. CITATION.cff requests a
research citation and gives concept DOI 10.5281/zenodo.21156787, but this is a
request rather than an extra MIT license condition. Its metadata says version
2.2.0, while every tooth asset header says SVG Version 2.5.0. The provenance
notice must record the package snapshot as 2.4.0, the assets' self-declared
artwork/SVG version as 2.5.0, and their distinct version scopes; it must not
relabel the assets.
Generated, stale TypeDoc output links to commit
0adf3ab43cdeece8aa01723f66f5fa5fc3959599, but no reliable commit ties the
current declared-2.4.0 snapshot to Git. Do not use that hash as current
provenance or invent another.

### 6.2 Asset-specific findings

| Asset group | Finding | Decision |
| --- | --- | --- |
| Six tooth SVGs | Carry explicit upstream MIT comments and are authored as part of the project. | LOW legal risk when copied unchanged with comments and the MIT notice. These are the only initial assets. |
| Five toolbar icons | Carry similar MIT comments but support legacy controls, not the core chart. | Do not copy unless a later approved interaction needs one. |
| Roboto subsets in src/fonts/roboto.ts | Comment says Apache-2.0; the legacy tree does not include the separate font license/copyright material. | Do not migrate. Independently source and review if PDF export is later approved. |
| Noto Arabic/SC subsets in src/fonts/* | Comments say OFL; the legacy tree does not include the separate OFL notices, and modified-font naming obligations require review. | Do not migrate. |
| iso/*.pdf | Several documents explicitly restrict reproduction; all are unnecessary reference material. | Never copy or redistribute through Clinora without separate permission/legal review. |
| Logo, screenshots, DOI badge, generated docs assets | No useful renderer role; some lack individual provenance markers. | Do not copy. |
| Third-party packages | Their package metadata is not a substitute for their licenses in a distributed product. | Add normal notices only if a future task actually adds a package. |

## 7. Dependency Analysis

Versions show the legacy manifest range and exact legacy lock where relevant,
then Clinora's current declaration and resolved lock version.

| Dependency | Legacy version | Clinora version | Required? | Decision |
| --- | ---: | ---: | --- | --- |
| react | peer ^18 or ^19; dev ^18.3.1, locked 18.3.1 | ^19.0.0, locked 19.2.8 | REQUIRED, ALREADY AVAILABLE | Use Clinora React 19; test Strict Mode and React 19 types. Do not add or downgrade. |
| react-dom | peer ^18 or ^19; dev ^18.3.1, locked 18.3.1 | ^19.0.0, locked 19.2.8 | REQUIRED, ALREADY AVAILABLE | Use existing. react-dom/client is needed only by the removed Vite demo. |
| @types/react / @types/react-dom | ^18.3.3 / ^18.3.0, locked 18.3.27 / 18.3.7 | ^19.0.0 / ^19.0.0, locked 19.2.17 / 19.2.3 | REQUIRED, ALREADY AVAILABLE; POTENTIAL PORTING CONFLICT | Use existing React 19 types and resolve adapted-code errors; do not downgrade. |
| next | none | 16.2.3 | REQUIRED, ALREADY AVAILABLE | Use the existing App Router/client-component model. |
| typescript | ^5.5.3, locked 5.9.3 | ~6.0.3, locked 6.0.3 | REQUIRED, ALREADY AVAILABLE; POTENTIAL PORTING CONFLICT | Rewrite under Clinora strict TS 6; never copy Any or disable strictness. |
| sass | none | 1.97.2 at workspace root | REQUIRED, ALREADY AVAILABLE | Use a feature CSS Module and existing variables. |
| bootstrap / react-bootstrap | none | 5.3.8 / 2.10.10 | REPLACE WITH EXISTING CLINORA DEPENDENCY | Use only for Clinora controls/layout; the SVG renderer itself stays library-light. |
| dompurify | ^3.4.13, locked 3.4.13; lock reports MPL-2.0 OR Apache-2.0 | absent | UNNECESSARY / LEGACY-ONLY | Do not install. It is used only for arbitrary plugin SVG, which is removed. Review the installed package's actual license/notices if plugins are approved. |
| jspdf | ^4.2.1, locked 4.2.1; lock reports MIT | absent | UNNECESSARY / LEGACY-ONLY | Do not install. PDF export and bundled fonts are deferred. Review the installed package's actual license/notices if later approved. |
| @types/fhir | ^0.0.44, locked 0.0.44; lock reports MIT | absent | UNNECESSARY | Do not install. It supplies type-only fhir/r4 imports for deferred FHIR modules. Review the installed package's actual license/notices if later approved. |
| @testing-library/react | ^16.3.2, locked 16.3.2 | 16.3.0 | REQUIRED FOR TESTS, ALREADY AVAILABLE | Rewrite relevant tests using the workspace version. |
| @testing-library/jest-dom | ^6.9.1, locked 6.9.1 | absent | UNNECESSARY INITIALLY | Use existing Jest/Testing Library assertions; add only if a demonstrated matcher need warrants workspace review. |
| vitest / jsdom / @types/jsdom | ^4.0.18 / ^28.1.0 / ^28.0.0, locked 4.1.10 / 28.1.0 / 28.0.0 | jest-environment-jsdom ~30.3.0, locked 30.3.0, uses jsdom 26.1.0; @types/jsdom is transitive 21.1.7, not direct | REPLACE WITH EXISTING / @types UNNECESSARY | Port selected tests to the inferred frontend Jest target and existing DOM types; retain no legacy jsdom-specific code. |
| vite / @vitejs/plugin-react / vite-plugin-dts | ^7.3.1 / ^4.3.1 / ^5.0.3 | not frontend tooling | LEGACY-ONLY | Remove. Next/Nx replaces the build and package pipeline. |
| tailwindcss / postcss / autoprefixer | ^3.4.10 / ^8.4.45 / ^10.4.20 | no direct frontend Tailwind setup | UNNECESSARY | Do not install or copy the legacy build configuration. The legacy source uses a large custom global CSS file, not Tailwind utilities. |
| ESLint/tooling plugins | ESLint 9-era legacy config | workspace ESLint 9 and Nx/Next config | REQUIRED, ALREADY AVAILABLE | Use Clinora's existing configuration; do not copy legacy lint config. |
| Three.js / React Three Fiber / Drei | not used | absent | NOT REQUIRED | Do not install. The chart is SVG/DOM, not 3D. |
| Redux / Zustand | not used | Zustand 5.0.14 available | NOT REQUIRED | No renderer store is justified. Controlled props and local transient state are sufficient. |
| TypeDoc / API Extractor / gh-pages | legacy dev tooling | absent | LEGACY-ONLY | Do not install. |

Initial dependency decision: install nothing. In particular, do not add the
react-advanced-odontogram package itself. DOMPurify, jsPDF, and @types/fhir
remain conditional future decisions tied to separately approved plugin,
export, or interoperability work.

The frontend app's own Next.js 16.2.3 declaration is the relevant version for
this plan. The root workspace currently also declares Next.js ~16.1.6; this is
an existing workspace discrepancy, not odontogram scope, and must not be
changed incidentally by an ODONTO task.

## 8. Proposed Clinora Structure

This is the expected end-state after the relevant roadmap tasks, not a request
to create every file at once:

~~~text
apps/frontend/src/features/odontogram/
├── components/
│   ├── bridge-overlay.tsx
│   ├── bridge-overlay.spec.tsx
│   ├── odontogram-arch.tsx
│   ├── odontogram-tooth.tsx
│   ├── odontogram-tooth.spec.tsx
│   ├── odontogram-viewport.tsx
│   ├── odontogram-viewport.spec.tsx
│   ├── odontogram.tsx
│   ├── odontogram.module.scss
│   ├── odontogram.spec.tsx
│   ├── tooth-surface-selector.tsx
│   └── tooth-surface-selector.spec.tsx
├── model/
│   ├── odontogram-selection.ts
│   ├── odontogram-selection.spec.ts
│   ├── odontogram.ts
│   └── odontogram.spec.ts
├── rendering/
│   ├── apply-tooth-visuals.ts
│   ├── apply-tooth-visuals.spec.ts
│   ├── bridge-layout.ts
│   ├── bridge-layout.spec.ts
│   ├── restoration-layers.ts
│   ├── restoration-layers.spec.ts
│   ├── svg-id-namespace.ts
│   ├── svg-id-namespace.spec.ts
│   ├── svg-template-loader.ts
│   ├── svg-template-loader.spec.ts
│   ├── tooth-layer-registry.ts
│   ├── tooth-layer-registry.spec.ts
│   ├── tooth-layout.ts
│   └── tooth-layout.spec.ts
├── utils/
│   ├── surface-notation.ts
│   ├── surface-notation.spec.ts
│   ├── tooth-numbering.ts
│   └── tooth-numbering.spec.ts
├── THIRD_PARTY_NOTICES.md
└── index.ts

apps/frontend/public/odontogram/
├── LICENSE.react-advanced-odontogram.txt
└── teeth/
    ├── 11.svg
    ├── 13.svg
    ├── 14.svg
    ├── 14_occl.svg
    ├── 16.svg
    └── 16_occl.svg
~~~

Responsibilities:

- components/ contains the small client boundary, responsive composition,
  accessible interaction, and feature-scoped styles.
- model/ contains immutable visual DTOs and controlled selection types only.
- rendering/ contains private SVG-template, layer, restoration, and bridge
  details. It is a feature-internal subsystem, not a Clean Architecture layer.
- utils/ contains pure dental display conventions that do not touch React or
  the DOM.
- index.ts exports only the supported components, props, and consumer-facing
  visual types. Rendering internals remain private.
- public/odontogram/ contains trusted static SVG text and the license that must
  ship with it. Runtime code fetches these files once and does not use Vite
  ?raw imports or custom webpack loaders.

Do not create empty directories. Start with a single model file and split it
only when roadmap work creates distinct responsibilities. Do not initially
create api/, hooks/, stores/, schemas/, pages/, adapters/, an Nx library, or a
second application.

The Treatment mapper is deliberately absent from this tree. Once real
Treatment models exist, it belongs in:

apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.ts

## 9. Treatment to Odontogram Boundary

### 9.1 Data flow

~~~text
Treatment query data / draft / treatment acts
                    |
                    v
features/treatment/model/treatment-odontogram.mapper.ts
  - knows actual Treatment models
  - resolves business status into visual appearance
  - supplies stable bridge grouping
  - emits no prices, visits, sessions, or patient metadata
                    |
                    v
OdontogramData from @/features/odontogram
                    |
                    v
<Odontogram />
                    |
                    v
tooth components -> layer registry -> trusted SVG templates
~~~

Odontogram must never import from Treatment. Treatment may import only the
odontogram public entry:

~~~ts
import {
  Odontogram,
  ToothSurfaceSelector,
  type OdontogramData,
  type OdontogramSelection,
} from '@/features/odontogram';
~~~

The mapper is owned by Treatment because it understands TreatmentAct,
Treatment status, and any visit/session relationships. It must map only models
that actually exist at implementation time. A visual style such as existing
versus planned is acceptable in the odontogram contract; the renderer receives
that style and never derives it from a Treatment status.

### 9.2 Interaction flow

~~~text
User activates a tooth tile
          |
          v
Odontogram calculates and emits the next visual selection
          |
          v
Treatment-owned client UI stores the selection
          |
          v
User chooses an existing Treatment command/action
          |
          v
Treatment validates and persists through its BFF/API workflow
          |
          v
Treatment query/draft changes
          |
          v
Treatment mapper produces new OdontogramData
          |
          v
Odontogram re-renders changed visual state
~~~

Tooth or surface activation must never create, price, complete, schedule, or
persist a TreatmentAct. Odontogram callbacks report visual interaction only.

### 9.3 Minimum public API

The recommended public API is controlled and immutable. Exact names should be
ratified in ODONTO-01, but its responsibilities should not expand:

~~~ts
export type OdontogramView = 'side' | 'side-and-occlusal';
export type OdontogramInteractionMode = 'view' | 'select';

export interface OdontogramProps {
  data: OdontogramData;
  selection: OdontogramSelection;
  onSelectionChange?: (next: OdontogramSelection) => void;
  numberingSystem?: ToothNumberingSystem;
  view?: OdontogramView;
  interactionMode?: OdontogramInteractionMode;
  ariaLabel?: string;
  className?: string;
}

export interface ToothSurfaceSelectorProps {
  toothPosition: ToothPosition;
  value: readonly ToothSurface[];
  onChange?: (next: readonly ToothSurface[]) => void;
  disabled?: boolean;
  ariaLabel?: string;
}
~~~

OdontogramSelection should carry both the selected positions and the active
position so multi-selection does not lose the last-focused tooth:

~~~ts
export interface OdontogramSelection {
  selectedToothPositions: readonly ToothPosition[];
  activeToothPosition: ToothPosition | null;
}
~~~

Behavioral rules:

- selection is fully controlled; no default singleton or global store exists;
- view mode may display a supplied selection but emits no changes;
- select mode emits the complete next selection;
- Ctrl/Command toggling and keyboard navigation are renderer behavior;
- Treatment decides whether it allows single or multiple selection and may
  normalize an emitted selection;
- ToothSurfaceSelector is a separate controlled primitive so Treatment can
  compose it near its own action controls;
- direct SVG-region surface callbacks are not part of the first public API;
- no public method exposes SVG elements, engine Maps, imperative setters,
  import/export functions, or mutable state;
- no props accept TreatmentAct, Visit, Patient, prices, API callbacks, or
  persistence functions.

## 10. Proposed Odontogram Model

### 10.1 Design constraints

The visual model must be:

- small and serializable;
- strict and immutable;
- independent of Treatment and backend DTOs;
- explicit enough for deterministic layer rendering;
- extensible by adding reviewed visual variants rather than arbitrary strings;
- clear about chart position versus display numbering;
- free of patient, visit, session, billing, and workflow data.

The following is the proposed v1 shape, not implementation performed by this
planning task:

~~~ts
export const TOOTH_POSITIONS = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
] as const;

export type ToothPosition = (typeof TOOTH_POSITIONS)[number];

export type ToothNumberingSystem = 'fdi' | 'universal' | 'palmer';

export type ToothSurface =
  | 'buccal'
  | 'lingual'
  | 'mesial'
  | 'distal'
  | 'occlusal';

export type OdontogramAppearance = 'existing' | 'planned';
export type ToothBase = 'natural' | 'missing' | 'implant';

export type FillingMaterial =
  | 'amalgam'
  | 'composite'
  | 'gic'
  | 'temporary';

export type RestorationType =
  | 'crown'
  | 'inlay'
  | 'onlay'
  | 'veneer';

export type RestorationMaterial =
  | 'emax'
  | 'gold'
  | 'gradia'
  | 'zircon'
  | 'metal'
  | 'metal-ceramic'
  | 'telescope'
  | 'temporary';

export type OdontogramCondition =
  | {
      kind: 'caries';
      surface: ToothSurface;
      severity?: 1 | 2 | 3 | 4 | 5 | 6;
      appearance: OdontogramAppearance;
    }
  | {
      kind: 'filling';
      surface: ToothSurface;
      material: FillingMaterial;
      appearance: OdontogramAppearance;
    }
  | {
      kind: 'restoration';
      restoration: RestorationType;
      material: RestorationMaterial;
      appearance: OdontogramAppearance;
    }
  | {
      kind: 'endodontic';
      state: 'root-canal';
      appearance: OdontogramAppearance;
    }
  | {
      kind: 'extraction';
      appearance: 'planned';
    }
  | {
      kind: 'bridge';
      bridgeId: string;
      role: 'abutment' | 'pontic';
      material: RestorationMaterial;
      appearance: OdontogramAppearance;
    };

export interface OdontogramTooth {
  position: ToothPosition;
  base: ToothBase;
  conditions: readonly OdontogramCondition[];
}

export interface OdontogramData {
  teeth: readonly OdontogramTooth[];
}

export type OdontogramDataIssue =
  | { code: 'invalid-shape'; path: string }
  | { code: 'duplicate-position'; position: ToothPosition }
  | { code: 'missing-position'; position: ToothPosition }
  | { code: 'invalid-condition'; position: ToothPosition; reason: string };

export type OdontogramDataValidationResult =
  | { valid: true; data: OdontogramData }
  | { valid: false; issues: readonly OdontogramDataIssue[] };

export function validateOdontogramData(
  input: unknown,
): OdontogramDataValidationResult;
~~~

OdontogramData is logically a complete 32-position chart. Model validation
requires every ToothPosition exactly once. base='natural' with empty
conditions represents a visually unannotated natural tooth; omission must not
silently turn an incomplete clinical response into a healthy-looking chart.

The public pure validator is the runtime boundary: Treatment calls it after
mapping, and Odontogram defensively calls it before rendering. Invalid data
produces an explicit accessible chart-level error and no tooth chart; the
renderer must never fill omitted entries with natural teeth.

This is intentionally a bounded first-release catalogue, not a copy of the
legacy defaultState(). ODONTO-01 must confirm the condition list with product
and clinical stakeholders before freezing it. A variant should be removed
from v1 if no first-release consumer and no rendering task require it. Future
visual conditions such as primary dentition, fissure sealants, retained roots,
periapical findings, wear, discoloration, orthodontics, removable prostheses,
and periodontal measurements require separate model and rendering work.

The material vocabularies above are taken from the available legacy visual
layers, not from a proposed Treatment domain enum. Treatment maps its own
material concepts to supported visual values. If Clinora does not need
material-specific rendering in v1, those fields and variants should be
narrowed during ODONTO-01 rather than retained speculatively.

Caries is one surface per condition because the legacy renderer stores and
draws severity independently by surface. Severity 0 is deliberately excluded:
the absence of a caries condition means no rendered lesion; omitted severity
uses the reviewed legacy visual default of 2. Filling is likewise one surface
per condition so a tooth can show different materials by surface. Validation
permits each condition kind at most once per surface and rejects ambiguous
same-kind overlaps. If Treatment supports planned caries observations, its
mapper supplies planned appearance; otherwise ODONTO-01 should narrow caries
appearance to existing. Appearance applies only to the visual layers derived
from that condition, never base
anatomy or layers shared with an existing condition. Exact legacy proposed
styling requires the Treatment mapper to supply the existing-versus-planned
layer delta; Odontogram must not infer it from lifecycle status.

Tooth base is structural and exclusive rather than a repeatable condition.
Missing and implant represent existing anatomy; planned removal uses
extraction. Planned implant is deferred from this smallest v1 contract unless
ODONTO-01 identifies a real first-release consumer and adds a separate
planned-implant visual condition—it must not overload the structural base.
The visual validator owns an explicit base-by-condition support matrix:
caries, fillings, endodontic state, inlay, onlay, veneer, and planned
extraction require a natural base; implant permits only artwork verified for
an implant (for example an approved crown or bridge abutment); missing permits
only artwork verified for a gap, such as a bridge pontic. Subcrown caries is
deferred, so v1 also rejects caries/fillings combined with a full crown or
bridge rather than silently hiding them. These are renderer capability rules,
not Treatment eligibility rules.

Validation also allows at most one restoration, endodontic condition,
extraction marker, and bridge membership per position, with an explicit
mutual-exclusion table for contradictory whole-tooth combinations. Rendering
precedence composes legitimate visuals; it never chooses arbitrarily between
duplicate or contradictory records.

### 10.2 Why each concept exists

| Concept | Purpose |
| --- | --- |
| ToothPosition | Stable 32-slot permanent FDI layout key. It avoids confusing a chart position with a translated/displayed number. |
| ToothNumberingSystem | Presentation option only; it never changes storage identity. |
| ToothSurface | Canonical five-surface restorative vocabulary. Display labels are derived separately. |
| ToothBase | Exclusive natural/missing/implant anatomy underlying visual conditions. |
| OdontogramAppearance | Tells the renderer how to style condition-derived layers without exposing a Treatment status/lifecycle or tinting base/shared anatomy. |
| OdontogramCondition | Closed discriminated union that gives each approved visual rule typed inputs. |
| bridgeId | Groups adjacent units belonging to one bridge and fixes the legacy adjacent-bridge merge ambiguity. It is opaque to the renderer. |
| OdontogramTooth | Exclusive base plus conditions for one chart position. One entry per position is a visual invariant. |
| OdontogramData | Complete immutable chart input containing each permanent position exactly once. A natural base plus empty conditions means an unannotated natural tooth; a missing position is invalid input. |
| OdontogramSelection | Controlled selected and active positions, separate from clinical data. |

Visual validation may reject duplicate positions, unknown surfaces, impossible
renderer values, or bridge groups without enough units. It must not decide
clinical eligibility, prices, required sessions, completion rules, or whether
a Treatment action is allowed.

When multiple supported conditions affect the same layer, the renderer needs
a documented deterministic precedence table. Treatment should resolve
business conflicts before mapping, while Odontogram resolves only graphical
composition.

For a bridge, an abutment tooth's ToothBase must be natural or implant and a
pontic tooth's ToothBase must be missing. A group must occupy contiguous
positions in one arch and use one material/appearance in v1. These are visual
consistency invariants, not Treatment eligibility rules.

## 11. State Ownership

| State | Owner | Reason |
| --- | --- | --- |
| Selected tooth positions | Consuming feature, initially Treatment | Selection drives external workflow. Odontogram receives it and emits the complete next value. |
| Active tooth position | Consuming feature | Multi-selection needs a stable active tooth for adjacent Treatment controls. |
| Selected surface or surfaces | Consuming feature, initially Treatment | Surface choice may become input to a Treatment command. ToothSurfaceSelector remains controlled. |
| Hovered tooth/surface | Odontogram component | Ephemeral visual feedback with no business meaning. |
| DOM focus and keyboard navigation cursor | Odontogram component/DOM | Local accessibility and interaction detail. Selection changes still emit outward. |
| Visual conditions | Upstream owning feature as OdontogramData | They are mapped input. Odontogram interprets them but does not author or persist them. |
| Layer activation and SVG clone state | Odontogram renderer | Private representation of supplied visual conditions. |
| Template text/parsed template cache | Odontogram renderer module | Immutable technical cache only; contains no patient or chart data and is safe to share between instances. |
| Loading/error state for static templates | Odontogram component | Local technical state; render accessible fallback/retry UI. |
| Zoom/pan/active mobile arch | Odontogram viewport | Transient view state. No camera or clinical persistence is needed. |
| Bridge measurement/overlay geometry | Odontogram renderer | Derived visual layout, recalculated from scoped element refs. |
| Treatment acts and plans | Treatment | Business source of truth. |
| Treatment status/lifecycle | Treatment | Business rules and workflow. Odontogram sees only mapped appearance. |
| Visits, sessions, dentist handoff, pricing, billing | Treatment and its BFF/services | Outside visualization. |
| Patient treatment data and server cache | Treatment/TanStack Query | Clinical data must use the real API contract, not local renderer state. |
| Treatment action forms/dialogs | Treatment | Business commands and validation belong beside Treatment. |
| Generic renderer tooltip or zoom control | Odontogram | Allowed only when it explains/controls visualization and uses Clinora styling. |
| Settings, import/export, perio panels | No initial owner; deferred | They are deliberately excluded rather than silently inherited. |

No new global store is justified. If a future Treatment workspace needs a
cross-component draft, Treatment may choose its existing local/store
convention; the odontogram feature must remain controlled either way.

## 12. Next.js Integration

### 12.1 Component boundary

The route and Treatment page should remain Server Components wherever their
actual data flow permits. Only the interactive renderer and descendants need
'use client':

~~~text
app/(admin)/visits/new/page.tsx                 Server Component
  -> Treatment workspace composition            Server by default
     -> Treatment client interaction section    Client only if needed
        -> features/odontogram/components/
           odontogram.tsx                        Small client facade
~~~

Browser APIs must run only after the client component mounts. Rendering
modules must not read window, document, DOMParser, ResizeObserver, or layout
geometry during server/module evaluation.

A normal import of a correctly isolated client component is preferred.
next/dynamic with ssr: false is not automatically required. Use it only if
measurement shows valuable deferred loading or a narrowly retained module
cannot be made safe at evaluation time. Never disable SSR for the entire
Treatment route.

### 12.2 Asset loading

The current Next config has no Vite-style raw SVG loader, and adding one would
couple the feature to bundler details. The recommended approach is:

1. copy only the six approved SVGs to public/odontogram/teeth/;
2. fetch the four side templates once when the chart is needed;
3. fetch the two occlusal templates only when the occlusal view is requested;
4. cache fetch Promises and immutable parsed templates by asset URL;
5. clone a cached template per tooth/view;
6. expose accessible loading and error states;
7. centralize asset URL construction and test it against the current
   deployment plus configured basePath/asset-prefix inputs; do not scatter
   root-relative strings.

These are trusted application-owned static files. The plugin/arbitrary-SVG
path is removed, so DOMPurify is not needed. The loader should still reject
failed responses and malformed SVG, verify the approved templates contain no
script, foreignObject, inline event-handler, or remote CSS/URL content, and
evict failed cache entries so an explicit retry can work. DOMParser parse
errors must be detected through parsererror content, because DOMParser need
not throw. It must not accept caller-provided markup or remote URLs.

### 12.3 Instance safety and cleanup

Every cloned SVG ID and every reference to an ID must be namespaced with a
stable component-instance, tooth-position, and view prefix. References include
the root SVG ID, href/xlink:href, presentation attributes, fragment URLs in
inline style declarations, masks, filters, clip paths, gradients, and ARIA
references. Embedded style elements are removed during trusted-template
normalization; they are never injected or rewritten as document-level CSS.
React useId may seed the prefix, with characters normalized for selectors.
This prevents collisions across 52 clones and multiple charts.

Before IDs are rewritten, the normalizer must retain a private semantic-layer
index, for example by adding data-odontogram-layer="<original-id>" to approved
switchable elements or returning an original-ID-to-element map per clone.
Condition rendering uses that private contract, never document IDs, so
namespacing does not destroy semantic layer lookup.

All queries stay under a component-owned ref. There must be no fixed global
#toothGrid, document.querySelector for chart state, document.body portals,
MutationObserver portal reparenting, or module-global chart Map.

Effects must be idempotent under React Strict Mode. Unmount must cancel/remove:

- ResizeObserver instances;
- window/document listeners, if any unavoidable scoped listener is used;
- pointer/touch handlers not owned by React;
- pending requestAnimationFrame and timers;
- object URLs or export resources, although exports are not in initial scope;
- stale template-load callbacks.

Styles belong in odontogram.module.scss with an odontogram root and
feature-specific custom properties. Do not import legacy index.css or recreate
generic selectors such as body, :root, *, .card, .row, .btn, select, .hidden,
or .dark.

## 13. Performance Considerations

### 13.1 Baseline risks

- The six SVG sources total 413,445 bytes (approximately 403.8 KiB)
  uncompressed.
- A full unpruned side-plus-occlusal chart creates 52 dense inline SVGs and
  roughly 21,000 chart nodes.
- Legacy odontogram.ts alone is 487,821 bytes (approximately 476.4 KiB),
  translations.ts is 669,519 bytes (approximately 653.8 KiB), and embedded PDF
  font modules exceed 1 MiB. Blind copying would create a needlessly large
  route chunk.
- A historical full-package experiment produced an approximately 1.31 MiB
  distribution JavaScript file plus global CSS, before Clinora application
  code.
- Legacy updates clear broad layer sets; full-chart refreshes touch all
  positions, and bridge measurement can force layout.

### 13.2 Required mitigations

- Copy algorithms selectively; never ship App.tsx, the monolith, translations,
  perio, FHIR, export, fonts, plugins, or demo code in the initial chunk.
- Keep the six SVG documents as cacheable static assets rather than embedding
  413,445 bytes of raw XML into JavaScript.
- Fetch/parse each archetype once and clone immutable normalized templates.
- Load occlusal assets and instantiate occlusal roots only for the
  side-and-occlusal view.
- Memoize each tooth by position, relevant visual conditions, selection, and
  view so a one-tooth change does not rebuild the chart.
- Apply layer changes only inside the changed tooth's roots. Maintain a small
  known reset set per supported visual condition rather than the legacy full
  catalogue.
- Namespace templates once per clone and avoid repeated DOMParser work.
- Keep visual input immutable and normalize/map Treatment data outside render
  where appropriate.
- Batch/debounce bridge measurements, separate DOM reads from writes, and
  observe only the chart container.
- Prefer CSS transforms for bounded zoom. Avoid continuous animation loops;
  honor prefers-reduced-motion.
- Do not virtualize 32 fixed positions; reducing optional DOM and update scope
  has more value.
- Rely on route-level code splitting first. Add dynamic import only after
  measuring its benefit.
- Record asset transfer size, first mount cost, one-tooth update cost, and side
  versus side-and-occlusal node count in ODONTO-13 using a temporary
  non-production harness. Record the real Treatment route-chunk and page-level
  delta in ODONTO-16 after integration exists.

No arbitrary numeric performance budget should be invented without a Clinora
baseline and target devices. ODONTO-13 must capture reproducible desktop and
mobile measurements, obtain approval for any material regression, and document
the accepted budget before Treatment integration.

## 14. Integration Risks

| Risk | Severity | Evidence/impact | Mitigation |
| --- | --- | --- | --- |
| Clinical visual misrepresentation | HIGH | Dense layer rules encode dental meaning; an incorrect precedence or mapper could display the wrong condition. | Define an approved v1 catalogue, port parity tests, document precedence, and require clinical/product visual review before route release. |
| Treatment does not exist yet | HIGH | There are no current Treatment acts, models, APIs, permissions, or persistence hooks. | Build the reusable renderer independently; block ODONTO-14/15 until real contracts exist. Never invent business models. |
| Copying the singleton monolith | HIGH | Global Maps/Sets, fixed IDs, any, and document queries conflict with React, multiple instances, and strict TS. | Extract only visual rules into controlled components and small strict modules. |
| SVG ID/reference collisions | HIGH | Dozens of clones repeat gradients, masks, layers, and IDs. Multiple charts amplify the problem. | Namespace every ID and reference per instance/position/view and test two charts concurrently. |
| Initial and update rendering cost | HIGH | The unpruned full view is roughly 21,000 chart nodes; broad layer resets and bridge measurement can be expensive. | Conditional occlusal view, cached templates, memoized teeth, changed-tooth updates, measured performance gate. |
| Restricted or unclear non-core assets | HIGH if copied | ISO PDFs restrict reproduction; subset-font notices/provenance are incomplete. | Never migrate ISO PDFs or embedded fonts in initial work. Require separate legal/provenance review later. |
| Business/visual state coupling | HIGH | Legacy status/plan and edit workflow are inside the renderer. | Keep mapper in Treatment, expose visual-only DTOs, and ban Treatment imports in Odontogram. |
| Browser APIs and SSR | MEDIUM | DOMParser, document, ResizeObserver, layout measurement, and touch APIs are client-only. | Keep one low client boundary; defer browser access to effects; use dynamic import only if justified. |
| Vite-specific asset imports | MEDIUM | Legacy uses ?raw, unsupported by current Next configuration. | Use trusted public static assets with cached fetch/parse; do not add a custom loader. |
| Embedded SVG CSS or unsafe content | HIGH if injected unchanged | Each source template embeds the same unscoped data-active style and inline markup is inserted into the DOM. | Keep source bytes for provenance, but validate/normalize clones, remove embedded style elements, use one scoped rule, and test no document leakage. |
| Global CSS collisions | HIGH for full shell; LOW after extraction | Legacy CSS contains body, wildcard, card, row, button, select, and dark selectors that overlap Bootstrap/Ubold. | Copy no global CSS; create a scoped SCSS Module using Clinora variables. |
| React 19 and strict TypeScript 6 porting | MEDIUM | Legacy development used React 18 types, strict:false, and many any values. | Re-type adapted code, use existing React 19 packages, and pass Jest/lint/Next build on each task. |
| Surface interaction expectation | MEDIUM | Legacy does not provide SVG region hit-testing although users may expect direct surface clicks. | Ship the controlled five-surface selector first; treat anatomical hit-testing as a separate approved research task. |
| Accessibility/touch regressions | MEDIUM | Imperative event wiring and body overlays are fragile; 32 positions need coherent keyboard behavior. | Port listbox/option behavior, use React/pointer events, add keyboard/touch tests, and review at mobile breakpoints. |
| Independent adjacent bridges merge | MEDIUM | Legacy bridge detection has no group ID. | Require stable bridgeId in visual data and group before span calculation. |
| Attribution omission | MEDIUM | MIT notice must accompany copies/substantial portions and SVGs carry author comments. | Preserve headers, ship full license, maintain feature notice, and verify hashes in final audit. |
| Unbounded feature scope | MEDIUM | Legacy includes perio, FHIR, export, plugins, notes, many conditions, and a full workflow. | Use the approved v1 catalogue and separate future plans; do not chase full legacy parity. |
| Treatment authorization is undefined | MEDIUM | Current authenticated users can reach /visits/new; no Treatment capability rule exists. | Treatment/security work must define and enforce server-side route/action authorization before ODONTO-15 release; frontend checks are UX only. |
| Static asset path under a future basePath | LOW now | Current Next config has no basePath, but a later deployment change could break root-relative fetches. | Centralize asset URL construction and test deployment configuration. |
| Core package conflicts | LOW | The selective renderer needs only dependencies already in Clinora; no 3D stack is involved. | Keep the zero-new-dependency scope. |

### 14.1 Decisions requiring approval

Implementation should not start until the following product/architecture
choices are accepted:

1. Selective extraction is approved instead of installing or wrapping the
   published react-advanced-odontogram package.
2. Version 1 supports permanent dentition only; mixed/primary dentition is a
   later explicitly modeled capability.
3. The approved v1 visual-condition catalogue is the narrow union in section
   10, reduced further if Treatment does not need some variants.
4. Side-plus-occlusal is an available view, while side-only may be used as a
   lower-cost view where appropriate.
5. Surface input initially uses a separate five-surface selector. Direct SVG
   anatomical hit-testing is out of scope.
6. The odontogram visual feature may be implemented and reviewed before
   Treatment exists, but Treatment mapper/route tasks remain blocked.
7. Treatment product/security owners will define /visits/new authorization and
   the real Treatment contracts before final integration.
8. The public static asset plus scoped DOM-template approach is accepted in
   preference to custom Next raw loaders or a huge JSX conversion.
9. Planned implant, primary/mixed dentition, and subcrown caries are deferred
   unless a demonstrated first-release consumer expands the approved model.
10. Product/clinical owners approve an explicit non-silent policy for visuals
    unsupported by the assets, notably anterior lingual conditions and onlays
    in side-only view: reject them, require a compatible view, or show an
    accessible reviewed fallback.

## 15. Implementation Roadmap

### 15.1 Protocol for every ODONTO task

Each task is intended for a fresh Codex session. Before changing code, that
session must:

1. read the root AGENTS.md, apps/frontend/AGENTS.md,
   docs/architecture/frontend.md, and this plan;
2. inspect the files produced by prerequisite tasks and the current git
   status, because later Treatment work may have changed the repository;
3. treat legacy/react-advanced-odontogram/ as read-only reference;
4. preserve unrelated user changes and never import production code from
   legacy/;
5. implement only the named task and avoid speculative folders or models;
6. use pnpm/Nx and the existing dependency set unless a separately approved
   task explicitly changes it;
7. add or update focused tests with the implementation, then run verification
   proportionate to the task;
8. keep feature internals private and update
   apps/frontend/src/features/odontogram/index.ts only for intentional public
   API changes;
9. whenever the task copies or substantially adapts upstream code, preserve
   its author/project header, add a Clinora modification note, and update
   apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md. Treat that
   notice as an expected file even when a later task list does not repeat it.

No task before ODONTO-14 may change Treatment. No roadmap task authorizes
changes to the legacy source.

Execution order:

~~~text
ODONTO-01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08
          -> 09 -> 10 -> 11 -> 12 -> 13
          -> 14 -> 15 -> 16
~~~

ODONTO-01 through ODONTO-13 form the independent visualization lane.
ODONTO-14 and ODONTO-15 are additionally blocked by real Treatment contracts
and workflow. ODONTO-16 is the release gate.

### ODONTO-01 — Define the visual contract and public feature foundation

**Goal**

Create the smallest strict, Treatment-independent public model on which all
later renderer tasks can depend.

**Scope**

- Confirm the approved v1 decisions from section 14.1, especially permanent
  dentition and the initial visual-condition catalogue.
- Define immutable ToothPosition, ToothSurface, ToothNumberingSystem,
  ToothBase, OdontogramAppearance, condition variants, OdontogramTooth,
  OdontogramData, and OdontogramSelection.
- Define and test the canonical 32-position constant and model-level visual
  invariants.
- Expose a small pure runtime validator/result type for duplicate, omitted,
  and invalid visual combinations; do not add a schema dependency.
- Export only consumer-facing types/constants plus validateOdontogramData from
  the feature index; keep renderer internals private.
- Keep the initial model in one file unless its implementation genuinely
  becomes unwieldy.

**Expected files**

- apps/frontend/src/features/odontogram/model/odontogram.ts
- apps/frontend/src/features/odontogram/model/odontogram.spec.ts
- apps/frontend/src/features/odontogram/index.ts

**Dependencies**

- This plan and its approval decisions.
- No code task dependency.

**Acceptance criteria**

- The model compiles under strict TypeScript 6 with no any.
- It contains no import from Treatment, backend DTOs, legacy/, React, or DOM
  modules.
- Tooth positions contain exactly the 32 permanent FDI layout positions in
  deterministic order.
- OdontogramData validation requires every position exactly once and rejects
  duplicate or omitted positions.
- Conditions form a closed discriminated union and carry only information
  needed to render.
- A tested base-by-condition matrix rejects visually unsupported natural,
  implant, and missing combinations, including subcrown/surface conflicts.
- Cardinality and mutual-exclusion tests reject duplicate restorations,
  endodontic states, extraction markers, bridge memberships, and contradictory
  whole-tooth combinations.
- No price, visit, session, patient, dentist, persistence, or Treatment
  lifecycle field exists.
- Focused Jest tests pass and the public index does not export rendering
  internals.

**Out of scope**

Components, SVGs, Treatment mapping, API code, primary dentition, and the full
legacy condition catalogue.

### ODONTO-02 — Adapt tooth numbering and arch metadata

**Goal**

Port the useful pure positioning/numbering knowledge without bringing over
engine state or Vite assumptions.

**Scope**

- Implement immutable upper/lower arch order, archetype assignment, mirror,
  rotation, anterior/posterior classification, and occlusal availability.
- Adapt permanent-tooth FDI, Universal, and Palmer display formatting from
  src/utils/numbering.ts.
- Keep stable ToothPosition separate from the displayed label.
- Add pure tests against selected legacy numbering and template-map cases.
- Create the public full MIT license and source-repository provenance notice
  before committing the first substantially adapted upstream logic; retain
  upstream headers and add a Clinora modification note where source is copied.

**Expected files**

- apps/frontend/src/features/odontogram/rendering/tooth-layout.ts
- apps/frontend/src/features/odontogram/rendering/tooth-layout.spec.ts
- apps/frontend/src/features/odontogram/utils/tooth-numbering.ts
- apps/frontend/src/features/odontogram/utils/tooth-numbering.spec.ts
- apps/frontend/public/odontogram/LICENSE.react-advanced-odontogram.txt
- apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md
- apps/frontend/src/features/odontogram/index.ts only if a formatter is
  intentionally public

**Dependencies**

- ODONTO-01.

**Acceptance criteria**

- Every ToothPosition maps to the correct archetype, arch, quadrant,
  transformation, and occlusal availability.
- FDI, Universal, and Palmer output matches approved permanent-dentition
  legacy fixtures.
- Functions are pure, immutable, and DOM-free.
- Primary-tooth remapping is documented as deferred rather than silently
  conflated with permanent positions.
- The public file contains the complete upstream MIT text; the source notice
  records upstream 2.4.0 provenance and every adapted ODONTO-02 file.
- Substantially adapted files retain the upstream author/project header plus a
  clear Clinora modification note.
- No production import references legacy/.

**Out of scope**

Asset copying, SVG parsing, chart components, condition layers, and primary
dentition.

### ODONTO-03 — Migrate licensed tooth assets and build the template loader

**Goal**

Bring only the six required SVG templates into Clinora with complete
provenance and a Next-compatible, trusted-static-asset loader.

**Scope**

- Copy the six approved SVGs without altering their embedded attribution.
- Verify the license and provenance files created by ODONTO-02, then add the
  six copied SVGs and their hash inventory to the provenance notice.
- Record and compare SHA-256 hashes of each source/copy pair.
- Implement a client-only-on-use loader with response/malformed-SVG errors,
  Promise caching, failed-entry eviction, parsed-template caching, and
  conditional occlusal loading.
- Validate the fixed source snapshot for script, foreignObject, external URL,
  inline event-handler, CSS import/remote URL, and unexpected style content
  without changing the public source assets.
- Normalize an in-memory clone by removing each embedded style element,
  converting legacy inline display:none switchables to data-active="0" while
  preserving other inline declarations, seeding data-active on every
  switchable element discovered by the trusted-template normalization rules,
  and relying on one feature-scoped data-active="0" display rule.
- Accept only the fixed internal asset manifest; callers cannot provide SVG
  text or remote URLs.
- Centralize public asset URL construction and cover normal, basePath, and
  asset-prefix inputs without reading Next config from rendering code.
- Port focused asset/template normalization tests to Jest.

**Expected files**

- apps/frontend/public/odontogram/teeth/11.svg
- apps/frontend/public/odontogram/teeth/13.svg
- apps/frontend/public/odontogram/teeth/14.svg
- apps/frontend/public/odontogram/teeth/16.svg
- apps/frontend/public/odontogram/teeth/14_occl.svg
- apps/frontend/public/odontogram/teeth/16_occl.svg
- apps/frontend/public/odontogram/LICENSE.react-advanced-odontogram.txt
- apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md
- apps/frontend/src/features/odontogram/rendering/svg-template-loader.ts
- apps/frontend/src/features/odontogram/rendering/svg-template-loader.spec.ts

**Dependencies**

- ODONTO-02 for the approved template manifest.

**Acceptance criteria**

- All six source/copy hashes match and their embedded comments remain intact.
- The public license contains the complete upstream MIT text and the feature
  notice records package 2.4.0, asset-declared artwork/SVG 2.5.0, their
  distinct version scopes, author, URL, adapted files, SVG inventory,
  provenance, hashes, and modifications.
- No logo, screenshot, icon, font, ISO PDF, translation, or other legacy asset
  is copied.
- The frontend manifest and lockfile are unchanged.
- Asset URL tests cover current deployment, basePath, and asset-prefix inputs.
- There is no ?raw import, custom bundler loader, DOMPurify, or runtime legacy
  import.
- Loader tests cover caching, missing response, malformed SVG, and conditional
  occlusal requests, rejected-entry retry, and the fixed-template safety
  checks.
- DOMParser parsererror content is treated as malformed input; a rejected
  shared load is evicted, while one component unmount cannot abort a shared
  fetch still consumed by another instance.
- Normalization tests prove embedded style elements cannot leak, each
  switchable has a symmetric data-active default, inline display:none no
  longer prevents later activation, needed inline paint/gradient declarations
  remain and every fragment reference resolves. Evidence-backed dormant-layer
  pruning is deliberately deferred until all v1 registries exist.

**Out of scope**

Rendering a tooth, arbitrary SVG/plugin input, PDF export, and changing source
assets.

### ODONTO-04 — Build an instance-safe base tooth renderer

**Goal**

Render one natural tooth from the trusted template system inside a React-owned,
strictly scoped component.

**Scope**

- Build a low 'use client' OdontogramTooth component for one position/view.
- Clone the correct parsed archetype and apply mirror/rotation metadata.
- Normalize and namespace all IDs and ID references by component instance,
  tooth position, and view.
- Retain a private original semantic-layer lookup after ID rewriting so later
  condition tasks can activate approved layers without querying document IDs.
- Keep all DOM lookup/mutation under a component ref.
- Implement accessible loading/error fallback for an individual template.
- Add only renderer-specific scoped styles.
- Verify cleanup and prop changes under React Strict Mode.

**Expected files**

- apps/frontend/src/features/odontogram/components/odontogram-tooth.tsx
- apps/frontend/src/features/odontogram/components/odontogram-tooth.spec.tsx
- apps/frontend/src/features/odontogram/components/odontogram.module.scss
- apps/frontend/src/features/odontogram/rendering/svg-id-namespace.ts
- apps/frontend/src/features/odontogram/rendering/svg-id-namespace.spec.ts

**Dependencies**

- ODONTO-01 through ODONTO-03.

**Acceptance criteria**

- Representative incisor, canine, premolar, molar, lower, mirrored, and
  occlusal cases render the correct template/transform.
- Two teeth and two chart-instance prefixes have no duplicate IDs or
  cross-resolving gradients/masks/links.
- A real template fixture proves root IDs and fragment URLs in presentation
  attributes and inline style declarations are all rewritten, while a
  semantic layer remains addressable through the private lookup.
- No embedded style element reaches the live DOM; the one feature-scoped
  data-active rule affects only odontogram descendants.
- The component has no document-wide query, fixed chart ID, body portal,
  MutationObserver, singleton chart state, or global stylesheet.
- Changing position/view replaces only that component's template and unmount
  leaves no listeners/timers.
- It renders base anatomy only; clinical condition behavior is not hidden in
  this task.

**Out of scope**

Full arch, selection, conditions, bridges, and Treatment.

### ODONTO-05 — Compose the responsive arch and public Odontogram facade

**Goal**

Render the complete permanent chart as a reusable feature component without
business workflow.

**Scope**

- Compose one logical accessible option per ToothPosition, represented across
  separate side, optional occlusal, and number visual cells in the six-row
  grid. The side cell exposes the canonical geometry ref for bridge layout.
- Implement the six-row upper/lower layout using tooth-layout metadata.
- Add the controlled Odontogram facade with data, selection, numberingSystem,
  view, interactionMode, ariaLabel, and className props.
- Show scoped loading and asset-error UI.
- Make layout responsive and contain overflow within the feature.
- Export Odontogram and its public props from index.ts.

**Expected files**

- apps/frontend/src/features/odontogram/components/odontogram-arch.tsx
- apps/frontend/src/features/odontogram/components/odontogram.tsx
- apps/frontend/src/features/odontogram/components/odontogram.spec.tsx
- apps/frontend/src/features/odontogram/components/odontogram.module.scss
- apps/frontend/src/features/odontogram/index.ts

**Dependencies**

- ODONTO-04.

**Acceptance criteria**

- The chart displays all 32 permanent positions in correct upper/lower order.
- side view creates no occlusal SVG roots or requests; side-and-occlusal shows
  only the 20 valid posterior occlusal views.
- FDI, Universal, and Palmer labels change presentation without changing
  position identity.
- Two Odontogram instances render independently.
- Each position has one accessible identity/focus target even though its side,
  occlusal, and label cells are visually separate; each side cell supplies a
  stable bridge-measurement rect.
- No legacy UI, action panel, settings, notes, patient data, or persistence is
  present.
- Component tests cover successful, loading, and failed asset states.
- Duplicate/omitted positions render an accessible chart-level data error and
  no chart; natural defaults are never synthesized for incomplete input.

**Out of scope**

Interactive selection semantics and visual condition activation.

### ODONTO-06 — Add controlled tooth selection and accessibility

**Goal**

Adapt the useful multi-select and keyboard behavior into normal controlled
React interaction.

**Scope**

- Implement pure next-selection logic and, if warranted, extract the selection
  type/helpers into their own model file.
- Normal activation replaces selection; Ctrl/Command activation toggles a
  position. The newly added position becomes active; when the active position
  is removed, active falls back to the first remaining position in canonical
  arch order or null.
- Support Enter/Space, deterministic arrow navigation across arches, and
  Escape according to the approved behavior.
- Use one focusable logical option per position even when side and occlusal
  views are both visible. This is a Clinora accessibility improvement over the
  legacy engine, where only side tiles are tabbable options.
- Implement view versus select interaction modes and clear focus styling.
- Keep hovered position as local visual state; hover may show styling or a
  renderer-only label but must not alter controlled selection.
- Emit only the complete next OdontogramSelection.

**Expected files**

- apps/frontend/src/features/odontogram/model/odontogram-selection.ts
- apps/frontend/src/features/odontogram/model/odontogram-selection.spec.ts
- apps/frontend/src/features/odontogram/components/odontogram-arch.tsx
- apps/frontend/src/features/odontogram/components/odontogram-tooth.tsx
- apps/frontend/src/features/odontogram/components/odontogram.spec.tsx
- apps/frontend/src/features/odontogram/components/odontogram.module.scss
- apps/frontend/src/features/odontogram/index.ts

**Dependencies**

- ODONTO-05.

**Acceptance criteria**

- Click, modifier-click, keyboard, and simple touch activation emit the
  documented next value without mutating props.
- Controlled prop updates are the only source of selected styling.
- Hover styling is local, disappears on pointer exit, and emits no business or
  selection callback.
- View mode emits no selection change.
- Active and selected semantics are announced with appropriate
  listbox/option or an equally justified accessible pattern.
- Focus never duplicates between side and occlusal representations.
- Controlled selections contain unique canonical positions; active is one of
  the selected positions, and an empty selection requires active=null.
  Invalid controlled selection renders no selected state, reports a
  development diagnostic, and never mutates/repairs the consumer's prop.
- Two chart instances cannot change each other's selection or focus state.
- Focused Jest/Testing Library accessibility and interaction tests pass.

**Out of scope**

Creating Treatment actions, selected surfaces, context menus, and zoom.

### ODONTO-07 — Add canonical surface notation and a controlled selector

**Goal**

Provide a reusable five-surface input that reports visual surface selection
without pretending the legacy tooth paths are hit regions.

**Scope**

- Implement pure canonical-to-display notation based on tooth position.
- Build a keyboard-accessible five-surface cross with mesial, distal, buccal,
  lingual, and occlusal positions.
- Display incisal/labial/palatal terminology where appropriate while emitting
  canonical ToothSurface values.
- Keep value and changes fully controlled.
- Export ToothSurfaceSelector and its props.

**Expected files**

- apps/frontend/src/features/odontogram/utils/surface-notation.ts
- apps/frontend/src/features/odontogram/utils/surface-notation.spec.ts
- apps/frontend/src/features/odontogram/components/tooth-surface-selector.tsx
- apps/frontend/src/features/odontogram/components/tooth-surface-selector.spec.tsx
- apps/frontend/src/features/odontogram/components/odontogram.module.scss
- apps/frontend/src/features/odontogram/index.ts

**Dependencies**

- ODONTO-01 and ODONTO-06.

**Acceptance criteria**

- The selector emits only canonical surface values and never mutates its value.
- Anterior/posterior and upper/lower display labels match approved notation.
- Keyboard, focus, disabled, and multi-surface toggle behavior is covered.
- The component does not render Treatment actions or apply changes to
  OdontogramData itself.
- No direct SVG hit-testing, pointer-region geometry, or global store is added.

**Out of scope**

Anatomical path clicking and applying a clinical action to selected surfaces.

### ODONTO-08 — Render caries and filling surface conditions

**Goal**

Implement the first externally supplied visual conditions using a small,
testable layer system.

**Scope**

- Inventory only the layer IDs required for caries, optional approved ICDAS
  severity, fillings, materials, and recurrent/subcaries composition.
- Implement strict condition-to-layer derivation and a known reset set.
- Apply derived layers within the affected tooth's scoped side/occlusal roots.
- Define deterministic surface and caries/filling precedence.
- Ensure a prop change removes stale layers as well as adding new ones.
- Port representative legacy SVG/parity fixtures to Jest.

**Expected files**

- apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.ts
- apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.spec.ts
- apps/frontend/src/features/odontogram/rendering/apply-tooth-visuals.ts
- apps/frontend/src/features/odontogram/rendering/apply-tooth-visuals.spec.ts
- apps/frontend/src/features/odontogram/components/odontogram-tooth.tsx
- apps/frontend/src/features/odontogram/components/odontogram-tooth.spec.tsx

**Dependencies**

- ODONTO-04 and ODONTO-07.

**Acceptance criteria**

- Each canonical surface activates the expected front/occlusal layer where the
  template supports it.
- The product-visible policy for anterior lingual data is explicit: reject
  that condition/view combination or render an accessible fallback indicator;
  never silently accept an invisible condition. Posterior lingual uses the
  occlusal asset, while anterior teeth have no occlusal root.
- Supported filling materials render through explicit typed mappings.
- A filled surface with caries uses the approved recurrent/subcaries visual
  rather than simultaneously displaying contradictory primary caries.
- Different filling materials may coexist on different surfaces, while
  duplicate filling/caries entries for one surface fail validation.
- Existing/planned appearance follows supplied visual input only.
- Updating one tooth does not rebuild or clear unrelated tooth roots.
- No FHIR fields, legacy registry axis, treatment rule, or any enters the
  renderer.

**Out of scope**

Whole-tooth conditions, restorations, bridges, persistence, and action UI.

### ODONTO-09 — Render whole-tooth and endodontic visual states

**Goal**

Add the approved non-restorative whole-tooth visuals without importing the
legacy clinical workflow.

**Scope**

- Add explicit mappings for existing missing/implant bases, planned
  extraction, and root-canal/endodontic visual states from the v1 model.
- Map root-canal specifically to the legacy side-view endo-filling artwork;
  do not imply an occlusal endodontic layer exists.
- Extract only the required layer IDs and visual composition rules.
- Document and test precedence with surface conditions and tooth base anatomy.
- Keep all state driven by OdontogramData props.

**Expected files**

- apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.ts
- apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.spec.ts
- apps/frontend/src/features/odontogram/rendering/apply-tooth-visuals.ts
- apps/frontend/src/features/odontogram/rendering/apply-tooth-visuals.spec.ts
- apps/frontend/src/features/odontogram/components/odontogram-tooth.spec.tsx
- apps/frontend/src/features/odontogram/model/odontogram.ts only if the
  previously approved contract needs a narrow correction

**Dependencies**

- ODONTO-08.

**Acceptance criteria**

- Every approved whole-tooth variant has a named test fixture and expected
  active-layer set.
- Missing/implant base selection and planned extraction presentation are
  deterministic when other visual conditions are present.
- No existing implant base is presented as a planned implant; planned implant
  remains deferred unless ODONTO-01 approved a separate variant.
- root-canal activates side-view endo-filling only, with explicit fallback
  semantics in an occlusal-only presentation.
- No clinical eligibility decision is made by the renderer.
- Removing/changing a condition clears stale layers locally.
- Unsupported legacy conditions remain absent rather than becoming arbitrary
  strings.

**Out of scope**

Restoration materials, bridge spans, periodontal states, and Treatment
commands.

### ODONTO-10 — Render fixed restorations and materials

**Goal**

Adapt the clean restoration-layer composition logic for the approved Clinora
visual contract.

**Scope**

- Adapt the relevant restoration/material matrix from
  src/registry/restorations.ts.
- Support the approved crown, inlay, onlay, and veneer variants and
  existing/planned appearance.
- Gate side/occlusal layers based on actual template support.
- Exclude onlay from v1 unless product approves side-and-occlusal as mandatory
  for every onlay chart (or approves an explicit accessible fallback marker);
  a side-only chart must never silently hide it.
- Maintain a strict exhaustive mapping and known reset set.
- Preserve upstream attribution on substantially adapted logic.

**Expected files**

- apps/frontend/src/features/odontogram/rendering/restoration-layers.ts
- apps/frontend/src/features/odontogram/rendering/restoration-layers.spec.ts
- apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.ts
- apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.spec.ts
- apps/frontend/src/features/odontogram/rendering/apply-tooth-visuals.ts
- apps/frontend/src/features/odontogram/rendering/apply-tooth-visuals.spec.ts
- apps/frontend/src/features/odontogram/components/odontogram-tooth.spec.tsx
- apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md

**Dependencies**

- ODONTO-09.

**Acceptance criteria**

- Every approved restoration/material/view combination has deterministic
  output and unsupported combinations fail or produce no layer by documented
  visual validation.
- Telescope or other multi-layer materials activate all required child layers
  if they remain in the approved v1 model.
- Planned styling is presentation only and does not infer Treatment status.
- Surface/whole-tooth/restoration composition has regression tests.
- Implant plus crown activates implant base/connector and the material crown;
  it never produces a floating crown.
- No supported condition becomes visually silent in an allowed view. An onlay
  policy is explicit and tested if onlay remains in the approved model.
- No UI-option, FHIR, removable-prosthesis, or business-gating code is copied.

**Out of scope**

Bridge overlay/grouping and Treatment selection/action UI.

### ODONTO-11 — Add grouped bridge visualization

**Goal**

Render multi-tooth bridge connections with explicit group identity and
instance-scoped layout measurement.

**Scope**

- Adapt pure span and geometry calculations from src/bridgeOverlay.ts.
- Group units by bridgeId before detecting adjacent spans.
- Enforce visual group invariants: units are contiguous within one arch and
  use one material/appearance in v1.
- Build a React BridgeOverlay using one chart-container ref.
- Recalculate on relevant data/layout changes and a scoped ResizeObserver.
- Batch/debounce measurement without mixing DOM reads and writes.
- Render approved abutment/pontic per-tooth layers through existing
  restoration logic.
- Retain natural/implant base anatomy for an abutment; suppress natural tooth
  anatomy for a pontic while showing its crown-shaped body and connector.

**Expected files**

- apps/frontend/src/features/odontogram/rendering/bridge-layout.ts
- apps/frontend/src/features/odontogram/rendering/bridge-layout.spec.ts
- apps/frontend/src/features/odontogram/components/bridge-overlay.tsx
- apps/frontend/src/features/odontogram/components/bridge-overlay.spec.tsx
- apps/frontend/src/features/odontogram/components/odontogram-arch.tsx
- apps/frontend/src/features/odontogram/components/odontogram.module.scss
- apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md

**Dependencies**

- ODONTO-10.

**Acceptance criteria**

- Separate adjacent bridges remain separate because their bridgeIds differ.
- Invalid cross-arch, noncontiguous, or mixed-material/appearance groups fail
  visual validation; abutment and pontic base behavior has explicit tests.
- Upper/lower, resized, side-only, side-and-occlusal, and changed-data cases
  produce correct spans in focused tests.
- Observer/timer cleanup is verified on unmount and Strict Mode remount.
- All element lookup is scoped; no document/body query or fixed overlay ID
  exists.
- Bridge selection, price, validity, and lifecycle remain Treatment concerns.

**Out of scope**

Creating/editing bridge acts and generic diagram connectors.

### ODONTO-12 — Add the responsive viewport, zoom, theme, and motion behavior

**Goal**

Make the standalone chart usable across Clinora breakpoints without importing
legacy popovers, global theme, or touch infrastructure.

**Scope**

- Build a scoped viewport with bounded CSS-transform zoom and accessible
  zoom/reset controls.
- Transform an outer viewport while bridge measurement and overlay remain in
  the same unscaled inner chart coordinate system; do not mix scaled
  getBoundingClientRect values with unscaled overlay coordinates.
- Add pointer-based pinch support only if it is reliable in the supported
  browsers; otherwise ship controls plus contained scrolling.
- Define mobile side/occlusal presentation and prevent page-level overflow.
- Map colors, spacing, focus, and selected/planned states to
  Bootstrap/Ubold/Clinora CSS variables.
- Keep the dental grid direction:ltr inside RTL host layouts so FDI order and
  mesial/distal geometry do not reverse; localize labels without mirroring the
  chart.
- Support the current light/dark layout behavior and
  prefers-reduced-motion.
- Keep zoom/view state local and non-persistent.

**Expected files**

- apps/frontend/src/features/odontogram/components/odontogram-viewport.tsx
- apps/frontend/src/features/odontogram/components/odontogram-viewport.spec.tsx
- apps/frontend/src/features/odontogram/components/odontogram.tsx
- apps/frontend/src/features/odontogram/components/odontogram.module.scss

**Dependencies**

- ODONTO-11.

**Acceptance criteria**

- The chart is usable at representative phone, tablet, and desktop widths and
  never forces uncontrolled page overflow.
- Keyboard users can operate zoom controls; reduced-motion users receive no
  infinite glow or unnecessary transition.
- Any pointer listeners are scoped and cleaned up.
- Bridge connectors stay aligned at minimum, default, and maximum zoom and
  after resize.
- An RTL host does not reverse tooth order or surface geometry.
- No body popover, long-press context menu, MutationObserver, second theme
  provider, legacy toolbar, or global CSS is introduced.
- Local zoom cannot change selected teeth or visual data.

**Out of scope**

3D camera/orbit controls, exports, and Treatment layout integration.

### ODONTO-13 — Validate and harden renderer performance and lifecycle

**Goal**

Measure the extracted renderer, remove demonstrated bottlenecks, and establish
an accepted baseline before business integration.

**Scope**

- Record static asset transfer size, SVG/DOM node counts, first mount,
  one-tooth update, view switch, and bridge resize costs in a temporary local
  component harness that is not committed as an application route.
- Measure side and side-and-occlusal views on agreed desktop and mobile target
  devices/profiles.
- Verify four side assets and two conditional occlusal assets are fetched and
  parsed at most once per URL.
- Now that all v1 registries exist, prune dormant non-v1 layers and unused
  definitions from normalized runtime templates. Preserve required
  definitions transitively.
- Confirm memoization limits a one-tooth condition/selection change to the
  affected components.
- Stress two simultaneous charts, repeated mount/unmount, Strict Mode, failed
  asset load/retry, and reduced motion.
- Optimize only evidence-backed bottlenecks without changing the public
  contract.

**Expected files**

- Existing odontogram component/rendering files and focused specs as required
- docs/implementation/treatment/odontogram/ODONTOGRAM_PERFORMANCE_NOTES.md

**Dependencies**

- ODONTO-01 through ODONTO-12.

**Acceptance criteria**

- The performance note contains reproducible commands/profile settings,
  before/after numbers, target hardware/profile, and the approved release
  baseline.
- No initial production dependency has been added.
- side view creates/fetches no occlusal content.
- Runtime templates contain only approved base/v1 layers and transitively
  referenced definitions after pruning; every fragment reference resolves and
  all visual parity fixtures still pass.
- One-tooth updates do not reconstruct the full arch.
- Multiple instances and Strict Mode show no ID collisions, leaked observers,
  listeners, timers, or stale asynchronous updates.
- Any material renderer-performance regression is resolved or explicitly approved
  before ODONTO-14.
- Frontend test, lint, and production build pass.

**Out of scope**

Treatment integration and unrelated application optimization.

### ODONTO-14 — Implement the real Treatment to Odontogram mapper

**Goal**

Translate actual, approved Treatment data into the public visual contract while
keeping all business knowledge in Treatment.

**Scope**

- First verify that real Treatment/visit/treatment-act models and their status
  semantics now exist. If they do not, stop without scaffolding fake models.
- Map only implemented Treatment diagnoses/acts/materials/statuses to supported
  OdontogramCondition variants.
- Map Treatment lifecycle meanings to existing/planned visual appearance
  explicitly.
- Produce stable bridgeId values from real Treatment identity/grouping.
- Define behavior for unsupported Treatment acts, conflicts, missing tooth
  positions, and invalid data.
- Add pure exhaustive mapper tests using actual Treatment fixtures.
- Import odontogram types only from @/features/odontogram.

**Expected files**

- apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.ts
- apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.spec.ts
- apps/frontend/src/features/treatment/index.ts only if the mapper/data is an
  intentional Treatment public export

**Dependencies**

- ODONTO-13.
- External prerequisite: actual Treatment models, contracts, status rules, and
  supported-act catalogue are implemented and approved.

**Acceptance criteria**

- No speculative Treatment DTO, act, status, or persistence abstraction is
  created.
- The mapper is pure, deterministic, exhaustive for the approved current
  Treatment inputs, and covered by representative status/material/bridge
  tests.
- No Treatment type enters the odontogram public model.
- Odontogram still has no Treatment import.
- Unsupported inputs have an explicit tested policy; they do not silently
  render a misleading condition.
- No API call, React hook, localStorage, or rendering DOM appears in the
  mapper.

**Out of scope**

Route UI, Treatment mutations, or changing Treatment business rules.

### ODONTO-15 — Integrate into the Treatment workspace

**Goal**

Compose the approved odontogram into the real /visits/new Treatment workflow
with Treatment-owned selection and persistence.

**Scope**

- Reinspect the actual Treatment feature and route; follow its implemented
  names and public API rather than recreating the historical prototype.
- Consume and validate the existing waiting-room handoff in Treatment.
- Keep the route/server shell server-capable and isolate only necessary
  interaction state in a small Treatment client component.
- Use the Treatment mapper to supply OdontogramData.
- Let Treatment own selected teeth/surfaces and compose
  ToothSurfaceSelector beside existing Treatment action controls.
- Execute clinical commands through actual Treatment hooks/BFF/API only after
  explicit user action and validation.
- Add loading, empty, error, read-only, and permission behavior consistent with
  current Clinora/Ubold patterns.
- Define and enforce the approved Treatment route/action authorization.
  Frontend capability/read-only checks are UX only; the owning backend/API
  Gateway/BFF mutation path must enforce authorization.

**Expected files**

The exact set must follow the Treatment implementation present at execution
time. The likely files are:

- apps/frontend/src/features/treatment/components/treatment-odontogram-panel.tsx
- apps/frontend/src/features/treatment/components/treatment-odontogram-panel.spec.tsx
- apps/frontend/src/features/treatment/pages/treatment-workspace-page.tsx
- apps/frontend/src/features/treatment/pages/treatment-workspace-page.spec.tsx
- apps/frontend/src/features/treatment/index.ts
- apps/frontend/src/app/(admin)/visits/new/page.tsx

**Dependencies**

- ODONTO-14.
- External prerequisites: Treatment workspace, BFF/API hooks, persistence,
  waiting-room context consumption, and backend-enforced authorization policy
  exist.

**Acceptance criteria**

- /visits/new renders the odontogram inside Clinora's actual Treatment
  workspace without making the whole route client-only.
- Tooth/surface activation changes Treatment-owned UI selection only; it never
  directly creates a TreatmentAct.
- A deliberate existing Treatment command persists through the BFF/API, query
  data updates, the mapper recomputes visual data, and the odontogram reflects
  it.
- Reload behavior comes from persisted Treatment data, not localStorage.
- Read-only/unauthorized users cannot invoke mutation paths.
- Direct mutation requests are rejected by the owning server-side
  authorization boundary; hiding/disabling frontend controls is not treated as
  security.
- No historical package wrapper, MutationObserver portal repair, full legacy
  stylesheet, or runtime legacy import returns.

**Out of scope**

Inventing missing Treatment services/contracts or adding legacy settings,
notes, pricing, perio, FHIR, and export UI.

### ODONTO-16 — Complete release validation, accessibility, and provenance audit

**Goal**

Prove the integrated capability meets architecture, quality, clinical visual,
performance, accessibility, and licensing gates.

**Scope**

- Add one focused Playwright flow for Treatment-to-odontogram composition using
  the repository's established e2e mocking/test conventions.
- Measure and record the actual /visits/new route-chunk and page-level
  performance delta now that the integration exists; update the ODONTO-13
  performance note with the integrated result.
- Complete component parity fixtures for the approved condition catalogue.
- Test keyboard-only selection/surface/zoom behavior, read-only behavior,
  focus visibility, responsive view, error fallback, and multiple instances.
- Have the approved product/clinical reviewer compare representative rendered
  conditions to the source assets/reference behavior.
- Re-run source/copy SVG hashes and audit production imports, package changes,
  copied assets, notices, and legacy-source immutability.
- Run the full relevant Nx verification suite and record results.
- Fix only integration defects found by this gate; do not expand scope.

**Expected files**

- apps/frontend-e2e/src/odontogram.spec.ts
- Existing odontogram/Treatment specs and source files for narrowly required
  fixes
- docs/implementation/treatment/odontogram/completion-notes.md

**Dependencies**

- ODONTO-15.

**Acceptance criteria**

- pnpm nx test frontend passes.
- pnpm nx lint frontend passes.
- pnpm nx build frontend --skip-nx-cache passes.
- The focused frontend-e2e Playwright test passes in its documented
  environment.
- Clinical/product visual review covers every approved v1 condition and
  planned/existing presentation.
- Renderer performance remains within the ODONTO-13 approved baseline, and the
  integrated route delta is recorded and explicitly accepted.
- There is no runtime import from legacy/, no unexpected production
  dependency, and no copied unused legacy UI/asset.
- SVG comments, public MIT license, adapted-file headers, provenance notice,
  and source/copy hashes are verified.
- A checksum comparison confirms the legacy reference tree is unchanged.
- Completion notes record commands, evidence, residual deferred scope, and any
  accepted limitation.

**Out of scope**

New conditions or workflows. Any new requirement becomes a separately planned
task after this release gate.

## 16. Definition of Done

The integration is complete only when all applicable statements below are
true.

### Architecture and boundaries

- Odontogram lives in apps/frontend/src/features/odontogram/ and is not a new
  application or Nx library.
- Production code has no import, symlink, build alias, or runtime dependency
  pointing into legacy/.
- The downloaded legacy tree remains unchanged.
- The frontend remains feature-oriented and contains no introduced
  domain/application/infrastructure Clean Architecture folders.
- Odontogram exposes a small public index; its rendering internals remain
  private.
- Treatment imports the odontogram public API, while Odontogram has no
  Treatment dependency.
- The Treatment mapper is Treatment-owned and maps actual models only.

### Functional capability

- All 32 approved permanent tooth positions render in correct arch order.
- The approved side and optional occlusal views use the correct archetypes and
  transformations.
- FDI, Universal, and Palmer labels work without changing position identity.
- Controlled tooth multi-selection, active tooth, keyboard behavior, and
  read-only/view behavior work.
- The controlled five-surface selector emits canonical surfaces with correct
  display notation.
- Every approved v1 visual condition renders deterministically from external
  OdontogramData and clears correctly when data changes.
- Separate adjacent bridges remain distinct.
- Two odontograms can coexist without ID, state, focus, style, or observer
  collisions.

### Business ownership

- Clicking a tooth or surface reports an interaction only.
- Treatment owns treatment acts, plans, visits, sessions, clinical validation,
  status/lifecycle, pricing, dentist handoff, API calls, and persistence.
- A deliberate Treatment action flows through the real BFF/API and returns as
  mapped visual data.
- No localStorage, file import, or renderer singleton is a clinical source of
  truth.
- Treatment authorization and read-only mutation behavior are defined and
  tested, with enforcement at the owning server-side boundary rather than
  frontend UI alone.

### Next.js, UX, and performance

- The route/server shell remains server-capable and browser-only code is
  isolated to the smallest client boundary.
- Static assets load through the approved Next-compatible path with accessible
  loading/error behavior.
- All DOM access is instance-scoped and all observers/listeners/timers clean
  up under unmount and React Strict Mode.
- Styling is feature-scoped and consistent with Clinora's
  Bootstrap/React-Bootstrap/Ubold design; the legacy global stylesheet is not
  imported.
- Phone, tablet, desktop, dark/light behavior, keyboard focus, and reduced
  motion are verified.
- Bundle, asset, mount, update, and DOM costs are measured and stay within the
  ODONTO-13 approved baseline.
- No unnecessary renderer dependency, 3D stack, global store, or continuous
  animation loop is added.

### Quality and compliance

- Strict TypeScript contains no introduced any or disabled safety checks.
- Focused unit/component tests cover layout, numbering, ID namespacing,
  selection, surfaces, each approved condition, bridges, error states,
  multiple instances, and cleanup.
- Frontend Jest tests, lint, Next production build, and the focused e2e flow
  pass.
- Clinical/product reviewers approve representative visual parity.
- Only approved tooth assets were copied.
- Upstream SVG comments and substantially adapted source headers are retained.
- The full MIT license ships at the documented public path, and the provenance
  notice remains at the documented source-repository path.
- ISO PDFs, embedded fonts, screenshots, branding, FHIR, plugins, perio, and
  export code remain excluded unless separately reviewed and approved.
- Final completion notes record verification evidence, performance results,
  hashes, approvals, and deferred capabilities.
