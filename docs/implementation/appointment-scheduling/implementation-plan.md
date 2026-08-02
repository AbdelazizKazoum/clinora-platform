# Appointment Scheduling Implementation Plan

Status: planning reference  
Created: 2026-08-02

## Goal

Build Clinora's appointment scheduling experience using the migrated
appointment service, the existing BFF/API Gateway contract, and the Ubold
calendar reference.

This plan extracts the useful appointment business behavior from the legacy
DentiFlow frontend and adapts it to Clinora's current frontend architecture.

## 1. Sources inspected

- Legacy appointment route:
  `legacy/dentiflow/frontend/old-dentiflow/src/app/[locale]/admin/(dashboard)/appointments/page.tsx`
- Legacy appointment page and UI:
  `legacy/dentiflow/frontend/old-dentiflow/src/presentation/admin/appointment`
- Legacy appointment domain/use cases:
  `legacy/dentiflow/frontend/old-dentiflow/src/domain/appointment`
  and `legacy/dentiflow/frontend/old-dentiflow/src/application/appointment`
- Legacy queue check-in behavior:
  `legacy/dentiflow/frontend/old-dentiflow/src/domain/queue`
  and `legacy/dentiflow/frontend/old-dentiflow/src/presentation/stores/queueStore.ts`
- Ubold calendar reference:
  `legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/calendar`
- Clinora frontend architecture:
  `docs/architecture/frontend.md`
- Current frontend route stub:
  `apps/frontend/src/app/(admin)/schedule/page.tsx`
- Migrated API contract:
  `docs/api/appointment-service.md`

## 2. Business behavior to keep

The legacy frontend has useful appointment workflow behavior, but it must be
rebuilt inside Clinora feature modules instead of copied directly.

Keep these behaviors:

- Calendar range loading: fetch appointments for the visible date range.
- Doctor/provider filtering: allow users to show or hide doctors without
  disabling the final visible doctor.
- Doctor resource scheduling: day view should show doctors as resources/columns.
- Create appointment from selected calendar slot.
- Create appointment from a New Appointment button with a user-editable duration.
- Let the user decide appointment duration, such as 15 minutes, 30 minutes,
  45 minutes, 1 hour, or a custom clinic-supported value.
- Store and submit appointment timing as `startAt` and `endAt`; duration is a
  frontend form/control concept derived from those two values unless the backend
  later adds a duration field.
- Edit appointment from calendar event details.
- Drag/drop reschedule by time and doctor directly inside the calendar, without
  opening the modal.
- Resize appointments directly inside the calendar to increase or decrease
  duration, without opening the modal.
- Persist inline calendar movement and resizing through the appointment timing
  endpoint by sending the updated `doctorId`, `newStartAt`, and `newEndAt`.
- Validate start/end time on the frontend before submitting.
- Proactively check conflicts for non-emergency appointments.
- Still handle backend `409` conflicts because the backend is authoritative.
- Allow emergency override to skip proactive conflict blocking.
- Use selected patient snapshots: `patientId`, `patientName`, `patientPhone`.
- Use selected doctor snapshots: staff `userId` as `doctorId`, plus `doctorName`.
- Appointment status drives visual color and check-in eligibility.
- Check in from appointment popover or edit modal for `PENDING` and `CONFIRMED`
  appointments.
- Check-in creates a queue entry with appointment snapshots, priority, notes,
  and optional arrival time.
- Queue rollback/correction logic belongs to the queue feature when the waiting
  room UI is built, but appointment check-in should already respect queue
  priority values.

## 3. Business behavior to change

These legacy details should not be migrated as-is:

- Do not use legacy direct `/api/v1` browser calls. Clinora must use
  `/api/bff/clinics/{clinicId}/...`.
- Do not use legacy snake_case request/response DTOs. The migrated Gateway uses
  camelCase.
- Do not copy legacy frontend repositories, use-case classes, DI containers, or
  global appointment stores. Clinora uses feature API functions and TanStack
  Query.
- Do not copy MUI appointment components into Clinora. Clinora is currently
  Bootstrap/Ubold styled.
- Do not keep the legacy "delete appointment" behavior as local-only removal.
  Backend has no hard delete appointment endpoint. Cancellation should be
  implemented as `PUT /appointments/{appointmentId}` with status `CANCELLED`,
  `cancelledAt`, and optional `cancellationReason`.
- Do not keep legacy patient free-text creation from the appointment form as a
  real booking path. The migrated backend requires a valid `patientId`; if a new
  patient is needed, create the patient through the patient feature first.

## 4. Target Clinora structure

Create the appointment feature under:

```txt
apps/frontend/src/features/appointments/
  api/
    appointment-api-paths.ts
    commands/
    dto/
    queries/
  components/
  hooks/
    commands/
    queries/
  model/
  schemas/
  utils/
  index.ts
```

Keep the route thin:

```txt
apps/frontend/src/app/(admin)/schedule/page.tsx
```

The page should compose an exported appointment feature component, for example
`AppointmentSchedulePage`.

Do not create a separate `queue` feature in the first appointment UI step unless
the waiting room page is also being implemented. For appointment check-in, keep
only the small queue command and DTOs needed by the appointment feature. Extract
a dedicated queue feature when building the waiting room UI.

## 5. API layer plan

Build appointment API functions against the BFF contract:

- `listAppointments(query)`:
  `GET /clinics/{clinicId}/appointments`
- `getAppointment(query)`:
  `GET /clinics/{clinicId}/appointments/{appointmentId}`
- `createAppointment(command)`:
  `POST /clinics/{clinicId}/appointments`
- `updateAppointment(command)`:
  `PUT /clinics/{clinicId}/appointments/{appointmentId}`
- `rescheduleAppointment(command)`:
  `PATCH /clinics/{clinicId}/appointments/{appointmentId}/timing`
- `checkAppointmentConflicts(query)`:
  `GET /clinics/{clinicId}/appointments/conflicts`
- `checkInAppointment(command)`:
  `POST /clinics/{clinicId}/queue`

Use the existing `apiClient` from `apps/frontend/src/lib/api/api-client.ts`.

DTOs must match `docs/api/appointment-service.md`. Mappers should convert:

- ISO strings to `Date`.
- Empty optional response strings to `null`.
- `queueNotes` to the frontend queue/check-in notes field where needed.

## 6. Model and rules plan

Recommended model files:

- `appointment.ts`: `Appointment`, `AppointmentStatus`, `BookingChannel`,
  labels, badge class names, calendar color class names.
- `appointment.commands.ts`: create, update, cancel, reschedule, check-in
  command types.
- `appointment.queries.ts`: list/calendar range/conflict query types.
- `appointment.mapper.ts`: DTO to domain and command to request body mappers.
- `appointment.rules.ts`: frontend-only rules:
  - `canCheckInAppointment`
  - `canRescheduleAppointment`
  - `calculateEndAtFromDuration`
  - `calculateDurationMinutes`
  - `isBlockingAppointment`
  - `appointmentsOverlap`
  - `isBlockingOverlap`
  - `isValidAppointmentTiming`
- `appointment-duration.ts`: duration options and labels.
- `appointment-query-keys.ts`: TanStack Query keys.
- `appointment-provider.ts`: doctor resource projection from staff members.

Important rule adaptation:

- The backend conflict check ignores `CANCELLED` and `NO_SHOW`.
- The legacy frontend considered only `CANCELLED` non-blocking.
- Clinora should align the frontend rule with the backend and treat both
  `CANCELLED` and `NO_SHOW` as non-blocking.

## 7. UI plan with Ubold calendar

Use Ubold's calendar page as the implementation reference for the schedule UI:

- Outlook-style main calendar area.
- Bootstrap cards, card body, modal, buttons, form controls, and subtle event
  color classes.
- FullCalendar toolbar with Today, Day, Week, Month, and List views.
- Existing Clinora/Ubold calendar SCSS in
  `apps/frontend/src/assets/scss/plugins/_calendar.scss`.

The implementation must start from these Ubold reference files:

```txt
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/calendar/page.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/calendar/components/CalendarPage.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/calendar/components/AddEditModal.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/calendar/components/data.ts
legacy/dentiflow/frontend/ubold-full-template-source-here/src/assets/scss/plugins/_calendar.scss
```

Adapt the useful Ubold calendar patterns into Clinora. Do not copy the Ubold
route, mock data, event categories, or folder structure into Clinora.

Use legacy DentiFlow's appointment screen for workflow guidance:

- Provider filter bar above the calendar.
- Status legend near the filter bar.
- Appointment event popover with edit and check-in actions.
- Appointment form modal with patient, service/type, doctor, status, time,
  duration, channel, emergency override, and notes.
- Check-in modal with priority and arrival notes.

Adapt these to Clinora's Bootstrap/Ubold style:

- Use `react-bootstrap` modal/form/button/card components.
- Use a duration select or segmented control with common options such as 15,
  30, 45, 60, and 90 minutes. Keep a path for custom minute values if product
  wants more flexibility.
- When the user changes `startAt` or duration, calculate `endAt`
  automatically.
- If the UI exposes manual `endAt` editing, recalculate/display duration from
  the selected start/end values.
- Use existing `Icon` wrapper or the app's icon pattern.
- Avoid MUI components.
- Keep cards at Ubold density and avoid nested cards.
- Keep the first schedule screen as the usable calendar, not a landing page.
- Keep the Clinora route file thin:
  `apps/frontend/src/app/(admin)/schedule/page.tsx` should only compose the
  appointment feature page and metadata.
- Place the adapted calendar implementation under
  `apps/frontend/src/features/appointments/components`, with API, hooks, model,
  schemas, and mappers in their matching appointment feature folders.

FullCalendar dependency note:

- `apps/frontend` does not currently declare FullCalendar packages.
- Add the required packages in the first implementation step:
  `@fullcalendar/core`, `@fullcalendar/react`, `@fullcalendar/daygrid`,
  `@fullcalendar/timegrid`, `@fullcalendar/list`,
  `@fullcalendar/interaction`.
- For doctor resource columns, also add a resource plugin such as
  `@fullcalendar/resource-timegrid` if the chosen package/license fits the
  project. If not, fall back to a week/day calendar plus doctor filters in the
  first iteration.

## 8. Integration sequence

1. Add appointment models, DTOs, mappers, API paths, and query keys.
2. Add appointment queries and commands using `apiClient`.
3. Add TanStack Query hooks for list/calendar range, create, update,
   reschedule, conflict check, cancellation, and check-in.
4. Add lightweight appointment schemas and form mappers.
5. Add FullCalendar dependencies and verify the calendar renders locally.
6. Replace the schedule route stub with a thin route that renders the
   appointment feature page.
7. Build the calendar shell using Ubold Bootstrap styling.
8. Add doctor/provider loading by reusing the staff feature public hook/API
   only if exported cleanly; otherwise compose staff data at the page/feature
   boundary without importing staff internals.
9. Add calendar range loading and status-based event rendering.
10. Add appointment form modal and patient selection.
11. Add create/update/cancel flows with query invalidation.
12. Add conflict check before save/reschedule and preserve backend `409`
    handling.
13. Add event popover and check-in dialog.
14. Add inline calendar move and resize rescheduling when FullCalendar
    interaction is verified.
15. Add focused tests for mappers, rules, API commands/queries, and critical
    form validation.
16. Run `pnpm nx lint frontend`, `pnpm nx test frontend`, and
    `pnpm nx build frontend`.

## 9. Testing strategy

Testing is required throughout the appointment scheduling implementation, not
only at the final verification step.

Add focused tests for:

- Appointment timing rules:
  - Valid start/end timing.
  - Invalid zero or negative duration.
  - Duration to `endAt` calculation.
  - `startAt` and `endAt` to duration calculation.
- Conflict rules:
  - True overlap is blocking.
  - Exact back-to-back boundary contact is allowed.
  - `CANCELLED` and `NO_SHOW` appointments are non-blocking.
  - Emergency appointments can bypass proactive frontend conflict blocking.
- Appointment DTO mappers:
  - ISO strings become `Date`.
  - Empty optional response strings become `null`.
  - Appointment status/channel values are preserved.
- API functions:
  - BFF-relative paths are used.
  - No frontend code calls `/api/v1` directly.
  - Query params match `docs/api/appointment-service.md`.
  - Create/update/reschedule/cancel/check-in bodies match the Gateway DTOs.
- Query hooks:
  - Query keys include clinic ID and range/filter inputs.
  - Mutations invalidate affected appointment and queue queries.
- Form validation:
  - Existing `patientId` is required.
  - Doctor is required and uses staff `userId`.
  - Duration is required and positive.
  - End time updates when start time or duration changes.
- Calendar interaction:
  - Event move calls reschedule with updated `newStartAt` and `newEndAt`.
  - Event resize calls reschedule with resized `newEndAt`.
  - Failed move/resize reverts the calendar event.
  - Conflict errors are shown without opening the modal.
- Check-in:
  - Only eligible appointment statuses show check-in.
  - Queue check-in body uses appointment snapshots.
  - Duplicate check-in `409` is displayed clearly.

Run these commands during and after implementation:

```txt
pnpm nx test frontend
pnpm nx lint frontend
pnpm nx build frontend
```

Final manual verification must cover create, list, edit, inline move, inline
resize, conflict rejection, cancellation, and check-in through the `/schedule`
UI.

## 10. Open decisions before implementation

- Confirm whether the first UI should be reachable at existing
  `/schedule` or a new `/appointments` route. The current Clinora route is
  `/schedule`.
- Confirm whether doctor resource columns are required in the first release.
  They provide the best appointment scheduling experience, but may require an
  additional FullCalendar resource package.
- Confirm whether a patient can be created inline from the appointment modal.
  The safe first version should require selecting an existing patient, with a
  link/action to open the patient intake modal.
- Confirm cancellation language and whether a cancellation reason is required
  by product, even though the backend currently treats it as optional.
- Confirm whether waiting room/queue management should be built immediately
  after appointment check-in or as a separate feature step.
