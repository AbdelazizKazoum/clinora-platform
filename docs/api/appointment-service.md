# Appointment API contract for frontend integration

Status: HTTP routes implemented with authenticated role and clinic-scope access  
Last verified: 2026-08-05

This document is the frontend-facing HTTP contract for the appointment bounded
context. The appointment service owns appointment scheduling, doctor conflict
checks, patient check-in, the daily clinic queue, and waiting-room patient-flow
business rules.

The browser must not call the appointment service gRPC API directly. Frontend
code should call the same-origin BFF, which forwards to the API Gateway. The API
Gateway then calls the appointment service through gRPC.

Implementation sources:

- API Gateway appointment controllers:
  `apps/backend/api-gateway/src/modules/appointments`
- API Gateway waiting-room controller:
  `apps/backend/api-gateway/src/modules/waiting-room`
- API Gateway appointment validation DTOs:
  `apps/backend/api-gateway/src/modules/appointments/dto`
- API Gateway waiting-room validation DTOs:
  `apps/backend/api-gateway/src/modules/waiting-room/dto`
- API Gateway appointment gRPC client:
  `apps/backend/api-gateway/src/clients/appointment`
- Shared appointment contract:
  `libs/contracts/appointment/src/lib/appointment.contract.ts`
- Internal gRPC contract:
  `libs/contracts/appointment/src/lib/appointment.proto`
- Appointment service use cases:
  `apps/backend/services/appointment-service/src/appointment/application/use-cases`

## 1. Transport and URL rules

### Browser requests

Use the same-origin BFF URL:

```txt
/api/bff/clinics/{clinicId}/appointments
/api/bff/clinics/{clinicId}/queue
/api/bff/clinics/{clinicId}/waiting-room
```

Example:

```ts
const response = await fetch(
  `/api/bff/clinics/${clinicId}/appointments?page=1&limit=50`,
  {
    headers: { Accept: 'application/json' },
  },
);
```

Do not add `/api/v1` to a BFF request. The BFF adds the Gateway prefix and
forwards the request to:

```txt
{API_GATEWAY_URL}/api/v1/clinics/{clinicId}/...
```

The BFF requires an authenticated Clinora frontend session. It supplies the
Bearer access token, refreshes an expiring token, and retries once after an
HTTP `401`.

### Direct Gateway requests

Server-side tools may call the Gateway at:

```txt
http://localhost:3001/api/v1/clinics/{clinicId}/appointments
http://localhost:3001/api/v1/clinics/{clinicId}/queue
http://localhost:3001/api/v1/clinics/{clinicId}/waiting-room
```

Direct browser-to-Gateway calls are not part of the frontend contract.

### Common request rules

- `clinicId` and every path identifier must be a UUID.
- JSON bodies must use `Content-Type: application/json`.
- Request and response property names use `camelCase`.
- Body booleans must be JSON booleans, not strings.
- Dates must be valid ISO 8601 date strings.
- All records are tenant-scoped by the `clinicId` path value.
- The Gateway requires a valid JWT, an allowed role, and a `clinicId` route
  parameter matching the trusted clinic claim in the access token.
- The frontend must obtain `clinicId` from trusted session/clinic context. It
  must not accept an arbitrary clinic ID from free-form user input.

## 2. Shared values

### Appointment enums

```ts
type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'COMPLETED';

type BookingChannel = 'ONLINE' | 'WALK_IN' | 'PHONE';
```

### Queue enums

```ts
type QueuePriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';
type QueueStatus = 'ARRIVED' | 'WAITING' | 'IN_CHAIR' | 'DONE';
```

### Role access

The Gateway enforces these roles from the authenticated token:

| Capability                            | Allowed roles                                      |
| ------------------------------------- | -------------------------------------------------- |
| List/get appointments                 | `admin`, `doctor`, `secretary`, `dental_assistant` |
| Create/update/reschedule appointments | `admin`, `doctor`, `secretary`                     |
| Check appointment conflicts           | `admin`, `doctor`, `secretary`                     |
| List/get queue entries                | `admin`, `doctor`, `secretary`, `dental_assistant` |
| Check in a patient                    | `admin`, `secretary`, `dental_assistant`           |
| Update queue status or notes          | `admin`, `secretary`, `dental_assistant`           |
| Read waiting-room state and chairs    | `admin`, `doctor`, `secretary`, `dental_assistant` |
| Move entries, notes, chairs, ordering | `admin`, `secretary`, `dental_assistant`           |
| Create/update waiting-room chairs     | `admin`, `secretary`                               |

Frontend permission checks are only UX. The backend remains the source of truth.

## 3. Response shapes

```ts
interface AppointmentDto {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  startAt: string;
  endAt: string;
  isEmergency: boolean;
  type: string;
  channel: BookingChannel;
  status: AppointmentStatus;
  notes: string;
  cancelledAt: string;
  cancellationReason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentsListResponse {
  appointments: AppointmentDto[];
  total: number;
}

interface ConflictResponse {
  hasConflict: boolean;
}

interface QueueEntryDto {
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

interface QueueEntriesListResponse {
  queueEntries: QueueEntryDto[];
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
  entries: QueueEntryDto[];
  chairs: WaitingRoomChairDto[];
  ordering: WaitingRoomOrderingDto;
  generatedAt: string;
}

interface WaitingRoomChairsListResponse {
  chairs: WaitingRoomChairDto[];
}
```

Response notes:

- Date/time response fields are ISO 8601 strings.
- Absent optional scalar values are returned as `""`, not `null`. This applies
  to `patientPhone`, `type`, `notes`, `cancelledAt`, `cancellationReason`,
  `createdBy`, `appointmentType`, `queueNotes`, `calledAt`, `seatedAt`, and
  `completedAt`.
- `chairId`, `chairName`, and `occupiedByEntryId` follow the same empty-string
  convention when absent.
- Map empty strings to `null` at the feature API boundary if the UI model
  prefers nullable values.
- Convert date strings to `Date` only in frontend models, not in raw DTO types.
- `manualOrder` is omitted when automatic queue ordering applies.
- `WaitingRoomChairDto.isAvailable` is computed for the current waiting-room
  state. Inactive chairs are never available.

## 4. Appointment endpoints

All appointment paths below are relative to
`/api/bff/clinics/{clinicId}/appointments` in frontend code.

| Method  | Path                      | Purpose                                       | Success response               |
| ------- | ------------------------- | --------------------------------------------- | ------------------------------ |
| `GET`   | `/`                       | List and filter appointments                  | `200 AppointmentsListResponse` |
| `POST`  | `/`                       | Create an appointment                         | `201 AppointmentDto`           |
| `GET`   | `/conflicts`              | Check whether a doctor has a conflicting slot | `200 ConflictResponse`         |
| `GET`   | `/{appointmentId}`        | Get one appointment                           | `200 AppointmentDto`           |
| `PUT`   | `/{appointmentId}`        | Partially update an appointment               | `200 AppointmentDto`           |
| `PATCH` | `/{appointmentId}/timing` | Move an appointment to a new doctor/time slot | `200 AppointmentDto`           |

Use the dedicated `/conflicts` route exactly as shown. Do not treat `conflicts`
as an appointment ID.

### Create appointment

Route:

```txt
POST /api/bff/clinics/{clinicId}/appointments
```

Body:

```ts
interface CreateAppointmentBody {
  patientId: string; // required UUID
  patientName: string; // required, non-empty, max 255
  patientPhone?: string; // max 30
  doctorId: string; // required UUID, clinic staff userId for a DOCTOR
  doctorName: string; // required, non-empty, max 255
  startAt: string; // required ISO 8601 date-time
  endAt: string; // required ISO 8601 date-time, must be after startAt
  isEmergency?: boolean; // default: false
  type?: string; // max 100
  channel?: BookingChannel; // default: PHONE
  status?: AppointmentStatus; // default: PENDING
  notes?: string;
}
```

Example:

```ts
await fetch(`/api/bff/clinics/${clinicId}/appointments`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    patientId,
    patientName: 'Sara Amrani',
    patientPhone: '+212600000000',
    doctorId,
    doctorName: 'Dr. Salma El Mansouri',
    startAt: '2026-08-03T09:00:00.000Z',
    endAt: '2026-08-03T09:30:00.000Z',
    type: 'Consultation',
    channel: 'PHONE',
  } satisfies CreateAppointmentBody),
});
```

Backend behavior:

- The appointment service validates that `patientId` belongs to the same clinic.
- `doctorId` is the staff user's `userId`, not the staff profile `id`.
- The appointment service validates that `doctorId` belongs to a clinic staff
  member whose role is `DOCTOR`.
- Non-emergency appointments are rejected with HTTP `409` if the doctor already
  has an overlapping appointment in the same clinic.
- Emergency appointments skip the conflict rejection during create and timing
  updates.
- The Gateway sets `createdBy` from the authenticated token. The frontend must
  not send `createdBy`.

### List appointments

Route:

```txt
GET /api/bff/clinics/{clinicId}/appointments
```

Query fields:

| Query field | Type                | Rules and behavior                                                             |
| ----------- | ------------------- | ------------------------------------------------------------------------------ |
| `page`      | integer             | Minimum `1`; default `1`                                                       |
| `limit`     | integer             | `1..100`; default `50`                                                         |
| `startDate` | ISO date string     | Lower date bound. With `endDate`, returns appointments overlapping the range   |
| `endDate`   | ISO date string     | Upper date bound. With `startDate`, returns appointments overlapping the range |
| `doctorId`  | UUID                | Filters by doctor staff user ID                                                |
| `status`    | `AppointmentStatus` | Exact enum filter                                                              |

Results are ordered by `startAt` ascending, then `createdAt` ascending.

The response has `appointments` and `total`, but not a `meta` object. Keep the
requested `page` and `limit` in frontend query state to calculate pagination.

Example:

```ts
const params = new URLSearchParams({
  page: '1',
  limit: '50',
  startDate: dayStartIso,
  endDate: dayEndIso,
});

const response = await fetch(
  `/api/bff/clinics/${clinicId}/appointments?${params}`,
  { headers: { Accept: 'application/json' } },
);
```

### Check conflicts

Route:

```txt
GET /api/bff/clinics/{clinicId}/appointments/conflicts
```

Query fields:

| Query field            | Type                | Rules and behavior                             |
| ---------------------- | ------------------- | ---------------------------------------------- |
| `doctorId`             | UUID                | Required doctor staff user ID                  |
| `startAt`              | ISO date string     | Required proposed start                        |
| `endAt`                | ISO date string     | Required proposed end, must be after `startAt` |
| `excludeStatus`        | `AppointmentStatus` | Optional status to ignore                      |
| `excludeAppointmentId` | UUID                | Optional appointment to ignore while editing   |

The conflict check ignores existing `CANCELLED` and `NO_SHOW` appointments.

Example:

```ts
const params = new URLSearchParams({
  doctorId,
  startAt,
  endAt,
  excludeAppointmentId: appointmentId,
});

const response = await fetch(
  `/api/bff/clinics/${clinicId}/appointments/conflicts?${params}`,
  { headers: { Accept: 'application/json' } },
);

const result = (await response.json()) as ConflictResponse;
```

### Update appointment

Route:

```txt
PUT /api/bff/clinics/{clinicId}/appointments/{appointmentId}
```

Body:

```ts
interface UpdateAppointmentBody {
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  startAt?: string;
  endAt?: string;
  isEmergency?: boolean;
  type?: string;
  channel?: BookingChannel;
  status?: AppointmentStatus;
  notes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}
```

Frontend rules:

- Omit unchanged fields.
- Send `status: 'CANCELLED'`, `cancelledAt`, and `cancellationReason` when
  implementing cancellation UI.
- Send `""` only when the UI intentionally clears an optional text field.
- If changing the doctor, send both `doctorId` and `doctorName` so stored
  snapshots stay readable.

### Update appointment timing

Route:

```txt
PATCH /api/bff/clinics/{clinicId}/appointments/{appointmentId}/timing
```

Body:

```ts
interface UpdateAppointmentTimingBody {
  doctorId: string; // required doctor staff user ID
  doctorName?: string; // optional display snapshot
  newStartAt: string; // required ISO 8601 date-time
  newEndAt: string; // required ISO 8601 date-time
}
```

Use this route for drag/drop calendar moves or compact reschedule actions. Use
`PUT /{appointmentId}` when the edit form changes patient, channel, status, or
notes at the same time.

## 5. Queue endpoints

All queue paths below are relative to `/api/bff/clinics/{clinicId}/queue` in
frontend code.

| Method  | Path                     | Purpose                                   | Success response               |
| ------- | ------------------------ | ----------------------------------------- | ------------------------------ |
| `GET`   | `/`                      | List current clinic queue                 | `200 QueueEntriesListResponse` |
| `POST`  | `/`                      | Check in a patient for an appointment     | `201 QueueEntryDto`            |
| `GET`   | `/{queueEntryId}`        | Get one queue entry                       | `200 QueueEntryDto`            |
| `PATCH` | `/{queueEntryId}/status` | Move a queue entry through the visit flow | `200 QueueEntryDto`            |
| `PATCH` | `/{queueEntryId}/notes`  | Replace queue notes                       | `200 QueueEntryDto`            |

### List queue entries

Route:

```txt
GET /api/bff/clinics/{clinicId}/queue
```

The queue list is not paginated. Results are ordered by:

1. Status flow: `ARRIVED`, `WAITING`, `IN_CHAIR`, `DONE`
2. Priority: `EMERGENCY`, `URGENT`, `NORMAL`
3. Arrival time ascending

### Check in patient

Route:

```txt
POST /api/bff/clinics/{clinicId}/queue
```

Body:

```ts
interface CheckInPatientBody {
  appointmentId: string; // required UUID
  patientId: string; // required UUID
  patientName: string; // required, max 255
  patientPhone?: string; // max 30
  doctorId: string; // required doctor staff user ID
  doctorName: string; // required, max 255
  appointmentType?: string; // max 100
  priority?: QueuePriority; // default: NORMAL
  queueNotes?: string;
  arrivedAt?: string; // default: server time
}
```

Example:

```ts
await fetch(`/api/bff/clinics/${clinicId}/queue`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    appointmentId,
    patientId,
    patientName: 'Sara Amrani',
    doctorId,
    doctorName: 'Dr. Salma El Mansouri',
    appointmentType: 'Consultation',
    priority: 'NORMAL',
  } satisfies CheckInPatientBody),
});
```

Backend behavior:

- A queue entry starts at status `ARRIVED`.
- Checking in the same appointment twice returns HTTP `409`.
- `arrivedAt` defaults to the server time when omitted.
- The check-in body uses appointment snapshots. Prefer using values from the
  selected `AppointmentDto` instead of separately edited free-form text.

### Update queue status

Route:

```txt
PATCH /api/bff/clinics/{clinicId}/queue/{queueEntryId}/status
```

Body:

```ts
interface UpdateQueueStatusBody {
  status: QueueStatus;
  correctionReason?: string;
}
```

Status timestamps are set by the backend the first time the entry reaches each
step:

| Status     | Timestamp field set |
| ---------- | ------------------- |
| `WAITING`  | `calledAt`          |
| `IN_CHAIR` | `seatedAt`          |
| `DONE`     | `completedAt`       |

Moving backward in the queue flow requires `correctionReason`. The backend
appends it to `queueNotes` with a correction marker. For example, changing from
`IN_CHAIR` back to `WAITING` without a correction reason returns HTTP `400`.

### Update queue notes

Route:

```txt
PATCH /api/bff/clinics/{clinicId}/queue/{queueEntryId}/notes
```

Body:

```ts
interface UpdateQueueNotesBody {
  queueNotes?: string;
}
```

This route replaces queue notes. Omit `queueNotes` or send `""` only when the UI
intentionally clears the note.

## 6. Waiting-room endpoints

The waiting-room API is a board-oriented facade over appointment-service queue
state. It is separate from the compatibility `/queue` API so the UI can seat
patients, manage chairs, persist manual order, and consume one state document
without moving business rules into the Gateway.

All waiting-room paths below are relative to
`/api/bff/clinics/{clinicId}/waiting-room` in frontend code. Direct Gateway
paths use the same suffix under `/api/v1`.

| Method  | Path                        | Purpose                                      | Success response                |
| ------- | --------------------------- | -------------------------------------------- | ------------------------------- |
| `GET`   | `/`                         | Read board entries, chairs, and order mode   | `200 WaitingRoomStateResponse`  |
| `PATCH` | `/entries/{entryId}/status` | Move an entry through the waiting-room flow  | `200 QueueEntryDto`             |
| `PATCH` | `/entries/{entryId}/notes`  | Replace queue notes                          | `200 QueueEntryDto`             |
| `PATCH` | `/entries/{entryId}/chair`  | Change the assigned chair for a seated entry | `200 QueueEntryDto`             |
| `PATCH` | `/reorder`                  | Persist manual order or restore auto order   | `200 QueueEntriesListResponse`  |
| `GET`   | `/chairs`                   | List waiting-room chairs                     | `200 WaitingRoomChairsListResponse` |
| `POST`  | `/chairs`                   | Create a waiting-room chair                  | `201 WaitingRoomChairDto`       |
| `PATCH` | `/chairs/{chairId}`         | Rename, recode, activate, or deactivate chair | `200 WaitingRoomChairDto`       |

### Read waiting-room state

Route:

```txt
GET /api/bff/clinics/{clinicId}/waiting-room
```

The response contains the current queue entries, all clinic chairs with
computed availability, ordering metadata, and a `generatedAt` timestamp. Entries
created through `POST /queue` are included in this state.

Ordering is backend-authoritative:

1. Status flow: `ARRIVED`, `WAITING`, `IN_CHAIR`, `DONE`
2. If manual order exists for a status, `manualOrder` ascending
3. Priority: `EMERGENCY`, `URGENT`, `NORMAL`
4. Arrival time ascending
5. Created time ascending fallback

`ordering.mode` is `MANUAL` when at least one visible status column has a
persisted `manualOrder`; otherwise it is `AUTO`. `manualStatuses` lists the
status columns currently using manual order.

### Update waiting-room status

Route:

```txt
PATCH /api/bff/clinics/{clinicId}/waiting-room/entries/{entryId}/status
```

Body:

```ts
interface UpdateWaitingRoomStatusBody {
  status: QueueStatus;
  chairId?: string; // UUID, required when seating without an assigned chair
  correctionReason?: string;
  targetOrderedEntryIds?: string[]; // UUIDs for destination column order
}
```

The allowed flow is `ARRIVED -> WAITING -> IN_CHAIR -> DONE`. Moving backward
requires `correctionReason`; otherwise the backend returns HTTP `400`. Moving
to `IN_CHAIR` requires an active and available chair unless the entry already
has a valid chair assignment. When `targetOrderedEntryIds` is supplied, the
status update and destination-column manual ordering are persisted as one
waiting-room command.

The legacy queue route `PATCH /queue/{queueEntryId}/status` remains available,
but seating through that route can fail with HTTP `400` because it has no
`chairId` field. New waiting-room UI should use this route.

### Update waiting-room notes

Route:

```txt
PATCH /api/bff/clinics/{clinicId}/waiting-room/entries/{entryId}/notes
```

Body:

```ts
interface UpdateWaitingRoomNotesBody {
  queueNotes?: string;
}
```

This route delegates to the same backend note command as the compatibility
queue API after the Gateway verifies the queue entry belongs to the requested
clinic.

### Assign waiting-room chair

Route:

```txt
PATCH /api/bff/clinics/{clinicId}/waiting-room/entries/{entryId}/chair
```

Body:

```ts
interface AssignWaitingRoomChairBody {
  chairId: string; // required UUID
}
```

Chair assignment is available only for entries already in `IN_CHAIR`. The
backend rejects inactive chairs with HTTP `400` and occupied chairs with HTTP
`409`. The queue entry stores `chairName` as a snapshot so historical cards
remain readable if the chair is renamed later.

### Reorder waiting-room entries

Route:

```txt
PATCH /api/bff/clinics/{clinicId}/waiting-room/reorder
```

Body:

```ts
interface ReorderWaitingRoomBody {
  mode: 'AUTO' | 'MANUAL';
  status?: QueueStatus;
  orderedEntryIds?: string[]; // UUIDs
}
```

`mode: 'MANUAL'` requires `status` and a non-empty `orderedEntryIds` list. The
IDs must exactly match the entries currently in that clinic and status column.

`mode: 'AUTO'` clears persisted manual order for the supplied `status`. When
`status` is omitted, it clears all waiting-room status columns for the clinic
and restores priority/check-in-time ordering.

### Manage waiting-room chairs

Routes:

```txt
GET   /api/bff/clinics/{clinicId}/waiting-room/chairs
POST  /api/bff/clinics/{clinicId}/waiting-room/chairs
PATCH /api/bff/clinics/{clinicId}/waiting-room/chairs/{chairId}
```

Bodies:

```ts
interface CreateWaitingRoomChairBody {
  name: string; // required, max 100
  code?: string; // max 50
  isActive?: boolean;
}

interface UpdateWaitingRoomChairBody {
  name?: string; // max 100
  code?: string; // max 50
  isActive?: boolean;
}
```

Chair `code` is optional display metadata. If omitted, the backend stores an
empty string. Deactivated chairs remain listed for staff visibility but cannot
be assigned to a new `IN_CHAIR` move.

## 7. Expected errors

Frontend code should branch on HTTP status before reading a success shape.

| Status | Meaning                                                                                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Invalid UUID, invalid enum, invalid date, missing field, invalid timing, invalid clinic relationship, queue status rollback without correction reason, or inactive chair use |
| `401`  | No valid authenticated frontend session                                                                                                                                      |
| `403`  | Authenticated user is not allowed for this role or clinic scope                                                                                                              |
| `404`  | Appointment, queue entry, or chair was not found                                                                                                                             |
| `409`  | Doctor slot conflict, invalid appointment timing, appointment already checked in, or selected chair already occupied                                                         |
| `500`  | Unexpected appointment or waiting-room request failure                                                                                                                       |
| `502`  | BFF could not reach the API Gateway                                                                                                                                          |
| `503`  | API Gateway could not reach the appointment service                                                                                                                          |

Typical Gateway validation error:

```json
{
  "statusCode": 400,
  "message": ["doctorId must be a UUID"],
  "error": "Bad Request"
}
```

`message` can be a string or string array.

Recommended frontend error type:

```ts
interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

## 8. Queue realtime events

The appointment service writes queue changes to its service-owned outbox table.
When `NATS_URL` is configured, the appointment-service outbox relay publishes
pending queue events to NATS. The API Gateway subscribes to those NATS subjects
and exposes an authenticated SSE stream:

```txt
GET /events/queue?clinicId={clinicId}
```

The SSE route is intentionally outside the `/api/v1` prefix. It requires the
same JWT authentication strategy as Gateway HTTP routes and rejects requests
when the query `clinicId` does not match the authenticated `clinic_id` claim.

Queue event subjects:

| Subject                | Meaning                                                 |
| ---------------------- | ------------------------------------------------------- |
| `queue.checked_in`     | A patient was checked into the waiting room             |
| `queue.status.updated` | A queue entry changed visit-flow status                 |
| `queue.notes.updated`  | Queue notes were replaced                               |
| `queue.reordered`      | Manual or automatic queue ordering changed              |
| `queue.chair.assigned` | A seated queue entry was assigned to another chair      |
| `queue.chair.updated`  | A chair was created, renamed, activated, or deactivated |

SSE messages contain:

```ts
interface QueueStreamEvent {
  type:
    | 'queue.checked_in'
    | 'queue.status.updated'
    | 'queue.notes.updated'
    | 'queue.reordered'
    | 'queue.chair.assigned'
    | 'queue.chair.updated';
  clinic_id: string;
  entry?: Record<string, unknown>;
  entries?: Record<string, unknown>[];
  chair?: Record<string, unknown>;
  status?: QueueStatus;
}
```

Entry payloads use snake_case field names from the appointment-service outbox
and include queue entry data such as `chair_id`, `chair_name`, `manual_order`,
and `updated_at`. `queue.reordered` carries ordered `entries` and the affected
`status` when one status column changed. `queue.chair.assigned` carries both the
updated `entry` and assigned `chair`. `queue.chair.updated` carries `chair`.

The Gateway also sends periodic heartbeat messages with data `":heartbeat"`.

## 9. Frontend integration rules

1. Keep appointment-specific API functions, DTOs, mappers, schemas, hooks, and
   UI under `apps/frontend/src/features/appointments`.
2. Keep waiting-room-specific API functions, DTOs, mappers, hooks, and UI under
   `apps/frontend/src/features/waiting-room`.
3. Call only `/api/bff/clinics/{clinicId}/...` from client-side code.
4. Keep route strings centralized in the owning feature API layer.
5. Use the waiting-room state route for the board instead of combining queue
   and chair routes in UI components.
6. Use `/events/queue?clinicId={clinicId}` for live queue updates and merge
   supported events into the waiting-room cache.
7. Launch treatment from seated entries by navigating to `/visits/new` with
   `patientId`, `appointmentId`, `queueEntryId`, `chairId`, and `doctorId`.
   The treatment bounded context remains responsible for consuming and
   validating that handoff.
8. Keep backend DTOs at the API boundary and map them into frontend models.
9. Convert empty optional response strings to `null` if that is easier for UI
   code.
10. Convert date strings to `Date` values in frontend models, and send ISO
   strings back to the API.
11. Use the staff API to select doctors. Send the doctor's staff `userId` as
   `doctorId`.
12. Use the patient API to select patients. Send the selected patient's `id` as
   `patientId`.
13. Use `GET /appointments/conflicts` for proactive calendar warnings, but still
   handle `409` from create/update because the backend is authoritative.
14. Invalidate appointment list/detail queries after create, update,
    cancellation, or timing changes.
15. Invalidate queue and waiting-room state queries after check-in, status
    changes, note changes, chair changes, or reorder commands.
16. Do not expose direct appointment-service, gRPC, or Docker service URLs in
    frontend code.

## 10. Local verification reference

The appointment service was verified through the API Gateway after migration:

- `GET http://127.0.0.1:3001/health` returned API Gateway healthy.
- `GET http://127.0.0.1:3005/health` returned appointment service healthy.
- `POST /api/v1/clinics/{clinicId}/appointments` created an appointment.
- `GET /api/v1/clinics/{clinicId}/appointments` listed the appointment.
- `POST /api/v1/clinics/{clinicId}/queue` checked in the appointment.
- `GET /api/v1/clinics/{clinicId}/queue` listed the queue entry.
- Waiting-room automated verification passed on 2026-08-05:
  `pnpm nx test contracts-appointment --runInBand --silent`,
  `pnpm nx test appointment-service --runInBand --silent`,
  `pnpm nx test api-gateway --runInBand --silent`,
  `pnpm nx test frontend --runInBand --silent`,
  `pnpm nx build appointment-service`,
  `pnpm nx build api-gateway`,
  `pnpm nx lint frontend`, and
  `pnpm nx build frontend --skip-nx-cache`.
- Browser integration verification passed against
  `http://localhost:3000/waiting-room` with mocked authenticated session, BFF
  responses, and SSE for initial queue render, check-in event merge, notes
  save, chair seating, treatment launch, and horizontal overflow.

The Docker images for `appointment-service` and `api-gateway` were also built
successfully during the migration verification.

## 11. Known integration gaps

- There is no generated OpenAPI/Swagger contract. This Markdown file documents
  the implemented HTTP contract; the TypeScript DTOs and shared contracts remain
  the executable backend source of truth.
- Appointment and queue records store patient and doctor display snapshots.
  The frontend should choose these values from patient/staff APIs instead of
  letting users type unrelated names.
- Queue listing is currently an unpaginated clinic-wide list.
- Waiting-room SSE depends on `NATS_URL`. When NATS is not configured, HTTP
  routes still work and the Gateway logs that SSE queue events are disabled.
- `/visits/new` is a typed navigation handoff only. A future treatment feature
  should consume the query parameters and create or resume the clinical visit
  inside the treatment bounded context.
