# Task 3 Execution Plan: Role-Aware Access Control For Staff Management

## Purpose

This document breaks Task 3 from the
[staff management implementation plan](./implementation-plan.md) into a small
number of ordered, independently verifiable microtasks.

The work starts with backend authorization because the API Gateway is the
security boundary for browser and direct HTTP access. Frontend navigation and
route authorization are added afterward so the user experience matches the
backend rules without becoming the only protection.

Complete and verify one microtask before starting the next one.

## Scope Boundary

This execution plan covers:

- API Gateway authentication, role, and clinic-scope enforcement for staff
  routes.
- A lightweight frontend capability policy that can later be reused for other
  pages, navigation entries, and UI actions.
- Staff-management frontend navigation and route access behavior as the first
  consumer of that policy.
- Authorization test coverage for wrong-role and wrong-clinic requests.
- Documentation updates that reflect the final access rules.

The following remain out of scope:

- General-purpose permissions management.
- Dynamic permission matrices.
- A frontend ACL, CASL, or RBAC library.
- A new authorization microservice.
- Staff deletion policy changes.
- Moving clinic business rules into the API Gateway.

## Locked Access Decisions

Use these decisions unless a product requirement explicitly changes them:

- Backend authorization is the security boundary.
- Staff management is admin-only by default.
- Staff create and update require an authenticated admin.
- Staff directory read access is admin-only until product requirements say
  non-admin clinic staff may read it.
- The `:clinicId` route parameter must belong to the authenticated caller's
  tenant or clinic claims.
- The frontend uses a small static capability policy instead of a third-party
  ACL/RBAC package.
- Frontend access checks are based on capabilities, not scattered raw role
  comparisons.
- `admin` has wildcard access to all frontend capabilities and routes.
- Non-admin roles start with only the capabilities explicitly granted in the
  policy.
- Frontend middleware protects role-aware routes using the shared access
  policy.
- The frontend must hide navigation entries from users that cannot access the
  related page.
- The frontend must hide or disable future buttons and actions using the same
  policy helpers.
- Unauthorized frontend routes must render or redirect to the existing 403
  experience.

## Frontend Authorization Direction

Use a lightweight static capability model for the frontend:

```txt
apps/frontend/src/features/auth/model/access-policy.ts
```

Initial capability examples:

```txt
staff:read
staff:create
staff:update
```

Initial role behavior:

```txt
admin -> *
doctor -> no staff-management capability yet
secretary -> no staff-management capability yet
dental_assistant -> no staff-management capability yet
patient -> no staff-management capability yet
```

Expected helpers:

```txt
can(role, capability)
canAccessPath(role, path)
filterMenuItemsForRole(menuItems, role)
```

Use the same policy from:

- Next.js middleware for route-level access.
- Layout/navigation components for menu visibility.
- Feature components later for buttons, dropdown actions, tabs, and page
  sections.

Middleware implementation notes:

- Keep middleware path matching broad enough to support future protected admin
  pages, but start with staff route rules for this task.
- Middleware must not import server-only BFF or token-refresh helpers.
- If middleware needs to read the Auth.js JWT directly, use an edge-safe helper
  that only depends on middleware-compatible APIs and the Auth.js session
  cookie configuration.
- Do not expose access or refresh tokens to browser JavaScript.
- Keep backend/API Gateway authorization as the final enforcement layer.

## Implementation Order

- [x] Microtask 1: Enforce Staff Route Authorization In The API Gateway
- [x] Microtask 2: Add Backend Authorization Tests
- [x] Microtask 3: Add Frontend Capability Policy And Staff Access UX
- [ ] Microtask 4: Verify End-To-End Behavior And Update Documentation

## Microtask 1: Enforce Staff Route Authorization In The API Gateway

Goal: protect every staff HTTP route with authenticated, role-aware, and
clinic-scoped access checks.

Implementation notes:

- Inspect the existing API Gateway auth primitives from Task 1 before adding
  new code.
- Reuse the existing JWT authentication guard or strategy.
- Reuse or complete the existing role and clinic-scope primitives where they
  already exist.
- Apply admin-only access to staff list, detail, create, and update routes.
- Validate the route `clinicId` against trusted token claims.
- Keep the API Gateway limited to access control and request orchestration.
- Do not move staff lifecycle, last-admin, or status business rules out of the
  clinic service.

Verification:

- A request without a valid token is rejected.
- A non-admin caller cannot read, create, or update staff.
- An admin caller cannot access a clinic outside their token claims.
- A valid admin for the clinic can still use the staff routes from Task 2.

Done when:

- Staff HTTP routes enforce authentication, admin role, and clinic scope.
- The gateway still delegates staff business behavior to the clinic service.

## Microtask 2: Add Backend Authorization Tests

Goal: lock the backend security behavior before the frontend depends on it.

Implementation notes:

- Add focused tests around the API Gateway staff routes.
- Cover missing token, wrong role, wrong clinic, and valid admin access.
- Prefer existing test helpers and module setup patterns.
- Keep tests focused on authorization and gateway behavior.
- Avoid testing clinic-service lifecycle rules again in this task unless a
  route integration requires it.

Verification:

- Run the relevant API Gateway tests.
- Run a broader affected test command if the change touches shared auth
  primitives.

Done when:

- Wrong-role and wrong-clinic requests fail in automated tests.
- Valid admin requests continue to pass.

## Microtask 3: Add Frontend Capability Policy And Staff Access UX

Goal: make the frontend match the backend access rules so unauthorized users do
not see or enter staff management, while preparing the same authorization
model for future pages and actions.

Implementation notes:

- Inspect the current admin layout, navigation model, and existing 403
  experience before editing.
- Inspect the Ubold reference only for visual/navigation behavior, not for
  authorization architecture.
- Do not copy Ubold's demo `sessionStorage` token auth.
- Add a small typed `access-policy.ts` under the auth feature.
- Define capabilities and route access rules centrally.
- Grant `admin` wildcard access.
- Start staff access as admin-only by granting staff capabilities only through
  the admin wildcard.
- Add frontend middleware that uses the shared policy for route-level access.
- Filter Staff navigation entries from the shared menu model for roles that
  cannot access staff management.
- Keep the policy static and local for this task.
- Do not add a third-party ACL/RBAC library unless product requirements later
  require dynamic roles or clinic-configurable permissions.
- Do not start building the staff data boundary or staff page workflows from
  Tasks 4-8.

Verification:

- An admin user can still see and open staff management.
- A non-admin user does not see Staff navigation.
- A non-admin user who manually enters the staff URL reaches the 403
  experience.
- The same policy helper is used for route access and menu filtering.
- No access or refresh token is exposed to browser JavaScript.

Done when:

- Staff route and navigation behavior match the backend access rules.
- The frontend has a small reusable policy foundation for future page and
  action authorization.

## Microtask 4: Verify End-To-End Behavior And Update Documentation

Goal: confirm the backend and frontend tell the same access-control story.

Implementation notes:

- Manually verify the core admin and non-admin paths if local auth fixtures or
  seeded users are available.
- Update `docs/api/clinic-service.md` so it no longer says role-aware access
  control is pending.
- Update the parent implementation plan checkbox only after all Task 3
  microtasks are complete.

Verification:

- Backend tests for staff route authorization pass.
- Frontend checks or linting pass for the changed route/navigation code.
- Documentation reflects the implemented access rules.

Done when:

- Users cannot access another clinic by changing a browser URL or request body.
- Unauthorized roles cannot mutate staff through direct HTTP calls.
- Frontend navigation and route behavior match backend access rules.
