# Staff Management Implementation Plan

## Goal

Build Clinora's staff management experience for clinic administrators.

The finished workflow should let an authorized administrator:

- View the clinic's staff members.
- Understand total, active, on-leave, and inactive counts.
- Search and filter staff by role and status.
- Create a staff member and the corresponding login account through one
  backend operation.
- Edit staff profile information.
- Change a staff member's operational status safely.

Implement the work incrementally. Complete and verify one task before starting
the next task.

## Implementation Status

- [x] Task 1: Define and enforce the staff identity lifecycle
- [x] Task 2: Expose staff management through the API Gateway
- [x] Task 3: Add role-aware access control for staff management
- [ ] Task 4: Add TanStack Query infrastructure to the frontend
- [x] Task 5: Create the frontend staff data boundary
- [x] Task 6: Build the read-only staff management page
- [x] Task 7: Build the create-staff workflow
- [x] Task 8: Add edit and status-management actions
- [x] Task 9: Decide and implement the removal policy
- [x] Task 10: Add staff-management test coverage and final UX hardening

## Architectural Direction

Staff management belongs to the clinic bounded context. Authentication owns
credentials and login identity, while the clinic service owns the staff
profile, clinic membership, role assignment, and operational status.

The browser must not call the auth service and clinic service separately.
Creating or managing a staff identity must be represented as one operation at
the API Gateway:

```txt
Staff UI
  -> same-origin BFF
  -> API Gateway
  -> Clinic service
  -> Auth service when the identity must be created or updated
```

The frontend should use the authenticated session's clinic ID as UI/request
context. The API Gateway and downstream services must still validate tenant
access from authenticated claims. A browser-provided clinic ID is never an
authorization source of truth.

## Frontend Architecture Rules

Follow `docs/architecture/frontend.md`.

- Keep App Router pages under `apps/frontend/src/app`.
- Keep route pages thin and limited to metadata and feature composition.
- Put staff-specific UI, API code, DTOs, models, mappers, schemas, hooks, and
  rules under `apps/frontend/src/features/staff`.
- Use the feature's `index.ts` as its public API.
- Do not put staff server state in a root Zustand store.
- Use TanStack Query for staff server state.
- Keep backend response DTOs at the staff API boundary.
- Map response DTOs into frontend domain models before UI code consumes them.
- Keep dates as `Date` values in the frontend model and serialized strings in
  DTOs.
- Convert empty transport strings for optional values into `null`.
- Do not import implementation details from another frontend feature.
- Do not create a shared frontend library unless real cross-application reuse
  exists.
- Keep `'use client'` boundaries as low as practical.
- Treat frontend permission checks as UX only. The backend must enforce every
  security-sensitive rule.

Target route composition:

```txt
apps/frontend/src/app/(admin)/staff/page.tsx
  -> StaffPage from @/features/staff

apps/frontend/src/app/(admin)/staff/new/page.tsx
  -> CreateStaffPage from @/features/staff
```

Target feature structure:

```txt
apps/frontend/src/features/staff/
  api/
    commands/
    dto/
    queries/
    staff-api-paths.ts
  components/
  hooks/
    commands/
    queries/
  model/
  pages/
  schemas/
  index.ts
```

Create only the folders and files required by the current task. Do not scaffold
the entire target structure in advance.

## Domain And Display Rules

Supported roles:

- `SECRETARY` -> Secretary
- `DENTAL_ASSISTANT` -> Dental Assistant
- `DOCTOR` -> Doctor
- `ADMIN` -> Administrator

Supported staff statuses:

- `active` -> Active
- `on-leave` -> On Leave
- `inactive` -> Inactive

Recommended lifecycle invariant:

- `status` is the canonical staff status exposed to the frontend.
- Active staff can authenticate.
- On-leave staff remain part of the clinic and can authenticate unless a future
  policy explicitly changes this.
- Inactive staff cannot authenticate or refresh a session.
- The frontend must not independently update both `status` and `isActive`.
- While `isActive` remains in the backend contract, the backend should derive or
  enforce it from the canonical lifecycle rule.

The summary counts must be calculated from the complete staff list, not from the
currently filtered card collection.

## UX Direction

Preserve the useful structure of the previous DentiFlow screen while adapting
it to Clinora and Ubold:

```txt
Staff Management                            [ + Add Staff Member ]

[ Total Staff ] [ Active ] [ On Leave ] [ Inactive ]

[ Search name, email, specialization... ] [ Roles ] [ Status ]

[ Staff card ] [ Staff card ] [ Staff card ]
[ Staff card ] [ Staff card ] [ Staff card ]
```

Responsive behavior:

- Large desktop: three staff cards per row.
- Tablet: two staff cards per row.
- Mobile: one card per row.
- Summary cards: four columns on desktop, two by two on tablet, and stacked when
  necessary.
- Toolbar controls wrap cleanly and remain keyboard accessible.

Each staff card should display:

- Avatar or initials fallback.
- Full name.
- Specialization when present.
- Role badge.
- Status badge.
- Email.
- Phone when present.
- Joined date.
- An actions dropdown when the current user is allowed to manage the member.

Use centralized role/status label and badge-style mappings. Do not duplicate
those mappings in multiple components.

## Ubold References

Use these files as visual and interaction references only:

```txt
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/crm/contacts/page.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/users/contacts/page.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/users/account-settings/page.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/apps/users/roles/components/UsersTable.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/widgets/components/StatisticCard4.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/form/layout/components/LayoutForm.tsx
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/form/validation/components/CustomValidation.tsx
```

Adapt:

- Bootstrap `Card`, `CardBody`, `CardHeader`, `Row`, and `Col`.
- Ubold avatar and initials patterns.
- Subtle role and status badges.
- `app-search` styling with Clinora's `Icon` wrapper.
- React Bootstrap `Dropdown` for staff actions.
- Account settings page structure for a full-page staff/account form.
- Form row, select, password, and action alignment patterns from Ubold forms.
- Ubold form validation feedback.
- Clinora's existing `PageBreadcrumb` and notification system.

Do not copy:

- Demo data.
- CRM statistics unrelated to clinic staff.
- Message/follow actions.
- Fake navigation.
- Ubold's route or folder organization.
- Client-side deletion behavior from template examples.
- Account-settings hero imagery, social links, address sections, and unrelated
  profile settings.

Do not use Ubold's `MemberRoleCard` for individual staff members. That component
represents role definitions and may be useful only for a future roles and
permissions page.

## Navigation Naming

Use concise, task-oriented sidebar labels. Avoid repeating the parent concept in
child labels.

Recommended staff sidebar naming:

```txt
Staff
  Directory
  Add Member
```

Use fuller labels in page titles and buttons where extra clarity helps:

```txt
Staff Management
Add Staff Member
Create Staff Member
```

Avoid nested sidebar labels such as `Staff > Staff Members > Add Staff Member`
because they are redundant and scan poorly.

## Current Backend Readiness

The clinic contract currently supports:

- Get a staff member by user ID.
- List staff members.
- Create a staff member.
- Update a staff member.
- Delete a staff member.

The create use case already asks the auth service to create the login identity
before it saves the staff profile.

Readiness notes before exposing all UI actions:

- Staff route authorization is enforced in the API Gateway for authenticated
  admins scoped to the route clinic.
- Staff frontend navigation and route access are filtered through the auth
  feature access policy.
- Permanent staff deletion is disabled. Staff removal is represented by setting
  status to `inactive`, which disables the synchronized auth identity while
  retaining the clinic profile.

Do not expose permanent deletion to the frontend unless a future architecture
decision defines coordinated auth cleanup, session invalidation, and audit
retention.

## API Shape

Frontend-facing API guide:

- [Clinic and staff API contract](../../api/clinic-service.md)

Recommended API Gateway routes:

```txt
GET   /clinics/:clinicId/staff
POST  /clinics/:clinicId/staff
GET   /clinics/:clinicId/staff/by-user/:userId
PATCH /clinics/:clinicId/staff/:staffMemberId
```

Do not expose permanent deletion to the frontend. Use `PATCH` with status
`inactive` for staff removal.

The initial list operation may return the complete clinic staff list. Local
search and filtering are acceptable for the first release because individual
dental clinics normally have small teams. Add server-side search, filtering,
sorting, and pagination only when real scale requires them.

## Implementation Tasks

### Task 1: Define And Enforce The Staff Identity Lifecycle

Detailed execution plan:

- [Task 1 auth foundation and staff identity lifecycle](./task-1-execution-plan.md)

Why:

The staff profile and auth identity currently risk becoming inconsistent.
Frontend actions must not be built on ambiguous lifecycle behavior.

Scope:

- Make `status` the canonical lifecycle field, or document a different explicit
  invariant if requirements demand it.
- Ensure `inactive` prevents new login and refresh operations.
- Define whether existing access tokens are revoked immediately or expire
  naturally within a documented short period.
- Keep `on-leave` behavior explicit.
- Synchronize role, email, and full-name changes with the auth service.
- Add a compensation strategy when auth registration succeeds but staff-profile
  creation fails.
- Add backend rules preventing an administrator from disabling the last active
  administrator in a clinic.
- Add backend rules for self-deactivation if it is not allowed.
- Add focused clinic-service and auth-service tests.

Out of scope:

- API Gateway controllers.
- Frontend code.
- Permanent deletion UI.

Acceptance criteria:

- A staff profile and auth identity cannot silently disagree about email, role,
  name, or account availability.
- Inactive staff cannot establish or refresh an authenticated session.
- Failure during staff creation does not leave an unmanaged login account.
- Lifecycle rules have automated tests.

### Task 2: Expose Staff Management Through The API Gateway

Depends on Task 1.

Scope:

- Add the clinic gRPC client and client module to the API Gateway.
- Add a staff facade that maps gRPC failures to appropriate HTTP errors.
- Add request DTOs with validation.
- Add list, create, get-by-user, and update controller endpoints.
- Keep `clinicId` in the URL and staff member IDs in resource paths.
- Register the new gateway module intentionally in `app.module.ts`.
- Add API Gateway unit tests for success and error mapping.
- Add required clinic-service connection environment validation.

Out of scope:

- Frontend code.
- Permanent delete endpoint.
- Working-hours and unrelated clinic endpoints.

Acceptance criteria:

- The staff contract is reachable through HTTP from the BFF path.
- Validation errors, conflicts, not-found responses, and dependency failures map
  to stable HTTP responses.
- No business logic is moved into the API Gateway.

### Task 3: Add Role-Aware Access Control For Staff Management

Depends on Task 2.

Execution plan:

- [Task 3 role-aware access control](./task-3-execution-plan.md)

Scope:

- Require an authenticated `admin` role for staff create and update operations.
- Decide whether non-admin clinic staff may read the staff directory; default to
  admin-only until a product requirement says otherwise.
- Validate that `:clinicId` belongs to the authenticated tenant claims.
- Hide Staff navigation entries from roles that cannot access the page.
- Add a frontend route-level role guard that renders or redirects to the
  existing 403 experience.
- Keep backend authorization as the security boundary.
- Add authorization tests covering wrong-role and wrong-clinic requests.

Out of scope:

- General-purpose permissions management.
- Dynamic permission matrices.
- A new authorization microservice.

Acceptance criteria:

- A user cannot access another clinic by changing a browser URL or request body.
- Unauthorized roles cannot mutate staff through direct HTTP calls.
- Navigation and route behavior match backend access rules.

### Task 4: Add TanStack Query Infrastructure To The Frontend

Depends on Task 3 only for implementation order; it can be developed
independently when necessary.

Scope:

- Add `@tanstack/react-query` to the frontend with `pnpm`.
- Add one application-level Query client provider under the appropriate shared
  technical/provider location.
- Compose it into `apps/frontend/src/app/providers.tsx`.
- Configure conservative defaults appropriate for authenticated clinic data.
- Ensure logout/session changes cannot display another user's cached clinic
  data.
- Add a small provider-level test if useful.

Out of scope:

- Migrating the patients feature from Zustand.
- Adding staff API functions.
- Adding React Query Devtools to production.

Acceptance criteria:

- Feature query hooks can run inside the existing application provider tree.
- No access or refresh tokens are exposed to the Query cache.
- The frontend builds and existing authentication behavior remains intact.

### Task 5: Create The Frontend Staff Data Boundary

Depends on Tasks 2-4.

Scope:

- Create the smallest necessary `features/staff` structure.
- Define `StaffMember`, `StaffRole`, and `StaffStatus` frontend model types.
- Define response DTOs that exactly match the API Gateway JSON.
- Map DTO string dates to `Date`.
- Map empty optional strings to `null`.
- Centralize role and status labels/styles.
- Add `staff-api-paths.ts`.
- Add the list-staff query function.
- Add a TanStack Query key factory local to the staff feature.
- Add `useStaffMembers`.
- Export only the required public API from `features/staff/index.ts`.
- Add mapper and API-boundary unit tests.

Out of scope:

- Rendering the page.
- Create/update commands.
- A staff Zustand store.

Acceptance criteria:

- UI code can consume a typed `StaffMember[]` without knowing transport details.
- Staff query keys include clinic scope.
- Optional values and dates are mapped consistently.
- The feature does not import patient-feature implementation details.

### Task 6: Build The Read-Only Staff Management Page

Depends on Task 5.

Scope:

- Replace the placeholder `/staff` route with thin `StaffPage` composition.
- Add the page heading and Add Staff Member link.
- Add total, active, on-leave, and inactive summary cards.
- Add local search by name, email, phone, and specialization.
- Add role and status filtering.
- Add the responsive staff-card grid.
- Add avatar initials fallback.
- Add loading skeletons.
- Add initial empty, filtered-empty, error, and retry states.
- Ensure summary cards use the complete list rather than filtered results.
- Keep the actions dropdown absent or read-only until Task 8.

Out of scope:

- Creating staff.
- Editing staff.
- Status mutations.
- Pagination.
- Grid/table switching.

Acceptance criteria:

- The page matches Clinora's Ubold styling direction.
- It displays three cards per row on large screens, two on tablet, and one on
  mobile.
- Search and filters can be used together and can be cleared.
- Loading does not cause a large layout jump.
- Keyboard and screen-reader users can understand the controls and badges.

### Task 7: Build The Create-Staff Workflow

Depends on Task 6.

Scope:

- Replace the placeholder `/staff/new` route with thin `CreateStaffPage`
  composition.
- Implement staff creation as a dedicated full page, not a modal or offcanvas,
  because it creates both a staff profile and a login identity.
- Use Ubold's `apps/users/account-settings/page.tsx` as the primary visual
  reference for the full-page account form structure.
- Use Ubold's `form/validation/components/CustomValidation.tsx` for validation
  feedback patterns.
- Use Ubold's `form/layout/components/LayoutForm.tsx` only for small form-row,
  select, password, and action alignment details.
- Build a staff-owned form and validation schema.
- Support first name, last name, email, optional phone, role, optional
  specialization, optional avatar URL, password, and password confirmation.
- Do not show a status field because new members are created as active.
- Show specialization conditionally or explain it when the selected role is
  Doctor.
- Treat avatar as a URL until a real upload strategy exists.
- Submit one create-staff command through the BFF.
- Never log, persist, or cache the plaintext password.
- Disable duplicate submission while the request is pending.
- Map backend validation and conflict errors into useful form feedback.
- On success, invalidate the clinic staff query, show a notification, and return
  to `/staff`.
- Add form and command tests.

Out of scope:

- Email invitations.
- File upload.
- Editing an existing member.
- Admin-generated permanent password storage.

Acceptance criteria:

- One successful form submission creates both the login identity and staff
  profile through the backend workflow.
- Duplicate emails produce useful feedback.
- Password confirmation never leaves the browser.
- Successful creation appears on the staff page without a full browser reload.

Future recommendation:

Replace administrator-selected passwords with an invitation and first-login
password setup flow when the auth service supports it.

### Task 8: Add Edit And Status-Management Actions

Depends on Task 7.

Scope:

- Add an actions dropdown to each manageable staff card.
- Add an edit form using a modal, offcanvas, or dedicated route based on the
  amount of information at implementation time.
- Support profile, role, and status updates backed by one update command.
- Present only valid transitions:
  - Active -> On Leave
  - Active -> Inactive
  - On Leave -> Active
  - On Leave -> Inactive
  - Inactive -> Active
- Confirm deactivation because it affects account access.
- Apply last-active-admin and self-deactivation rules returned by the backend.
- Invalidate or update the staff query after success.
- Add optimistic updates only if rollback behavior is clear; otherwise wait for
  the server response.
- Add mutation and interaction tests.

Out of scope:

- Permanent deletion.
- Bulk status updates.
- Role and permission definition screens.

Acceptance criteria:

- Auth identity and staff profile remain synchronized after edits.
- Invalid transitions and protected-admin operations are rejected safely.
- Pending and error states prevent accidental repeated mutations.

### Task 9: Decide And Implement The Removal Policy

Depends on Task 8.

Why:

Hard-deleting only the staff profile can leave a valid login identity and lose
important audit history.

Scope:

- Decide between:
  - Inactivation only.
  - Soft removal with audit history.
  - Coordinated permanent deletion across clinic and auth services.
- Prefer inactivation for normal clinic administration.
- If permanent deletion is required, define auth cleanup, session invalidation,
  audit retention, and cross-service failure compensation.
- Expose a delete endpoint and UI only after those rules exist.
- Add explicit confirmation and backend tests.

Acceptance criteria:

- Removal cannot leave a usable orphaned auth account.
- The result is auditable and recoverability is documented.
- The UI language distinguishes deactivation from permanent deletion.

### Task 10: Add Test Coverage And Final UX Hardening

Depends on Tasks 6-9 as applicable.

Scope:

- Add focused unit tests for mappers, display rules, filtering, and statistics.
- Add component tests for loading, empty, error, and permission states.
- Add frontend integration tests for list, create, edit, and deactivate flows.
- Add API Gateway tests for tenant and role authorization.
- Add or update Playwright coverage for the administrator workflow.
- Verify English labels do not block later French and Arabic localization.
- Verify responsive behavior and keyboard navigation.
- Verify avatar images have useful fallback and error behavior.
- Verify no plaintext credentials or tokens appear in logs, browser storage, or
  public session data.

Acceptance criteria:

- The critical administrator workflow has automated regression coverage.
- The page remains usable on desktop, tablet, and mobile.
- Authorization and tenant-isolation failures are covered.
- Frontend lint, tests, type checking, and production build pass.

## Recommended Task Execution Format

For every task:

1. Read this plan and the relevant repository `AGENTS.md` files.
2. Re-read `docs/architecture/frontend.md` before frontend work.
3. Inspect only the Ubold references relevant to that task.
4. Explain the task's architectural impact before implementation.
5. Implement only that task's scope.
6. Run focused tests first, followed by the affected Nx targets.
7. Mark the task complete in the Implementation Status checklist only after
   verification passes.
8. Summarize the change and name the next task without implementing it.

## Recommended First Session Prompt

```txt
Implement Task 1 from
docs/implementation/staff-management/implementation-plan.md.

Define and enforce the staff identity lifecycle only. Make staff status,
authentication availability, role/email/name synchronization, creation failure
compensation, and last-active-admin protection consistent across the clinic and
auth services. Add focused tests. Do not add API Gateway staff routes or
frontend staff code yet.
```
