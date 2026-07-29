# Clinic and staff API contract for frontend integration

Status: HTTP staff routes implemented; role-aware access pending Task 3  
Last verified: 2026-07-29

This document is the frontend-facing reference for the clinic bounded context,
especially staff management. The clinic service owns clinic profile data,
working hours, staff profiles, clinic membership, staff role assignment, and
staff lifecycle status.

The browser must not call the clinic service gRPC API directly. Frontend code
should call the same-origin BFF, which forwards to the API Gateway. The API
Gateway then calls the clinic service. For staff creation and identity updates,
the clinic service synchronizes with the auth service internally.

Implementation sources:

- API Gateway staff controller:
  `apps/backend/api-gateway/src/modules/staff/staff.controller.ts`
- API Gateway staff facade:
  `apps/backend/api-gateway/src/modules/staff/staff.facade.ts`
- API Gateway staff validation DTOs:
  `apps/backend/api-gateway/src/modules/staff/dto/staff.dto.ts`
- API Gateway clinic gRPC client:
  `apps/backend/api-gateway/src/clients/clinic`
- Internal clinic contract:
  `libs/contracts/clinic/src/lib/clinic.contract.ts`
- Internal gRPC contract:
  `libs/contracts/clinic/src/lib/clinic.proto`
- Clinic service gRPC controller:
  `apps/backend/services/clinic-service/src/clinic/presentation/grpc`
- Staff lifecycle use case:
  `apps/backend/services/clinic-service/src/clinic/application/use-cases/manage-staff-members.use-case.ts`
- Staff management plan:
  `docs/implementation/staff-management/implementation-plan.md`

## 1. Transport status

### Current backend-to-backend implementation

The clinic service currently exposes staff management through internal gRPC:

```txt
ClinicService.GetStaffMember
ClinicService.ListStaffMembers
ClinicService.CreateStaffMember
ClinicService.UpdateStaffMember
ClinicService.DeleteStaffMember
```

These methods are for backend-to-backend communication only.

### Frontend communication rule

Frontend code should be prepared to call the same-origin BFF shape:

```txt
/api/bff/clinics/{clinicId}/staff
```

The BFF should forward to the API Gateway:

```txt
{API_GATEWAY_URL}/api/v1/clinics/{clinicId}/staff
```

For local server-side checks, the direct Gateway base is:

```txt
http://localhost:3001/api/v1/clinics/{clinicId}/staff
```

The API Gateway staff routes are implemented. Role-aware authorization and
clinic-scope enforcement are pending Task 3.

## 2. Staff values

### Roles

```ts
type StaffRole =
  | 'SECRETARY'
  | 'DENTAL_ASSISTANT'
  | 'DOCTOR'
  | 'ADMIN';
```

Recommended display labels:

```ts
const staffRoleLabels = {
  SECRETARY: 'Secretary',
  DENTAL_ASSISTANT: 'Dental Assistant',
  DOCTOR: 'Doctor',
  ADMIN: 'Administrator',
} satisfies Record<StaffRole, string>;
```

### Statuses

```ts
type StaffStatus = 'active' | 'on-leave' | 'inactive';
```

Recommended display labels:

```ts
const staffStatusLabels = {
  active: 'Active',
  'on-leave': 'On Leave',
  inactive: 'Inactive',
} satisfies Record<StaffStatus, string>;
```

Lifecycle rules:

- `status` is the canonical lifecycle field for frontend code.
- `active` staff can authenticate.
- `on-leave` staff remain enabled and can authenticate.
- `inactive` staff cannot log in or refresh a session.
- The frontend must not independently edit `isActive`.
- `isActive` is returned only as a compatibility field derived from `status`.

## 3. Staff response shape

```ts
interface StaffMemberDto {
  id: string;
  clinicId: string;
  userId: string;
  role: StaffRole;
  status: StaffStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  specialization: string;
  avatar: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Response notes:

- `createdAt` and `updatedAt` are ISO 8601 strings.
- Optional scalar response fields currently come back as empty strings, not
  `null`. This applies to `phone`, `specialization`, and `avatar`.
- Map empty strings to `null` at the staff API boundary if the UI model prefers
  nullable values.
- The UI should derive `fullName` from `firstName` and `lastName`.

Recommended frontend model:

```ts
interface StaffMember {
  id: string;
  clinicId: string;
  userId: string;
  role: StaffRole;
  status: StaffStatus;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string;
  specialization: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. HTTP staff endpoints

All paths below are relative to `/api/bff`.

| Method  | Path                              | Purpose                         | Success response                    |
| ------- | --------------------------------- | ------------------------------- | ----------------------------------- |
| `GET`   | `/clinics/{clinicId}/staff`       | List clinic staff members       | `200 { items: StaffMemberDto[] }`   |
| `POST`  | `/clinics/{clinicId}/staff`       | Create staff and login identity | `201 StaffMemberDto`                |
| `GET`   | `/clinics/{clinicId}/staff/by-user/{userId}` | Find staff profile for a user | `200 StaffMemberDto` |
| `PATCH` | `/clinics/{clinicId}/staff/{staffMemberId}` | Partially update staff profile/lifecycle | `200 StaffMemberDto` |

Do not expose permanent staff deletion to the frontend yet. The internal gRPC
contract has `DeleteStaffMember`, but Task 9 must first define identity and
audit behavior for removal.

Gateway implementation notes:

- The Gateway module is `StaffModule`.
- The Gateway delegates to the clinic service through `ClinicClientModule`.
- The Gateway does not create auth identities itself; staff creation remains
  one clinic-service operation.
- The `PATCH` route requires JWT authentication now because the Gateway must
  derive `actorUserId` from trusted token claims for self-deactivation rules.
- Admin-role and clinic-scope guards are pending Task 3.

## 5. Create staff

Route:

```txt
POST /api/bff/clinics/{clinicId}/staff
```

Body:

```ts
interface CreateStaffMemberBody {
  role: StaffRole;
  firstName: string; // required, non-empty, max 100
  lastName: string; // required, non-empty, max 100
  phone?: string; // max 30
  email: string; // required email, max 255
  specialization?: string; // max 255
  avatar?: string; // URL, max 500
  password: string; // required, 8..128
}
```

Example:

```ts
await fetch(`/api/bff/clinics/${clinicId}/staff`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    role: 'DOCTOR',
    firstName: 'Salma',
    lastName: 'El Mansouri',
    email: 'salma.elmansouri@example.ma',
    phone: '+212600000000',
    specialization: 'Endodontics',
    password: 'StrongPassword123!',
  } satisfies CreateStaffMemberBody),
});
```

Backend behavior:

- The clinic service first provisions the auth identity.
- The clinic service then saves the staff profile.
- If staff-profile creation fails after auth identity creation, the clinic
  service deletes the provisioned identity as compensation.
- If compensation fails, the service raises a consistency error and logs only
  safe diagnostic fields.

Frontend rules:

- Treat create as one operation. Do not call auth registration separately.
- Never log or persist the plaintext password in frontend state.
- Invalidate the staff list after success.

## 6. List staff

Route:

```txt
GET /api/bff/clinics/{clinicId}/staff
```

Success response:

```ts
interface StaffMembersResponse {
  items: StaffMemberDto[];
}
```

The initial backend operation returns the complete clinic staff list. For the
first staff-management screen, local search/filtering by name, email,
specialization, role, and status is acceptable.

Recommended frontend-derived counts:

```ts
interface StaffSummary {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
}
```

Calculate summary counts from the complete staff list, not from the currently
filtered cards.

## 7. Get staff profile by user

Route:

```txt
GET /api/bff/clinics/{clinicId}/staff/by-user/{userId}
```

Use this when the frontend needs the clinic staff profile for an authenticated
user ID.

## 8. Update staff

Route:

```txt
PATCH /api/bff/clinics/{clinicId}/staff/{staffMemberId}
```

Body:

```ts
interface UpdateStaffMemberBody {
  role?: StaffRole;
  status?: StaffStatus;
  firstName?: string; // non-empty when supplied, max 100
  lastName?: string; // non-empty when supplied, max 100
  phone?: string | ''; // "" clears
  email?: string; // email, max 255
  specialization?: string | ''; // "" clears
  avatar?: string | ''; // URL or "" clears
}
```

`actorUserId` is required by the internal gRPC contract, but the frontend must
not send it in the body. The API Gateway derives it from the verified
access-token claims.

Backend behavior:

- Email changes synchronize to the auth identity.
- First-name or last-name changes synchronize the auth full name.
- Role changes synchronize to auth.
- Status changes synchronize auth availability:
  - `active` -> enabled auth account.
  - `on-leave` -> enabled auth account.
  - `inactive` -> disabled auth account.
- If auth synchronization succeeds but clinic persistence fails, the clinic
  service attempts to roll auth back.
- Self-deactivation is rejected.
- Deactivating or demoting the last enabled clinic admin is rejected.
- The last-admin rule is enforced inside the clinic service transaction.

Frontend rules:

- Omit unchanged fields.
- Send `""` to clear `phone`, `specialization`, or `avatar`.
- Do not send `isActive`.
- Invalidate the staff list and the edited staff member after success.

## 9. Clinic and working-hours capabilities

The current internal clinic service also supports:

```txt
ClinicService.GetClinic
ClinicService.CreateClinic
ClinicService.GetWorkingHours
ClinicService.UpsertWorkingHours
```

These operations do not yet have a frontend-facing HTTP contract in this file.
Document them separately when a frontend workflow needs them.

## 10. Expected errors

Frontend code should branch on HTTP status before reading a success shape.

| Status | Meaning |
| ------ | ------- |
| `400`  | Invalid UUID, invalid enum, invalid body field, or validation failure |
| `401`  | No valid authenticated frontend session |
| `403`  | Authenticated user is not allowed to manage staff |
| `404`  | Clinic or staff member was not found |
| `409`  | Staff email already exists in the clinic |
| `412`  | Lifecycle rule failed, such as self-deactivation or last enabled admin |
| `500`  | Unexpected clinic-service failure |
| `502`  | BFF could not reach the API Gateway |
| `503`  | API Gateway could not reach the clinic service |

Typical Gateway validation error:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
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

## 11. Frontend integration rules

1. Keep staff-specific API functions, DTOs, mappers, schemas, hooks, and UI
   under `apps/frontend/src/features/staff`.
2. Call only `/api/bff/clinics/{clinicId}/...` from client-side code.
3. Keep route strings centralized in the staff feature API layer.
4. Keep backend DTOs at the API boundary and map them into frontend models.
5. Convert date strings to `Date` values in the frontend model.
6. Convert empty optional response strings to `null` if that is easier for UI
   code.
7. Use TanStack Query for staff server state.
8. Invalidate staff queries after create, update, status, role, email, or name
   changes.
9. Treat frontend permission checks as UX only. The backend must enforce
   authorization.
10. Do not expose staff deletion until Task 9 defines the product and audit
    behavior.

## 12. Known integration gaps

- Role-aware access control and clinic-scope enforcement for staff routes are
  pending Task 3.
- The staff update route already requires JWT authentication so the Gateway can
  pass a trusted `actorUserId` to the clinic service. Admin-role and
  clinic-scope checks are added in Task 3.
- There is no generated OpenAPI/Swagger contract. This Markdown file documents
  the intended frontend contract; the TypeScript and proto contracts remain
  the executable backend source of truth.
