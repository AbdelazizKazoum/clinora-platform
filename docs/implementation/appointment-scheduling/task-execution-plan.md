# Appointment Scheduling Task Execution Plan

Status: ready for implementation  
Created: 2026-08-02

## Purpose

This document breaks the
[appointment scheduling implementation plan](./implementation-plan.md) into
small, independently verifiable Codex tasks.

Complete and verify one task before starting the next one. Each task is scoped
so it can be implemented, reviewed, and stabilized before moving forward.

## Execution Checklist

- [x] Task 1. Confirm Ubold Calendar Dependencies
- [x] Task 2. Create Appointment Feature Skeleton
- [x] Task 3. Add Appointment Models And Rules
- [x] Task 4. Add Appointment DTOs And Mappers
- [x] Task 5. Add Appointment API Functions
- [x] Task 6. Add Appointment Query And Mutation Hooks
- [x] Task 7. Adapt Ubold Calendar Shell
- [x] Task 8. Connect Calendar Range Loading
- [x] Task 9. Add Doctor Provider Filtering
- [x] Task 10. Add Appointment Form Modal
- [x] Task 11. Connect Create And Update Flows
- [x] Task 12. Add Event Popover
- [x] Task 13. Add Inline Move And Resize Reschedule
- [x] Task 14. Add Cancellation Flow
- [ ] Task 15. Add Check-In Dialog
- [ ] Task 16. Polish Responsive Ubold Schedule UX
- [ ] Task 17. Final Integration Verification
- [ ] Task 18. Document Completion Notes

After finishing and verifying any task, check both the execution checklist and
testing checklist, then update every completed item before starting the next
task.

## Testing Checklist

- [x] Appointment timing rule tests cover valid timing, invalid timing, and
      duration calculations.
- [x] Conflict rule tests cover overlap, exact back-to-back appointments,
      cancelled/no-show exceptions, and emergency override behavior.
- [x] Appointment DTO mapper tests cover date conversion and empty optional
      string conversion.
- [x] Appointment API function tests cover BFF-relative paths, query params, and
      command bodies.
- [x] Query key and hook tests cover clinic/range/filter inputs and mutation
      invalidation.
- [x] Appointment form validation tests cover required patient, doctor,
      duration, start time, and derived end time behavior.
- [x] Calendar interaction tests cover inline move, inline resize, conflict
      failure, and event revert behavior.
- [ ] Check-in tests cover status eligibility, queue command mapping, and
      duplicate check-in errors.
- [ ] Final frontend verification runs `pnpm nx test frontend`.
- [ ] Final frontend verification runs `pnpm nx lint frontend`.
- [ ] Final frontend verification runs `pnpm nx build frontend`.

## Task 1. Confirm Ubold Calendar Dependencies

Goal: make the Ubold calendar reference buildable inside Clinora.

Instructions for Codex:

- Inspect the Ubold reference calendar files under
  `legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/calendar`.
- Inspect `apps/frontend/package.json`.
- Add only the FullCalendar packages needed for the schedule screen.
- Prefer the same FullCalendar package family used by Ubold.
- If resource doctor columns require an additional package, add it only if the
  license/package choice is acceptable for the project; otherwise document the
  fallback.

Expected output:

- `apps/frontend/package.json` and lockfile updated.
- No appointment feature code yet.

Verify:

```txt
pnpm install
pnpm nx build frontend
```

## Task 2. Create Appointment Feature Skeleton

Goal: create the Clinora feature boundary without implementing UI behavior yet.

Instructions for Codex:

- Create `apps/frontend/src/features/appointments`.
- Add only folders/files needed immediately:
  `api`, `components`, `hooks`, `model`, `schemas`, `index.ts`.
- Do not create empty deep folder trees.
- Add a minimal exported `AppointmentSchedulePage` component.
- Update `apps/frontend/src/app/(admin)/schedule/page.tsx` so it remains thin
  and renders the appointment feature page.

Expected output:

- Schedule route renders an appointment feature placeholder using Clinora/Ubold
  page structure.

Verify:

```txt
pnpm nx build frontend
```

## Task 3. Add Appointment Models And Rules

Goal: model appointment and queue check-in concepts for frontend use.

Instructions for Codex:

- Add appointment model types:
  `Appointment`, `AppointmentStatus`, `BookingChannel`.
- Add minimal queue check-in model types:
  `QueuePriority`, `QueueStatus`, and check-in command fields needed by the
  appointment screen.
- Add labels/class names for appointment statuses using Bootstrap/Ubold-friendly
  color classes.
- Add pure frontend rules:
  `canCheckInAppointment`, `isValidAppointmentTiming`,
  `calculateEndAtFromDuration`, `calculateDurationMinutes`,
  `appointmentsOverlap`, `isBlockingAppointment`, and `isBlockingOverlap`.
- Add appointment duration options such as 15, 30, 45, 60, and 90 minutes.
- Treat duration as a frontend scheduling control. The backend still receives
  `startAt` and `endAt`.
- Align blocking behavior with the backend: `CANCELLED` and `NO_SHOW` are not
  blocking.

Expected output:

- Types and rules under `features/appointments/model`.
- Focused tests for duration calculation, timing, overlap, and check-in
  eligibility.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

## Task 4. Add Appointment DTOs And Mappers

Goal: keep backend DTOs at the API boundary and map them into frontend models.

Instructions for Codex:

- Add DTOs matching `docs/api/appointment-service.md`.
- Add mappers from appointment response DTOs to `Appointment`.
- Convert ISO strings to `Date`.
- Convert empty optional response strings to `null`.
- Add command-to-body mappers only where the frontend command differs from the
  gateway body.

Expected output:

- DTOs under `features/appointments/api/dto`.
- Mappers under `features/appointments/model`.
- Tests covering empty string and date conversion.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

## Task 5. Add Appointment API Functions

Goal: connect the feature to the migrated appointment Gateway endpoints.

Instructions for Codex:

- Add `appointment-api-paths.ts`.
- Implement API queries:
  `listAppointments`, `getAppointment`, `checkAppointmentConflicts`.
- Implement API commands:
  `createAppointment`, `updateAppointment`, `rescheduleAppointment`,
  `cancelAppointment`, `checkInAppointment`.
- Use `apiClient` from `@/lib/api`.
- Use `/clinics/{clinicId}/appointments` and `/clinics/{clinicId}/queue`
  BFF-relative paths.
- Do not call `/api/v1` from frontend code.

Expected output:

- API functions under `features/appointments/api`.
- Focused tests for path generation and request body/query params.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

## Task 6. Add Appointment Query And Mutation Hooks

Goal: expose appointment server state through TanStack Query.

Instructions for Codex:

- Add appointment query keys.
- Add query hooks:
  `useAppointments`, `useAppointment`, `useAppointmentConflicts`.
- Add mutation hooks:
  `useCreateAppointment`, `useUpdateAppointment`,
  `useRescheduleAppointment`, `useCancelAppointment`,
  `useCheckInAppointment`.
- Invalidate the correct appointment and queue queries after mutations.
- Keep hooks under `features/appointments/hooks`.

Expected output:

- Hooks that UI components can consume without direct `fetch` or `apiClient`.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

## Task 7. Adapt Ubold Calendar Shell

Goal: build the schedule screen shell from the Ubold calendar reference.

Instructions for Codex:

- Start from Ubold's `CalendarPage.tsx` visual structure.
- Rebuild it inside `features/appointments/components`, not inside `app`.
- Use `react-bootstrap` `Card`, `CardBody`, `Button`, and existing wrappers
  such as `Icon` and `SimpleBar` where appropriate.
- Remove Ubold demo external events and mock data.
- Keep the calendar as the first usable screen.
- Use the existing calendar SCSS already present in Clinora.

Expected output:

- Schedule page shows the Ubold-style calendar shell.
- Calendar can switch views and respond to date clicks with local placeholder
  handlers.

Verify:

```txt
pnpm nx build frontend
```

## Task 8. Connect Calendar Range Loading

Goal: load real appointments for the visible FullCalendar range.

Instructions for Codex:

- Connect FullCalendar `datesSet` to `useAppointments`.
- Map appointments to FullCalendar events.
- Use appointment status for event color classes.
- Preserve pagination/query state internally; calendar range should request
  enough items for the visible period.
- Add loading and error states using Clinora feedback patterns.

Expected output:

- Real appointment events render from the BFF.

Verify:

```txt
pnpm nx build frontend
```

Manual check:

- Open `/schedule`.
- Confirm the calendar requests `/api/bff/clinics/{clinicId}/appointments`.

## Task 9. Add Doctor Provider Filtering

Goal: filter the calendar by active doctors using Clinora staff data.

Instructions for Codex:

- Reuse the staff feature public API/hook if available.
- Project active `DOCTOR` staff members into appointment providers.
- Use staff `userId` as `doctorId`.
- Add Ubold-style provider filter chips above the calendar.
- Prevent disabling the last visible provider.
- If FullCalendar resource columns are available, show doctors as day-resource
  columns. If not, keep provider filtering as the first iteration.

Expected output:

- Calendar can show/hide appointments by doctor.
- Doctor names and avatars/colors are visible in the schedule UI.

Verify:

```txt
pnpm nx build frontend
```

## Task 10. Add Appointment Form Modal

Goal: create and edit appointments through a Bootstrap/Ubold modal.

Instructions for Codex:

- Adapt Ubold `AddEditModal.tsx` structure, but replace generic event fields
  with appointment fields.
- Include patient selection, service/type, doctor, status, start time,
  user-selected duration, derived end time, channel, emergency override, phone,
  and notes.
- Duration must be user controlled, with common options such as 15, 30, 45, 60,
  and 90 minutes.
- When the user changes start time or duration, recalculate `endAt`.
- If manual end-time editing is exposed, recalculate/display duration from the
  selected start and end time.
- Use `react-bootstrap` form controls.
- Add frontend validation in `features/appointments/schemas`.
- Require an existing `patientId`.
- Do not implement inline patient creation in this task.

Expected output:

- Date click or New Appointment opens the modal.
- Existing appointment click can open the modal for editing.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

## Task 11. Connect Create And Update Flows

Goal: submit appointment form changes to the backend.

Instructions for Codex:

- Connect modal save to create/update mutation hooks.
- Validate timing before submit.
- Convert the user's selected duration into the backend `endAt` value before
  submit.
- For non-emergency appointments, call conflict check before submit.
- Still handle backend `409` errors and show a user-facing message.
- Invalidate appointment queries after success.
- Show success/error notifications using the existing notification pattern.

Expected output:

- Appointments can be created and edited from `/schedule`.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

Manual check:

- Create an appointment from the calendar.
- Refresh/list and confirm it stays visible.

## Task 12. Add Event Popover

Goal: provide quick appointment details and actions from calendar events.

Instructions for Codex:

- Adapt the legacy appointment event popover behavior into Bootstrap/Ubold
  styling.
- Show patient, service/type, status, doctor, date/time, emergency marker, and
  notes.
- Include actions for Edit and Check In when allowed.
- Keep action eligibility in `appointment.rules.ts`.

Expected output:

- Clicking an appointment shows a compact details/action popover.

Verify:

```txt
pnpm nx build frontend
```

## Task 13. Add Inline Move And Resize Reschedule

Goal: move and resize appointments directly inside the calendar without opening
the appointment modal.

Instructions for Codex:

- Connect FullCalendar `eventDrop` or equivalent event change handling to
  `useRescheduleAppointment`.
- Connect FullCalendar `eventResize` or equivalent resize handling to
  `useRescheduleAppointment`.
- Enable the FullCalendar options required for inline movement and duration
  resizing, such as `editable`, `eventStartEditable`, and
  `eventDurationEditable`.
- Preserve duration when moving events without explicit end time.
- When resizing an appointment, submit the resized `newEndAt` value instead of
  forcing a default duration or opening the modal.
- If moving to a doctor resource column, send that doctor `userId`.
- Check conflicts before submitting non-emergency moves.
- Revert the calendar event when movement or resize mutation fails.
- Do not open the appointment modal for normal inline move or resize actions.

Expected output:

- Drag/drop movement works and respects conflict handling.
- Inline resize works and persists the new appointment duration.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

Manual check:

- Move an appointment to a free slot.
- Resize an appointment from 30 minutes to 1 hour and confirm the updated end
  time persists.
- Try moving a non-emergency appointment into a conflicting slot and confirm it
  reverts.
- Try resizing a non-emergency appointment into a conflicting slot and confirm
  it reverts.

## Task 14. Add Cancellation Flow

Goal: replace legacy local delete with backend cancellation.

Instructions for Codex:

- Add cancellation action in the appointment modal or popover.
- Send `status: 'CANCELLED'`, `cancelledAt`, and optional
  `cancellationReason`.
- Do not remove the appointment locally without backend confirmation.
- Show cancelled appointments using the configured cancelled styling.

Expected output:

- Users can cancel appointments and cancelled appointments remain visible or
  filterable according to current product behavior.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

## Task 15. Add Check-In Dialog

Goal: check in an appointment into the queue from the schedule UI.

Instructions for Codex:

- Add check-in dialog with priority and arrival notes.
- Use selected appointment snapshots to build the queue check-in command.
- Submit to `POST /clinics/{clinicId}/queue`.
- Handle duplicate check-in `409` errors clearly.
- Invalidate queue-related appointment state as needed.

Expected output:

- Eligible appointments can be checked into the queue from the schedule screen.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
```

Manual check:

- Check in an appointment.
- Confirm the API call succeeds against `/api/bff/clinics/{clinicId}/queue`.

## Task 16. Polish Responsive Ubold Schedule UX

Goal: make the schedule screen feel production-ready.

Instructions for Codex:

- Verify desktop and mobile calendar layouts.
- Ensure toolbar buttons, modal text, form controls, event text, and filter
  chips do not overlap.
- Keep the UI dense and operational, not landing-page-like.
- Add empty states for no doctors and no appointments.
- Add loading skeletons/spinners where the current app pattern supports them.

Expected output:

- Schedule UI is usable and visually consistent with Ubold/Clinora.

Verify:

```txt
pnpm nx build frontend
```

Manual check:

- Open `/schedule` on desktop and mobile widths.

## Task 17. Final Integration Verification

Goal: verify the end-to-end schedule workflow.

Instructions for Codex:

- Run frontend tests and build.
- Start the needed backend services and frontend dev server.
- Confirm login/session has a `clinicId`.
- Test appointment create, list, edit, reschedule, cancel, and check-in through
  the UI.
- Confirm gateway requests use `/api/bff`, not direct `/api/v1`.

Verify:

```txt
pnpm nx test frontend
pnpm nx build frontend
pnpm nx build api-gateway
pnpm nx build appointment-service
```

Manual API/UI checks:

- Calendar loads appointments.
- New appointment persists.
- Edit persists.
- Conflict creates a clear error.
- Drag/drop success persists.
- Drag/drop failure reverts.
- Cancel persists.
- Check-in creates a queue entry.

## Task 18. Document Completion Notes

Goal: record what was implemented and any remaining gaps.

Instructions for Codex:

- Update this task file or create a short completion note in the same folder.
- Record package additions.
- Record implemented endpoints.
- Record verification commands and results.
- Record known follow-up work, especially waiting room/queue UI if not built.

Expected output:

- A concise implementation completion note for future maintainers.
