# Treatment handoff and longitudinal treatment plans

Status: original design requirements. Local frontend handoff and continuation
are implemented; backend persistence and API integration remain pending. See
[Treatment continuation across visits](./treatment-continuation-across-visits.md)
for the refined status model and current implementation scope.

## Purpose

This document defines the treatment workflow where:

- the responsible dentist may create structured treatment plans directly;
- the dentist may instead write visit-level instructions and assign them to a
  dental assistant;
- the assistant selects acts from the Treatment catalogue and assigns targets
  such as teeth and surfaces;
- assistant-created acts remain drafts until the responsible dentist approves
  them; and
- a treatment plan may start in one visit and continue across multiple later
  visits.

The handoff is for the full visit. It is not a one-act assignment.

## Original implementation assessment (before local continuation)

The current Treatment foundation supports the first part of this workflow:

- `TreatmentVisit` owns `acts` and `documentationHandoff`.
- A dentist-created act is immediately `PLANNED` and has
  `approvedByDentistId`.
- An assistant-created act is `DRAFT` and can later be approved by the
  responsible dentist.
- The handoff lifecycle is `ASSIGNED -> IN_PROGRESS -> SUBMITTED -> ACCEPTED`,
  with `RETURNED` for corrections.
- A draft act can currently transition to `PLANNED`, `CANCELLED`, or
  `ENTERED_IN_ERROR` in the local domain rules.

The current implementation does **not** fully support continuation across
visits:

- `TreatmentAct` is stored inside one `TreatmentVisit`.
- `RecordTreatmentActRequest` requires a `visit_id` and does not carry a
  longitudinal plan-item identifier.
- `IN_PROGRESS` describes an act inside the current visit; it does not link
  that work to a later visit.
- There is no treatment-plan or treatment-execution entity that connects the
  same clinical plan across multiple visits.

Therefore, the existing `IN_PROGRESS` status must not be treated as sufficient
for multi-visit treatment. A plan could currently be recreated in a later
visit, but the system would not know that it is a continuation of the original
plan.

## Domain boundaries

The model should separate three related concepts.

### 1. Treatment handoff: visit-level coordination

The handoff belongs to the full `TreatmentVisit` and contains the dentist's
instructions for the assistant. It does not contain the treatment catalogue
selection for every plan.

Responsibilities:

- identify the assigning dentist and assigned assistant;
- store the dentist's free-text instruction;
- track the handoff lifecycle and revision history;
- define that the scope is the full visit;
- lock assistant editing after submission; and
- record dentist review and return notes.

Suggested shape:

```ts
interface TreatmentHandoff {
  id: string;
  visitId: string;
  scope: 'FULL_VISIT';
  instruction: string;
  assignedByDentistId: string;
  assignedToAssistantId: string;
  status:
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'RETURNED'
    | 'ACCEPTED'
    | 'CANCELLED';
  revision: number;
  reviewNote: string | null;
  assignedAt: Date;
  submittedAt: Date | null;
  reviewedAt: Date | null;
}
```

The current `DocumentationHandoff` can be evolved into this concept. The
product language should prefer `TreatmentHandoff` or `Assistant handoff` over
`DocumentationHandoff`, because the assistant is creating structured plans,
not merely typing a note.

### 2. Longitudinal treatment plan item: patient-level clinical intent

A treatment plan item represents the plan that can survive beyond the visit
where it was created.

It owns the catalogue act, clinical target, details, plan status, and approval.
It should belong to the patient and clinic, with an optional originating visit.

Suggested shape:

```ts
interface TreatmentPlanItem {
  id: string;
  clinicId: string;
  patientId: string;
  originVisitId: string | null;
  originHandoffId: string | null;
  code: TreatmentActCode;
  target: ClinicalTarget;
  details: readonly ClinicalDetail[];
  note: string | null;
  source: 'DOCTOR_DIRECT' | 'ASSISTANT_HANDOFF';
  status:
    | 'DRAFT'
    | 'PLANNED'
    | 'IN_PROGRESS'
    | 'PARTIALLY_COMPLETED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'ENTERED_IN_ERROR';
  enteredByUserId: string;
  approvedByDentistId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

The plan item is the durable source of truth for what is intended for the
patient. Assistant-created items begin as `DRAFT`. Dentist-created items may
begin as `PLANNED` because the responsible dentist has already approved them.

### 3. Visit-specific treatment execution: work performed in one visit

When a plan starts or continues during a visit, create a visit execution
record. This is what allows one plan to span multiple visits without copying
or overwriting the original plan.

Suggested shape:

```ts
interface TreatmentPlanExecution {
  id: string;
  planItemId: string;
  visitId: string;
  status: 'STARTED' | 'PARTIALLY_COMPLETED' | 'COMPLETED' | 'CANCELLED';
  performedByUserId: string | null;
  note: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Example:

```text
Plan item: Root canal treatment on tooth 16

Visit 1: access and medication       COMPLETED
Visit 2: canal preparation            COMPLETED
Visit 3: obturation                    COMPLETED
```

The plan item remains the same across all three visits. Each visit records its
own execution and clinical notes.

## Creation workflows

### Dentist creates plans directly

The dentist uses the catalogue in the Treatment plans workspace, selects the
act and target, and saves the plan.

```text
Doctor selects catalogue act and target
    -> TreatmentPlanItem: PLANNED
    -> originVisitId: current visit
    -> source: DOCTOR_DIRECT
    -> approvedByDentistId: current dentist
```

No assistant handoff is required.

### Dentist delegates plan creation

The dentist opens the Assistant handoff workspace and writes instructions for
the full visit. The dentist does not need to preselect catalogue acts.

```text
Doctor writes visit instructions
    -> TreatmentHandoff: ASSIGNED
    -> assistant opens the visit
    -> assistant creates TreatmentPlanItem records
    -> each item starts as DRAFT
    -> items reference originHandoffId
    -> assistant submits the handoff
    -> dentist approves or returns the draft items
```

The assistant uses the same catalogue and target-selection components as the
dentist. The difference is the resulting status and approval requirement, not a
second catalogue implementation.

### Mixed creation in one visit

A visit may contain both paths:

- the dentist directly creates some plans; and
- the assistant creates additional draft plans from the handoff.

The system must not make these mutually exclusive. The handoff is still
visit-level, while each plan item records its source.

## Handoff review rules

The handoff is submitted for the visit after the assistant has finished
creating the requested plans. The dentist reviews the draft plan items, not
just the free-text handoff.

The dentist can:

- approve an individual draft item;
- approve all valid draft items;
- return the entire handoff with a correction note;
- mark an incorrect draft as entered in error; or
- cancel the handoff when no further assistant work is required.

The handoff can become `ACCEPTED` only when its draft items have been resolved:

- approved as `PLANNED`; or
- explicitly cancelled/entered in error with an auditable reason.

If all draft items are deleted before submission, the handoff remains active
and shows an empty state. The assistant can add new items or the dentist can
cancel the handoff.

## Draft deletion and clinical record retention

An unsaved draft can be discarded freely.

A persisted assistant-created `DRAFT` item may be removed before handoff
submission by the assistant who created it, the responsible dentist, or an
authorized administrator. The preferred implementation is a soft removal with
audit attribution rather than physical deletion.

After submission, the assistant must not delete draft items. The dentist
returns the handoff for correction or marks the item as entered in error.

Doctor-created `PLANNED` items can be removed without a reason while their
originating visit is editable and no session or finalized visit references
them. Use soft removal with audit attribution, excluding them from the active
chart, list, and timeline. **Start** is the boundary after which any removal
requires cancellation or an entered-in-error correction with a reason.

`IN_PROGRESS`, `PARTIALLY_COMPLETED`, `COMPLETED`, and finalized visit records
must not be hard-deleted. Preserve all prior sessions and corrections.

## Multi-visit lifecycle

The lifecycle should distinguish plan status from execution status.

```text
TreatmentPlanItem:
  DRAFT -> PLANNED -> IN_PROGRESS -> PARTIALLY_COMPLETED -> COMPLETED
                  |                  |
                  +------------------+-> CANCELLED
                  +--------------------> ENTERED_IN_ERROR

TreatmentPlanExecution:
  STARTED -> PARTIALLY_COMPLETED -> COMPLETED
     |
     +----------------------------> CANCELLED
```

Rules:

- A planned item can be started in any eligible visit.
- A later visit can create another execution for the same plan item only when
  the previous execution is complete or explicitly closed according to the
  clinical workflow.
- A plan item is `PARTIALLY_COMPLETED` when work remains after a visit.
- The plan item becomes `COMPLETED` only when the complete clinical intent is
  fulfilled.
- Visit completion must not require every plan item in the patient's overall
  treatment plan to be completed. It only needs the current visit's required
  work and review state to be resolved.
- A completed visit remains immutable; later work is recorded in a new visit
  and linked to the same plan item.

## UI requirements

### Assistant handoff tab

The visit workspace should show:

1. Doctor instructions and handoff status.
2. Existing plans already present for the visit.
3. Draft plans created by the assistant.
4. The catalogue-based `Add treatment plan` flow.
5. Per-item draft removal before submission.
6. Submission and return/review feedback.
7. A link to prior and upcoming executions when a plan is multi-visit.

### Treatment plans tab

The plan table should support:

- all plans for the current visit;
- plans created directly by the dentist;
- assistant-created drafts;
- plans awaiting approval;
- active plans continuing from previous visits; and
- completed, cancelled, or entered-in-error history.

Each plan row should display its origin and continuation state, for example:

```text
Root canal · Tooth 16
Active · Started in Visit V-1001 · 2 of 3 executions completed
```

### Visit history

The patient treatment history should expose longitudinal plans separately from
individual visits. Selecting a plan should show its execution timeline:

```text
Visit V-1001 · 2026-10-22 · Access completed
Visit V-1014 · 2026-11-05 · Medication completed
Visit V-1030 · Scheduled · Obturation pending
```

## Backend and contract changes

The current Treatment contract is visit-centric. The next backend slice should
introduce explicit plan and execution operations rather than overloading
`RecordTreatmentAct` for both concepts.

Potential operations:

- `CreateTreatmentPlanItem`
- `UpdateDraftTreatmentPlanItem`
- `RemoveDraftTreatmentPlanItem`
- `ApproveTreatmentPlanItem`
- `EnterTreatmentPlanItemInError`
- `StartTreatmentPlanExecution`
- `UpdateTreatmentPlanExecution`
- `CompleteTreatmentPlanExecution`
- `ListPatientTreatmentPlanItems`
- `GetTreatmentPlanItemTimeline`

Existing visit commands can remain responsible for creating and reviewing the
visit-level handoff:

- assign handoff;
- start handoff;
- submit handoff;
- return or accept handoff.

Plan-item commands should carry clinic scope, authenticated actor, optimistic
concurrency version, and idempotency where retries could duplicate clinical
records.

## Migration direction from the current model

Do not immediately remove `TreatmentVisit.acts`. A safe migration is:

1. Add a longitudinal `planItemId` or equivalent linkage to the existing
   treatment-act representation.
2. Add `originVisitId`, `originHandoffId`, and source attribution.
3. Keep existing visit rendering working while plans are backfilled.
4. Introduce visit execution records for plans that are started again in a
   later visit.
5. Move multi-visit queries and UI to the longitudinal plan model.
6. Deprecate direct interpretation of `TreatmentVisit.acts` as the complete
   patient treatment history.

Until this migration exists, the frontend must not claim that an `IN_PROGRESS`
act can safely continue in another visit. It can only display progress inside
the current visit.

## Relevant current files

- `apps/frontend/src/features/treatment/model/treatment.ts`
- `apps/frontend/src/features/treatment/model/treatment-workspace.ts`
- `apps/frontend/src/features/treatment/components/documentation-handoff-panel.tsx`
- `apps/frontend/src/features/treatment/components/treatment-acts-table.tsx`
- `libs/contracts/treatment/src/lib/treatment.proto`
- `docs/implementation/treatment/TREATMENT_FOUNDATION.md`
- `docs/implementation/treatment/TREATMENT_BACKEND_REQUIREMENTS_PLAN.md`

