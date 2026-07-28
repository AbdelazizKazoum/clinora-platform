# Patient API contract for frontend integration

Status: current implementation reference  
Last verified: 2026-07-28

This document is the frontend-facing HTTP contract for the patient bounded
context. The browser must integrate with the API Gateway through the Clinora
frontend BFF. The patient service's gRPC API is internal and must not be called
from frontend code.

Implementation sources:

- API Gateway controllers:
  `apps/backend/api-gateway/src/modules/patients/controllers`
- API Gateway validation DTOs:
  `apps/backend/api-gateway/src/modules/patients/dto`
- Shared patient contract:
  `libs/contracts/patient/src/lib/patient.contract.ts`
- Internal gRPC contract:
  `libs/contracts/patient/src/lib/patient.proto`

## 1. Transport and URL rules

### Browser requests

Use the same-origin BFF URL:

```txt
/api/bff/clinics/{clinicId}/...
```

Example:

```ts
const response = await fetch(
  `/api/bff/clinics/${clinicId}/patients?page=1&limit=20`,
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
http://localhost:3001/api/v1/clinics/{clinicId}/...
```

Direct browser-to-Gateway calls are not part of the frontend contract.

### Common request rules

- `clinicId` and every path identifier must be a UUID.
- JSON bodies must use `Content-Type: application/json`.
- Request and response property names use `camelCase`.
- Unknown JSON body fields are rejected with HTTP `400`.
- Query dates must be valid ISO 8601 date strings.
- Query booleans should be sent as `true` or `false`; `1` is also interpreted
  as `true`.
- Body booleans must be JSON booleans, not strings.
- All records are tenant-scoped by the `clinicId` path value.
- The frontend must obtain `clinicId` from trusted session/clinic context. It
  must not accept an arbitrary clinic ID from free-form user input.

## 2. Shared values and response conventions

### Enums

```ts
type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';
type PatientDocumentType = 'GENERAL' | 'INSURANCE' | 'MEDICAL' | 'OTHER';
```

### Date and empty-value behavior

- `createdAt`, `updatedAt`, `deletedAt`, and returned `dateOfBirth` values are
  ISO 8601 strings.
- Because the internal gRPC contract uses scalar strings, an absent nullable
  response value is returned as `""`, not `null`. This applies to fields such
  as `userId`, `phone`, `email`, `dateOfBirth`, `gender`, `address`, `notes`,
  `allergies`, `chronicConditions`, `currentMedications`, `medicalNotes`,
  `deletedAt`, `code`, `policyNumber`, `memberId`, and `title`.
- On update endpoints, omit a field to leave it unchanged. For nullable text,
  date, gender, code, policy/member, and document-title fields, send `""` to
  clear the current value.
- Create requests should omit unused optional fields instead of sending
  `null`.

### Common response shapes

```ts
interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  status: PatientStatus;
  userId: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: PatientGender | '';
  address: string;
  notes: string;
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  medicalNotes: string;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientListItem {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: PatientStatus;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: PatientGender | '';
  createdAt: string;
  updatedAt: string;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InsuranceProvider {
  id: string;
  clinicId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InsuranceTemplate {
  id: string;
  clinicId: string;
  insuranceProviderId: string;
  name: string;
  fileUrl: string;
  createdAt: string;
}

interface PatientInsurance {
  id: string;
  clinicId: string;
  patientId: string;
  insuranceProviderId: string;
  policyNumber: string;
  memberId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PatientDocument {
  id: string;
  clinicId: string;
  patientId: string;
  type: PatientDocumentType;
  title: string;
  fileUrl: string;
  createdAt: string;
}

interface SuccessResponse {
  success: true;
}
```

## 3. Patient endpoints

All paths below are relative to
`/api/bff/clinics/{clinicId}` in frontend code.

| Method   | Path                                | Purpose                                  | Success response                                   |
| -------- | ----------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| `POST`   | `/patients`                         | Create a patient                         | `201 Patient`                                      |
| `GET`    | `/patients`                         | List and filter patients                 | `200 { items: PatientListItem[]; meta: PageMeta }` |
| `GET`    | `/patients/search`                  | Search full patient records by name      | `200 { items: Patient[] }`                         |
| `GET`    | `/patients/by-user/{userId}`        | Find the patient linked to a user        | `200 Patient`                                      |
| `GET`    | `/patients/{patientId}`             | Get one patient                          | `200 Patient`                                      |
| `PUT`    | `/patients/{patientId}`             | Partially update a patient               | `200 Patient`                                      |
| `DELETE` | `/patients/{patientId}`             | Permanently delete a patient             | `200 SuccessResponse`                              |
| `PUT`    | `/patients/{patientId}/soft-delete` | Archive and soft-delete a patient        | `200 SuccessResponse`                              |
| `PUT`    | `/patients/{patientId}/restore`     | Restore a soft-deleted patient as active | `200 Patient`                                      |

Route ordering matters conceptually: use the dedicated `/patients/search` and
`/patients/by-user/{userId}` routes exactly as shown; do not treat `search` or
`by-user` as patient IDs.

### Create patient

Required fields are `firstName` and `lastName`.

```ts
interface CreatePatientBody {
  firstName: string; // non-empty, max 100
  lastName: string; // non-empty, max 100
  userId?: string; // UUID
  phone?: string; // max 30
  email?: string; // valid email, max 255
  dateOfBirth?: string; // ISO 8601 date
  gender?: PatientGender;
  address?: string;
  notes?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  medicalNotes?: string;
  status?: PatientStatus; // default: ACTIVE
}
```

Example:

```ts
await fetch(`/api/bff/clinics/${clinicId}/patients`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    firstName: 'Sara',
    lastName: 'Amrani',
    phone: '+212600000000',
    email: 'sara@example.com',
    status: 'ACTIVE',
  } satisfies CreatePatientBody),
});
```

### List patients

`GET /patients` accepts:

| Query field   | Type            | Rules and behavior                                                        |
| ------------- | --------------- | ------------------------------------------------------------------------- |
| `page`        | integer         | Minimum `1`; default `1`                                                  |
| `limit`       | integer         | `1..100`; default `20`                                                    |
| `status`      | `PatientStatus` | Exact enum filter                                                         |
| `gender`      | `PatientGender` | Exact enum filter                                                         |
| `search`      | string          | Matches first name, last name, phone, or email                            |
| `isNew`       | boolean         | When true, only records created in the last 30 days                       |
| `createdFrom` | ISO date string | Inclusive lower creation-date bound                                       |
| `createdTo`   | ISO date string | Inclusive upper creation-date bound                                       |
| `sortBy`      | string          | `firstName`, `lastName`, `createdAt`, or `updatedAt`; default `createdAt` |
| `sortOrder`   | string          | `asc` or `desc`; default `desc`                                           |

`isNew=false` does not add a "not new" filter; it behaves like an omitted
`isNew`.

### Search patients by name

`GET /patients/search` accepts optional string query fields `firstName` and
`lastName`. Each supplied field performs a contains match. Results are ordered
by last name and then first name ascending. With neither query field, the
current implementation returns all patients as full `Patient` records without
pagination; use `GET /patients` for normal screens.

### Update patient

`PUT /patients/{patientId}` accepts any subset of:

```ts
interface UpdatePatientBody {
  firstName?: string; // non-empty when supplied, max 100
  lastName?: string; // non-empty when supplied, max 100
  phone?: string; // max 30
  email?: string; // valid email or "" to clear, max 255
  dateOfBirth?: string; // ISO 8601 date or "" to clear
  gender?: PatientGender | ''; // "" clears
  address?: string;
  notes?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  medicalNotes?: string;
  status?: PatientStatus;
}
```

`userId` cannot be changed through the current update endpoint.

### Deletion behavior

- `DELETE /patients/{patientId}` is a hard delete. Related patient insurance
  and patient documents are deleted by database cascade.
- `PUT /patients/{patientId}/soft-delete` sets status to `ARCHIVED` and hides
  the patient from normal get/list/search operations.
- `PUT /patients/{patientId}/restore` restores the record and sets status to
  `ACTIVE`.

## 4. Insurance provider endpoints

| Method   | Path                                           | Purpose                     | Success response                         |
| -------- | ---------------------------------------------- | --------------------------- | ---------------------------------------- |
| `POST`   | `/insurance-providers`                         | Create a provider           | `201 InsuranceProvider`                  |
| `GET`    | `/insurance-providers`                         | List/filter providers       | `200 { providers: InsuranceProvider[] }` |
| `GET`    | `/insurance-providers/{providerId}`            | Get one provider            | `200 InsuranceProvider`                  |
| `PUT`    | `/insurance-providers/{providerId}`            | Partially update a provider | `200 InsuranceProvider`                  |
| `DELETE` | `/insurance-providers/{providerId}`            | Delete a provider           | `200 SuccessResponse`                    |
| `PUT`    | `/insurance-providers/{providerId}/activate`   | Activate a provider         | `200 InsuranceProvider`                  |
| `PUT`    | `/insurance-providers/{providerId}/deactivate` | Deactivate a provider       | `200 InsuranceProvider`                  |

### Provider bodies

```ts
interface CreateInsuranceProviderBody {
  name: string; // required, non-empty, max 255
  code?: string; // max 50
  isActive?: boolean; // default: true
}

interface UpdateInsuranceProviderBody {
  name?: string; // non-empty when supplied, max 255
  code?: string; // max 50; "" clears
  isActive?: boolean;
}
```

`GET /insurance-providers` accepts:

| Query field | Type    | Behavior                            |
| ----------- | ------- | ----------------------------------- |
| `isActive`  | boolean | Filters active/inactive state       |
| `search`    | string  | Contains match against name or code |
| `name`      | string  | Case-insensitive exact name filter  |
| `code`      | string  | Case-insensitive exact code filter  |

If both `name` and `code` are supplied, the current Gateway applies only the
`name` exact filter. Results are ordered by provider name ascending.

Provider names are unique inside a clinic. Deleting a provider also deletes
its templates. Deletion fails with HTTP `409` while patient-insurance records
still reference the provider.

## 5. Insurance template endpoints

| Method   | Path                                | Purpose                     | Success response                         |
| -------- | ----------------------------------- | --------------------------- | ---------------------------------------- |
| `POST`   | `/insurance-templates`              | Create a template           | `201 InsuranceTemplate`                  |
| `GET`    | `/insurance-templates`              | List/filter templates       | `200 { templates: InsuranceTemplate[] }` |
| `GET`    | `/insurance-templates/{templateId}` | Get one template            | `200 InsuranceTemplate`                  |
| `PUT`    | `/insurance-templates/{templateId}` | Partially update a template | `200 InsuranceTemplate`                  |
| `DELETE` | `/insurance-templates/{templateId}` | Delete a template           | `200 SuccessResponse`                    |

### Template bodies

```ts
interface CreateInsuranceTemplateBody {
  insuranceProviderId: string; // required UUID
  name: string; // required, non-empty, max 255
  fileUrl: string; // required, non-empty, max 500
}

interface UpdateInsuranceTemplateBody {
  name?: string; // non-empty when supplied, max 255
  fileUrl?: string; // non-empty when supplied, max 500
}
```

The patient API does not upload files. The frontend must first obtain a usable
file URL through the future/owning upload flow, then submit that URL as
`fileUrl`.

`GET /insurance-templates` accepts:

| Query field            | Type      | Behavior                                                              |
| ---------------------- | --------- | --------------------------------------------------------------------- |
| `insuranceProviderId`  | UUID      | Filter by one provider                                                |
| `insuranceProviderIds` | UUID list | Filter by several providers; comma-separated or repeated query values |
| `search`               | string    | Contains match against template name                                  |
| `name`                 | string    | Case-insensitive exact template-name filter                           |

When both provider filters are supplied, `insuranceProviderId` takes
precedence. Results are ordered by template name ascending.

Example list query:

```txt
/api/bff/clinics/{clinicId}/insurance-templates?insuranceProviderIds={id1},{id2}
```

## 6. Patient insurance endpoints

Note the current route naming:

- Patient-scoped collection routes use singular `/insurance`.
- Clinic-wide and item routes use singular `/patient-insurance`.

The frontend must preserve these exact paths.

| Method   | Path                                             | Purpose                       | Success response                         |
| -------- | ------------------------------------------------ | ----------------------------- | ---------------------------------------- |
| `POST`   | `/patients/{patientId}/insurance`                | Add patient insurance         | `201 PatientInsurance`                   |
| `GET`    | `/patients/{patientId}/insurance`                | List one patient's insurance  | `200 { insurances: PatientInsurance[] }` |
| `PUT`    | `/patients/{patientId}/insurance/activate-all`   | Activate all for patient      | `200 SuccessResponse`                    |
| `PUT`    | `/patients/{patientId}/insurance/deactivate-all` | Deactivate all for patient    | `200 SuccessResponse`                    |
| `GET`    | `/patient-insurance`                             | List clinic patient insurance | `200 { insurances: PatientInsurance[] }` |
| `GET`    | `/patient-insurance/{insuranceId}`               | Get one insurance record      | `200 PatientInsurance`                   |
| `PUT`    | `/patient-insurance/{insuranceId}`               | Partially update a record     | `200 PatientInsurance`                   |
| `DELETE` | `/patient-insurance/{insuranceId}`               | Delete a record               | `200 SuccessResponse`                    |
| `PUT`    | `/patient-insurance/{insuranceId}/activate`      | Activate a record             | `200 PatientInsurance`                   |
| `PUT`    | `/patient-insurance/{insuranceId}/deactivate`    | Deactivate a record           | `200 PatientInsurance`                   |

### Patient insurance bodies

```ts
interface CreatePatientInsuranceBody {
  insuranceProviderId: string; // required UUID
  policyNumber?: string; // max 100
  memberId?: string; // max 100
  isActive?: boolean; // default: true
}

interface UpdatePatientInsuranceBody {
  policyNumber?: string; // max 100; "" clears
  memberId?: string; // max 100; "" clears
  isActive?: boolean;
}
```

`GET /patients/{patientId}/insurance` accepts the optional boolean query field
`isActive`.

`GET /patient-insurance` accepts:

| Query field           | Type    | Behavior                          |
| --------------------- | ------- | --------------------------------- |
| `insuranceProviderId` | UUID    | Filter by provider                |
| `isActive`            | boolean | Filter active/inactive state      |
| `policyNumber`        | string  | Exact, case-sensitive post-filter |
| `memberId`            | string  | Exact, case-sensitive post-filter |

If both `policyNumber` and `memberId` are supplied, the current Gateway applies
only `policyNumber`. Insurance lists are ordered newest first.

The two `activate-all`/`deactivate-all` actions return `{ "success": true }`
even when the patient has no insurance records.

## 7. Patient document endpoints

| Method   | Path                              | Purpose                         | Success response                       |
| -------- | --------------------------------- | ------------------------------- | -------------------------------------- |
| `POST`   | `/patients/{patientId}/documents` | Add document metadata           | `201 PatientDocument`                  |
| `GET`    | `/patients/{patientId}/documents` | List a patient's documents      | `200 { documents: PatientDocument[] }` |
| `GET`    | `/patient-documents`              | List clinic patient documents   | `200 { documents: PatientDocument[] }` |
| `GET`    | `/patient-documents/{documentId}` | Get one document                | `200 PatientDocument`                  |
| `PUT`    | `/patient-documents/{documentId}` | Partially update metadata       | `200 PatientDocument`                  |
| `DELETE` | `/patient-documents/{documentId}` | Delete one document record      | `200 SuccessResponse`                  |
| `DELETE` | `/patient-documents`              | Delete several document records | `200 SuccessResponse`                  |

### Document bodies

```ts
interface CreatePatientDocumentBody {
  type: PatientDocumentType; // required
  title?: string; // max 255
  fileUrl: string; // required, non-empty, max 500
}

interface UpdatePatientDocumentBody {
  type?: PatientDocumentType;
  title?: string; // max 255; "" clears
  fileUrl?: string; // non-empty when supplied, max 500
}

interface DeleteManyPatientDocumentsBody {
  ids: string[]; // 1..100 UUIDs
}
```

As with insurance templates, these endpoints store document metadata and a
`fileUrl`; they do not accept multipart file uploads.

`GET /patients/{patientId}/documents` accepts the optional `type` enum query.

`GET /patient-documents` accepts:

| Query field | Type                  | Behavior                                                            |
| ----------- | --------------------- | ------------------------------------------------------------------- |
| `type`      | `PatientDocumentType` | Filter by document type                                             |
| `patientId` | UUID                  | Filter by patient                                                   |
| `search`    | string                | Contains match against title                                        |
| `ids`       | UUID list             | Restrict returned records; comma-separated or repeated query values |

Document lists are ordered newest first. Bulk delete is tenant-safe: only IDs
belonging to the path's clinic are deleted. It currently returns success even
when some supplied IDs do not exist.

## 8. HTTP errors

Frontend code must branch on HTTP status before parsing a success shape.

| Status | Meaning                                                                               |
| ------ | ------------------------------------------------------------------------------------- |
| `400`  | Invalid UUID, invalid query/body value, missing required field, or unknown body field |
| `401`  | The BFF has no valid authenticated frontend session                                   |
| `404`  | The requested patient-context record was not found in this clinic                     |
| `409`  | A unique value already exists or a related record is invalid/still in use             |
| `500`  | Unexpected patient request failure                                                    |
| `502`  | The BFF could not reach the API Gateway                                               |
| `503`  | The API Gateway could not reach the patient service                                   |

Typical Gateway error:

```json
{
  "statusCode": 400,
  "message": ["firstName should not be empty"],
  "error": "Bad Request"
}
```

`message` can be either a string or a string array. The BFF authentication and
connectivity errors can omit `error`.

Recommended frontend error type:

```ts
interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

## 9. Frontend integration rules

1. Keep patient-specific API functions and models under
   `apps/frontend/src/features/patients`.
2. Call only `/api/bff/clinics/{clinicId}/...` from client-side code.
3. Centralize these paths in the patient feature API layer; UI components
   should not assemble endpoint strings.
4. Use `GET /patients` for the main patient table because it is paginated.
5. Treat empty scalar response strings as absent values at the API-mapping
   boundary if the UI prefers `null`.
6. Invalidate the affected patient/list queries after create, update, delete,
   restore, activation, or deactivation actions.
7. Do not upload binary files to template/document endpoints; submit an
   existing `fileUrl`.
8. Do not expose hard delete as the normal archive action. Use `soft-delete`
   for reversible user-facing removal.

## 10. Known backend integration gaps

These gaps describe the implementation verified on the date at the top of this
document:

- The frontend BFF requires a valid session and forwards a Bearer token, but
  the patient API Gateway controllers do not yet apply an authentication guard
  or verify that the caller belongs to `{clinicId}`. The Gateway must add both
  checks before the patient API is considered safe for production exposure.
- There is no OpenAPI/Swagger generator configured in the API Gateway. This
  Markdown file documents the implemented HTTP contract; DTOs and shared
  contracts remain the executable source of truth.
- File upload/storage is not owned by the patient endpoints. Template and
  patient-document creation requires an already available `fileUrl`.
- Only the main patient list is paginated. Provider, template, insurance,
  document, and name-search lists currently return complete arrays.
