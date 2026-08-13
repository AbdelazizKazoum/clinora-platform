# Clinora Treatment bounded-context foundation

## Scope of this slice

This slice establishes the Treatment language and workflow without creating a
Treatment UI or connecting the odontogram. It contains:

- the Treatment visit aggregate and lifecycle rules;
- a separate clinical-finding model and treatment-act model;
- the supported clinical catalogue;
- dentist-to-assistant documentation handoff rules;
- a versionable gRPC/TypeScript API boundary; and
- frontend DTO mapping and permission-oriented view rules.

Persistence, TypeORM entities/migrations, NestJS composition, API Gateway/BFF
routes, authorization adapters, events, commands/hooks, and `/visits/new` UI are
deliberately deferred to the next vertical slice. The treatment-service folder
is therefore a tested domain foundation, not a deployable service yet.

## Core domain decisions

### A visit is the clinical record boundary

A `TreatmentVisit` belongs to one clinic and patient and has one responsible
dentist. Appointment, queue-entry, and chair IDs are optional workflow links;
Treatment does not read the Appointment database.

Visit lifecycle:

```text
DRAFT -> IN_PROGRESS -> READY_FOR_COMPLETION -> COMPLETED
                         ^
                         |
          AWAITING_REVIEW

Any non-terminal visit -> CANCELLED
```

`COMPLETED` and `CANCELLED` visits are immutable in the domain. Corrections to a
completed clinical record will require an explicit amendment/addendum workflow,
not silent reopening.

### Findings are not treatment acts

The reference odontogram combines current status, diagnosis, planned state, and
rendering flags. Clinora separates them:

- `ClinicalFinding`: what was observed or diagnosed, such as caries, mobility,
  an existing restoration, pulp/apical diagnosis, or periodontal measurement.
- `TreatmentAct`: care proposed, started, completed, cancelled, or entered in
  error, such as a filling, crown, root-canal filling, extraction, implant, or
  prosthesis.
- The odontogram: a future projection of approved Treatment data. It is not the
  clinical source of truth.

This distinction prevents a caries finding from being mistaken for a billable
procedure and preserves a durable treatment history independently of the SVG
engine.

### Assistant handoff is delegated data entry, not delegated diagnosis

The responsible dentist may assign visit documentation to a dental assistant:

```text
ASSIGNED -> IN_PROGRESS -> SUBMITTED -> ACCEPTED
                ^              |
                |              v
                +---------- RETURNED
```

The assignment records who assigned it, who entered it, timestamps, review
notes, and revision count. An assigned assistant can edit draft documentation
only while the assignment is active. Submission locks assistant editing until
the dentist accepts or returns it.

Only the responsible dentist can confirm findings, approve/complete treatment
acts, accept delegated documentation, and complete the visit. An administrator
may cancel an operational visit with a reason but cannot provide clinical
approval. Frontend capability checks are UX only; the API Gateway and Treatment
service must enforce these rules from authenticated identity and clinic scope.

## Catalogue coverage

The catalogue was independently modelled after auditing React Advanced
Odontogram's chartable features. No production file imports the legacy source,
and no renderer or SVG identifier appears in the Treatment contract.

Treatment acts cover:

- preventive fissure sealing;
- direct fillings;
- crowns, inlays, onlays, veneers, fixed bridges, and crown replacement;
- root-canal medication/filling/repair, glass-fiber and metal posts,
  apicoectomy, and parapulpal pins;
- extraction and implant placement;
- healing abutments, Locator/bar attachments and overdentures, and partial/full
  removable dentures; and
- orthodontic appliances.

Clinical findings cover tooth presence/substrate, surface and root caries,
existing fillings/restorations/endodontics/prostheses, calculus, contact defects,
fractures, mobility, periodontal/periapical findings, extraction wounds, crown
leakage, pulp/apical diagnosis, resorption, wear, discoloration, orthodontic and
peri-implant state, six-site periodontal measurements, furcation, plaque, and
gingival findings.

Clinical targets are renderer-neutral: mouth, arch, tooth, tooth surface,
periodontal site, or bridge span. Restorative surfaces remain canonical
`BUCCAL | LINGUAL | MESIAL | DISTAL | OCCLUSAL`; anterior display terminology
such as “incisal” belongs to presentation.

## Deliberate limitations

- The catalogue is a supported technical vocabulary, not a fee schedule or a
  clinical eligibility engine.
- Standard clinical/billing codings (SNOMED CT, CDT, ICD-10, local clinic codes)
  are not asserted in this slice. They require licensed/verified terminology
  governance before being attached.
- Prices, insurance, estimates, consent, prescriptions, lab cases, multi-visit
  treatment plans, and amendments are separate upcoming Treatment capabilities.
- Periodontal chart data is represented at the contract/model level, but its
  specialist classification and UI remain a later periodontal slice.
- No Treatment-to-Odontogram mapper exists yet. That integration starts only
  after the Treatment persistence/API vertical slice is operational.

## Reference provenance

Feature vocabulary was reviewed against:

- React Advanced Odontogram repository:
  https://github.com/ZoliQua/React-Odontogram-Modul
- the read-only local snapshot under
  `legacy/react-advanced-odontogram/React-Odontogram-Modul-main/`.

The reference is MIT licensed (Zoltán Dul), but this Treatment model is a new
Clinora design based on observed clinical concepts and behavior. No legacy
source file or asset was copied into this bounded-context slice.
