# Clinora Frontend Architecture

This guide defines the frontend architecture, naming conventions, folder responsibilities, dependency rules, and implementation standards for `apps/frontend`.

Frontend architecture belongs to Clinora. Ubold is a visual and styling reference only; it must not dictate application boundaries or folder structure.

## Architecture Style

The frontend uses a modular feature-based architecture inspired by Feature-Sliced Design, without applying strict FSD layers.

Goals:

- Keep business-related code together.
- Avoid large global folders grouped only by file type.
- Keep Next.js routes thin.
- Separate frontend domain models from backend response DTOs.
- Separate reads from writes using lightweight CQRS conventions.
- Prefer simple, explicit code over unnecessary abstractions.
- Allow the architecture to grow gradually.

The frontend does not implement backend-style CQRS, DDD, command buses, query buses, aggregates, or event buses.

## Root Structure

Target structure for `apps/frontend`:

```txt
apps/frontend/
  src/
    app/
    features/
    components/
    lib/
    hooks/
    stores/
    config/
    types/
    middleware.ts
  public/
  next.config.js
  project.json
  tsconfig.json
```

Folder responsibilities:

| Folder | Responsibility |
| --- | --- |
| `app/` | Next.js routes, layouts, route groups, providers, loading states, error boundaries, and page composition |
| `features/` | Business modules such as appointments, patients, clinics, queue, staff, billing, and authentication |
| `components/` | Generic reusable UI, application shell, and feedback components |
| `lib/` | Shared technical infrastructure such as API client, authentication helpers, i18n, and generic utilities |
| `hooks/` | Hooks reusable across unrelated features |
| `stores/` | Truly global application state only |
| `config/` | Application-wide configuration and constants |
| `types/` | Generic application-wide technical types |
| `middleware.ts` | Next.js request middleware when required |

Do not create empty folders preemptively. Add folders when real code needs them.

## Feature Modules

Each business area is represented by a feature module.

Examples:

```txt
src/features/
  auth/
  clinics/
  staff/
  patients/
  appointments/
  queue/
  billing/
```

A mature feature may use this structure:

```txt
features/appointments/
  api/
    commands/
    queries/
    dto/
    index.ts
  components/
  hooks/
    commands/
    queries/
    index.ts
  model/
    appointment.ts
    appointment.commands.ts
    appointment.queries.ts
    appointment.mapper.ts
    appointment.rules.ts
    appointment.enums.ts
  schemas/
  utils/
  index.ts
```

A smaller feature should start smaller:

```txt
features/clinics/
  api/
  components/
  hooks/
  model/
  index.ts
```

Split folders only when the number of files justifies it.

## Dependency Rules

Use this dependency direction:

```txt
app
  -> features
  -> components / lib / hooks / stores / config / types
```

Allowed imports:

- `app/` may import from feature modules and shared folders.
- A feature may import from shared folders.
- A feature should not import implementation details from another feature.
- Shared folders must not import from feature modules.

Avoid cross-feature implementation imports like this:

```ts
import { PatientCard } from '@/features/patients/components/patient-card';
```

Prefer one of these approaches:

- Compose both features in a route or higher-level component.
- Move truly generic UI into `components/ui`.
- Expose a stable public API from the owning feature.
- Extract a shared business concept only after real reuse appears.

## Next.js App Folder

The `app` folder contains routing and composition, not feature implementation details.

Example:

```txt
app/
  (public)/
  (auth)/
  (dashboard)/
  api/
  layout.tsx
  providers.tsx
  loading.tsx
  error.tsx
```

A route page should remain small:

```tsx
import { AppointmentCalendar } from '@/features/appointments';

export default function AppointmentsPage() {
  return <AppointmentCalendar />;
}
```

Do not place these directly in `page.tsx` unless trivial:

- Large forms
- API request logic
- React Query configuration
- Complex validation
- Business rules
- Large data tables
- Feature-specific stores
- Mapping logic

Pages should mainly compose features and layout components.

## Shared Components

Use this structure when shared UI exists:

```txt
components/
  ui/
  layout/
  feedback/
```

`components/ui` contains generic design-system components with no business knowledge.

Examples:

```txt
button.tsx
input.tsx
dialog.tsx
select.tsx
data-table.tsx
pagination.tsx
```

`components/layout` contains application shell components.

Examples:

```txt
sidebar.tsx
dashboard-header.tsx
dashboard-shell.tsx
mobile-navigation.tsx
```

`components/feedback` contains reusable feedback components.

Examples:

```txt
loading-spinner.tsx
empty-state.tsx
error-state.tsx
confirmation-dialog.tsx
```

## Frontend Domain Models

Frontend domain models live inside the owning feature's `model/` folder.

Example:

```txt
features/appointments/model/appointment.ts
```

Use plain TypeScript interfaces or type aliases by default:

```ts
export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Use names like:

```txt
Appointment
Patient
Clinic
Invoice
QueueEntry
```

Do not use frontend model suffixes like:

```txt
AppointmentEntity
PatientEntity
ClinicEntity
```

Use classes only when the model has substantial behavior, invariants, or state transitions that clearly benefit from encapsulation.

## Frontend Business Rules

Keep frontend domain models as plain objects and place business rules in dedicated functions.

Example:

```txt
features/appointments/model/appointment.rules.ts
```

```ts
import type { Appointment } from './appointment';

export function canCancelAppointment(
  appointment: Appointment,
  now = new Date(),
): boolean {
  return appointment.status === 'confirmed' && appointment.scheduledAt > now;
}
```

Do not duplicate the same business condition in several components.

Important frontend rules must still be validated by the backend. Frontend rules improve user experience but do not provide security or final business enforcement.

## Lightweight CQRS Convention

The frontend separates reads and writes conceptually.

Queries read data and do not modify server state.

Examples:

```txt
get-appointment.ts
get-appointments.ts
get-available-slots.ts
get-calendar-appointments.ts
```

Commands modify server state.

Examples:

```txt
create-appointment.ts
cancel-appointment.ts
reschedule-appointment.ts
confirm-appointment.ts
complete-appointment.ts
```

Use:

```txt
api/queries/
api/commands/
```

The frontend does not use a command bus or query bus unless a future requirement clearly justifies it.

## Commands And Queries

Command types live in the feature's `model/` folder.

Example:

```txt
features/appointments/model/appointment.commands.ts
```

```ts
export interface CreateAppointmentCommand {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMinutes: number;
  channel: AppointmentChannel;
  notes?: string;
}
```

A command represents the user's intention. Do not include UI-only state in commands.

Query input types also live in the feature's `model/` folder.

Example:

```txt
features/appointments/model/appointment.queries.ts
```

```ts
export interface GetAppointmentsQuery {
  clinicId: string;
  doctorId?: string;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
}
```

## DTO Policy

Response DTOs belong in the owning feature's `api/dto/` folder.

Example:

```txt
features/appointments/api/dto/appointment-response.dto.ts
```

DTOs must match the backend response exactly. They may contain string dates, nullable values, API enum values, backend-specific naming, pagination wrappers, and snapshot fields.

Do not use response DTOs directly in components when a domain mapping exists.

Frontend request DTOs are optional. When the command shape matches the backend request contract, send the command directly.

Create a request DTO only when:

- Field names differ.
- Dates require transformation.
- Enums differ.
- The API body excludes URL parameters.
- Several commands share one transport contract.
- The backend expects nested or flattened data.
- A mapping is repeated in several places.
- The command contains non-serializable values.

## DTO-To-Domain Mappers

Mappers live in the feature's `model/` folder.

Example:

```txt
features/appointments/model/appointment.mapper.ts
```

Mapping should happen at the API boundary so the rest of the feature works with frontend domain models.

Flow:

```txt
Backend JSON
  -> Response DTO
  -> Mapper
  -> Frontend domain model
  -> Hooks, stores, and components
```

## API File Organization

Use one endpoint or action per file once a feature has several operations.

Recommended structure:

```txt
api/
  commands/
    create-appointment.ts
    update-appointment.ts
    cancel-appointment.ts
    confirm-appointment.ts
    complete-appointment.ts
  queries/
    get-appointment.ts
    get-appointments.ts
    get-calendar-appointments.ts
    get-available-slots.ts
  dto/
    appointment-response.dto.ts
    appointment-list-response.dto.ts
    available-slot-response.dto.ts
  index.ts
```

For very small features, one API file is acceptable. Split it when navigation becomes harder or the file starts mixing several responsibilities.

## React Query Hooks

Use TanStack Query conventions:

```txt
useQuery    = query/read
useMutation = command/write
```

Mirror the API organization:

```txt
hooks/
  commands/
    use-create-appointment.ts
    use-cancel-appointment.ts
    use-reschedule-appointment.ts
  queries/
    use-appointment.ts
    use-appointments.ts
    use-available-slots.ts
  index.ts
```

Do not call `fetch` directly from UI components when an API function or hook should own the request.

## Forms And Validation

Form schemas belong inside the feature's `schemas/` folder.

Example:

```txt
features/appointments/schemas/appointment-form.schema.ts
```

Prefer Zod inference for form values.

Form values may differ from commands. Convert form values into a command before calling the API.

Do not send UI-only form state directly to the backend.

## Stores

Place feature-specific Zustand stores inside the owning feature:

```txt
features/appointments/stores/appointment-form.store.ts
```

Use root `src/stores/` only for truly global state such as:

```txt
sidebar.store.ts
locale.store.ts
clinic-context.store.ts
```

Prefer server state in TanStack Query rather than duplicating it in Zustand.

Use Zustand mainly for:

- Multi-step form state
- Temporary UI workflows
- Cross-component client state
- Drafts not yet persisted to the backend

## Public APIs And Imports

Each feature should expose a public API through `index.ts`.

Example:

```ts
export { AppointmentCalendar } from './components/appointment-calendar';
export { AppointmentForm } from './components/appointment-form';
export { useAppointments } from './hooks/queries/use-appointments';
export { useCreateAppointment } from './hooks/commands/use-create-appointment';
export type { Appointment } from './model/appointment';
```

Use public imports outside the feature:

```ts
import {
  AppointmentCalendar,
  useAppointments,
  type Appointment,
} from '@/features/appointments';
```

Inside the same feature, relative imports are acceptable and often clearer.

Do not export every internal helper. Export only what other modules genuinely need.

## Naming Conventions

Use kebab-case file names:

```txt
create-appointment.ts
appointment-card.tsx
appointment-response.dto.ts
use-create-appointment.ts
appointment.rules.ts
```

Use PascalCase for React components and domain types:

```txt
Appointment
AppointmentCard
CreateAppointmentDialog
```

Use camelCase for functions and variables:

```txt
createAppointment
mapAppointmentFromDto
canCancelAppointment
```

Use DTO suffixes only for transport contracts:

```txt
AppointmentResponseDto
AvailableSlotResponseDto
PaginatedAppointmentsResponseDto
```

Do not add `Entity` to frontend domain model names.

## Server And Client Components

Use Server Components by default.

Add `'use client'` only when required for:

- State
- Effects
- Browser APIs
- Event handlers
- React Query hooks
- Zustand hooks
- Interactive forms

Keep the client boundary as low as practical. Do not make an entire route client-side only because one small child component requires interactivity.

## Multi-Tenant Security

The selected clinic in frontend state is a UI selection, not an authorization source of truth.

The backend must validate clinic access using authenticated claims such as:

```txt
clinic_id
allowed_clinic_ids
```

A route slug or browser-provided clinic ID must never be trusted for authorization.

The frontend may pass an effective clinic ID as part of a request when required, but the backend remains responsible for validating access.

## Error Handling

API errors should be normalized in shared infrastructure.

Example:

```txt
lib/api/api-error.ts
lib/api/api-client.ts
```

Features may translate normalized API errors into feature-specific messages.

Do not repeat low-level response parsing in every endpoint file. Do not expose raw backend error objects directly in the UI.

## Ubold Integration

Ubold is a styling and design reference.

Use Ubold for:

- Visual language
- Layout inspiration
- SCSS patterns
- Design tokens and theme direction
- Existing visual components that can be adapted cleanly

Do not use Ubold to define Clinora's feature boundaries, routing structure, data flow, or domain model organization.

Do not dump the full template into `apps/frontend`. Bring in only the assets, styles, and component patterns needed for the current step.

## Avoid These Patterns

Avoid large generic files such as:

```txt
appointments.api.ts
appointments.types.ts
appointments.utils.ts
```

when they contain many unrelated operations.

Avoid global dumping-ground folders:

```txt
src/types/appointment.ts
src/services/appointment.service.ts
src/hooks/use-appointments.ts
src/utils/appointment.ts
```

when all of them belong to the same feature.

Avoid unnecessary duplication:

```txt
CreateAppointmentCommand
CreateAppointmentRequestDto
```

when both types are identical and no mapping is needed.

Avoid introducing classes, repositories, use-case classes, dependency injection containers, or command buses on the frontend without a concrete need.

## Decision Guide

Use these rules when deciding where code belongs:

- Next.js route, layout, provider, loading state, or error boundary: `app/`
- Business-specific code: `features/<feature-name>/`
- Generic reusable visual component: `components/ui/`
- Application shell component: `components/layout/`
- Shared technical infrastructure: `lib/`
- Frontend business representation: `features/<feature>/model/`
- Backend response contract: `features/<feature>/api/dto/`
- Server data read: `features/<feature>/api/queries/`
- Server data write: `features/<feature>/api/commands/`
- Frontend domain rule: `features/<feature>/model/<feature>.rules.ts`
- Form validation: `features/<feature>/schemas/`

## Implementation Principles

When implementing frontend code:

1. Keep code close to the business feature that owns it.
2. Keep route files thin.
3. Use plain objects for frontend domain models by default.
4. Put reusable business rules in pure functions.
5. Separate API reads from writes.
6. Use one API operation per file when a feature grows.
7. Keep response DTOs at the API boundary.
8. Map response DTOs into frontend domain models.
9. Send commands directly when they already match the backend request contract.
10. Introduce request DTOs only when they solve a real mismatch.
11. Keep server state in TanStack Query.
12. Keep feature-specific client state inside the feature.
13. Do not create abstractions before they are needed.
14. Prefer explicit and maintainable code over architectural ceremony.
15. Preserve existing conventions when modifying an established feature, unless the task explicitly includes refactoring it.
