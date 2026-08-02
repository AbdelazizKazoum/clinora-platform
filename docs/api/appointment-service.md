# Appointment API contract for frontend integration

Status: HTTP routes implemented with authenticated role and clinic-scope access  
Last verified: 2026-08-02

This document is the frontend-facing HTTP contract for the appointment bounded
context. The appointment service owns appointment scheduling, doctor conflict
checks, patient check-in, and the daily clinic queue.

The browser must not call the appointment service gRPC API directly. Frontend
code should call the same-origin BFF, which forwards to the API Gateway. The API
Gateway then calls the appointment service through gRPC.

Implementation sources:

- API Gateway appointment controllers:
  `apps/backend/api-gateway/src/modules/appointments`
- API Gateway appointment validation DTOs:
  `apps/backend/api-gateway/src/modules/appointments/dto`
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

| Capability | Allowed roles |
| ---------- | ------------- |
| List/get appointments | `admin`, `doctor`, `secretary`, `dental_assistant` |
| Create/update/reschedule appointments | `admin`, `doctor`, `secretary` |
| Check appointment conflicts | `admin`, `doctor`, `secretary` |
| List/get queue entries | `admin`, `doctor`, `secretary`, `dental_assistant` |
| Check in a patient | `admin`, `secretary`, `dental_assistant` |
| Update queue status or notes | `admin`, `secretary`, `dental_assistant` |

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
  arrivedAt: string;
  calledAt: string;
  seatedAt: string;
  completedAt: string;
  updatedAt: string;
}

interface QueueEntriesListResponse {
  queueEntries: QueueEntryDto[];
}
```

Response notes:

- Date/time response fields are ISO 8601 strings.
- Absent optional scalar values are returned as `""`, not `null`. This applies
  to `patientPhone`, `type`, `notes`, `cancelledAt`, `cancellationReason`,
  `createdBy`, `appointmentType`, `queueNotes`, `calledAt`, `seatedAt`, and
  `completedAt`.
- Map empty strings to `null` at the feature API boundary if the UI model
  prefers nullable values.
- Convert date strings to `Date` only in frontend models, not in raw DTO types.

## 4. Appointment endpoints

All appointment paths below are relative to
`/api/bff/clinics/{clinicId}/appointments` in frontend code.

| Method | Path | Purpose | Success response |
| ------ | ---- | ------- | ---------------- |
| `GET` | `/` | List and filter appointments | `200 AppointmentsListResponse` |
| `POST` | `/` | Create an appointment | `201 AppointmentDto` |
| `GET` | `/conflicts` | Check whether a doctor has a conflicting slot | `200 ConflictResponse` |
| `GET` | `/{appointmentId}` | Get one appointment | `200 AppointmentDto` |
| `PUT` | `/{appointmentId}` | Partially update an appointment | `200 AppointmentDto` |
| `PATCH` | `/{appointmentId}/timing` | Move an appointment to a new doctor/time slot | `200 AppointmentDto` |

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

| Query field | Type | Rules and behavior |
| ----------- | ---- | ------------------ |
| `page` | integer | Minimum `1`; default `1` |
| `limit` | integer | `1..100`; default `50` |
| `startDate` | ISO date string | Lower date bound. With `endDate`, returns appointments overlapping the range |
| `endDate` | ISO date string | Upper date bound. With `startDate`, returns appointments overlapping the range |
| `doctorId` | UUID | Filters by doctor staff user ID |
| `status` | `AppointmentStatus` | Exact enum filter |

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

| Query field | Type | Rules and behavior |
| ----------- | ---- | ------------------ |
| `doctorId` | UUID | Required doctor staff user ID |
| `startAt` | ISO date string | Required proposed start |
| `endAt` | ISO date string | Required proposed end, must be after `startAt` |
| `excludeStatus` | `AppointmentStatus` | Optional status to ignore |
| `excludeAppointmentId` | UUID | Optional appointment to ignore while editing |

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

| Method | Path | Purpose | Success response |
| ------ | ---- | ------- | ---------------- |
| `GET` | `/` | List current clinic queue | `200 QueueEntriesListResponse` |
| `POST` | `/` | Check in a patient for an appointment | `201 QueueEntryDto` |
| `GET` | `/{queueEntryId}` | Get one queue entry | `200 QueueEntryDto` |
| `PATCH` | `/{queueEntryId}/status` | Move a queue entry through the visit flow | `200 QueueEntryDto` |
| `PATCH` | `/{queueEntryId}/notes` | Replace queue notes | `200 QueueEntryDto` |

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

| Status | Timestamp field set |
| ------ | ------------------- |
| `WAITING` | `calledAt` |
| `IN_CHAIR` | `seatedAt` |
| `DONE` | `completedAt` |

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

## 6. Expected errors

Frontend code should branch on HTTP status before reading a success shape.

| Status | Meaning |
| ------ | ------- |
| `400` | Invalid UUID, invalid enum, invalid date, missing field, invalid timing, invalid clinic relationship, or queue status rollback without correction reason |
| `401` | No valid authenticated frontend session |
| `403` | Authenticated user is not allowed for this role or clinic scope |
| `404` | Appointment or queue entry was not found |
| `409` | Doctor slot conflict, invalid appointment timing, or appointment already checked in |
| `500` | Unexpected appointment request failure |
| `502` | BFF could not reach the API Gateway |
| `503` | API Gateway could not reach the appointment service |

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

## 7. Frontend integration rules

1. Keep appointment-specific API functions, DTOs, mappers, schemas, hooks, and
   UI under `apps/frontend/src/features/appointments`.
2. Call only `/api/bff/clinics/{clinicId}/...` from client-side code.
3. Keep route strings centralized in the appointment feature API layer.
4. Keep backend DTOs at the API boundary and map them into frontend models.
5. Convert empty optional response strings to `null` if that is easier for UI
   code.
6. Convert date strings to `Date` values in frontend models, and send ISO
   strings back to the API.
7. Use the staff API to select doctors. Send the doctor's staff `userId` as
   `doctorId`.
8. Use the patient API to select patients. Send the selected patient's `id` as
   `patientId`.
9. Use `GET /appointments/conflicts` for proactive calendar warnings, but still
   handle `409` from create/update because the backend is authoritative.
10. Invalidate appointment list/detail queries after create, update,
    cancellation, or timing changes.
11. Invalidate queue list/detail queries after check-in, queue status changes,
    or note changes.
12. Do not expose direct appointment-service, gRPC, or Docker service URLs in
    frontend code.

## 8. Local verification reference

The appointment service was verified through the API Gateway after migration:

- `GET http://127.0.0.1:3001/health` returned API Gateway healthy.
- `GET http://127.0.0.1:3005/health` returned appointment service healthy.
- `POST /api/v1/clinics/{clinicId}/appointments` created an appointment.
- `GET /api/v1/clinics/{clinicId}/appointments` listed the appointment.
- `POST /api/v1/clinics/{clinicId}/queue` checked in the appointment.
- `GET /api/v1/clinics/{clinicId}/queue` listed the queue entry.

The Docker images for `appointment-service` and `api-gateway` were also built
successfully during the migration verification.

## 9. Known integration gaps

- There is no generated OpenAPI/Swagger contract. This Markdown file documents
  the implemented HTTP contract; the TypeScript DTOs and shared contracts remain
  the executable backend source of truth.
- Appointment and queue records store patient and doctor display snapshots.
  The frontend should choose these values from patient/staff APIs instead of
  letting users type unrelated names.
- Queue listing is currently an unpaginated clinic-wide list.
