# Clinora Odontogram Clinical Parity Roadmap

Status: proposed implementation roadmap  
Last reviewed: 2026-08-13  
Execution mode: frontend-first with in-memory mock data  
Foundation: `ODONTOGRAM_INTEGRATION_PLAN.md` / renderer ODONTO-01 through
ODONTO-13 plus the current mock Treatment mapper and workspace prototypes

## 1. Purpose

This roadmap extends Clinora's existing odontogram foundation toward clinical
and visual feature parity with React Advanced Odontogram. It is the roadmap to
follow before treating the odontogram as feature-complete or designing the
final backend persistence contract.

The existing integration plan deliberately delivered a bounded v1 renderer.
It did not promise all upstream tooth-detail axes, treatment actions,
prostheses, periodontal records, or diagnostic states. ODONTO-16 in that plan
is a release audit and explicitly excludes new clinical conditions. Therefore,
ODONTO-16 must not be used as the next feature-development task for this goal.

This roadmap preserves the architecture already established:

```text
Treatment domain data
       |
       | pure Treatment-owned mapping
       v
Odontogram visual DTO
       |
       | controlled rendering only
       v
Trusted, instance-scoped SVG renderer
```

The goal is not to copy the upstream standalone application. The goal is to
provide equivalent clinically useful charting capabilities inside Clinora's
Treatment bounded context.

## 2. Definition of parity

For this roadmap, a capability reaches parity only when all applicable parts
are implemented:

1. A typed Treatment finding or act can represent the information without a
   free-form string convention.
2. The tooth-details UI exposes the correct inputs and applicability rules.
3. Existing, planned, in-progress, completed, cancelled, and entered-in-error
   lifecycle meanings are deterministic.
4. The Treatment-to-odontogram mapper has an explicit result for the feature.
5. If upstream has relevant artwork, the Clinora renderer activates the
   correct layer or composition without hiding incompatible data.
6. If the information is intentionally record-only, it appears in the tooth
   record/periodontal record and is not assigned a misleading tooth symbol.
7. Assistant-entered drafts and dentist-confirmed data follow the documented
   handoff and review behavior.
8. Model, mapper, UI, rendering, conflict, accessibility, and lifecycle tests
   cover the behavior.

Parity does not mean that every upstream setting or technical subsystem must
be migrated.

## 3. Sources of truth

Use the local, license-audited snapshot as the implementation reference:

- `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/src/odontogram.ts`
- `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/src/registry/axes.ts`
- `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/src/registry/restorations.ts`
- `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/src/registry/svgLayers.ts`
- `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/src/fhir/codesystems.ts`
- `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/src/PerioChart.tsx`
- `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/src/PerioSidebar.tsx`
- the upstream tests for the feature being adapted

Use the current Clinora implementation as the architectural source of truth:

- `apps/frontend/src/features/odontogram/`
- `apps/frontend/src/features/treatment/model/treatment.ts`
- `apps/frontend/src/features/treatment/model/treatment-catalogue.ts`
- `apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.ts`
- `apps/frontend/src/features/treatment/model/treatment-workspace.ts`
- `apps/frontend/src/features/treatment/pages/treatment-workspace-page.tsx`

Do not import production code from `legacy/`. Extract and adapt reviewed rules
into the owning Clinora feature.

## 4. Current baseline

### 4.1 Implemented foundation

The current implementation already provides:

- 32 permanent FDI positions and FDI/Universal/Palmer labels.
- Side and posterior occlusal SVG views.
- Controlled single and modifier-key multi-selection.
- A five-surface selector.
- Existing/planned layer styling.
- Natural, missing, and existing-implant structural bases.
- Surface caries and recurrent caries rendering.
- Filling material rendering.
- Crown, inlay, onlay, veneer, and bridge rendering.
- Root-canal filling rendering.
- Planned/completed extraction behavior.
- Existing implant crown and implant bridge-abutment composition.
- A mock Treatment visit, act lifecycle, clinical record, and assistant handoff.

### 4.2 Important limitations

The current catalogue contains 25 treatment-act codes and 27 finding codes,
but catalogue presence does not mean complete model or rendering support.

At the start of this roadmap:

- 9 of 25 acts are marked `visualized: true`.
- 5 of 27 finding categories are marked `visualized: true`.
- some `visualized: true` entries are only partially supported.
- planned implant placement is recorded but intentionally produces a
  projection issue; only completed implant placement becomes an existing
  implant base.
- `EXISTING_ENDODONTIC_STATE` is marked visualized, but only root-canal filling
  currently projects.
- many details use generic `ClinicalDetail[]` keys rather than a closed,
  discriminated Treatment input model.
- the runtime SVG normalizer prunes layers not approved by the current v1
  registry, even though the trusted source SVG files contain more artwork.

The catalogue boolean must not be treated as proof of parity.

## 5. Scope boundaries

### 5.1 Included

This roadmap includes:

- all clinically useful tooth-status and tooth-substrate states present in the
  upstream tooth-detail workflow;
- primary-tooth presentation supported by the existing upstream artwork;
- all upstream fixed-restoration and filling variants;
- endodontic treatment states, posts, pins, and resection;
- pulp, apical, periapical, resorption, wear, discoloration, and orthodontic
  charting;
- implant lifecycle and implant/restorative/prosthetic combinations;
- removable prosthesis presentation where the artwork supports it;
- periodontal and peri-implant charting as a separate Treatment sub-workspace;
- status versus plan behavior owned by Treatment;
- assistant draft, dentist review, audit attribution, and correction behavior;
- summaries and accessible fallbacks for valid data with no tooth SVG symbol.

### 5.2 Explicitly excluded from this frontend parity phase

Do not migrate these as part of the tasks below:

- upstream localStorage or JSON files as a clinical source of truth;
- the upstream singleton store or direct document-wide queries;
- the standalone upstream header, settings modal, tour, and demo shell;
- FHIR import/export;
- PDF/image export and embedded font modules;
- plugin/custom-SVG execution;
- upstream global CSS or translated demo application;
- backend APIs, database entities, migrations, or authorization enforcement;
- pricing, billing, inventory, insurance, or procedure-code adjudication.

FHIR/export and backend persistence require separate plans after this
frontend model stabilizes.

## 6. Architecture rules

### 6.1 Treatment owns clinical meaning

Treatment owns:

- findings and treatment acts;
- act and visit lifecycle;
- author, verifier, approver, and performer attribution;
- applicability and business validation;
- status versus plan semantics;
- assistant handoff and dentist review;
- record-only details;
- conflict resolution and audit history.

The odontogram must not import Treatment types or infer a treatment act from a
clicked SVG layer.

### 6.2 Odontogram owns visual capability

Odontogram owns only:

- strict visual DTOs;
- template/view support rules;
- semantic layer composition;
- SVG normalization, namespacing, and activation;
- visual fallback reporting;
- selection, focus, zoom, and accessible presentation.

### 6.3 Do not reproduce the upstream `defaultState()` object

The upstream record combines structure, findings, treatments, periodontal
measurements, display state, notes, and planned workflow in one mutable object.
Clinora must retain separate concepts:

```text
TreatmentVisit
  findings[]
  acts[]
  periodontalExamination?
  documentationHandoff?

Treatment -> Odontogram mapper
  visual base + visual conditions + unsupported/detail-only notices
```

### 6.4 Capability metadata replaces one boolean

Replace the catalogue's `visualized: boolean` with explicit capability data.
The exact name can be refined in PARITY-01, but it must distinguish at least:

```ts
type OdontogramProjectionSupport =
  | 'none'
  | 'record-only'
  | 'existing-only'
  | 'planned-only'
  | 'existing-and-planned';
```

It must also be possible to express support that depends on a subtype, view,
tooth base, tooth position, or lifecycle state.

### 6.5 Record-only is a valid outcome

Some upstream axes have no SVG layer, including CEJ visibility, root
concavity, gingival thickness, Miller recession class, Latin pulp detail, and
parts of the diagnostic classification. These must remain visible in the
clinical record without inventing arbitrary artwork.

### 6.6 Planned and existing are not the same state

- Confirmed findings describe existing status.
- Completed acts may contribute existing post-treatment status when clinically
  appropriate.
- Planned and in-progress acts contribute planned visuals.
- Draft assistant records do not become authoritative visuals before dentist
  review, unless the UI explicitly presents a draft preview isolated from the
  confirmed chart.
- Cancelled and entered-in-error records do not project.
- Shared layers must not be styled as planned when the same visual is already
  established by an existing record.

### 6.7 No silent visual loss

For valid Treatment data that cannot render in the active view, use one of:

1. automatically include the compatible view;
2. expose an accessible visual marker approved for that concept; or
3. show a clear record-level “not represented on chart” indicator.

Never silently show the tooth as healthy.

## 7. Upstream-to-Clinora capability matrix

The status values below describe the repository before PARITY work begins.

Legend:

- **Implemented**: typed/mapped/rendered for the current supported case.
- **Partial**: some values or lifecycle states work.
- **Catalogue only**: selectable/recordable, but not fully modeled/rendered.
- **Missing**: not implemented in Clinora.
- **Record-only upstream**: upstream records it but has no dedicated tooth
  artwork.

| Capability family          | Upstream values/behavior                                     | Clinora baseline                                 | Required outcome                                       |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------ |
| Permanent tooth            | present natural tooth                                        | Implemented                                      | Preserve                                               |
| Missing tooth              | gap/no tooth                                                 | Implemented                                      | Add extraction-socket distinctions                     |
| Existing implant           | implant fixture                                              | Implemented                                      | Preserve and test combinations                         |
| Planned implant            | planned placement                                            | Missing                                          | Add separate planned condition                         |
| Primary tooth              | deciduous artwork and remapped label                         | Missing                                          | Add typed dentition and artwork                        |
| Tooth under gum            | `tooth-under-gum`                                            | Catalogue only through substrate/status concepts | Model and render                                       |
| Post-extraction socket     | `no-tooth-after-extraction`, extraction wound                | Missing                                          | Model and render lifecycle                             |
| Tooth substrate            | natural, radix, broken, crown preparation                    | Catalogue only                                   | Model, edit, render                                    |
| Fracture geometry          | mesial/incisal/distal combinations                           | Catalogue only                                   | Typed regions and derived layer composition            |
| Missing gap closed         | closed missing space                                         | Missing                                          | Record and render                                      |
| Crown needed/replacement   | planned crown glyphs                                         | Catalogue only                                   | Map acts to planned symbols                            |
| Surface caries             | five canonical surfaces, ICDAS 1-6                           | Implemented                                      | Preserve                                               |
| Recurrent caries           | CARS by filled surface                                       | Implemented                                      | Make explicit in detail UI and tests                   |
| Subcrown caries            | separate subcrown state                                      | Missing                                          | Model and render with restoration rules                |
| Root caries                | active, arrested, active-cavitated                           | Catalogue only                                   | Model and render side view                             |
| Radiographic depth         | E1/E2/D1/D2/D3 per surface                                   | Missing                                          | Record; provide reviewed indicator/summary             |
| Fillings                   | four materials by surface                                    | Implemented                                      | Preserve                                               |
| Filling defects            | marginal, fracture, wear by filled surface                   | Missing                                          | Model and render defect markers                        |
| Fissure sealing            | fissure sealant glyph                                        | Catalogue only act                               | Map and render                                         |
| Contact defect             | mesial/distal contact issue                                  | Catalogue only finding                           | Model and render                                       |
| Fixed restorations         | crown/inlay/onlay/veneer/bridge and materials                | Implemented                                      | Complete lifecycle/conflict parity                     |
| Crown marginal leakage     | crown/bridge leakage glyph                                   | Catalogue only                                   | Model and render                                       |
| Endodontic treatment       | medication, complete/incomplete filling                      | Partial                                          | Add missing variants                                   |
| Endodontic posts           | glass-fiber and metal posts                                  | Catalogue only                                   | Model and render composition                           |
| Apicoectomy                | root resection                                               | Catalogue only                                   | Model and render                                       |
| Parapulpal pin             | pin glyph                                                    | Catalogue only                                   | Model and render                                       |
| Pulp diagnosis             | AAE values plus optional Latin detail                        | Catalogue only                                   | Typed diagnosis; render only supported pulp appearance |
| Apical diagnosis           | AAE values                                                   | Catalogue only                                   | Typed record and reviewed visual mapping               |
| Periapical lesion          | granuloma/cyst/abscess                                       | Catalogue only                                   | Model and render exact layers                          |
| Root resorption            | internal/external cervical                                   | Catalogue only                                   | Model and render shared resorption glyph               |
| Tooth wear                 | edge and cervical type axes                                  | Catalogue only                                   | Split axes and render                                  |
| Discoloration              | tetracycline/fluorosis/nonvital/extrinsic/other              | Catalogue only                                   | Model and apply scoped tint rules                      |
| Orthodontics               | bracket/band, drift, vertical, rotation                      | Catalogue only                                   | Model and render                                       |
| Implant prostheses         | healing abutment, locator, locator denture, bar, bar denture | Catalogue only                                   | Model and render supported compositions                |
| Removable prostheses       | partial/full                                                 | Catalogue only                                   | Model arch/span ownership and render supported artwork |
| Peri-implant disease       | healthy, mucositis, mild/moderate/severe implantitis         | Catalogue only                                   | Implant-gated record and visual severity               |
| Calculus                   | per-tooth calculus                                           | Catalogue only                                   | Periodontal model and render                           |
| Mobility                   | grades I-III                                                 | Catalogue only                                   | Periodontal record; render upstream modifier           |
| Periodontal involvement    | periodontal modifier                                         | Catalogue only                                   | Record and render                                      |
| Probing                    | PD and signed gingival margin at MB/B/DB/ML/L/DL             | Catalogue only simplified PD                     | Full six-site model and UI                             |
| Derived CAL                | PD + gingival margin                                         | Missing                                          | Derive, never store                                    |
| BOP/suppuration            | per charted probing site                                     | Missing                                          | Model and edit                                         |
| Furcation                  | position-gated entrances, grades I-IV                        | Catalogue only simplified grade                  | Full entrance-aware model                              |
| O'Leary plaque             | four-surface presence                                        | Catalogue only generic surface finding           | Separate index model                                   |
| PI/GI                      | four-surface grades 1-3                                      | Missing                                          | Separate graded index model                            |
| mPI/mBI                    | implant-only four-surface grades 1-3                         | Missing                                          | Implant-gated model                                    |
| Keratinized gingiva        | buccal width 0-15 mm                                         | Missing                                          | Record and edit                                        |
| CEJ/root concavity         | categorical data axes                                        | Missing                                          | Record-only detail                                     |
| Gingival phenotype         | thin/medium/thick                                            | Missing                                          | Record-only detail                                     |
| Miller class               | I-IV                                                         | Missing                                          | Record-only detail                                     |
| Cairo recession            | RT1-RT3 derived                                              | Missing                                          | Derive from approved inputs                            |
| Whole-mouth perio summary  | PD/CAL/BOP/plaque/index summaries                            | Missing                                          | Add periodontal summary                                |
| Periodontal classification | diagnosis/stage/grade/extent and risk inputs                 | Missing                                          | Separate clinically reviewed task                      |
| Status versus plan         | dual chart comparison and proposed styling                   | Partial                                          | Treatment-owned, deterministic delta                   |
| Notes and summaries        | per-tooth clinical summary                                   | Partial                                          | Structured record plus accessible summary              |
| Assistant handoff          | not an upstream domain feature                               | Implemented mock foundation                      | Extend for all new details                             |

This matrix must be updated after every task. “Catalogue only” must never be
changed to “Implemented” until the full parity definition in section 2 passes.

### 7.1 Current Treatment act assignment

Every currently declared act code has an owning parity task:

| Treatment act code           | Baseline              | Owning task                                |
| ---------------------------- | --------------------- | ------------------------------------------ |
| `FISSURE_SEALING`            | Catalogue only        | PARITY-03                                  |
| `DIRECT_FILLING`             | Implemented core      | PARITY-03 completes detail/conflict parity |
| `CROWN`                      | Implemented core      | PARITY-03 and PARITY-05                    |
| `INLAY`                      | Implemented core      | PARITY-03 and PARITY-05                    |
| `ONLAY`                      | Implemented core      | PARITY-03 view-safety completion           |
| `VENEER`                     | Implemented core      | PARITY-03 and PARITY-05                    |
| `BRIDGE`                     | Implemented core      | PARITY-02 and PARITY-05                    |
| `ROOT_CANAL_MEDICATION`      | Catalogue only        | PARITY-03                                  |
| `ROOT_CANAL_FILLING`         | Implemented core      | PARITY-03 completes family parity          |
| `ROOT_CANAL_REPAIR`          | Catalogue only        | PARITY-03                                  |
| `GLASS_FIBER_POST`           | Catalogue only        | PARITY-03                                  |
| `METAL_POST`                 | Catalogue only        | PARITY-03                                  |
| `APICOECTOMY`                | Catalogue only        | PARITY-03                                  |
| `PARAPULPAL_PIN`             | Catalogue only        | PARITY-03                                  |
| `EXTRACTION`                 | Implemented core      | PARITY-02 and PARITY-05                    |
| `IMPLANT_PLACEMENT`          | Completed-only visual | PARITY-02                                  |
| `HEALING_ABUTMENT`           | Catalogue only        | PARITY-02                                  |
| `LOCATOR_ATTACHMENT`         | Catalogue only        | PARITY-02                                  |
| `LOCATOR_OVERDENTURE`        | Catalogue only        | PARITY-02                                  |
| `BAR_ATTACHMENT`             | Catalogue only        | PARITY-02                                  |
| `BAR_OVERDENTURE`            | Catalogue only        | PARITY-02                                  |
| `PARTIAL_REMOVABLE_DENTURE`  | Catalogue only        | PARITY-02                                  |
| `COMPLETE_REMOVABLE_DENTURE` | Catalogue only        | PARITY-02                                  |
| `CROWN_REPLACEMENT`          | Catalogue only        | PARITY-03                                  |
| `ORTHODONTIC_APPLIANCE`      | Catalogue only        | PARITY-03                                  |

### 7.2 Current Treatment finding assignment

Every currently declared finding code also has an owning parity task:

| Clinical finding code        | Baseline                     | Owning task                             |
| ---------------------------- | ---------------------------- | --------------------------------------- |
| `TOOTH_STATE`                | Partial                      | PARITY-02                               |
| `TOOTH_SUBSTRATE`            | Catalogue only               | PARITY-02                               |
| `CARIES`                     | Implemented core             | PARITY-03 completes advanced detail     |
| `ROOT_CARIES`                | Catalogue only               | PARITY-03                               |
| `EXISTING_FILLING`           | Implemented core             | PARITY-03 completes defect/depth detail |
| `EXISTING_FIXED_RESTORATION` | Implemented core             | PARITY-03                               |
| `EXISTING_ENDODONTIC_STATE`  | Root-filling subtype only    | PARITY-03                               |
| `EXISTING_PROSTHESIS`        | Catalogue only               | PARITY-02                               |
| `CALCULUS`                   | Catalogue only               | PARITY-04                               |
| `CONTACT_POINT_DEFECT`       | Catalogue only               | PARITY-03                               |
| `TOOTH_FRACTURE`             | Catalogue only               | PARITY-02                               |
| `MOBILITY`                   | Catalogue only               | PARITY-04                               |
| `PERIODONTAL_INVOLVEMENT`    | Catalogue only               | PARITY-04                               |
| `PERIAPICAL_LESION`          | Catalogue only               | PARITY-03                               |
| `EXTRACTION_WOUND`           | Catalogue only               | PARITY-02                               |
| `CROWN_LEAKAGE`              | Catalogue only               | PARITY-03                               |
| `PULP_DIAGNOSIS`             | Catalogue only               | PARITY-03                               |
| `APICAL_DIAGNOSIS`           | Catalogue only               | PARITY-03                               |
| `ROOT_RESORPTION`            | Catalogue only               | PARITY-03                               |
| `TOOTH_WEAR`                 | Catalogue only               | PARITY-03                               |
| `DISCOLORATION`              | Catalogue only               | PARITY-03                               |
| `ORTHODONTIC_STATE`          | Catalogue only               | PARITY-03                               |
| `PERI_IMPLANT_STATUS`        | Catalogue only               | PARITY-04                               |
| `PERIODONTAL_MEASUREMENT`    | Simplified catalogue concept | PARITY-04                               |
| `FURCATION_INVOLVEMENT`      | Simplified catalogue concept | PARITY-04                               |
| `PLAQUE_FINDING`             | Generic catalogue concept    | PARITY-04                               |
| `GINGIVAL_FINDING`           | Generic catalogue concept    | PARITY-04                               |

PARITY-01 may split a code when upstream concepts are clinically distinct—for
example edge wear versus cervical wear—or introduce a structured subtype. It
must not overload one code with unrelated meanings merely to avoid changing
the catalogue.

## 8. Delivery strategy

### 8.1 Frontend first

All tasks through PARITY-05 use the existing in-memory Treatment workspace.
They define the frontend domain behavior and rendering contract before backend
schemas are frozen.

### 8.2 Vertical slices

Each clinical family is implemented vertically:

```text
typed Treatment concept
  -> catalogue/applicability metadata
  -> tooth-details editor
  -> mock lifecycle behavior
  -> Treatment mapper
  -> visual DTO when applicable
  -> SVG layer/record-only presentation
  -> tests
```

Do not add every enum first and defer rendering until later. A task is complete
only when its whole vertical slice is usable.

### 8.3 Preserve performance work

The runtime loader currently prunes nonapproved SVG layers. Each visual task
must add only its reviewed semantic layers and transitively referenced SVG
definitions to the approved manifest. Measure normalized node count and mount
cost after each large family. Do not restore all legacy layers in one step.

### 8.4 File routing

Extend existing feature folders rather than creating a new Nx library or a
parallel architecture:

| Responsibility                         | Location                                                                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Treatment clinical types and lifecycle | `apps/frontend/src/features/treatment/model/`                                                                                                 |
| Treatment capability catalogue         | `apps/frontend/src/features/treatment/model/treatment-catalogue.ts` or a small colocated split when the current file becomes hard to navigate |
| Treatment-to-visual mapping            | `apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.ts` and focused collaborators                                         |
| Mock fixtures                          | `apps/frontend/src/features/treatment/mock/`                                                                                                  |
| Tooth-detail and periodontal UI        | `apps/frontend/src/features/treatment/components/`                                                                                            |
| Workspace composition                  | `apps/frontend/src/features/treatment/pages/`                                                                                                 |
| Public visual DTO                      | `apps/frontend/src/features/odontogram/model/`                                                                                                |
| Semantic SVG layer rules               | `apps/frontend/src/features/odontogram/rendering/`                                                                                            |
| Controlled visual components           | `apps/frontend/src/features/odontogram/components/`                                                                                           |
| Provenance updates                     | `apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md`                                                                                |

Keep tests colocated with the owning module. Export only intentional consumer
APIs from each feature's root `index.ts`. Do not introduce
domain/application/infrastructure folder layers into the frontend.

## 9. Execution protocol

For each PARITY task:

1. Read this roadmap and the original integration plan.
2. Inspect the exact upstream implementation and tests named by the task.
3. Inspect current Clinora files before changing types.
4. Implement only one task.
5. Update the capability matrix or add a dated completion note.
6. Preserve upstream MIT headers on substantially adapted logic.
7. Update `THIRD_PARTY_NOTICES.md` when adapting additional upstream code.
8. Add no dependency unless the task proves it is required.
9. Run focused tests serially to control memory.
10. Run lint, formatting, and `git diff --check`.

Recommended focused command pattern:

```bash
pnpm exec nx test frontend --runInBand \
  --testPathPatterns='features/(odontogram|treatment)' \
  --skip-nx-cache
```

For local UI review, use:

```bash
pnpm dev:frontend:low-memory
```

## 10. Five-task implementation roadmap

These five tasks are intentionally larger than the original task list. Each
task contains ordered internal checkpoints so the implementation remains
reviewable while requiring only five top-level execution prompts. Complete the
checkpoints in order and do not mark the parent task complete when only one
clinical family works.

### PARITY-01 — Establish the typed parity foundation and scalable Treatment editor

**Goal**

Make support claims honest, replace generic clinical-detail conventions with
typed inputs, and prepare the Treatment UI to add every later clinical family
without becoming one monolithic form.

**Dependencies**

- Existing ODONTO v1 renderer and mock Treatment workspace.
- The capability inventory in sections 4 and 7 of this roadmap.

**Checkpoint A — Executable capability inventory**

- Inventory every upstream axis, special per-surface map, periodontal record,
  SVG layer, applicability gate, and record-only field.
- Replace `visualized: boolean` with capability metadata that distinguishes
  existing, planned, record-only, unsupported, subtype-conditional,
  view-conditional, and lifecycle-conditional support.
- Correct implant placement: planned/in-progress is not currently supported,
  while completed placement is an existing implant.
- Correct partial endodontic support and every other overstated catalogue row.
- Add a test that fails whenever an act, finding, or subtype lacks explicit
  support metadata.
- Keep the 25-act and 27-finding assignment tables synchronized with code.

**Checkpoint B — Typed Treatment clinical inputs**

- Replace open `ClinicalDetail[]` key conventions in creation paths with
  discriminated finding and act inputs.
- Preserve serializable stored records; do not use `Map` or `Set` in public
  Treatment records.
- Define distinct types for:
  - restorative five-surface targets;
  - six-site periodontal targets;
  - four-surface plaque/index targets;
  - position-aware furcation entrances;
  - tooth, bridge-span, arch, and mouth targets.
- Add total runtime validation at the UI/mock boundary.
- Separate clinical/business validation from odontogram visual-capability
  validation.
- Provide a temporary legacy-detail adapter only if necessary for current mock
  fixtures, with an explicit removal test or follow-up checkpoint.

**Checkpoint C — Scalable tooth-details editor**

- Split the current editor into Treatment-owned clinical-family panels.
- Add grouped/searchable finding and act selection.
- Show inputs based on act/finding subtype, tooth base, position, dentition,
  lifecycle, and target geometry.
- Show `visual`, `record-only`, or `not available for this target` capability
  honestly.
- Preserve assistant draft and dentist confirmation behavior.
- Keep surface, bridge, arch, and periodontal controls distinct.
- Add keyboard, accessible-name, validation-error, and conditional-field tests.

**Expected files**

- `apps/frontend/src/features/treatment/model/treatment.ts`
- `apps/frontend/src/features/treatment/model/treatment-catalogue.ts`
- `apps/frontend/src/features/treatment/model/treatment-catalogue.spec.ts`
- focused typed-input/validation modules under
  `apps/frontend/src/features/treatment/model/`
- focused editor components under
  `apps/frontend/src/features/treatment/components/`
- `apps/frontend/src/features/treatment/pages/treatment-workspace-page.tsx`
- colocated tests and mock fixture updates

**Acceptance criteria**

- All 25 current acts and 27 current findings have explicit, subtype-aware
  capability metadata.
- Invalid detail combinations cannot be created through the typed UI path.
- Target geometries are not interchangeable.
- Record-only concepts are presented intentionally rather than as renderer
  failures.
- The editor can accept later parity families without another page-level
  conditional block.
- No backend DTO, database schema, or odontogram layer ID enters the Treatment
  public domain model.

**Out of scope**

Adding the missing visual families themselves.

### PARITY-02 — Complete structural, implant, bridge, and prosthesis parity

**Goal**

Implement tooth structure and dentition states plus the full
implant/prosthodontic lifecycle, including the planned implant behavior that is
currently missing.

**Dependencies**

- PARITY-01.

**Checkpoint A — Structural states and dentition**

- Primary/deciduous tooth state with stable permanent-position identity and
  correct displayed primary numbering.
- Tooth under gum.
- Root remnant (`radix`).
- Broken tooth plus mesial/incisal/distal fracture combinations.
- Crown preparation.
- Missing-after-extraction/socket state.
- Extraction wound and closed missing gap.
- Crown-needed and crown-replacement planned states where structurally
  applicable.
- Typed mutual exclusions, transition cleanup, exact layer fixtures, and
  assistant approval behavior.
- Expand the approved runtime SVG manifest only with required layers and
  referenced definitions.

**Checkpoint B — Planned implant lifecycle**

- Add a separate planned-implant visual condition rather than overloading the
  existing implant base.
- Map PLANNED and IN_PROGRESS implant placement to planned artwork.
- Map COMPLETED placement to an existing implant base.
- Remove cancelled and entered-in-error contributions.
- Define staged extraction -> implant -> crown behavior.
- Ensure cancellation restores the confirmed chart without losing history.
- Test every act lifecycle transition and existing-versus-planned combination.

**Checkpoint C — Implant and removable prostheses**

- Existing/planned implant crown and bridge-abutment composition.
- Healing abutment.
- Locator attachment and locator overdenture.
- Bar attachment and bar overdenture.
- Partial and complete removable dentures.
- Correct tooth-unit, gap-unit, bridge-span, prosthesis-group, and arch
  ownership.
- Material/role validation and deterministic grouped identity.
- Prevent incompatible fixed and removable prostheses from silently
  overwriting one another.
- Keep separate adjacent bridges/prostheses visually distinct.

**Expected files**

- typed Treatment structural/implant/prosthesis model files
- `apps/frontend/src/features/treatment/model/treatment-catalogue.ts`
- `apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.ts`
- `apps/frontend/src/features/odontogram/model/odontogram.ts`
- `apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.ts`
- `apps/frontend/src/features/odontogram/rendering/restoration-layers.ts`
- `apps/frontend/src/features/odontogram/rendering/svg-template-loader.ts`
- focused Treatment editor components, mock fixtures, and colocated specs
- `apps/frontend/src/features/odontogram/THIRD_PARTY_NOTICES.md` when
  additional upstream logic is substantially adapted

**Acceptance criteria**

- Every structural state has exact layer fixtures for applicable archetypes.
- Primary teeth display correctly without changing their position key.
- Planning an implant visibly renders a planned fixture.
- Completing the act converts it to an existing implant base.
- Cancelling or entering the act in error removes only that act's contribution.
- Implant connectors appear only with compatible suprastructures.
- Removable prostheses have stable group/arch ownership rather than duplicated
  unrelated tooth records.
- No renderer rule makes Treatment eligibility decisions.

### PARITY-03 — Complete restorative, endodontic, diagnostic, wear, and orthodontic parity

**Goal**

Implement all remaining nonperiodontal tooth-detail and treatment visual
families as one vertical clinical epic.

**Dependencies**

- PARITY-01.
- PARITY-02 for structural and implant applicability rules.

**Checkpoint A — Advanced caries and restorative detail**

- Fissure sealing.
- Existing primary caries and recurrent CARS editing by surface.
- Root caries: active, arrested, and active-cavitated.
- Subcrown caries.
- Radiographic depth E1/E2/D1/D2/D3 per surface as a structured
  record/indicator.
- Filling defects: marginal, fracture, and wear on a filled surface.
- Mesial/distal contact defects.
- Crown/bridge marginal leakage.
- Crown needed and planned crown replacement integration.
- Complete material, surface, subcrown, onlay-view, and anterior-lingual
  conflict policies.

**Checkpoint B — Endodontic treatment and diagnosis**

- Root-canal medication.
- Complete and incomplete root-canal filling.
- Glass-fiber and metal posts with required root-filling composition.
- Parapulpal pin.
- Apicoectomy/root resection.
- AAE pulp diagnosis and optional Latin practical subtype.
- AAE apical diagnosis.
- Periapical granuloma, cyst, and abscess.
- Internal and external-cervical root resorption.
- Keep diagnosis separate from treatment acts and keep record-only distinctions
  visible in tooth details.
- Add explicit side/occlusal fallback rules.

**Checkpoint C — Wear, discoloration, and orthodontics**

- Incisal/occlusal attrition and erosion.
- Cervical abrasion, abfraction, and erosion.
- Tetracycline, fluorosis, nonvital, extrinsic, and other discoloration.
- Bracket and orthodontic band.
- Mesial/distal drift.
- Extrusion/intrusion.
- Rotation.
- Scope discoloration tinting to each cloned SVG and ensure it does not replace
  restoration material appearance.
- Verify directional glyphs after mirroring and lower-arch rotation.

**Expected files**

- typed clinical-family models and editors under the Treatment feature
- `apps/frontend/src/features/treatment/model/treatment-catalogue.ts`
- `apps/frontend/src/features/treatment/model/treatment-odontogram.mapper.ts`
- `apps/frontend/src/features/odontogram/model/odontogram.ts`
- `apps/frontend/src/features/odontogram/rendering/tooth-layer-registry.ts`
- `apps/frontend/src/features/odontogram/rendering/apply-tooth-visuals.ts`
- `apps/frontend/src/features/odontogram/rendering/svg-template-loader.ts`
- relevant component, mapper, registry, normalization, and lifecycle specs
- provenance notice updates for substantially adapted upstream rules

**Acceptance criteria**

- Every included nonperiodontal matrix row has a typed input, UI path, mapper
  outcome, and visual or record-only presentation.
- Surface severities/materials/details remain independently representable.
- Filling defects require a filling and subcrown caries requires compatible
  restoration context.
- Mutually exclusive endodontic states cannot coexist.
- Posts activate their reviewed root-filling composition.
- Diagnoses do not automatically create treatment acts.
- Shared-artwork diagnoses remain distinct in stored/visible details.
- Unsupported template views never silently make a diseased tooth appear
  healthy.
- Every visual has exact active-layer and stale-layer-clearing tests.

### PARITY-04 — Implement complete periodontal and peri-implant charting

**Goal**

Create the Treatment-owned periodontal examination, efficient charting UI,
visual overlays, summaries, peri-implant states, and clinically reviewed
classification.

**Dependencies**

- PARITY-01 typed target/value foundation.
- PARITY-02 implant and dentition states.

**Checkpoint A — Periodontal examination model**

- Six sites: MB, B, DB, ML, L, DL.
- Probing depth and signed gingival-margin offset.
- Derived CAL (`pd + gm`), never stored.
- BOP and suppuration only at charted sites.
- Mobility grades I-III.
- Position-aware furcation entrances and grades I-IV.
- O'Leary plaque presence on four surfaces.
- PI/GI grades 1-3 on four surfaces.
- Implant-only mPI/mBI grades 1-3.
- Keratinized gingiva width 0-15 mm.
- CEJ visibility, root concavity, gingival phenotype, and Miller class.
- Cairo recession type derived from approved inputs.
- Preserve uncharted versus measured-zero/healthy semantics.

**Checkpoint B — Periodontal UI and visual presentation**

- Build a separate Treatment periodontal sub-workspace.
- Provide efficient keyboard navigation and bulk charting.
- Adapt pure, typed arch-layout and curve/overlay calculations only.
- Render buccal and lingual/palatal charts.
- Add PD, margin, CAL, BOP, suppuration, mobility, furcation, plaque, PI/GI,
  KG, phenotype, Miller, mPI, and mBI rows/overlays.
- Add calculus and periodontal-involvement tooth layers.
- Add implant-gated mucositis and mild/moderate/severe peri-implant bone-loss
  presentation.
- Lazy-load periodontal UI so the default odontogram chunk does not regress.

**Checkpoint C — Summaries and classification**

- Whole-mouth charted-site, average/max PD, average/worst CAL, BOP%, plaque%,
  maximum furcation, PI/GI, mPI/mBI, KG, and phenotype summaries.
- Risk context: age, smoking, cigarettes/day, diabetes, HbA1c, periodontal
  tooth loss, and maximum radiographic bone loss percentage.
- Derived 2017 diagnosis, stage, grade, and extent.
- Separate clinician override, reason, author, and timestamp from the derived
  result.
- Require explicit clinical approval of formulas, terminology, and override
  policy before release.

**Expected files**

- focused periodontal models/rules/specs under
  `apps/frontend/src/features/treatment/model/`
- periodontal components/specs under
  `apps/frontend/src/features/treatment/components/`
- lazy workspace integration under
  `apps/frontend/src/features/treatment/pages/`
- narrowly adapted pure rendering utilities under the odontogram feature only
  when they are genuinely visual
- Tooth layer registry/loader updates for calculus, periodontal, and
  peri-implant artwork
- provenance notice updates

**Acceptance criteria**

- Restorative surfaces, periodontal sites, index surfaces, and furcation
  entrances are different types and cannot be interchanged.
- CAL and summary calculations pass boundary fixtures.
- Furcation is position-aware and mPI/mBI is implant-only.
- Missing/primary/implant/natural positions use correct row gating.
- Inputs and overlays remain aligned at supported viewport/zoom sizes.
- Empty examinations remain distinguishable from healthy recorded values.
- Opening no periodontal UI adds no significant default odontogram cost.
- Classification cannot be release-ready without clinical approval.

### PARITY-05 — Complete workflow parity, verification, and backend handoff

**Goal**

Finish professional status-versus-plan behavior, summaries and assistant
handoff for every clinical family; then prove frontend parity and freeze
backend requirements.

**Dependencies**

- PARITY-01 through PARITY-04.

**Checkpoint A — Existing/status versus plan workflow**

- Build independent confirmed-status and active-plan projections.
- Compute a layer-level planned delta so shared existing layers are not dashed
  or recolored.
- Add reviewed combined/status-only/plan-only viewing modes.
- Define deterministic conflicts for multiple active plans on one
  tooth/surface.
- Preserve history across planned, in-progress, completed, cancelled, and
  entered-in-error transitions.
- Handle staged extraction -> implant -> crown sequences.
- Keep assistant draft preview separate from confirmed status and approved
  plan.

**Checkpoint B — Clinical summaries, history, and handoff**

- Structured per-tooth summary grouped by existing findings, planned acts,
  completed acts, and record-only details.
- Accessible focus/hover summary derived from Treatment/public visual data,
  never raw SVG internals.
- Author, verifier, approver, performer, and timestamps.
- Assistant draft review for every new clinical family.
- Return-for-correction reasons and revision history.
- Entered-in-error behavior distinct from deletion.
- Multi-tooth/bulk-entry confirmation summaries.
- Ensure every chart symbol is traceable to a Treatment record.

**Checkpoint C — Full frontend parity gate**

- One representative fixture for every capability-matrix row.
- Exhaustive act/finding/subtype/lifecycle mapper coverage.
- Exact visual layer fixtures and stale-layer clearing.
- Multiple odontograms plus periodontal chart.
- Light/dark, RTL host with LTR chart, keyboard, reduced motion, loading/error,
  and responsive validation.
- Re-measure normalized nodes, chunks, mount/update cost, and memory behavior.
- Audit approved SVG layers, retained definitions, provenance, and notices.
- Obtain clinician visual review against representative upstream states.
- Run focused tests, lint, production build, and selected e2e journeys.

**Checkpoint D — Backend requirements handoff**

- Document aggregate boundaries for visit, finding, act, periodontal
  examination, handoff, and audit history.
- Document commands, queries, lifecycle transitions, optimistic concurrency,
  tenancy, and authorization requirements.
- Define API DTO requirements without exposing SVG layer IDs.
- Define clinical-vocabulary versioning/migration requirements.
- Produce a separate backend implementation plan; do not create backend
  services or migrations in this task.

**Expected files**

- Treatment mapper/workflow/summary/history modules and specs
- Treatment workspace and component specs
- odontogram integration/performance/accessibility specs
- parity completion evidence in this roadmap or a colocated report
- a new backend requirements/implementation-plan document under
  `docs/implementation/treatment/`

**Acceptance criteria**

- Existing, planned, draft, cancelled, completed, and entered-in-error states
  are never conflated.
- Every included upstream capability is visualized or intentionally shown as
  record-only.
- Unsupported data never silently appears healthy.
- Every symbol is traceable to its source record and every record-only detail
  is discoverable.
- Assistant handoff covers all new clinical families.
- Performance, accessibility, provenance, and clinician-review gates pass.
- Backend requirements express clinical meaning and never depend on SVG layer
  IDs.
- No backend service, entity, migration, or API mutation is implemented here.

**Out of scope**

FHIR/PDF/image export, plugin execution, legacy persistence, billing, and the
backend implementation itself.

## 11. Recommended execution order

Execute exactly these five top-level tasks in order:

```text
PARITY-01  Typed foundation, honest capabilities, scalable editor
    |
PARITY-02  Structure, dentition, implant lifecycle, prostheses
    |
PARITY-03  Restorative, endodontic, diagnostic, wear, orthodontic parity
    |
PARITY-04  Periodontal and peri-implant model, UI, visuals, classification
    |
PARITY-05  Status/plan workflow, handoff, full verification, backend handoff
```

Each task is an epic with ordered checkpoints. Work through one checkpoint at
a time, but report the parent task complete only after all of its checkpoints
and acceptance criteria pass. Do not run PARITY-05's final release gate while
any capability-matrix row assigned to PARITY-01 through PARITY-04 remains
partial without an approved record-only classification.

## 12. Clinical and product approval gates

The following decisions must be approved rather than inferred from upstream
code:

1. Whether every upstream value is required in Clinora's target markets.
2. Whether Latin pulp terminology is enabled per clinic/locale.
3. How planned implant appears and how staged extraction/implant/crown plans
   are ordered.
4. How anterior lingual conditions and side-only onlays are communicated.
5. Whether discoloration tinting is sufficiently distinguishable and safe.
6. Whether removable prostheses are tooth-, span-, or arch-owned in Clinora.
7. Which periodontal indices are enabled per clinic.
8. The exact 2017 periodontitis classification algorithm and override policy.
9. Whether assistant drafts may be previewed on the chart before approval.
10. Which actions require dentist-only authority at the future backend.

Implementation may use mock-reviewed defaults for UI development, but a task
cannot be called release-ready while its listed clinical gate is unresolved.

## 13. Testing strategy

### 13.1 Model tests

- exact discriminated shapes and enum values;
- applicability by base, position, dentition, and target geometry;
- duplicate/cardinality and mutual-exclusion rules;
- lifecycle transitions and staged-plan ordering;
- uncharted versus zero/healthy periodontal semantics;
- derived CAL and periodontal summaries.

### 13.2 Mapper tests

- every act/finding subtype and lifecycle status;
- existing versus planned appearance;
- completed structural transitions;
- unsupported and record-only results;
- conflict resolution and stable projection ordering;
- assistant draft/approval behavior.

### 13.3 Renderer tests

- exact semantic active-layer sets;
- stale-layer clearing after every update;
- namespaced IDs and gradient/reference integrity;
- planned appearance only on condition-derived delta layers;
- view incompatibility and accessible fallback behavior;
- multiple instances and Strict Mode cleanup.

### 13.4 UI tests

- keyboard-only entry;
- screen-reader names and error associations;
- target-appropriate detail fields;
- multi-tooth confirmation;
- compact and desktop layouts;
- dark theme and RTL host with LTR dental chart;
- handoff, review, correction, and entered-in-error flows.

## 14. Completion definition

Frontend clinical parity is complete only when:

- every included upstream capability is classified and implemented according
  to section 2;
- every relevant Clinora act/finding has typed details and honest support
  metadata;
- all applicable upstream visual layers are selectively approved, rendered,
  and tested;
- record-only clinical data is visible in the correct record UI;
- planned and existing treatment states remain clinically distinguishable;
- implant placement renders throughout its lifecycle;
- periodontal data uses its proper geometries and derived calculations;
- the assistant handoff supports the expanded detail set;
- no clinical source of truth exists in renderer-local state;
- no legacy application shell, persistence, export, or global styling has
  leaked into Clinora;
- performance, accessibility, provenance, and clinician review gates pass;
- PARITY-05 produces a backend requirements handoff without coupling backend
  contracts to SVG layer IDs.

Only after this definition passes should the team execute a final release
audit equivalent to ODONTO-16 and begin the backend bounded-context
implementation plan.
