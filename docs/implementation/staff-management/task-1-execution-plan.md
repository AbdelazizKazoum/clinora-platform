# Task 1 Execution Plan: Auth Foundation And Staff Identity Lifecycle

## Purpose

This document breaks Task 1 from the
[staff management implementation plan](./implementation-plan.md) into small,
independently verifiable changes.

The work starts by preparing the API Gateway authentication foundation because
the BFF already forwards an access token but the gateway does not currently
verify it. Preparing that foundation does not expose staff HTTP routes and does
not move staff lifecycle rules into guards.

After the foundation is ready, the remaining microtasks make staff `status`,
auth account availability, staff profile data, and auth identity data behave as
one explicit lifecycle.

Complete and verify one microtask before starting the next one.

## Scope Boundary

This execution plan contains two related tracks:

1. **Auth foundation preparation**
   - Prepare reusable JWT, role, and clinic-scope primitives in the API Gateway.
   - Do not add staff controllers or apply staff route permissions yet.
   - Applying these primitives to staff routes remains part of Tasks 2 and 3 in
     the parent plan.
2. **Task 1 staff identity lifecycle**
   - Implement account availability and identity management in the auth
     service.
   - Implement canonical staff lifecycle rules and auth synchronization in the
     clinic service.
   - Keep business invariants inside the clinic bounded context.

The following remain out of scope:

- Staff API Gateway controllers.
- Frontend staff code.
- A dynamic permission matrix or authorization service.
- Immediate access-token revocation infrastructure.
- Permanent staff deletion behavior exposed to users.
- Moving clinic business rules into the API Gateway.

## Locked Lifecycle Decisions

Use these decisions unless a product requirement explicitly changes them:

- `StaffMember.status` is the canonical staff lifecycle field.
- `active` means the auth identity is enabled.
- `on-leave` means the auth identity remains enabled.
- `inactive` means the auth identity is disabled.
- `isActive`, while it remains in persistence or response contracts, is
  read-only derived compatibility data:

  ```txt
  isActive = status !== inactive
  ```

- Clients cannot submit both `status` and `isActive`.
- Inactive users cannot log in or refresh a session.
- Existing access tokens expire naturally within a maximum documented
  15-minute lifetime.
- Self-deactivation is not allowed.
- A clinic must always retain at least one enabled administrator.
- An enabled administrator is an `ADMIN` whose status is `active` or
  `on-leave`.
- The clinic service owns staff profile, membership, role assignment, and
  canonical status.
- The auth service owns credentials and the auth-side projection required to
  accept or reject authentication.
- The API Gateway authenticates callers and enforces role and tenant access.
- The clinic service enforces staff lifecycle business invariants.

## Legacy Backend Reference

The legacy backend implementation is checked into this repository under:

```txt
legacy/dentiflow/backend/services/api-gateway/src/shared/strategies/jwt.strategy.ts
legacy/dentiflow/backend/services/api-gateway/src/shared/guards/jwt-auth.guard.ts
legacy/dentiflow/backend/services/api-gateway/src/shared/guards/roles.guard.ts
legacy/dentiflow/backend/services/api-gateway/src/shared/guards/clinic-scope.guard.ts
legacy/dentiflow/backend/services/api-gateway/src/shared/decorators/roles.decorator.ts
legacy/dentiflow/backend/services/api-gateway/src/shared/decorators/current-user.decorator.ts
legacy/dentiflow/backend/services/api-gateway/src/domain/auth/entities/jwt-payload.entity.ts
legacy/dentiflow/backend/services/api-gateway/src/app.module.ts
```

Inspect these files again immediately before implementing Microtasks 1 and 2.
They are the primary behavioral reference for Clinora's gateway auth
infrastructure.

### Default Implementation Decision

Use the same proven authentication and authorization design as the legacy
DentiFlow gateway:

- A Passport JWT strategy verifies signature and expiration.
- `JwtAuthGuard` extends Passport's `AuthGuard('jwt')`.
- The strategy validates required `user_id`, `clinic_id`, and `role` claims and
  attaches the verified JWT payload to `request.user`.
- `JwtAuthGuard` returns a stable `401` without leaking JWT implementation
  errors.
- `RolesGuard` reads route metadata after authentication has populated the
  principal.
- `ClinicScopeGuard` compares the verified clinic claim with the route clinic
  identifier.
- `CurrentUser` exposes the verified payload to a controller without manually
  reading or decoding the token again.
- Guards can be composed at controller or handler level.
- Guard providers stay in the feature module that applies them.
- Guard order remains:

  ```txt
  JwtAuthGuard -> RolesGuard -> ClinicScopeGuard
  ```

The behavior should match the legacy implementation unless one of the
Clinora-specific adaptations below applies.

### Required Clinora Adaptations

- **Token extraction:** Keep `ExtractJwt.fromAuthHeaderAsBearerToken()`, but do
  not copy query-string extraction. Query tokens can leak through logs, browser
  history, and referrer data. Do not copy cookie extraction for normal BFF
  requests because Clinora's BFF already sends the server-held access token in
  the `Authorization` header.
- **JWT payload type:** Preserve the legacy wire claim names
  `user_id`, `clinic_id`, `role`, `iat`, and `exp` on `request.user`. Type
  `role` with `AuthUserRole` from `@clinora/contracts-auth` instead of
  duplicating a gateway enum that can drift from the token issuer.
- **Clinic route convention:** Compare only the explicit
  `request.params.clinicId` used by Clinora routes. Do not copy the legacy
  fallback across `clinicId`, `clinic_id`, and generic `id`.
- **Fail-closed scope behavior:** The legacy guard skips when it cannot find a
  clinic route parameter. In Clinora, a `ClinicScopeGuard` applied to a
  clinic-scoped route must reject a missing principal or missing `clinicId`
  rather than silently bypass tenant enforcement.
- **Module registration:** Preserve `PassportModule.register({
  defaultStrategy: 'jwt' })` and register `JwtStrategy` as a gateway provider.
  Do not register an otherwise unused `JwtModule` merely because the legacy
  module did. The legacy strategy verifies with `passport-jwt` and
  `ConfigService` directly; it does not inject Nest's `JwtService`.
- **Tests:** Keep the useful legacy strategy and guard tests, then add coverage
  for missing claims, unsupported roles, invalid signatures, expiration,
  wrong-role access, and wrong-clinic access. Do not copy the legacy test role
  value `"dentist"` because it is not a supported issued role.

### Legacy-To-Clinora Mapping

| Legacy component | Clinora target | Decision |
| --- | --- | --- |
| `JwtStrategy` | Gateway auth strategy | Reuse behavior; bearer extraction only |
| `JwtAuthGuard` | Gateway auth guard | Reuse behavior and stable `401` |
| `Roles` | Gateway roles decorator | Reuse; type from auth contract |
| `RolesGuard` | Gateway roles guard | Reuse metadata approach |
| `ClinicScopeGuard` | Gateway tenant guard | Reuse concept; exact `:clinicId`, fail closed |
| `CurrentUser` | Gateway current-user decorator | Reuse with typed verified JWT payload |
| `UserRole` enum | `AuthUserRole` contract type | Replace duplicate enum |
| `JwtModule` in gateway | No gateway registration initially | Omit because legacy strategy does not use it |

## Target Request Flow

```txt
Browser
  -> same-origin BFF
  -> Authorization: Bearer <access token>
  -> API Gateway JWT authentication
  -> role authorization
  -> clinic-scope authorization
  -> clinic-service gRPC call with verified actor context
  -> clinic lifecycle rules
  -> auth-service identity synchronization when required
```

The browser-provided URL clinic ID remains request context only. The verified
`clinic_id` claim is the authorization source of truth.

## Microtask Status

- [x] Microtask 1: Prepare API Gateway JWT authentication
- [x] Microtask 2: Prepare role and clinic-scope authorization primitives
- [x] Microtask 3: Add auth account availability persistence
- [x] Microtask 4: Enforce account availability during login and refresh
- [x] Microtask 5: Add internal auth identity-management operations
- [x] Microtask 6: Extend the clinic service auth port
- [x] Microtask 7: Make staff status canonical
- [x] Microtask 8: Compensate failed staff creation
- [x] Microtask 9: Synchronize staff identity updates
- [ ] Microtask 10: Enforce self-deactivation and last-admin rules
- [ ] Microtask 11: Complete lifecycle integration verification

## Microtask 1: Prepare API Gateway JWT Authentication

### Why

The BFF forwards bearer access tokens, but the API Gateway currently does not
verify or consume them. Role and tenant guards cannot be trusted until
authentication produces a verified principal.

### Scope

- Add the required Passport JWT dependencies to the API Gateway using `pnpm`.
- Add `JWT_SECRET` to gateway environment validation.
- Add the same access-token secret to the API Gateway runtime configuration.
- Create a typed JWT payload matching the issued claims and preserving the
  legacy wire names:

  ```ts
  interface JwtPayload {
    user_id: string;
    clinic_id: string;
    role: AuthUserRole;
    iat: number;
    exp: number;
  }
  ```

- Adapt the legacy JWT strategy and guard under a gateway-owned technical
  location aligned with Clinora's existing `common` folder:

  ```txt
  apps/backend/api-gateway/src/common/auth/
    jwt-payload.ts
    guards/
      jwt-auth.guard.ts
    strategies/
      jwt.strategy.ts
  ```

- Extract access tokens only from `Authorization: Bearer`.
- Verify the JWT signature and expiration.
- Validate that `user_id`, `clinic_id`, and `role` exist and that `role` is one
  of the contract-supported auth roles.
- Return the validated `JwtPayload` from the strategy so Passport assigns it to
  `request.user`, matching the legacy request flow.
- Return a stable `401 Unauthorized` for missing, malformed, invalid, or
  expired tokens.
- Register `PassportModule` with the default `jwt` strategy and register
  `JwtStrategy` intentionally in the API Gateway module.
- Add focused strategy and guard tests.

### Out Of Scope

- Applying the guard to existing controllers.
- Role authorization.
- Clinic-scope authorization.
- Staff routes.
- Token revocation or introspection.

### Acceptance Criteria

- A valid auth-service access token produces a typed `request.user` JWT
  payload.
- A missing, invalid, or expired token is rejected with `401`.
- Query-string and direct browser-cookie access tokens are not accepted.
- Gateway startup fails clearly when `JWT_SECRET` is missing or invalid.
- No controller behavior changes in this microtask.

### Verification

```txt
pnpm nx test api-gateway
pnpm nx build api-gateway
```

## Microtask 2: Prepare Role And Clinic-Scope Authorization Primitives

### Why

Authentication establishes who the caller is. Staff routes will also need
explicit authorization for role and clinic ownership.

### Scope

- Adapt the legacy `Roles` decorator and `RolesGuard`.
- Use `AuthUserRole` from `@clinora/contracts-auth`.
- Add a `ClinicScopeGuard` that compares:

  ```txt
  request.params.clinicId === request.user.clinic_id
  ```

- Fail closed if the clinic-scope guard is applied without an authenticated
  principal or the expected route parameter.
- Adapt the legacy typed current-user decorator for controllers that need the
  actor:

  ```txt
  @CurrentUser() user: JwtPayload
  ```

- Add focused tests for:
  - Allowed role.
  - Wrong role.
  - Matching clinic.
  - Wrong clinic.
  - Missing principal.
  - Missing expected route clinic ID.
- Keep guard order explicit:

  ```txt
  JwtAuthGuard -> RolesGuard -> ClinicScopeGuard
  ```

### Out Of Scope

- Applying the guards to staff controllers, which do not exist yet.
- Dynamic permissions.
- Querying the database from a guard.
- Last-admin or self-deactivation rules.

### Acceptance Criteria

- Role and clinic authorization operate only on a verified principal.
- Wrong-role and wrong-clinic requests produce `403 Forbidden`.
- The guards contain no staff business logic and make no service calls.
- The primitives are ready for Tasks 2 and 3 without exposing new routes.

### Verification

```txt
pnpm nx test api-gateway
pnpm nx build api-gateway
```

## Microtask 3: Add Auth Account Availability Persistence

### Why

The auth service cannot currently represent whether a staff identity may
authenticate.

### Scope

- Add an auth-service migration for an account availability field.
- Prefer `is_active` for this small projection unless a broader account-state
  requirement is approved.
- Default existing and newly registered users to active.
- Add the field to:
  - The auth domain user.
  - The TypeORM entity.
  - Persistence mapper.
  - Repository save/update behavior.
- Add domain behavior or an explicit method for changing availability rather
  than allowing unrelated code to mutate persistence data directly.
- Add focused mapper and repository-facing unit tests.

### Out Of Scope

- Staff status in the auth service.
- Login and refresh rejection, handled in Microtask 4.
- Clinic-service changes.
- Immediate token revocation.

### Acceptance Criteria

- Auth identities have a persisted active/disabled state.
- Existing users remain active after migration.
- The auth service does not duplicate `active`, `on-leave`, and `inactive`;
  those remain clinic-domain concepts.

### Verification

```txt
pnpm nx test auth-service
pnpm nx build auth-service
```

## Microtask 4: Enforce Account Availability During Login And Refresh

### Why

Persisting availability has no security effect until every token-issuing path
checks it.

### Scope

- Reject inactive users during password login.
- Reject inactive users during refresh-token rotation.
- Use the existing generic invalid-credentials and invalid-refresh-token
  responses so account state is not disclosed.
- Keep password timing protection for unknown users.
- Document that existing access tokens expire naturally.
- Enforce or validate a maximum access-token lifetime of 15 minutes so the
  documented deactivation window cannot be extended accidentally.
- Add focused login and refresh tests.

### Out Of Scope

- Access-token deny lists.
- Session tables.
- Immediate invalidation of already-issued access tokens.
- Clinic-service synchronization.

### Acceptance Criteria

- An inactive identity cannot obtain new access or refresh tokens.
- An active identity continues to log in and refresh normally.
- The external error response does not reveal whether an account is disabled.
- The maximum remaining access after deactivation is documented and bounded.

### Implementation Note

Existing access tokens are not revoked immediately when an identity is disabled.
They expire naturally, and auth-service environment validation rejects
`JWT_EXPIRES_IN` values above `900` seconds so that maximum window remains
bounded to 15 minutes.

### Verification

```txt
pnpm nx test auth-service
pnpm nx build auth-service
```

## Microtask 5: Add Internal Auth Identity-Management Operations

### Why

The clinic service currently has only a registration operation. It cannot
synchronize staff changes or compensate failed profile creation.

### Scope

- Extend the auth protobuf and TypeScript contract with narrowly scoped
  internal operations:
  - Provision a staff identity without issuing login tokens.
  - Update identity email, full name, role, and availability.
  - Delete a newly provisioned identity for creation compensation.
- Keep these operations distinct from public self-registration/login behavior.
- Require both `userId` and `clinicId` when addressing an existing identity.
- Make delete compensation safe for a not-yet-attached provisioned identity.
- Implement auth-service use cases and repository operations.
- Normalize email and full name consistently with registration.
- Map duplicate email, not-found, and validation failures to stable gRPC
  statuses.
- Add focused contract, use-case, and gRPC controller tests.

### Out Of Scope

- Calling these operations from the clinic service.
- Public HTTP endpoints for identity management.
- Permanent staff removal policy.
- A general user-management service.

### Acceptance Criteria

- Staff provisioning does not mint or return login tokens.
- Identity attributes and availability can be updated idempotently.
- Compensation can remove a provisioned identity that has no staff profile.
- Cross-clinic identity targeting is rejected.
- Contract generation/type checking remains valid.

### Verification

```txt
pnpm nx test contracts-auth
pnpm nx test auth-service
pnpm nx build auth-service
```

## Microtask 6: Extend The Clinic Service Auth Port

### Why

The clinic application layer must depend on its own port, not directly on gRPC
or auth-service implementation details.

### Scope

- Extend the clinic-owned `AuthServicePort` with:
  - `provisionStaffIdentity`.
  - `updateStaffIdentity`.
  - `deleteProvisionedIdentity`.
- Keep `StaffRole` to auth-role mapping inside the gRPC adapter.
- Map auth gRPC failures to clinic application errors.
- Preserve stable distinctions between conflict, validation, not-found, and
  dependency failures.
- Add adapter tests for every role and operation.

### Out Of Scope

- Staff use-case orchestration.
- Gateway changes.
- Direct access to the auth database.

### Acceptance Criteria

- Clinic application code remains transport-independent.
- No auth contract role strings leak into the clinic domain.
- Every new auth operation has adapter mapping and error tests.

### Verification

```txt
pnpm nx test clinic-service
pnpm nx build clinic-service
```

## Microtask 7: Make Staff Status Canonical

### Why

The current contract allows `status` and `isActive` to contradict one another.

### Scope

- Remove `isActive` from all staff update/write inputs:
  - Clinic repository update input.
  - Clinic gRPC input validation.
  - Clinic protobuf update request.
  - TypeScript clinic contract.
- Keep `isActive` in read responses only while compatibility requires it.
- Centralize the mapping:

  ```txt
  active   -> isActive true
  on-leave -> isActive true
  inactive -> isActive false
  ```

- Ensure create always starts as `active`.
- Normalize existing staff rows in a migration.
- Ensure every repository update derives `isActive` from the resulting status.
- Add tests for all statuses and partial profile updates.

### Out Of Scope

- Auth synchronization.
- Last-admin protection.
- Frontend model changes.

### Acceptance Criteria

- No caller can write `isActive` independently.
- Persisted and returned `isActive` cannot contradict `status`.
- On-leave behavior is explicit and tested.
- Existing inconsistent records are normalized.

### Verification

```txt
pnpm nx test contracts-clinic
pnpm nx test clinic-service
pnpm nx build clinic-service
```

## Microtask 8: Compensate Failed Staff Creation

### Why

Auth provisioning currently occurs before staff-profile persistence, so a
clinic persistence failure can leave a usable orphan login.

### Scope

- Replace the current registration call with identity provisioning.
- Attempt staff-profile persistence after provisioning.
- If staff persistence fails, call `deleteProvisionedIdentity`.
- Preserve the original failure when compensation succeeds.
- If compensation also fails:
  - Throw a dedicated identity-consistency/dependency error.
  - Log the identity ID, clinic ID, operation, and correlation ID.
  - Never log the password or tokens.
- Add tests for:
  - Provisioning failure.
  - Staff persistence failure with successful compensation.
  - Staff persistence failure with failed compensation.
  - Successful creation.

### Out Of Scope

- General distributed transactions.
- NATS-based saga infrastructure.
- Staff update synchronization.

### Acceptance Criteria

- A failed staff-profile creation does not leave an enabled unmanaged login.
- Failed compensation is visible and diagnosable rather than silent.
- Plaintext passwords never appear in logs or errors.

### Verification

```txt
pnpm nx test clinic-service
pnpm nx test auth-service
pnpm nx build clinic-service
```

## Microtask 9: Synchronize Staff Identity Updates

### Why

Changing staff email, full name, role, or status currently updates only the
clinic database.

### Scope

- Load the existing staff member before applying updates.
- Build the proposed complete staff state.
- Detect whether auth-owned identity fields actually changed:
  - Email.
  - Full name derived from first and last name.
  - Role.
  - Availability derived from status.
- Update the auth identity and clinic profile through one clinic application
  use case.
- Add compensation using the previously loaded values if the second write
  fails.
- Surface a dedicated consistency error if rollback fails.
- Keep phone, specialization, and avatar clinic-only.
- Add tests for:
  - Profile-only update without unnecessary auth call.
  - Email update.
  - First-name or last-name update.
  - Role update.
  - Status update.
  - Auth failure before clinic persistence.
  - Clinic failure and successful auth rollback.
  - Clinic failure and failed auth rollback.

### Out Of Scope

- Last-admin and self-deactivation validation.
- Optimistic frontend updates.
- Eventual-consistency infrastructure.

### Acceptance Criteria

- Successful updates leave auth identity and staff profile aligned.
- A partial failure is compensated or reported explicitly.
- Unchanged identity fields do not cause unnecessary auth requests.
- Auth synchronization remains orchestrated by the clinic use case.

### Verification

```txt
pnpm nx test clinic-service
pnpm nx test auth-service
pnpm nx build clinic-service
```

## Microtask 10: Enforce Self-Deactivation And Last-Admin Rules

### Why

These are clinic-domain invariants based on the target staff member, acting
user, and current clinic membership. A stateless controller guard cannot enforce
them safely.

### Scope

- Add verified actor context to the internal update command:

  ```txt
  actorUserId
  ```

- Add `actor_user_id` to the clinic gRPC update request so the future gateway
  can forward it from the verified principal.
- Never accept `actorUserId` from an HTTP request body.
- Reject changing the acting member's own status to `inactive`.
- Before disabling or demoting an enabled admin, ensure another enabled admin
  remains.
- Make the last-admin check safe against concurrent updates using a
  transaction, row lock, or equivalent atomic persistence operation.
- Add dedicated clinic errors and stable gRPC mappings.
- Add tests for:
  - Self-deactivation rejection.
  - Updating one's own non-lifecycle profile fields.
  - Deactivating an admin when another enabled admin exists.
  - Rejecting deactivation of the last enabled admin.
  - Demoting an admin when another enabled admin exists.
  - Rejecting demotion of the last enabled admin.
  - Treating on-leave admins as enabled.
  - Concurrent attempts that would otherwise disable all admins.

### Out Of Scope

- Deciding which HTTP roles may call the update endpoint.
- Reading the actor from an unverified token.
- Frontend action visibility.

### Acceptance Criteria

- Self-deactivation is rejected by the clinic service.
- A clinic cannot end with zero enabled admins.
- The invariant remains true under concurrent requests.
- Actor identity comes from trusted gateway context once the HTTP route exists.

### Verification

```txt
pnpm nx test contracts-clinic
pnpm nx test clinic-service
pnpm nx build clinic-service
```

## Microtask 11: Complete Lifecycle Integration Verification

### Why

The final lifecycle crosses contracts, auth persistence, token issuance, clinic
persistence, and a synchronous service boundary.

### Scope

- Add or update integration coverage for:
  - Active staff login.
  - On-leave staff login.
  - Inactive staff login rejection.
  - Inactive staff refresh rejection.
  - Staff creation across auth and clinic services.
  - Staff identity update synchronization.
  - Creation compensation.
  - Last-admin and self-deactivation failures.
- Verify migrations are registered in each owning service.
- Verify Docker Compose provides the gateway with the access-token verification
  secret without exposing the refresh-token secret.
- Verify no tokens or plaintext passwords appear in logs.
- Update the parent Task 1 checkbox only when all lifecycle microtasks pass.
- Keep application of gateway guards to staff routes for Tasks 2 and 3.

### Acceptance Criteria

- Task 1 acceptance criteria in the parent plan are satisfied.
- Auth, clinic, contract, and gateway tests pass.
- A production build succeeds for every affected backend application.
- Prepared gateway authorization primitives remain unused until protected
  routes are added intentionally.

### Verification

```txt
pnpm nx test api-gateway
pnpm nx test auth-service
pnpm nx test clinic-service
pnpm nx test contracts-auth
pnpm nx test contracts-clinic
pnpm nx build api-gateway
pnpm nx build auth-service
pnpm nx build clinic-service
```

## Error Semantics

Use stable meanings across gRPC and HTTP mapping:

| Situation | Clinic/Auth application meaning | gRPC status |
| --- | --- | --- |
| Identity or staff member missing | Not found | `NOT_FOUND` |
| Duplicate clinic email | Conflict | `ALREADY_EXISTS` |
| Self-deactivation | Business rule conflict | `FAILED_PRECONDITION` |
| Last enabled admin | Business rule conflict | `FAILED_PRECONDITION` |
| Invalid lifecycle input | Validation failure | `INVALID_ARGUMENT` |
| Auth dependency unavailable | Dependency failure | `UNAVAILABLE` |
| Invalid login or disabled login | Authentication failure | `UNAUTHENTICATED` |

When Tasks 2 and 3 expose the HTTP routes, map `FAILED_PRECONDITION` to a stable
`409 Conflict` response suitable for frontend feedback.

## Expected File Ownership

```txt
libs/contracts/auth/
  Auth identity-management RPC contracts only

libs/contracts/clinic/
  Staff request/response transport contracts only

apps/backend/services/auth-service/
  Credentials, account availability, login/refresh enforcement,
  and identity-management use cases

apps/backend/services/clinic-service/
  Canonical staff status, lifecycle invariants, profile persistence,
  and auth synchronization orchestration

apps/backend/api-gateway/
  JWT verification, caller principal, role guard, and clinic-scope guard
```

Do not place these components in `libs/backend` yet. The current use is local to
the API Gateway or an owning bounded context, and there is no demonstrated
cross-service reuse that justifies a shared backend library.

## Recommended First Implementation Session

Start with Microtask 1 only:

```txt
Implement Microtask 1 from
docs/implementation/staff-management/task-1-execution-plan.md.

Prepare API Gateway JWT authentication by adapting the proven legacy JWT
strategy and guard from
legacy/dentiflow/backend/services/api-gateway/src/shared. Preserve the legacy
Passport strategy, AuthGuard, stable 401 behavior, and request.user flow.
Accept bearer tokens only, validate the issued claims, add gateway environment
validation, and add focused tests. Do not add role or clinic-scope guards, do
not apply guards to controllers, and do not start staff lifecycle changes.
```
