# Appointment Scheduling Completion Notes

Completed: 2026-08-04

## Summary

The appointment scheduling frontend is implemented under
`apps/frontend/src/features/appointments` and rendered by the thin Next.js
schedule route at `apps/frontend/src/app/(admin)/schedule/page.tsx`.

The schedule screen uses the Clinora frontend architecture with Ubold visual
patterns. Appointment state flows through TanStack Query hooks, frontend API
functions use the BFF-relative API client, and appointment domain rules remain
feature-local.

## Package Additions

The frontend added the Ubold-compatible FullCalendar package family:

- `@fullcalendar/core`
- `@fullcalendar/daygrid`
- `@fullcalendar/interaction`
- `@fullcalendar/list`
- `@fullcalendar/react`
- `@fullcalendar/timegrid`

No resource scheduler package was added. Doctor visibility is implemented with
provider filter chips; resource columns can be revisited if the product needs a
licensed resource scheduling view.

## Implemented Frontend Endpoints

Frontend appointment API functions call BFF-relative paths only:

- `GET /clinics/{clinicId}/appointments`
- `GET /clinics/{clinicId}/appointments/{appointmentId}`
- `POST /clinics/{clinicId}/appointments`
- `PUT /clinics/{clinicId}/appointments/{appointmentId}`
- `PATCH /clinics/{clinicId}/appointments/{appointmentId}/timing`
- `GET /clinics/{clinicId}/appointments/conflicts`
- `POST /clinics/{clinicId}/queue`

The frontend BFF proxy sends these to the gateway under `/api/v1`; schedule UI
code does not call `/api/v1` directly.

## Implemented Schedule Workflow

- Calendar range loading through `datesSet`.
- Appointment DTO mapping and date conversion at the API boundary.
- Doctor/provider filtering from active `DOCTOR` staff members.
- Create and edit modal with patient, doctor, timing, duration, channel,
  emergency override, phone, and notes fields.
- Conflict checks before non-emergency create/update/reschedule actions.
- Event popover with appointment details and actions.
- Inline drag/drop and resize rescheduling with failed-change reverts.
- Cancellation flow that persists `CANCELLED` status and reason.
- Check-in dialog that creates queue entries.
- Responsive Ubold polish, loading skeletons, and no-doctor/no-appointment
  empty states.

## Verification Results

Commands run with Nx daemon/cache disabled to avoid the local Windows Nx worker
cache flake observed during verification:

```txt
NX_DAEMON=false NX_SKIP_NX_CACHE=true pnpm nx test frontend --skip-nx-cache --output-style=stream
NX_DAEMON=false NX_SKIP_NX_CACHE=true pnpm nx lint frontend --skip-nx-cache --output-style=stream
NX_DAEMON=false NX_SKIP_NX_CACHE=true pnpm nx build frontend --skip-nx-cache --output-style=stream
NX_DAEMON=false NX_SKIP_NX_CACHE=true pnpm nx build api-gateway --skip-nx-cache --output-style=stream
NX_DAEMON=false NX_SKIP_NX_CACHE=true pnpm nx build appointment-service --skip-nx-cache --output-style=stream
```

Results:

- Frontend tests passed: 30 test suites, 112 tests.
- Frontend lint passed with 8 existing warnings in layout shell files.
- Frontend build passed and included `/schedule`.
- API gateway build passed.
- Appointment service build passed.

Manual integration verification used the local Docker backend stack and the
frontend dev server on `http://localhost:3000`.

Verified:

- Backend services were healthy.
- Authenticated frontend session contained `clinicId`.
- Schedule loaded appointments through `/api/bff`.
- Create persisted and appeared in list results.
- Edit persisted.
- Conflict check showed the expected user-facing conflict message.
- Drag/drop success persisted via appointment timing update.
- Drag/drop conflict returned `hasConflict: true` and reverted the UI change.
- Cancellation persisted.
- Check-in created a queue entry.
- No frontend schedule request called `/api/v1` directly.

## Known Follow-Ups

- Replace manual patient ID entry with a real patient picker/autocomplete.
- Consider doctor resource columns if licensed FullCalendar resource scheduling
  becomes a product requirement.
- Expand waiting-room/queue UI beyond appointment check-in if queue operations
  need full operational coverage from the schedule/waiting room surfaces.
- Clean up local Task 17 verification data from the development database if a
  pristine local seed state is needed.
