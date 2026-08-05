# Waiting Room Completion Notes

Status: Complete  
Completed: 2026-08-05

## Summary

The waiting room is delivered as a realtime patient-flow board owned by the
appointment bounded context. The implementation keeps queue status movement,
manual ordering, chair assignment, chair availability, notes, and queue events
inside the appointment service. The API Gateway exposes a waiting-room HTTP
facade and enforces role and clinic-scope access. The frontend consumes those
routes through the same-origin BFF from
`apps/frontend/src/features/waiting-room`.

## Delivered Behavior

- Clinic staff can view live queue entries in `ARRIVED`, `WAITING`,
  `IN_CHAIR`, and `DONE` columns.
- Admins, secretaries, and dental assistants can move entries through the
  waiting-room flow, edit notes, assign chairs, and reorder queue columns.
- Doctors can read the waiting-room board and chair state but do not get
  mutation controls.
- Moving backward in the flow requires a correction reason.
- Moving to `IN_CHAIR` requires an active and available chair.
- Chair names are snapshotted on queue entries so seated or historical entries
  stay readable after chair rename.
- Manual ordering is persisted by the appointment service and reconciled across
  clients through REST responses and queue SSE events.
- Auto reorder clears manual positions and restores priority/check-in-time
  ordering.
- Seated entries can launch treatment through `/visits/new` with
  `patientId`, `appointmentId`, `queueEntryId`, `chairId`, and `doctorId`.

## Endpoint Changes

The compatibility queue API remains available:

```txt
GET   /api/bff/clinics/{clinicId}/queue
POST  /api/bff/clinics/{clinicId}/queue
GET   /api/bff/clinics/{clinicId}/queue/{queueEntryId}
PATCH /api/bff/clinics/{clinicId}/queue/{queueEntryId}/status
PATCH /api/bff/clinics/{clinicId}/queue/{queueEntryId}/notes
```

The waiting-room BFF/API Gateway surface is:

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

Direct Gateway routes use the same suffixes under `/api/v1`.

The appointment gRPC contract now includes waiting-room methods for state,
status movement, chair assignment, reorder, chair listing, chair creation, and
chair update. `QueueEntryReply` was extended additively with `chair_id`,
`chair_name`, and optional `manual_order`.

## Persistence Changes

Appointment-service migrations added:

- `20260804000001-CreateWaitingRoomChairs.ts`: creates the `chairs` table with
  `clinic_id`, `name`, `code`, `is_active`, `created_at`, and `updated_at`.
- `20260804000002-AddWaitingRoomQueueFields.ts`: adds `chair_id`,
  `chair_name`, and `manual_order` to `queue_entries`, plus indexes for
  clinic/status/manual order and clinic/chair/status lookups.

The appointment service continues to own these entities and migrations. No
shared database entities were introduced.

## Events

The appointment-service outbox and Gateway SSE stream support:

```txt
queue.checked_in
queue.status.updated
queue.notes.updated
queue.reordered
queue.chair.assigned
queue.chair.updated
```

Gateway SSE is exposed at:

```txt
GET /events/queue?clinicId={clinicId}
```

The route requires JWT authentication and clinic-scope matching. When
`NATS_URL` is not configured, HTTP routes still work and queue SSE delivery is
disabled.

## Installed Packages

- `@hello-pangea/dnd@18.0.1` in `apps/frontend/package.json` for accessible
  Kanban-style drag and drop.

## Verification

Task 15 final verification passed on 2026-08-05:

```txt
pnpm nx test contracts-appointment --runInBand --silent
pnpm nx test appointment-service --runInBand --silent
pnpm nx test api-gateway --runInBand --silent
pnpm nx test frontend --runInBand --silent
pnpm nx build appointment-service
pnpm nx build api-gateway
pnpm nx lint frontend
pnpm nx build frontend --skip-nx-cache
```

Frontend lint passed with 0 errors and the existing 8 shared layout/template
warnings.

Browser integration verification passed at
`http://localhost:3000/waiting-room` with mocked authenticated session, BFF
responses, and SSE. Covered flows included initial queue render, schedule
check-in via `queue.checked_in`, notes save, chair seating, treatment launch,
and horizontal overflow.

Task 16 documentation verification:

```txt
pnpm nx test contracts-appointment --runInBand --silent
```

## Known Follow-Up Work

- Generate OpenAPI/Swagger documentation when the Gateway has a documented
  generation workflow.
- Build the treatment feature that consumes `/visits/new` handoff parameters
  and creates or resumes the visit inside the treatment bounded context.
- Replace mocked browser integration with seeded local end-to-end fixtures when
  stable test data and auth helpers are available.
- Consider paginating or date-filtering queue state if clinics need historical
  waiting-room review beyond the current operational board.
