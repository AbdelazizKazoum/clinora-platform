# Treatment workspace

The public entry point remains `TreatmentWorkspacePage` from `index.ts`.
The App Router route composes this feature without owning its implementation.

| Location                             | Responsibility                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `pages/treatment-workspace-page.tsx` | Compose sections, select the active tab/projection, and connect data to UI.                                |
| `hooks/use-local-treatment-visit.ts` | Initialize local mock data, expose named visit actions, and commit visit changes with feedback.            |
| `hooks/use-treatment-entry-form.ts`  | Keep unsaved entry fields, tooth/surface selection, and input assembly separate from persisted visit data. |
| `components/`                        | Render the header, navigation, odontogram, tooth editor, record tables, and documentation handoff.         |
| `model/`                             | Own domain types, catalogue, validation, workflow transitions, target rules, materials, and projections.   |
| `api/dto/`                           | Own transport response types; `model/treatment.mapper.ts` maps responses to frontend models.               |
| `mock/`                              | Supply local visit, patient, and actor fixtures through the local visit hook.                              |

`TreatmentActsTable` serves both the current-actor session panel and the full
plan tab. It and `ClinicalFindingsTable` reuse `TreatmentRecordsTable` for
sorting, filtering, pagination, and table layout. Column definitions and data
arrays keep stable references between unrelated renders.

The odontogram card and current-session act table are memoized so editing a
clinical note does not render them again. Workflow projections rebuild when
the visit changes; switching projection mode selects an existing projection.
The periodontal workspace remains dynamically loaded.

## Local data and future persistence

Visit data currently lasts for one mounted workspace. It is not saved to
browser storage or an API. Unsaved entry fields and chart selection survive
workspace tab switches.

When Treatment endpoints exist, replace `useLocalTreatmentVisit` at the page's
data boundary with feature query/mutation hooks. Add real endpoint functions
under `api/queries` and `api/commands`, using Clinora's shared BFF API client.
Map responses through the existing DTO mapper and keep server state in
TanStack Query. Components should keep invoking named actions such as
`recordFinding`, `recordAct`, `closeSession`, and `completeVisit` rather than replacing
whole visits.

The current periodontal updater is a local pure function. At API integration,
convert its result into the agreed examination payload (or replace it with
explicit patch inputs if the endpoint is granular); do not serialize the
function. Server-generated IDs, authenticated actors, loading/error states,
and mutation cache updates belong in that integration. Local workflow rules
remain useful for UI feedback, with final validation enforced by the backend.

## Direct documentation assignments

The doctor writes the handoff note and assigns an active assistant or secretariat
user. That user can enter effective findings, acts, and periodontal data, manage
sessions, and complete the assigned visit without doctor approval. Every mutation
checks the current visit assignment; unassigned and closed visits remain protected.

Acts retain `enteredByUserId`; sessions retain their recorder and `closedByUserId`.
The responsible doctor remains `performedByUserId` for the documented clinical work.
Visits and handoffs retain `completedByUserId`. Former approval/status fields remain
for read compatibility, and new staff entries do not require those fields.
