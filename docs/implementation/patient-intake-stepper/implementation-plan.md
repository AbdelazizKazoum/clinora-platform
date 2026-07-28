# Patient Intake Stepper Implementation Plan

## Goal

Build a fast, real-clinic patient intake flow for secretariat users.

The new patient page should allow the secretary to save a patient quickly from the required first step, then optionally continue with medical alerts, insurance, and documents when that information is available.

For the first implementation task, work only on the new patient page and present it as an Add/Edit Patient experience. Do not reuse or refactor the existing patient edit modal yet.

## UX Direction

Use a hybrid flow:

- The new patient page is a stepper.
- The page title should become `Add/Edit Patient`.
- Only Step 1 is required.
- Optional steps can be skipped.
- The patient profile page remains the long-term place to complete and edit the full patient file.

Use the Ubold form wizard as the visual and interaction reference:

```txt
legacy/dentiflow/frontend/ubold-full-template-source-here/src/app/(admin)/form/wizard/components/ValidationSupport.tsx
```

Adapt the `Validation Support` pattern into Clinora's patients feature architecture. Keep the code under `apps/frontend/src/features/patients`; do not copy Ubold's route or folder structure into Clinora.

Relevant Ubold details to adapt:

- `ins-wizard` wrapper
- `wizard-tabs` tab header styling
- Bootstrap `Form noValidate validated={validated}` validation behavior
- Step navigation with active/done states
- Compact card layout consistent with Ubold

Implementation note:

- Clinora already has wizard SCSS at `apps/frontend/src/assets/scss/plugins/_wizard.scss`.
- `react-use-wizard` is not currently installed in `apps/frontend/package.json`. During Task 1, either add it intentionally with `pnpm` if following Ubold directly, or implement a small local step state while preserving the Ubold validation/wizard UI.

Primary actions on Step 1:

- Save patient
- Save and add another
- Save and continue

After Step 1 succeeds, the frontend stores the returned `patient.id` and switches the flow from create mode to edit/attach mode.

## Stepper Structure

### Step 1: Quick Info

Backend table: `patients`

Required:

- `firstName`
- `lastName`

Recommended/optional:

- `phone`
- `email`
- `dateOfBirth`
- `gender`
- `address`
- `status`, default `ACTIVE`

Submit behavior:

- Calls `createPatient`.
- Stores the returned `patientId`.
- Allows the secretary to stop immediately or continue optional details.

### Step 2: Medical Alerts

Backend table: `patients`

Optional fields:

- `allergies`
- `chronicConditions`
- `currentMedications`
- `medicalNotes`

Submit behavior:

- Calls `updatePatient` using the `patientId` from Step 1.
- Can be skipped.

### Step 3: Insurance

Backend tables:

- `insurance_providers`
- `patient_insurances`

Optional fields:

- `insuranceProviderId`
- `policyNumber`
- `memberId`
- `isActive`

Submit behavior:

- Calls a new frontend patient insurance API client.
- Requires `patientId`.
- Can be skipped.

### Step 4: Documents

Backend table: `patient_documents`

Optional fields:

- `type`: `GENERAL`, `INSURANCE`, `MEDICAL`, `OTHER`
- `title`
- `fileUrl`

Submit behavior:

- Calls a new frontend patient document API client.
- Requires `patientId`.
- Can be skipped.

Important note:

- The backend stores `fileUrl`.
- A real upload/storage flow still needs to be decided or implemented before documents can support actual file upload.

## Current Backend Readiness

Already supported by backend and frontend patient DTO/mapper:

- Quick Info fields
- Medical Alerts fields

Already supported by backend gateway, but not yet wired in frontend patient API:

- Patient insurance
- Patient documents
- Insurance providers

Not included for now:

- Patient portal invite/user creation
- Emergency contact
- Preferred contact method
- Preferred language
- Communication consent
- Billing notes/payment category

## Frontend API Work Needed Later

Extend `apps/frontend/src/features/patients/api/patient-api-paths.ts` with paths for:

- `patientInsurances(clinicId, patientId)`
- `patientDocuments(clinicId, patientId)`
- `insuranceProviders(clinicId)`

Add frontend API/model files for:

- Insurance provider list
- Create/list patient insurance
- Create/list patient documents

Relevant backend gateway routes already exist:

```txt
GET  /clinics/:clinicId/insurance-providers
POST /clinics/:clinicId/patients/:patientId/insurance
GET  /clinics/:clinicId/patients/:patientId/insurance
POST /clinics/:clinicId/patients/:patientId/documents
GET  /clinics/:clinicId/patients/:patientId/documents
```

## Implementation Tasks

### Task 1: Build Add/Edit Patient Page With Step 1 And Step 2 Only

Scope:

- Work only on the new patient page flow.
- Change the page title from `Add Patient` to `Add/Edit Patient`.
- Replace the current single-card `PatientCreateForm` with a Ubold-style validation stepper.
- Implement Quick Info.
- Implement Medical Alerts.
- Save Step 1 using `createPatient`.
- Save Step 2 using `updatePatient`.
- Keep insurance and documents out of this first task.
- Do not reuse, replace, or refactor `patient-edit-modal.tsx` in this task.

Architecture:

- Keep feature-specific code under `apps/frontend/src/features/patients`.
- Prefer a reusable patient form model that can later support edit mode.
- Do not move code to `libs/frontend` unless reuse becomes real.
- Inspect Ubold `ValidationSupport.tsx` before implementation and adapt only the needed visual/interaction pattern.

### Task 2: Add Edit Mode To The Add/Edit Patient Page Later

Scope:

- Add route/page support for editing an existing patient with the same Add/Edit Patient stepper.
- Load the patient by ID and hydrate the form.
- Make sure all patient table fields can be edited where appropriate.
- Leave the existing edit modal untouched until there is a deliberate decision to replace it.

### Task 3: Add Insurance Frontend API

Scope:

- Add DTOs, model types, mappers, paths, and API commands/queries for insurance.
- Add Step 3 UI.
- Load insurance providers.
- Create patient insurance after `patientId` exists.

### Task 4: Add Documents Frontend API

Scope:

- Add DTOs, model types, mappers, paths, and API commands/queries for documents.
- Add Step 4 UI.
- Support document metadata first if upload storage is not ready.

### Task 5: Decide File Upload Strategy

Scope:

- Decide where files are uploaded.
- Decide whether the API gateway accepts multipart uploads or the frontend uploads directly to storage with a signed URL.
- Store the final `fileUrl` in `patient_documents`.

## Recommended First Session Prompt

```txt
Implement Task 1 from docs/implementation/patient-intake-stepper/implementation-plan.md.
Only build the first two steps: Quick Info and Medical Alerts.
Use the Ubold form/wizard Validation Support pattern.
Work only on the new patient page and title it Add/Edit Patient.
Do not add insurance or documents yet.
Do not change the existing patient edit modal yet.
```
