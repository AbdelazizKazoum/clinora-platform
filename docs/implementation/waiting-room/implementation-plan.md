# Waiting Room Implementation Plan

Status: Complete
Created: 2026-08-04

## Goal

Build Clinora's waiting room as a professional, realtime patient-flow board for
clinic reception, dental assistants, doctors, and administrators.

The finished workflow should let authorized clinic staff:

- See checked-in patients live as they arrive.
- Move patients through `ARRIVED`, `WAITING`, `IN_CHAIR`, and `DONE`.
- Move patient cards through a Kanban-style workflow board.
- Persist manual queue ordering across users and devices.
- Keep automatic ordering by priority and check-in time when manual ordering is
  not applied.
- Assign an active, available chair before a patient enters `IN_CHAIR`.
- Launch the treatment workspace from seated patients.
- Update queue notes and correct status mistakes with a reason.
- Receive live queue updates from other clinic users without refreshing.

Implement the work incrementally. Complete and verify one task before starting
the next task.

## Implementation Status

- [x] Task 1: Finalize waiting room backend contract and API shape
- [x] Task 2: Add chair/operatory domain and persistence in appointment service
- [x] Task 3: Extend queue entries with chair and manual ordering fields
- [x] Task 4: Add waiting room use cases inside appointment service
- [x] Task 5: Update appointment gRPC contract and service presentation
- [x] Task 6: Expose waiting room routes through the API Gateway
- [x] Task 7: Update queue outbox events and Gateway SSE streaming
- [x] Task 8: Create frontend waiting-room feature data boundary
- [x] Task 9: Add waiting room queries, commands, hooks, and stream handling
- [x] Task 10: Build Ubold-style realtime board shell
- [x] Task 11: Add Kanban-style status movement and manual reordering
- [x] Task 12: Add chair assignment and chair management UI
- [x] Task 13: Add patient details panel, notes, correction, and treatment launch
- [x] Task 14: Add role-aware UX, responsive polish, and loading/error states
- [x] Task 15: Add focused tests and final integration verification
- [x] Task 16: Update API documentation and completion notes

## Architectural Direction

The waiting room becomes a separate product feature in the frontend and API
Gateway, but it does not become a separate backend microservice yet.

Backend ownership:

```txt
apps/backend/services/appointment-service/src/appointment
```

The appointment service continues to own queue persistence, chair assignment,
queue ordering, queue status transitions, and queue events. This avoids a new
microservice boundary while the waiting room remains tightly coupled to
appointments and check-in.

Frontend ownership:

```txt
apps/frontend/src/features/waiting-room
```

The waiting room gets its own frontend feature because it is a large operational
workflow with its own board UI, realtime stream handling, chair assignment,
manual ordering, local interaction state, and treatment-launch behavior.

API Gateway ownership:

```txt
apps/backend/api-gateway/src/modules/waiting-room
```

The Gateway exposes waiting-room-oriented HTTP routes, validates roles and
clinic scope, maps DTOs, and calls the appointment-service gRPC client through a
facade. It must not own waiting-room business rules.

The existing appointment and queue API can remain for compatibility while the
new waiting room feature gets a clearer API surface.

## Boundary Decisions

Appointments own:

- Appointment booking.
- Scheduling.
- Doctor conflict checks.
- Cancellation and no-show appointment status.
- Check-in source data.

Waiting room owns:

- Queue board state.
- Queue status movement.
- Queue priority.
- Manual queue ordering.
- Chair assignment.
- Queue notes.
- Realtime queue events.
- Treatment launch context handoff.

Treatment owns:

- Clinical visit/workspace.
- Dental acts.
- Treatment plans.
- Clinical notes.
- Procedure completion.

The waiting room may launch treatment, but it must not contain treatment
workspace implementation details.

## Sources To Use

### Current Clinora Sources

- Appointment API contract:
  `docs/api/appointment-service.md`
- Frontend architecture:
  `docs/architecture/frontend.md`
- Backend architecture:
  `docs/architecture/backend.md`
- Existing schedule route pattern:
  `apps/frontend/src/app/(admin)/schedule/page.tsx`
- Existing waiting room route stub:
  `apps/frontend/src/app/(admin)/waiting-room/page.tsx`
- Existing appointment frontend feature:
  `apps/frontend/src/features/appointments`
- Existing appointment service:
  `apps/backend/services/appointment-service/src/appointment`
- Existing Gateway appointment module:
  `apps/backend/api-gateway/src/modules/appointments`
- Appointment contract package:
  `libs/contracts/appointment`

### Legacy DentiFlow References

Use legacy DentiFlow as workflow reference only:

```txt
legacy/dentiflow/frontend/old-dentiflow/src/presentation/admin/queue
legacy/dentiflow/frontend/old-dentiflow/src/domain/queue
legacy/dentiflow/frontend/old-dentiflow/src/application/queue
legacy/dentiflow/frontend/old-dentiflow/src/presentation/stores/queueStore.ts
legacy/dentiflow/frontend/old-dentiflow/src/presentation/admin/treatment/components/TreatmentWorkspace.tsx
```

Extract behavior such as status correction, live queue updates, notes, summary
cards, and start-treatment handoff. Do not copy legacy architecture, stores,
MUI/Tailwind components, route structure, or API URLs.

### Ubold UI References

Use Ubold as a visual and interaction reference only:

```txt
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/crm/pipeline/components/PipelinePage.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/plugins/sortable/components
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/plugins/sortable/components/SortableWithIconAndLabels.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/plugins/sortable/components/NestedListWithHandle.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/widgets/components/StatisticCard4.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/ecommerce/(orders)/order-details/components/ShippingActivity.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/users/contacts/page.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/components/wrappers/SimpleBar.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/assets/scss/pages/_kanban-board.scss
legacy/dentiflow/frontend/ubold-full-template-source-here/src/assets/scss/components/_card.scss
legacy/dentiflow/frontend/ubold-full-template-source-here/src/assets/scss/components/_badge.scss
```

Adapt:

- Kanban/pipeline board density and horizontal columns.
- Ubold's existing Kanban movement pattern from the CRM pipeline board.
- Ubold's existing sortable list patterns for handles, ghost state, animation,
  and sortable visual feedback.
- Ubold statistic card language for operational metrics.
- Dropdown action menus on queue cards.
- Bootstrap badges for status, priority, and chair state.
- Offcanvas or modal patterns for patient details, notes, correction reason,
  and chair assignment.
- Timeline styling for selected queue entry history.
- `SimpleBar` for scrollable columns.
- Existing `Icon` wrapper and react-bootstrap components.

Do not copy:

- Ubold demo data.
- CRM sales wording.
- Template route structure.
- Generic task/deal business logic.
- Kanban movement behavior that conflicts with backend queue rules.

## Business Workflow

The core queue flow is:

```txt
ARRIVED -> WAITING -> IN_CHAIR -> DONE
```

Status meanings:

- `ARRIVED`: patient checked in at reception.
- `WAITING`: patient is ready to be called.
- `IN_CHAIR`: patient is seated in a chair/operatory.
- `DONE`: waiting-room flow is complete for this visit.

Default allowed forward moves:

- `ARRIVED -> WAITING`
- `WAITING -> IN_CHAIR`
- `IN_CHAIR -> DONE`
- `ARRIVED -> IN_CHAIR` when the user assigns a chair, especially for urgent
  or emergency care.

Backward moves require `correctionReason`:

- `WAITING -> ARRIVED`
- `IN_CHAIR -> WAITING`
- `DONE -> IN_CHAIR`
- `DONE -> WAITING`
- `DONE -> ARRIVED`

The backend must enforce the correction rule. The frontend only improves the
experience by opening the correction dialog before submission.

## Queue Ordering

The waiting room supports two ordering modes.

Automatic order:

```txt
status flow
priority: EMERGENCY -> URGENT -> NORMAL
arrivedAt ascending
createdAt ascending fallback
```

Manual order:

```txt
status flow
manualOrder ascending
priority and arrivedAt fallback
```

Manual ordering must be backend-backed so every live client sees the same order.
Moving a card inside a column persists a new manual order for that column.
Moving a card between columns persists both the status change and the updated
ordering for the target column.

The UI must expose clear secretary controls:

```txt
[Auto Reorder] [Manual Order]
```

`Auto Reorder` asks the backend to clear or recalculate manual order for the
current waiting-room view and return the queue using the logical order:

```txt
EMERGENCY first
URGENT second
NORMAL last
inside each priority: earliest check-in first
```

`Manual Order` enables moving patient cards inside the same status column and
between status columns. Those movements must persist through backend reorder and
status commands so another user sees the same board order.

Recommended behavior:

- New checked-in patients enter `ARRIVED` using automatic priority/time order
  unless a manual order already exists for that status.
- When manual mode is active, the backend assigns or recalculates
  `manualOrder` values for affected entries.
- When the secretary clicks `Auto Reorder`, manual positioning is removed for
  the affected status columns and the board returns to priority/time ordering.
- Moving patients inside `ARRIVED`, `WAITING`, `IN_CHAIR`, or `DONE` is allowed
  in manual mode and persists the order of that status column.
- If two users reorder at the same time, the backend remains authoritative and
  the frontend reconciles with the next list response or SSE event.
- The first version should avoid complex collaborative editing locks unless a
  real conflict appears in testing.

## Chair Assignment

Create a proper chair/operatory model inside the appointment service.

Recommended chair fields:

```txt
id
clinicId
name
code
isActive
createdAt
updatedAt
```

Recommended queue entry additions:

```txt
chairId
chairName
manualOrder
```

Rules:

- A patient cannot move into `IN_CHAIR` without an active chair.
- A chair is occupied when another queue entry in the same clinic has
  `status = IN_CHAIR` and the same `chairId`.
- The backend must reject assigning an occupied chair.
- `chairName` is stored as a snapshot on the queue entry so historical cards
  remain readable if the chair is renamed later.
- Deactivated chairs cannot be assigned to new `IN_CHAIR` moves.
- A chair can be changed for an `IN_CHAIR` entry only if the target chair is
  active and available.

Chair setup can start simple:

- List chairs.
- Create chair.
- Update chair name/code/isActive.
- Filter available chairs for the chair assignment modal.

## API Shape

Task 1 inspection found the current backend surface is queue-oriented:

- `libs/contracts/appointment/src/lib/appointment.proto` exposes appointment
  methods plus `ListQueueEntries`, `GetQueueEntry`, `CheckInPatient`,
  `UpdateQueueStatus`, and `UpdateQueueNotes`.
- `libs/contracts/appointment/src/lib/appointment.contract.ts` mirrors those
  methods as gRPC-compatible TypeScript interfaces.
- `apps/backend/services/appointment-service/src/appointment/presentation/grpc`
  serves the queue methods through `AppointmentGrpcController`.
- `apps/backend/api-gateway/src/modules/appointments/queue.controller.ts`
  exposes the compatibility HTTP queue API at
  `/api/v1/clinics/{clinicId}/queue`.
- Queue persistence currently has no chair assignment or manual ordering
  fields, and Gateway SSE currently subscribes only to
  `queue.checked_in`, `queue.status.updated`, and `queue.notes.updated`.

Final decision:

- Keep the existing `/queue` HTTP routes and queue gRPC methods for appointment
  check-in compatibility.
- Add waiting-room-specific gRPC methods to the appointment contract rather
  than overloading the existing queue methods with chair and ordering behavior.
- Extend `QueueEntryReply` additively with `chairId`, `chairName`, and
  `manualOrder` when Task 5 updates the executable proto and contract.
- Reuse the existing `UpdateQueueNotes` gRPC method for the waiting-room notes
  route because its command semantics are already correct.
- Implement a new API Gateway module at
  `apps/backend/api-gateway/src/modules/waiting-room` in Task 6. It will expose
  waiting-room-oriented HTTP routes and call the appointment-service gRPC client
  through a waiting-room facade.
- Keep waiting-room business rules in appointment-service use cases. The
  Gateway validates transport DTOs, roles, and clinic scope only.

Final waiting-room HTTP API exposed through the same-origin BFF:

```txt
GET   /api/bff/clinics/{clinicId}/waiting-room
PATCH /api/bff/clinics/{clinicId}/waiting-room/entries/{entryId}/status
PATCH /api/bff/clinics/{clinicId}/waiting-room/entries/{entryId}/notes
PATCH /api/bff/clinics/{clinicId}/waiting-room/entries/{entryId}/chair
PATCH /api/bff/clinics/{clinicId}/waiting-room/reorder

GET   /api/bff/clinics/{clinicId}/waiting-room/chairs
POST  /api/bff/clinics/{clinicId}/waiting-room/chairs
PATCH /api/bff/clinics/{clinicId}/waiting-room/chairs/{chairId}
```

Direct Gateway routes use the same paths under `/api/v1` instead of
`/api/bff`.

The existing compatibility API remains:

```txt
GET   /api/bff/clinics/{clinicId}/queue
POST  /api/bff/clinics/{clinicId}/queue
GET   /api/bff/clinics/{clinicId}/queue/{queueEntryId}
PATCH /api/bff/clinics/{clinicId}/queue/{queueEntryId}/status
PATCH /api/bff/clinics/{clinicId}/queue/{queueEntryId}/notes
```

Compatibility rules:

- `POST /queue` remains the appointment check-in command and continues to
  create `ARRIVED` queue entries.
- Waiting-room state reads include entries created by `/queue` check-in.
- Existing queue responses may gain additive `chairId`, `chairName`, and
  `manualOrder` fields after Task 5. Existing consumers can ignore them.
- After chair enforcement lands, moving to `IN_CHAIR` through the old
  `/queue/{queueEntryId}/status` route without a chair is allowed to fail with
  `400`. New waiting-room clients must use the `/waiting-room` status route and
  send `chairId` when seating a patient.
- Queue notes remain compatible: the waiting-room notes route delegates to the
  same backend command semantics as `/queue/{queueEntryId}/notes`.

Final response DTO shapes:

```ts
interface WaitingRoomEntryDto {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  appointmentType: string;
  status: QueueStatus;
  priority: QueuePriority;
  queueNotes: string;
  chairId: string;
  chairName: string;
  manualOrder?: number;
  arrivedAt: string;
  calledAt: string;
  seatedAt: string;
  completedAt: string;
  updatedAt: string;
}

interface WaitingRoomChairDto {
  id: string;
  clinicId: string;
  name: string;
  code: string;
  isActive: boolean;
  isAvailable: boolean;
  occupiedByEntryId: string;
  createdAt: string;
  updatedAt: string;
}

interface WaitingRoomOrderingDto {
  mode: 'AUTO' | 'MANUAL';
  manualStatuses: QueueStatus[];
}

interface WaitingRoomStateResponse {
  entries: WaitingRoomEntryDto[];
  chairs: WaitingRoomChairDto[];
  ordering: WaitingRoomOrderingDto;
  generatedAt: string;
}

interface WaitingRoomChairsListResponse {
  chairs: WaitingRoomChairDto[];
}
```

Response notes:

- Optional string response values continue the existing appointment contract
  convention: use `""` for absent scalar strings.
- `manualOrder` is omitted when an entry is using automatic order.
- `isAvailable` and `occupiedByEntryId` are computed for the current waiting
  room state. Deactivated chairs return `isAvailable: false`.
- `ordering.mode` is `MANUAL` when at least one visible status column has
  persisted manual order; otherwise it is `AUTO`.

Final request DTO shapes:

```ts
interface UpdateWaitingRoomStatusBody {
  status: 'ARRIVED' | 'WAITING' | 'IN_CHAIR' | 'DONE';
  chairId?: string;
  correctionReason?: string;
  targetOrderedEntryIds?: string[];
}

interface ReorderWaitingRoomBody {
  mode: 'AUTO' | 'MANUAL';
  status?: 'ARRIVED' | 'WAITING' | 'IN_CHAIR' | 'DONE';
  orderedEntryIds?: string[];
}

interface AssignWaitingRoomChairBody {
  chairId: string;
}

interface CreateWaitingRoomChairBody {
  name: string;
  code?: string;
  isActive?: boolean;
}

interface UpdateWaitingRoomChairBody {
  name?: string;
  code?: string;
  isActive?: boolean;
}
```

Command rules:

- `UpdateWaitingRoomStatusBody.chairId` is required when `status` is
  `IN_CHAIR` and the entry does not already have a valid chair assignment.
- `correctionReason` is required for backward moves in the status flow.
- `targetOrderedEntryIds` lets one drag/drop move persist both the status change
  and the manual ordering of the destination column in one backend command.
- `ReorderWaitingRoomBody.mode = 'MANUAL'` requires `status` and
  `orderedEntryIds`. The ordered IDs must belong to the requested clinic and
  status after the move.
- `ReorderWaitingRoomBody.mode = 'AUTO'` clears persisted manual order for the
  supplied `status`; when `status` is omitted, it clears all waiting-room status
  columns for the clinic.
- Chair `code` is optional display metadata. If omitted, the backend stores an
  empty string and uses `name` as the human-readable identifier.

Final appointment gRPC contract target for Task 5:

```proto
service AppointmentService {
  rpc GetWaitingRoomState (GetWaitingRoomStateRequest)
      returns (WaitingRoomStateReply);
  rpc UpdateWaitingRoomStatus (UpdateWaitingRoomStatusRequest)
      returns (QueueEntryReply);
  rpc AssignWaitingRoomChair (AssignWaitingRoomChairRequest)
      returns (QueueEntryReply);
  rpc ReorderWaitingRoomEntries (ReorderWaitingRoomEntriesRequest)
      returns (QueueEntriesListReply);
  rpc ListWaitingRoomChairs (ListWaitingRoomChairsRequest)
      returns (WaitingRoomChairsListReply);
  rpc CreateWaitingRoomChair (CreateWaitingRoomChairRequest)
      returns (WaitingRoomChairReply);
  rpc UpdateWaitingRoomChair (UpdateWaitingRoomChairRequest)
      returns (WaitingRoomChairReply);
}

message QueueEntryReply {
  // Existing fields 1-17 remain unchanged.
  string chair_id = 18;
  string chair_name = 19;
  optional int32 manual_order = 20;
}

message WaitingRoomChairReply {
  string id = 1;
  string clinic_id = 2;
  string name = 3;
  string code = 4;
  bool is_active = 5;
  bool is_available = 6;
  string occupied_by_entry_id = 7;
  string created_at = 8;
  string updated_at = 9;
}

message WaitingRoomOrderingReply {
  string mode = 1;
  repeated string manual_statuses = 2;
}

message WaitingRoomStateReply {
  repeated QueueEntryReply entries = 1;
  repeated WaitingRoomChairReply chairs = 2;
  WaitingRoomOrderingReply ordering = 3;
  string generated_at = 4;
}

message WaitingRoomChairsListReply {
  repeated WaitingRoomChairReply chairs = 1;
}

message GetWaitingRoomStateRequest {
  string clinic_id = 1;
}

message UpdateWaitingRoomStatusRequest {
  string clinic_id = 1;
  string queue_entry_id = 2;
  string status = 3;
  optional string chair_id = 4;
  optional string correction_reason = 5;
  repeated string target_ordered_entry_ids = 6;
}

message AssignWaitingRoomChairRequest {
  string clinic_id = 1;
  string queue_entry_id = 2;
  string chair_id = 3;
}

message ReorderWaitingRoomEntriesRequest {
  string clinic_id = 1;
  string mode = 2;
  optional string status = 3;
  repeated string ordered_entry_ids = 4;
}

message ListWaitingRoomChairsRequest {
  string clinic_id = 1;
}

message CreateWaitingRoomChairRequest {
  string clinic_id = 1;
  string name = 2;
  optional string code = 3;
  optional bool is_active = 4;
}

message UpdateWaitingRoomChairRequest {
  string clinic_id = 1;
  string chair_id = 2;
  optional string name = 3;
  optional string code = 4;
  optional bool is_active = 5;
}
```

Task 5 implementation note:

- Waiting-room service-level mutation requests include `clinic_id` explicitly so
  appointment-service presentation keeps tenant scope visible. The Gateway may
  still derive this value from authenticated HTTP clinic scope in Task 6.

Task 5 should also update
`libs/contracts/appointment/src/lib/appointment.contract.ts`,
`apps/backend/api-gateway/src/clients/appointment`, and the service gRPC
presentation layer to match the proto exactly.

Role access target:

| Capability                                                       | Allowed roles                                      |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| Read waiting-room state and chairs                               | `admin`, `doctor`, `secretary`, `dental_assistant` |
| Update waiting-room status, notes, chair assignment, or ordering | `admin`, `secretary`, `dental_assistant`           |
| Create/update/deactivate chairs                                  | `admin`, `secretary`                               |

## Realtime Events

Keep using the appointment service outbox plus NATS plus Gateway SSE pattern.

Existing event subjects:

```txt
queue.checked_in
queue.status.updated
queue.notes.updated
```

Final waiting-room event subjects:

```txt
queue.reordered
queue.chair.assigned
queue.chair.updated
```

Recommended stream behavior:

- New checked-in patient appears live in `ARRIVED`.
- Status updates move cards between columns.
- Notes updates refresh card indicators and the selected details panel.
- Reorder updates reconcile visible card order.
- Chair updates refresh availability and cards currently showing that chair.
- Cards updated by another user briefly highlight.
- If an event arrives while a card is being moved, the frontend queues or merges
  the event after the movement completes.

Event payload target:

```ts
interface QueueStreamEvent {
  type:
    | 'queue.checked_in'
    | 'queue.status.updated'
    | 'queue.notes.updated'
    | 'queue.reordered'
    | 'queue.chair.assigned'
    | 'queue.chair.updated';
  entry?: Record<string, unknown>;
  entries?: Record<string, unknown>[];
  chair?: Record<string, unknown>;
}
```

Payload rules:

- All event payloads include `clinic_id`.
- Entry payloads include the same queue fields as `QueueEntryReply`, including
  `chair_id`, `chair_name`, and `manual_order` after Task 5.
- `queue.reordered` includes `status` and ordered `entries` for the affected
  status when manual ordering changes, or all visible entries when automatic
  ordering is restored for all statuses.
- `queue.chair.assigned` includes `entry` and the assigned `chair`.
- `queue.chair.updated` includes `chair`; if the update changes current
  availability or a displayed chair name, clients should refresh or reconcile
  the waiting-room state.

The Gateway SSE route must authenticate the user and enforce clinic scope before
streaming events.

## Frontend Architecture

Create the waiting room feature under:

```txt
apps/frontend/src/features/waiting-room/
  api/
    commands/
    dto/
    queries/
    waiting-room-api-paths.ts
  components/
  hooks/
    commands/
    queries/
  model/
  schemas/
  index.ts
```

Create only the files required by the current task. Do not scaffold the full
tree ahead of implementation.

Keep the route thin:

```txt
apps/frontend/src/app/(admin)/waiting-room/page.tsx
```

The route should only set metadata and render the public feature component:

```ts
import { WaitingRoomPage } from '@/features/waiting-room';
```

Frontend dependency rules:

- Use the waiting-room feature's public API from route files.
- Do not import appointment feature internals into waiting-room components.
- Share only stable public types or API helpers if needed.
- If both appointments and waiting room need a common queue enum/model, prefer a
  small duplication first or expose it deliberately from one feature; do not
  create a shared frontend library until reuse is real.
- Use TanStack Query for server state.
- Use local component state or feature-local state for active card movement,
  selected card, details panel, and modal state.
- Keep direct API calls out of components.

## Frontend UI/UX Direction

The waiting room should be a dense operational board, not a table and not a
landing page.

Primary desktop layout:

```txt
Waiting Room                              Live | Updated 10:42 AM

[Active] [Arrived] [Waiting] [In Chair] [Done] [Avg Wait]

[Search patient...] [Doctor] [Priority] [Order: Auto/Manual] [+ Chair]

+-------------+-------------+-------------+-------------+
| Arrived     | Waiting     | In Chair    | Done        |
| 3           | 7           | 2           | 9           |
|-------------|-------------|-------------|-------------|
| PatientCard | PatientCard | PatientCard | PatientCard |
| PatientCard | PatientCard | PatientCard | PatientCard |
+-------------+-------------+-------------+-------------+

Right offcanvas/details panel when a card is selected.
```

Patient card content:

```txt
Patient name
Appointment type
Doctor
Priority badge
Live waiting duration
Arrival time
Phone/contact icon
Notes indicator
Chair badge when in chair
Primary action when relevant
Actions dropdown
```

Card actions:

- Mark waiting.
- Move to chair.
- Assign/change chair.
- Start treatment.
- Mark done.
- Edit notes.
- Call patient.
- View appointment.
- View patient profile.
- Correct status.

Details panel:

- Patient summary.
- Appointment details.
- Doctor.
- Priority.
- Arrival, called, seated, and completed timestamps.
- Chair assignment.
- Queue notes.
- Status timeline.
- Action buttons.

Mobile layout:

- Keep the board usable with horizontally scrollable columns or a segmented
  status filter plus card list.
- Keep action buttons thumb-friendly.
- Avoid tiny movement handles as the only way to move a patient; action menus
  must remain available.

## Kanban Movement UI Resource Decision

`apps/frontend` does not currently declare a Kanban movement dependency, while
the Ubold full template already includes working Kanban board examples.

Use the Ubold implementation resources first instead of hand-rolling the
workflow-board movement mechanics from scratch.

Preferred board dependency:

```txt
@hello-pangea/dnd
```

Reasons:

- Ubold's CRM pipeline board already uses it for multi-column card movement.
- It fits the waiting-room status columns: `ARRIVED`, `WAITING`, `IN_CHAIR`,
  and `DONE`.
- It avoids building low-level card movement, column transfer, placeholder, and
  reorder behavior from scratch in the first version.

Secondary sortable-list resource:

```txt
react-sortablejs
sortablejs
```

Use this only if a specific waiting-room sub-workflow is better represented as a
simple sortable list, such as a compact manual-order list or chair setup list.
Do not add both movement/sortable stacks unless Task 11 proves both are needed.

Implementation rule:

- Start Task 11 by inspecting Ubold `PipelinePage.tsx` and sortable plugin
  examples.
- Adapt the board structure, card movement callbacks, movement handles, ghost
  state, and Bootstrap/Ubold visual feedback into `features/waiting-room`.
- Replace Ubold demo state with Clinora waiting-room models, TanStack Query
  mutations, backend reorder/status commands, and SSE reconciliation.

If package selection changes during implementation, document the reason in the
task execution file before installing.

Use `pnpm` only.

## Backend Implementation Direction

Inside appointment service, keep waiting room code within the appointment
bounded context unless the service structure already favors a specific
subfolder split.

Recommended additions inside appointment context:

```txt
domain/entities/chair.entity.ts
domain/repositories/chair-repository.interface.ts
domain/repositories/queue-entry-repository.interface.ts
application/use-cases/manage-waiting-room.use-case.ts
application/use-cases/manage-chairs.use-case.ts
application/errors/waiting-room.errors.ts
infrastructure/persistence/entities/chair.typeorm-entity.ts
infrastructure/persistence/migrations/<timestamp>-add-waiting-room-chairs-and-ordering.ts
infrastructure/persistence/repositories/typeorm-chair.repository.ts
presentation/grpc/controllers/waiting-room.grpc-controller.ts
```

Adapt to the current appointment-service folder conventions after inspecting
the existing code. Do not create a separate backend shared library.

Backend rules:

- Keep TypeORM entities service-local.
- Keep migrations inside appointment service.
- Keep domain logic out of gRPC controllers.
- Keep Gateway controllers thin.
- Update `libs/contracts/appointment` before changing gRPC implementation.
- Continue publishing queue changes through the appointment service outbox.
- Preserve clinic scoping on every chair and queue query.

## Testing Strategy

Add focused tests as each layer is implemented.

Backend tests:

- Chair creation/list/update/deactivation rules.
- Cannot assign inactive chair.
- Cannot assign occupied chair.
- Moving to `IN_CHAIR` requires chair assignment.
- Backward status movement requires correction reason.
- Automatic ordering by priority and arrival time.
- Manual reorder persistence and fallback ordering.
- Reorder rejects entries outside the clinic or target status.
- Queue status/chair/reorder events are written to the outbox.
- gRPC mapper includes `chairId`, `chairName`, and `manualOrder`.
- Gateway validation rejects invalid UUIDs, statuses, chairs, and reorder
  payloads.
- Gateway role and clinic-scope enforcement.

Frontend tests:

- DTO mappers convert date strings and empty optional values.
- Query keys include clinic scope.
- Board grouping by status.
- Automatic ordering by priority and arrival time.
- Manual reorder command payload generation.
- Auto reorder action resets manual order and restores priority/time ordering.
- Moving from one status to another calls the correct status command.
- Moving inside a column calls reorder with ordered IDs.
- Moving into `IN_CHAIR` opens chair assignment before status submit.
- Occupied chair errors are displayed clearly.
- Correction dialog is required for backward moves.
- SSE events add, move, update, and reorder cards.
- Treatment launch builds the expected navigation context.
- Responsive board controls do not overlap.

Run verification commands during implementation:

```txt
pnpm nx test appointment-service
pnpm nx build appointment-service
pnpm nx test api-gateway
pnpm nx build api-gateway
pnpm nx test frontend
pnpm nx lint frontend
pnpm nx build frontend
```

Use the exact available Nx target names if they differ in `project.json`.

## Implementation Tasks

### Task 1: Finalize Waiting Room Backend Contract And API Shape

Scope:

- Re-read `docs/api/appointment-service.md`.
- Inspect existing appointment proto, contract interfaces, service gRPC
  controllers, and Gateway appointment routes.
- Decide whether to add new gRPC methods or extend existing queue methods.
- Define final HTTP route names under `/waiting-room`.
- Define DTOs for chair assignment, reorder, chair CRUD, and status movement.
- Update this plan if the API shape changes.

Out of scope:

- Persistence changes.
- Frontend implementation.

Acceptance criteria:

- The implementation target is clear before schema and contract edits begin.
- Compatibility with existing `/queue` check-in is documented.

Task 1 result:

- Completed on 2026-08-04.
- Final HTTP route names, DTOs, gRPC method targets, queue compatibility rules,
  role targets, and SSE event targets are recorded in `## API Shape` and
  `## Realtime Events`.
- No executable proto, Gateway route, persistence, or frontend code was changed
  in this task.

### Task 2: Add Chair/Operatory Domain And Persistence

Depends on Task 1.

Scope:

- Add chair domain model and repository interface inside appointment service.
- Add TypeORM chair entity and migration.
- Add repository implementation with clinic-scoped list/create/update methods.
- Enforce unique active chair names or codes per clinic if product chooses that
  invariant.
- Add focused mapper/repository tests where useful.

Out of scope:

- Queue entry chair assignment.
- Gateway routes.
- Frontend UI.

Acceptance criteria:

- Appointment service can persist and retrieve clinic-scoped chairs.
- Deactivated chairs remain stored but are excluded from assignable chair lists.

Task 2 result:

- Completed on 2026-08-04.
- Added service-owned chair domain and persistence infrastructure inside the
  appointment bounded context.
- Chose the first-version invariant that active chair names and non-empty codes
  must be unique within a clinic; inactive historical chairs can keep duplicate
  names or codes.
- Registered the chair TypeORM entity, repository binding, and migration in the
  appointment service composition.
- Verification passed:
  `pnpm nx test appointment-service`,
  `pnpm nx build appointment-service`.

### Task 3: Extend Queue Entries With Chair And Manual Ordering Fields

Depends on Task 2.

Scope:

- Add `chairId`, `chairName`, and `manualOrder` to queue persistence.
- Add migration for queue entry columns and indexes.
- Update queue domain/application models.
- Update queue DTO/domain/persistence mappers.
- Preserve existing queue behavior for records without chair/manual order.

Out of scope:

- Chair assignment validation.
- Kanban movement UI.

Acceptance criteria:

- Existing queue list/check-in/status/notes behavior still works.
- Queue entries can carry chair and manual order data.

Task 3 result:

- Completed on 2026-08-04.
- Added `chairId`, `chairName`, and `manualOrder` to the queue domain entity
  and TypeORM persistence entity.
- Added a service-owned migration for `queue_entries.chair_id`,
  `queue_entries.chair_name`, `queue_entries.manual_order`, and supporting
  clinic/status/chair indexes.
- Updated queue persistence mapping and queue event payload generation to carry
  the new fields when present.
- Preserved check-in behavior by creating new queue entries with no chair and
  no manual order by default.
- Made queue listing manual-order aware while preserving the existing
  priority/arrival ordering for entries without manual order.
- Verification passed:
  `pnpm nx test appointment-service`,
  `pnpm nx build appointment-service`.

### Task 4: Add Waiting Room Use Cases Inside Appointment Service

Depends on Tasks 2 and 3.

Scope:

- Add use cases for listing waiting room state, updating status, assigning
  chair, reordering entries, and managing chairs.
- Enforce chair availability before `IN_CHAIR`.
- Enforce correction reason on backward moves.
- Enforce clinic scope for queue entries and chairs.
- Recalculate or store manual ordering consistently after reorder commands.
- Write outbox events for status, notes, chair, and reorder changes.

Out of scope:

- Gateway HTTP routes.
- Frontend UI.

Acceptance criteria:

- Business rules are enforced in appointment-service application/domain code.
- Controllers remain transport mappers only.

Task 4 result:

- Completed on 2026-08-04.
- Added appointment-service application use cases for waiting-room state,
  waiting-room status movement, chair assignment, queue notes, manual reorder,
  auto reorder, and chair management.
- Enforced active chair selection before `IN_CHAIR`, occupied-chair rejection,
  correction reasons for backward status movement, clinic scope for queue
  entries and chairs, and target-status validation for manual reorder.
- Added queue repository primitives for chair occupancy lookup, status movement
  with chair snapshots, chair assignment, manual reorder persistence, and manual
  order clearing.
- Added outbox events for waiting-room status, notes, chair assignment, chair
  updates, and reorder changes.
- Verification passed:
  `pnpm nx test appointment-service`,
  `pnpm nx build appointment-service`.

### Task 5: Update Appointment gRPC Contract And Service Presentation

Depends on Task 4.

Scope:

- Update `libs/contracts/appointment` proto and TypeScript contract.
- Add chair reply/request shapes.
- Include `chairId`, `chairName`, and `manualOrder` in queue entry replies.
- Add or extend gRPC methods for waiting room operations.
- Update appointment-service gRPC controllers and mappers.
- Update Gateway appointment-service client interface/adapter.

Out of scope:

- HTTP route implementation beyond client readiness.

Acceptance criteria:

- Gateway can call all needed waiting room operations through the appointment
  gRPC client.
- Contract changes are covered by service and Gateway tests.

Task 5 result:

- Completed on 2026-08-04.
- Added waiting-room gRPC methods and reply/request messages to
  `libs/contracts/appointment/src/lib/appointment.proto`.
- Extended `QueueEntryReply` with `chairId`, `chairName`, and `manualOrder`.
- Added waiting-room chair, state, ordering, and mutation interfaces to
  `libs/contracts/appointment/src/lib/appointment.contract.ts`.
- Updated appointment-service gRPC presentation to map waiting-room state,
  chair replies, status movement, chair assignment, reorder, and chair
  management calls.
- Updated the API Gateway appointment-service client interface and gRPC adapter
  so Task 6 can expose HTTP routes without reaching around the service boundary.
- Verification passed:
  `pnpm nx test contracts-appointment`,
  `pnpm nx test appointment-service`,
  `pnpm nx test api-gateway`,
  `pnpm nx build appointment-service`,
  `pnpm nx build api-gateway`.

### Task 6: Expose Waiting Room Routes Through The API Gateway

Depends on Task 5.

Scope:

- Add `modules/waiting-room` in the API Gateway.
- Add controllers, DTOs, mappers, and facade.
- Use existing appointment-service client module.
- Apply authenticated role and clinic-scope guards.
- Preserve same-origin BFF usage for the browser.
- Map gRPC errors to stable HTTP responses.

Out of scope:

- Frontend feature.
- Treatment workspace backend integration unless required for route handoff.

Acceptance criteria:

- `/api/bff/clinics/{clinicId}/waiting-room...` can reach the appointment
  service through the Gateway.
- Gateway does not own waiting-room business decisions.

Task 6 result:

- Completed on 2026-08-04.
- Added `apps/backend/api-gateway/src/modules/waiting-room` with DTOs,
  controller, facade, and module wiring.
- Exposed direct Gateway routes under
  `/api/v1/clinics/{clinicId}/waiting-room` for state reads, status movement,
  notes, chair assignment, manual/auto reorder, chair listing, chair creation,
  and chair updates.
- Applied JWT, role, and clinic-scope guards with the planned role split:
  read access for `admin`, `doctor`, `secretary`, and `dental_assistant`;
  flow commands for `admin`, `secretary`, and `dental_assistant`; chair
  management for `admin` and `secretary`.
- Added waiting-room facade calls through the typed appointment-service client,
  including a clinic-scope precheck before delegating the legacy queue notes
  gRPC command.
- Verification passed:
  `pnpm nx test api-gateway`,
  `pnpm nx build api-gateway`.

### Task 7: Update Queue Outbox Events And Gateway SSE Streaming

Depends on Task 6.

Scope:

- Emit events for chair assignment and reorder changes.
- Ensure event payloads include clinic scope and updated queue entry data.
- Update Gateway SSE broadcaster/stream mapping if needed.
- Keep stream authentication and clinic isolation.
- Document event payload shape in `docs/api/appointment-service.md`.

Out of scope:

- Frontend stream consumption.

Acceptance criteria:

- Browser clients can receive enough event data to keep the board live.
- No cross-clinic event leakage is possible.

Task 7 result:

- Completed on 2026-08-04.
- Normalized chair outbox payloads so `queue.chair.assigned` includes
  `{ clinic_id, entry, chair }` and `queue.chair.updated` includes
  `{ clinic_id, chair }`.
- Added `updated_at` to compatibility queue entry event payloads.
- Updated Gateway queue SSE broadcasting to subscribe to
  `queue.reordered`, `queue.chair.assigned`, and `queue.chair.updated` in
  addition to the existing queue subjects.
- Normalized SSE messages into a stable `{ type, clinic_id, entry?, entries?,
chair?, status? }` envelope while preserving clinic-scoped filtering.
- Updated appointment API documentation for queue event subjects and payload
  shape.
- Verification passed:
  `pnpm nx test appointment-service`,
  `pnpm nx test api-gateway`,
  `pnpm nx build appointment-service`,
  `pnpm nx build api-gateway`.

### Task 8: Create Frontend Waiting-Room Feature Data Boundary

Depends on Task 6 for final DTOs, but can begin after the contract is stable.

Scope:

- Create `apps/frontend/src/features/waiting-room`.
- Add model types, labels, status/priority/chair display mappings, and rules.
- Add DTOs matching Gateway responses.
- Add mappers that convert ISO strings to `Date` and empty optional strings to
  `null`.
- Add API path helpers.
- Keep `apps/frontend/src/app/(admin)/waiting-room/page.tsx` thin.

Out of scope:

- Kanban movement UI.
- Stream handling.

Acceptance criteria:

- Waiting room UI code can consume typed frontend models without touching raw
  transport DTOs.
- The feature boundary is independent from appointment feature internals.

Task 8 result:

- Completed on 2026-08-04.
- Added `apps/frontend/src/features/waiting-room` with public API exports,
  BFF-relative path helpers, response/request/SSE DTOs, frontend models,
  command types, pure mappers, and lightweight display/rule helpers.
- Mapped Gateway HTTP DTOs from camelCase transport fields into frontend models
  with `Date` values and nullable optional strings.
- Mapped queue SSE snake_case payloads into the same frontend entry/chair/event
  model used by HTTP state reads.
- Added path, mapper, and rule tests for the new feature boundary.
- Verification passed:
  `pnpm nx test frontend`,
  `pnpm nx build frontend`.
  Direct `pnpm exec next build` from `apps/frontend` was also used while
  clearing an intermediate Nx post-build IO error; after `pnpm nx reset`, the
  Nx build passed.

### Task 9: Add Waiting Room Queries, Commands, Hooks, And Stream Handling

Depends on Task 8.

Scope:

- Add TanStack Query keys.
- Add queries for waiting room state and chairs.
- Add commands for status, notes, chair assignment, reorder, and chair CRUD.
- Add mutation hooks with correct invalidation/update behavior.
- Add SSE hook for queue stream events.
- Merge stream events into TanStack Query cache carefully.

Out of scope:

- Board presentation.

Acceptance criteria:

- Components can read and mutate waiting room state through hooks only.
- Live events update cached board data without a full refresh.

Task 9 result:

- Completed on 2026-08-04.
- Added waiting-room TanStack Query keys for clinic-scoped state and chair
  caches.
- Added API query functions for waiting-room state and chairs.
- Added API command functions for status movement, notes, chair assignment,
  manual/auto reorder, chair creation, and chair updates.
- Added query hooks and mutation hooks that expose the waiting-room API through
  typed frontend commands/models only.
- Added cache reconciliation helpers for entry, reorder, chair, and SSE events.
- Added `useWaitingRoomEvents` to open the queue SSE stream and merge live
  waiting-room events into TanStack Query cache.
- Added API, hook, cache, and stream reconciliation tests.
- Verification passed:
  `pnpm nx test frontend`,
  `pnpm nx build frontend`.

### Task 10: Build Ubold-Style Realtime Board Shell

Depends on Task 9.

Scope:

- Build `WaitingRoomPage`, summary cards, toolbar, board columns, and cards.
- Use Ubold pipeline, statistic card, badge, dropdown, sortable feedback, and
  SimpleBar patterns.
- Shape the board from the full Ubold CRM pipeline reference instead of a table
  or datatable.
- Add visible ordering controls for `Auto Reorder` and `Manual Order`.
- Add loading, empty, filtered-empty, and error states.
- Keep the first screen as the usable queue board.
- Avoid normal table/datatable layout as the primary experience.

Out of scope:

- Real Kanban movement persistence.
- Chair modal behavior.

Acceptance criteria:

- `/waiting-room` renders a professional board using real waiting-room data.
- The UI is dense, operational, and consistent with Clinora/Ubold.

Task 10 result:

- Completed on 2026-08-05.
- Replaced the waiting-room placeholder route with a feature-owned
  `WaitingRoomPage` that resolves clinic scope from the authenticated session,
  loads the Task 9 waiting-room query, and subscribes to queue SSE updates.
- Added four compact queue summary cards plus an Ubold-style toolbar with
  patient search, priority and doctor filters, refresh feedback, realtime
  presence, and visible server-ordering mode controls.
- Adapted the Ubold CRM pipeline structure into four horizontally scrollable
  status columns backed by SimpleBar while preserving the entry order returned
  by the backend.
- Added dense patient cards with priority emphasis, appointment, doctor, chair,
  note, elapsed-time, automatic/manual position, and contact-dropdown details.
- Added loading skeletons, initial empty, filtered-empty, missing-clinic, stale
  data error, initial error, and retry states.
- Added pure board projection helpers and focused tests for filtering, grouping,
  summaries, doctor options, initials, live-data rendering, stream startup, and
  UI states.
- Kept status movement, persisted reordering, chair workflows, and patient
  details actions out of this step for Tasks 11-13.
- Verification passed:
  `pnpm nx test frontend --runInBand --testPathPatterns=waiting-room --skip-nx-cache`,
  `pnpm nx lint frontend`,
  `pnpm nx build frontend --skip-nx-cache`.

### Task 11: Add Kanban-Style Status Movement And Manual Reordering

Depends on Task 10.

Scope:

- Add the selected Ubold-backed board movement dependency through `pnpm`, preferring
  `@hello-pangea/dnd` for the board unless implementation testing proves
  otherwise.
- Adapt Ubold's CRM pipeline Kanban movement structure and sortable visual
  states rather than writing raw movement behavior from scratch.
- Support moving cards between status columns.
- Support moving cards inside a column to persist manual order.
- Add `Auto Reorder` behavior that asks the backend to restore logical ordering
  by priority and check-in time.
- Add `Manual Order` behavior that enables card movement inside a status column.
- Require correction dialog before backward status moves.
- Require chair assignment before moving into `IN_CHAIR`.
- Reconcile optimistic UI with backend response/SSE events.

Out of scope:

- Treatment launch.
- Chair management list page if not needed for assignment.

Acceptance criteria:

- Kanban movement operations persist through backend commands.
- Manual order is visible across clients after refresh or SSE update.

Task 11 result:

- Completed on 2026-08-05.
- Added `@hello-pangea/dnd` to the frontend package through pnpm and adapted
  Ubold's `DragDropContext`, `Droppable`, `Draggable`, drag-handle, ghost, and
  destination-feedback patterns to the waiting-room board.
- Activated `Manual Order` as the explicit opt-in for dragging and disabled
  movement while filters hide queue positions or while another movement is
  pending.
- Persisted same-column moves through the manual reorder command with the full
  ordered status list.
- Persisted cross-column moves atomically through the status command with the
  destination's full ordered entry list.
- Added optimistic board projection with rollback on command failure and an
  authoritative refetch after successful persistence.
- Activated `Auto Reorder` to clear persisted manual positions and restore the
  backend's priority/check-in-time ordering.
- Added a correction-reason modal before backward status movement and included
  the reason in the backend status command.
- Blocked moves into `IN_CHAIR` when no chair is assigned and provided clear
  user feedback; Task 12 remains responsible for selecting an available chair.
- Updated cache/SSE reconciliation to derive ordering mode and manually ordered
  statuses from the authoritative entry data so other clients reflect changes.
- Added focused tests for movement projection, shared ordering metadata,
  same-column reorder, forward status movement, chair blocking, correction
  submission, and automatic reorder.
- Verification passed:
  `pnpm nx test frontend --runInBand --testPathPatterns=waiting-room --skip-nx-cache`,
  `pnpm nx lint frontend --skip-nx-cache`,
  `pnpm nx build frontend --skip-nx-cache`.

### Task 12: Add Chair Assignment And Chair Management UI

Depends on Tasks 9 and 11.

Scope:

- Add chair assignment modal for `IN_CHAIR`.
- Show only active and available chairs by default.
- Show occupied chairs as unavailable when useful for staff visibility.
- Add minimal chair management UI for admins or authorized staff.
- Support create, rename/update, and deactivate chair.
- Show chair badge on `IN_CHAIR` cards.

Out of scope:

- Complex room scheduling beyond current `IN_CHAIR` occupancy.

Acceptance criteria:

- Users cannot seat a patient without selecting an available chair.
- Chair availability errors from the backend are clear and recoverable.

Task 12 result:

- Completed on 2026-08-05.
- Replaced the Task 11 chair-required warning with an Ubold-style chair picker
  that intercepts movement into `IN_CHAIR` and requires an explicit active,
  available chair selection before the status command is submitted.
- Kept occupied chairs hidden by default, added an optional occupied-chair view
  with patient context, and kept occupied/inactive choices disabled.
- Allowed the chair already occupied by the selected seated entry to remain a
  valid current selection while offering available chairs for reassignment.
- Added `Change chair` to seated patient-card actions and displayed the assigned
  chair as a compact badge on `IN_CHAIR` cards.
- Added authorized chair management for admins and secretaries with availability
  summaries, create, rename/update, activate, and deactivate actions.
- Prevented occupied chairs from being deactivated through the UI and explained
  how staff can recover by moving or completing the seated patient first.
- Kept backend conflict messages inside the chair picker/management modal so a
  stale availability selection can be refreshed and retried without losing the
  workflow.
- Reused the existing waiting-room API, TanStack Query mutations, cache
  invalidation, and SSE-backed state; no new backend boundary was introduced.
- Added focused model, modal, and page integration tests for availability
  filtering, explicit selection, occupied visibility, conflict retry, seated
  reassignment, chair CRUD UI, safe deactivation, and role visibility.
- Verification passed:
  `pnpm nx test frontend --runInBand --testPathPatterns=waiting-room --skip-nx-cache`
  (53 tests),
  `pnpm nx lint frontend --skip-nx-cache`,
  `pnpm nx build frontend --skip-nx-cache`.

### Task 13: Add Patient Details Panel, Notes, Correction, And Treatment Launch

Depends on Task 12.

Scope:

- Add selected patient details offcanvas/panel.
- Add status timeline using arrival/called/seated/completed timestamps.
- Add notes modal or inline notes editor.
- Add correction reason modal for backward moves.
- Add `Start Treatment` action for `IN_CHAIR` entries.
- Build treatment navigation context using `patientId`, `appointmentId`,
  `queueEntryId`, `chairId`, and `doctorId`.
- If treatment backend needs a create-visit-from-queue endpoint, document it as
  a dependent treatment feature task instead of hiding it inside waiting room.

Out of scope:

- Implementing treatment workspace internals.

Acceptance criteria:

- A seated patient can be sent to the treatment workspace from the board.
- Notes and correction workflows are role-aware and backend-backed.

Task 13 result:

- Added a responsive selected-patient offcanvas using the waiting-room queue
  projection for patient, appointment, provider, priority, phone, chair, and
  queue-note context.
- Adapted Ubold's timeline language to show arrival, called, seated, and
  completed timestamps, including explicit not-recorded states.
- Added queue-note editing from both patient cards and the details panel through
  the existing waiting-room notes mutation and SSE-compatible cache update.
- Exposed previous-status correction from the card action menu while preserving
  the backend-required correction-reason modal and status command.
- Matched frontend mutation visibility to the Gateway policy: `admin`,
  `secretary`, and `dental_assistant` can edit notes, correct status, assign
  chairs, and reorder; doctors retain read-only waiting-room access.
- Added `Start Treatment` to seated entries and built a typed `/visits/new`
  handoff containing `patientId`, `appointmentId`, `queueEntryId`, `chairId`,
  and `doctorId`.
- Did not add a waiting-room treatment endpoint. The dependent treatment
  feature must make `/visits/new` consume and validate this handoff and, when
  persistence is implemented, add create-visit-from-queue behavior inside the
  treatment bounded context.
- Added focused route-builder and page integration coverage for panel details,
  timestamps, notes, menu correction, role visibility, and treatment launch.
- Verification passed:
  `pnpm nx test frontend --runInBand --testPathPatterns=waiting-room --skip-nx-cache`
  (60 tests), `pnpm nx lint frontend --skip-nx-cache`, and
  `pnpm nx build frontend --skip-nx-cache`.
- Browser verification passed at `1440x1000` and `390x844` with no document
  overflow or detail-field collisions.

### Task 14: Add Role-Aware UX, Responsive Polish, And Loading/Error States

Depends on Task 13.

Scope:

- Show actions based on role while keeping backend authorization authoritative.
- Ensure desktop board, tablet, and mobile layouts are usable.
- Add keyboard-accessible menu/button actions for every Kanban movement
  operation.
- Ensure card text, badges, buttons, and dropdowns do not overlap.
- Add live-update indicators and update highlights.
- Add permission, offline/SSE disconnected, loading, and retry states.

Out of scope:

- Broad navigation redesign.

Acceptance criteria:

- The waiting room feels production-ready on common clinic devices.
- Users can operate the queue through menus/buttons when card movement is not
  convenient.

Task 14 result:

- Kept mutation actions aligned with the existing Gateway roles while adding a
  clear view-only state for doctors and a dedicated access-denied response for
  `401` and `403` failures.
- Promoted SSE connectivity into a typed live-state contract with connecting,
  connected, disconnected, and offline states, explicit recovery, and
  short-lived entry highlights for incoming queue events.
- Disabled server mutations while the browser is offline. An SSE-only
  disconnection remains visible and recoverable without unnecessarily blocking
  REST commands while network access is still available.
- Added keyboard-accessible status movement, chair movement, correction, and
  manual up/down ordering to every patient card, preserving the same projection
  and backend command paths used by drag and drop.
- Added responsive toolbar, filter, card text, dropdown, motion-reduction, and
  narrow-screen menu behavior. Fixed the shared shell breakpoint initialization
  so the mobile sidebar is off-canvas on first render rather than after resize.
- Added focused page and stream-helper coverage for role visibility, permission
  errors, offline/disconnected states, retries, accessible movements, manual
  reordering, chair selection, and live-update highlighting.
- Verification passed: `pnpm nx test frontend --runInBand
--testPathPatterns=waiting-room --silent` (68 tests), `pnpm nx lint frontend`
  (0 errors; 8 existing shell warnings), and `pnpm nx build frontend
--skip-nx-cache`.
- Browser verification passed at `1440x1000`, `900x900`, and `390x844` with no
  document overflow, control overflow, long-name/badge collision, or clipped
  mobile action menu.

### Task 15: Add Focused Tests And Final Integration Verification

Depends on Tasks 1-14.

Scope:

- Complete backend, Gateway, frontend model, hook, and component tests listed in
  the testing strategy.
- Run affected Nx test/build/lint targets.
- Start backend services and frontend locally if needed for manual verification.
- Verify check-in from schedule appears in waiting room.
- Verify manual reorder, status movement, chair assignment, notes, correction,
  SSE updates, and treatment launch.

Acceptance criteria:

- Automated tests cover critical waiting-room behavior.
- Build and lint pass for affected projects.
- Manual end-to-end clinic queue flow is verified.

Task 15 result:

- Completed on 2026-08-05.
- Added focused Gateway DTO validation tests for invalid waiting-room statuses,
  UUIDs, manual reorder payloads, and chair management payload shape.
- Added appointment-service coverage for clinic-scoped check-in rejection and
  queue note update events.
- Added frontend cache coverage proving `queue.checked_in` SSE events add newly
  checked-in appointments to the waiting-room state.
- Verification passed: `pnpm nx test contracts-appointment --runInBand
--silent`, `pnpm nx test appointment-service --runInBand --silent`, `pnpm nx
test api-gateway --runInBand --silent`, `pnpm nx test frontend --runInBand
--silent`, `pnpm nx build appointment-service`, `pnpm nx build api-gateway`,
  `pnpm nx lint frontend`, and `pnpm nx build frontend --skip-nx-cache`.
- Frontend lint passed with 0 errors and the existing 8 shared layout/template
  warnings.
- Browser integration verification passed against `http://localhost:3000/waiting-room`
  with mocked authenticated session, BFF responses, and SSE: initial queue
  render, schedule check-in via `queue.checked_in`, notes save, chair seating,
  treatment launch, and horizontal overflow check.

### Task 16: Update API Documentation And Completion Notes

Depends on Task 15.

Scope:

- Update `docs/api/appointment-service.md` with waiting-room routes, DTOs,
  chair behavior, ordering behavior, and events.
- Create completion notes in this folder.
- Record installed packages, migrations, endpoint changes, and verification
  results.
- Record known follow-up work.

Acceptance criteria:

- Future maintainers can understand the delivered waiting-room behavior without
  reading implementation code first.

Task 16 result:

- Completed on 2026-08-05.
- Updated `docs/api/appointment-service.md` with the delivered waiting-room HTTP
  routes, role access, response/request DTOs, chair rules, ordering behavior,
  queue SSE subjects, frontend integration rules, verification reference, and
  known integration gaps.
- Added `docs/implementation/waiting-room/completion-notes.md` with the final
  feature summary, endpoint changes, persistence migrations, installed package,
  event surface, verification results, and follow-up work.
- Verification passed:
  `pnpm nx test contracts-appointment --runInBand --silent`.

## Recommended Task Execution Format

For every task:

1. Read this plan and the relevant repository `AGENTS.md` instructions.
2. Re-read `docs/architecture/backend.md` before backend work.
3. Re-read `docs/architecture/frontend.md` before frontend work.
4. Inspect only the Ubold and legacy references relevant to that task.
5. Explain the task's architectural impact before implementation.
6. Implement only that task's scope.
7. Run focused tests first, followed by affected Nx targets.
8. Mark the task complete in the Implementation Status checklist only after
   verification passes.
9. Summarize the change and name the next task without implementing it.

## Recommended First Session Prompt

```txt
Implement Task 1 from
docs/implementation/waiting-room/implementation-plan.md.

Finalize the waiting room backend contract and API shape only. Inspect the
current appointment service, appointment contract, API Gateway appointment
module, and appointment API documentation. Decide the exact gRPC and HTTP route
changes for chairs, manual reordering, status movement, notes, and waiting room
state. Update the plan if needed. Do not implement persistence, UI, or Gateway
routes yet.
```
