# Treatment continuation across visits

Status: local frontend continuation implemented; SQL persistence and backend/API
integration remain pending.

## Local implementation

The treatment workspace now keeps separate in-memory collections for visits,
patient-level plan items, and visit-specific treatment sessions. The existing
`TreatmentVisit.acts` shape is retained as a compatibility chart snapshot, not
as the canonical store of plan identities.

- Start or continue an approved plan from the Treatment plans tab or chart.
- Close its session with required notes and choose **Continue later** or
  **Finish treatment**.
- Complete the visit once its sessions, drafts, and handoff review are resolved.
- Use **New visit** to create the next local encounter, then select an existing
  plan to continue it without creating a duplicate plan.
- Use the visit selector and patient treatment timeline to inspect history.
  Finalized visit snapshots and closed sessions remain unchanged by later work.

Plan and session IDs, clinic/patient scope, handoff origin, approval attribution,
versions, and session snapshots are represented explicitly for later relational
persistence. Session changes are applied together with their plan updates in
one local reducer operation. Duplicate open sessions and stale versions are
rejected; replaying the same session command is idempotent.

This local slice supports one non-cancelled session per plan per visit and one
open visit per patient workspace. New visits retain confirmed chart findings
and completed treatment as a clinical baseline, but do not automatically attach
unfinished plans as new sessions. Entry forms reset when switching visits.

Sessions are currently documented and closed by the responsible dentist.
Assistants can create draft plan items through the visit-level handoff; their
plan entries require approval before treatment can start. Assistant entry of
session documentation, plan revision editing, and session cancellation remain
future work.

State lasts only while the workspace is mounted and resets on reload. No
browser storage, SQL tables, backend persistence, or API contract changes are
included in this slice. SQL constraints, authorization, and transactions must
be enforced again in the Treatment service when persistence is implemented.

## Purpose

Allow a treatment act to start in one visit and continue in later visits while
preserving its identity, approval, and history. Each visit must record its own
work and be able to close independently of future treatment.

This document refines the continuation proposal in
[Treatment handoff and longitudinal treatment plans](./treatment-handoff-and-longitudinal-plans.md).
For the initial implementation, it uses `IN_PROGRESS` between visits instead of
introducing `PARTIALLY_COMPLETED`. It calls the visit-specific execution record
`TreatmentSession`; this corresponds to `TreatmentPlanExecution` in the earlier
proposal. These are alternative names for the same concept, not separate models.

## Original limitation addressed by the local implementation

Before this slice, `TreatmentVisit.acts` contained the visit's treatment acts. An act had
its own status, but there was no durable patient-level plan item linking work
across visits. Copying an act into another visit would create a separate record
without a reliable continuation relationship.

The original visit-completion rule also blocked acts with status `IN_PROGRESS`.
The local flow now permits an active overall plan when its current visit session
is closed. The backend rule still needs the equivalent change when sessions are
implemented there.

## Model and ownership

All models belong to the existing Treatment bounded context and Treatment
service. Its entities, migrations, repositories, and business rules remain
service-local. No additional microservice or shared business library is needed.

| Record | Responsibility |
| --- | --- |
| `TreatmentPlanItem` | A durable intended treatment for a patient |
| `TreatmentVisit` | One encounter, including its documentation and handoff |
| `TreatmentSession` | Work on one plan item during one visit |

Relationships:

- A patient can have many plan items.
- A plan item can have many sessions across visits.
- A visit can contain sessions for several plan items.
- Each session references exactly one plan item and one visit.
- A handoff belongs to the visit and may cover several plans or sessions.

A plan item is one intended act, such as a crown on a particular tooth. A larger
grouped treatment plan is outside this first implementation.

### TreatmentPlanItem

Store:

- Stable ID, clinic ID, and patient ID.
- Originating visit ID and optional originating handoff ID.
- Catalogue act code, target teeth/surfaces, clinical details, and plan notes.
- Overall treatment status.
- Entry author, approving dentist, and approval timestamp.
- Creation/update timestamps and a concurrency version.

The origin identifies where the plan was created. Continuing treatment in a new
visit does not replace that origin or create another plan item.

### TreatmentSession

Store:

- Stable ID, plan item ID, and visit ID.
- Session status and closure outcome.
- Work performed, progress notes, and remaining-work notes.
- Treating clinician and documentation author as separate identities.
- Start, closure, entry, and update timestamps.
- Review attribution when documentation is entered by an assistant.
- A concurrency version.

Keep documentation review separate from clinical progress. A closed session
can still require dentist review before its visit is finalized.

## Status rules

### Removal before Start

For doctor-created acts, adding from the catalogue creates a `PLANNED` item;
there is no additional confirmation step. **Start** creates its first session
and changes the overall plan to `IN_PROGRESS`.

- A responsible dentist can **Remove** their own never-started plan from its
  originating visit while that visit remains editable, without a reason prompt.
- Removal sets `removedAt` and `removedByUserId`, increments the plan version,
  and records `ACT_REMOVED` in the visit audit. It does not create a cancelled
  treatment. Removed items are excluded from active lists, chart snapshots,
  and the treatment timeline.
- Any session, including a closed or cancelled session from an earlier visit,
  prevents free removal. Records referenced by finalized visits are protected.
- Started plans can be cancelled or marked entered in error only with a reason.
  An explicit cancellation/correction also closes any active session in the
  current visit as `CANCELLED`, retaining its snapshot and recording the reason.
  Previously closed sessions remain unchanged. An active session in another
  visit must be resolved in its owning visit.
- Finalized visits remain read-only. Assistant draft approval and handoff
  review requirements are unchanged.

SQL persistence must enforce these checks again and exclude soft-removed items
from ordinary plan queries.

### Overall plan item

```text
DRAFT -> PLANNED -> IN_PROGRESS -> COMPLETED
```

Also support `CANCELLED` and `ENTERED_IN_ERROR` with reasons and audit history.

- Assistant-created items start as `DRAFT`.
- Responsible-dentist approval makes a draft `PLANNED`.
- A dentist-created plan can start as `PLANNED`.
- Starting the first treatment session makes the plan `IN_PROGRESS`.
- The plan remains `IN_PROGRESS` between sessions when work remains.
- Only an authorized dentist can confirm overall treatment completion.
- Plan approval does not represent patient consent or treatment performance.

### Visit-specific session

Use `IN_PROGRESS`, `COMPLETED`, and `CANCELLED` initially. Record a closure
outcome such as `CONTINUE_LATER` or `TREATMENT_FINISHED` for completed sessions.

Session completion means today's session is closed and documented. It does not
by itself mean the entire treatment act is complete.

| Doctor action | Session result | Plan result |
| --- | --- | --- |
| Finish session — continue later | `COMPLETED`, outcome `CONTINUE_LATER` | Remains `IN_PROGRESS` |
| Finish treatment act | `COMPLETED`, outcome `TREATMENT_FINISHED` | Becomes `COMPLETED` |

Session closure and its plan-status update must be one consistent operation.
Cancelling a session must not automatically cancel the overall plan.

## Example

```text
Plan P-100: Crown on tooth 26

Visit V-1 -> Session S-1 -> Closed; further treatment required
Visit V-2 -> Session S-2 -> Closed; further treatment required
Visit V-3 -> Session S-3 -> Closed; overall treatment finished
```

All sessions reference `P-100`. Visits V-1 and V-2 can be completed after their
documentation is reviewed, while P-100 remains `IN_PROGRESS`.

## Workspace workflow

1. Show the patient's approved `PLANNED` and `IN_PROGRESS` items in an
   **Existing treatment plans** section.
2. Let the doctor select **Start in this visit** or **Continue in this visit**.
3. Create a session linked to the existing plan and current visit.
4. Record today's work and relevant details in that session.
5. Let the doctor finish the session for later continuation or finish the
   overall treatment act.
6. Expose a timeline of the plan's sessions and originating visits.

Do not automatically attach every unfinished plan to every new visit. Selecting
a plan for treatment must be intentional. Continuing it must not duplicate the
catalogue act or silently create an appointment, charge, or invoice.

## Visit completion and handoff

The visit's status represents encounter documentation and finalization, not
the completion of every treatment intended for the patient.

Before completing a visit, require:

- No unresolved draft clinical entries associated with that visit.
- No open treatment sessions in that visit.
- Its handoff and required documentation reviews are resolved.
- Finalization by an authorized dentist.

An overall plan item remaining `PLANNED` or `IN_PROGRESS` must not block visit
completion when the current visit's work and documentation are resolved.

The handoff continues to cover the whole visit. Its instructions can request
new plan entries or documentation against existing plans. New assistant-created
plans remain drafts; continuation of an existing approved plan retains its
identity and approval. Assistant-entered session documentation requires dentist
review and must identify the clinician who performed the work.

Keep the original plan's `originHandoffId` unchanged. Later session documentation
can reference the later visit's handoff separately.

The proposed `AWAITING_DOCUMENTATION` visit state is a related workflow change;
it is not currently available and must be introduced consistently across the
backend, contracts, and frontend.

## Integrity and historical records

- Validate that the plan and visit belong to the same authorized clinic and
  patient. Clinic IDs supplied by the browser are not authorization.
- Allow execution only for approved, eligible plans. Do not continue cancelled,
  completed, or entered-in-error items through the ordinary continuation action.
- Permit at most one open session per plan item initially. Another session can
  start after the prior one closes, even if documentation review is pending.
- Use concurrency checks and idempotent creation to prevent duplicate sessions
  from retries or simultaneous actions.
- Preserve original visit records after finalization. Store the plan revision
  or relevant detail snapshot used by each session so later changes cannot
  rewrite historical visits.
- Record amendments and corrections with attribution, dates, and reasons.
  Do not hard-delete reviewed clinical history.
- Treat material changes to an approved plan as an auditable revision requiring
  appropriate clinical approval.
- Keep historical odontogram projections tied to recorded clinical work and
  applicable plan revisions. Later completion must not make treatment appear
  performed during an earlier visit.

## Incremental implementation

Implement and verify one slice at a time:

1. Add the service-local plan-item and session domain models and lifecycle
   rules. Verify continuation, approval, and visit-completion invariants.
2. Add Treatment-service persistence, migrations, and repositories. Define an
   explicit mapping from existing acts without inventing missing clinical dates
   or progress history. Preserve original IDs or a traceable ID mapping.
3. Extend Treatment contracts and expose commands/queries through the API
   Gateway and BFF. Keep old visit rendering compatible during migration.
4. Adapt the frontend treatment feature to display patient-level plans and
   visit-specific sessions, then add start/continue and session-closure actions.
5. Connect handoff review to new plans and session documentation, and provide
   the plan timeline across visits.

Only change visit-completion checks once the session model can reliably
distinguish today's open work from overall treatment progress.

## Verification scenarios

- A plan starts in Visit A and continues in Visit B with the same plan ID.
- Visit A can finalize after its session closes while the plan remains active.
- Several plans can have sessions in the same visit independently.
- Assistant-created drafts cannot start treatment before approval.
- Finishing a session for later continuation does not finish the overall plan.
- Finishing the treatment closes its session and completes the plan consistently.
- A retry does not create a duplicate session.
- Another patient's or clinic's plan cannot be attached to the visit.
- Later plan changes do not change completed visit history.
- Pending handoff review still prevents final visit completion.
