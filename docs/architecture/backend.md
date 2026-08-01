# Clinora Backend Architecture

This guide defines the backend architecture, folder responsibilities, dependency rules, communication patterns, and implementation standards for `apps/backend`.

The backend uses a clean, service-owned architecture inside an Nx monorepo. Legacy DentiFlow backend code is a reference for proven ideas such as service-local domain/application/infrastructure boundaries, gRPC controllers, gRPC adapters, NATS outbox relays, and gateway SSE streaming. It must be adapted to Clinora's current service boundaries, contract packages, and API Gateway structure.

## Architecture Style

Clinora backend services are organized by bounded context.

Goals:

- Keep business logic inside the microservice that owns the bounded context.
- Keep domain code independent from NestJS, TypeORM, generated contracts, and transport details.
- Keep use cases explicit and easy to test.
- Keep persistence, gRPC clients, NATS, mappers, and other technical details in infrastructure.
- Keep gRPC controllers thin and focused on transport mapping.
- Keep the API Gateway as an external HTTP orchestration layer, not a domain owner.
- Share contracts, not entities or business logic.
- Add shared backend libraries only for stable technical infrastructure with real reuse.

Do not introduce command buses, event buses, generic repositories, or shared business abstractions unless a concrete need appears.

## Backend Root Structure

Target structure for `apps/backend`:

```txt
apps/backend/
  api-gateway/
  api-gateway-e2e/
  services/
    auth-service/
    clinic-service/
    patient-service/
    <service-name>/
```

Folder responsibilities:

| Folder | Responsibility |
| --- | --- |
| `api-gateway/` | External HTTP API, auth guards, DTO validation, facades, and typed clients for backend services |
| `api-gateway-e2e/` | Gateway-level end-to-end tests |
| `services/<service>/` | A runnable microservice with its own domain, application, infrastructure, presentation, database model, migrations, and bootstrap |
| `services/<service>-e2e/` | Service-level end-to-end tests when present |

Shared backend technical infrastructure belongs in `libs/backend/` only when reuse is real. API, gRPC, event, and protobuf contracts belong in `libs/contracts/`.

## Microservice Structure

A mature microservice should follow this shape:

```txt
apps/backend/services/<service-name>/
  src/
    app.module.ts
    main.ts
    configuration/
      <service>-environment.ts
    common/
      pipes/
    health/
      health.controller.ts
      health.module.ts
    <bounded-context>/
      <bounded-context>.module.ts
      <bounded-context>.tokens.ts
      domain/
        entities/
        enums/
        repositories/
      application/
        errors/
        models/
        ports/
        use-cases/
      infrastructure/
        grpc/
        nats/
        persistence/
          entities/
          mappers/
          migrations/
          repositories/
      presentation/
        grpc/
          controllers/
          <context>.grpc-inputs.ts
          <context>.grpc-mapper.ts
          <context>-rpc-error.ts
```

Create only the folders a service actually needs. For example, `patient-service` does not need `application/ports` yet because it does not call another service. `clinic-service` does need `application/ports` and `infrastructure/grpc/auth` because staff management talks to the auth service through a port.

## Folder Responsibilities

Use this guide when deciding where code belongs.

| Folder | Belongs Here | Does Not Belong Here |
| --- | --- | --- |
| `domain/entities` | Domain entities, invariant helpers, computed domain properties, state transition helpers | NestJS decorators, TypeORM decorators, gRPC DTOs |
| `domain/enums` | Bounded-context enum values used by domain and application code | Generated transport enum types when they differ |
| `domain/repositories` | Repository interfaces, persistence-facing input types, result types owned by the domain | TypeORM queries, database entities, `InjectRepository` |
| `application/errors` | Business and application error classes from the owning context | HTTP exceptions, `RpcException`, raw database errors |
| `application/models` | Application result models that are not domain entities | Transport replies or TypeORM models |
| `application/ports` | Interfaces for dependencies outside the context, such as another service or external provider | Concrete gRPC clients, HTTP clients, SDK setup |
| `application/use-cases` | Business workflow orchestration, validation against repositories, compensation logic, calls to ports | TypeORM query builders, generated gRPC clients, HTTP response mapping |
| `infrastructure/grpc` | gRPC client modules and adapters that implement application ports | Use-case decisions or domain invariants |
| `infrastructure/nats` | NATS publishers, subscribers, outbox relays, and event delivery adapters | Business decisions that should happen before events are written |
| `infrastructure/persistence/entities` | TypeORM entities owned by this service only | Domain entities shared with other services |
| `infrastructure/persistence/mappers` | Mapping between TypeORM entities and domain entities | Business workflows or transport mapping |
| `infrastructure/persistence/migrations` | TypeORM migrations for this service database only | Migrations for another service |
| `infrastructure/persistence/repositories` | TypeORM repository implementations and persistence error translation | Repository interfaces or controller mapping |
| `presentation/grpc` | gRPC controllers, input validation classes, gRPC reply mappers, RPC error mapping | Business rules, database queries, cross-service client setup |
| `configuration` | Environment parsing and validation for the service | Feature-specific domain constants |
| `common` | Service-local technical helpers such as RPC validation pipes | Shared business rules |
| `health` | HTTP health endpoint for orchestration and infrastructure | Business readiness checks unless explicitly required |

## Dependency Direction

Dependencies point inward:

```txt
presentation -> application -> domain
infrastructure -> application/domain
module wiring -> all layers
```

Rules:

- Domain must not import NestJS, TypeORM, gRPC contracts, DTOs, generated clients, infrastructure classes, or API Gateway code.
- Application may import domain types, repository interfaces, application ports, and application errors.
- Application must not import TypeORM repositories, generated gRPC clients, `ClientGrpc`, HTTP controllers, or transport reply types.
- Infrastructure may import domain and application interfaces to implement repositories and ports.
- Presentation may import use cases, input DTO classes, contract service names, and transport mappers.
- Nest modules wire dependencies together; they should not contain business logic.
- No service may import another service's `src` folder.

## Service Modules

Each bounded context has one focused Nest module, such as `patient.module.ts` or `clinic.module.ts`.

The module should:

- Register only this service's TypeORM entities with `TypeOrmModule.forFeature(...)`.
- Register gRPC controllers for the bounded context.
- Register use cases.
- Bind repository interfaces to TypeORM implementations with explicit tokens.
- Import infrastructure client modules only when an application port needs them.

Patient service is the current example for a CRUD-heavy context:

```txt
PatientModule
  imports TypeOrm patient entities
  controllers Patient/Insurance gRPC controllers
  providers Manage*UseCase classes
  binds PATIENT_REPOSITORY -> TypeOrmPatientRepository
```

Clinic service is the current example for cross-service dependency:

```txt
ClinicModule
  imports TypeOrm clinic entities
  imports AuthClientModule
  controllers ClinicGrpcController
  providers Manage*UseCase classes
  binds repositories
  consumes AUTH_SERVICE_PORT
```

Provider tokens belong near the owning context in `<context>.tokens.ts`. Use symbols, not string literals, for service-local injection tokens.

## App Module And Bootstrap

`app.module.ts` owns service-level infrastructure composition:

- Load and validate environment with `ConfigModule.forRoot(...)`.
- Configure this service's TypeORM connection.
- List only this service's entities and migrations.
- Import the bounded-context module and health module.
- Keep `synchronize: false`.

`main.ts` owns runtime startup:

- Create the Nest app.
- Read `PORT` and `GRPC_PORT`.
- Install service-local global pipes such as `RpcValidationPipe`.
- Connect the gRPC microservice using constants and `resolve*ProtoPath()` from `libs/contracts`.
- Start microservices before HTTP listen.
- Enable shutdown hooks.

The HTTP port exists for health and operational endpoints. Business API traffic enters through gRPC from the API Gateway unless a future architecture decision says otherwise.

## Domain Layer

Domain entities should represent business concepts from the bounded context.

Use classes when the model has behavior, computed properties, invariants, or state transitions. Use plain types only when there is no behavior to encapsulate.

Example responsibilities:

- `Patient` owns patient identity and computed `fullName`.
- `StaffMember` owns staff status helpers and admin-related state checks.
- `WorkingHours` owns clinic schedule representation.

Domain entities should use domain enum types from the same context. They should not know how data is stored or transported.

Repository interfaces in `domain/repositories` define what the application needs from persistence. They may include input types such as `CreatePatient`, `UpdatePatient`, or `ListPatients` when those are domain/application concepts. They must return domain entities or domain result types.

## Application Layer

Use cases orchestrate business workflows.

They should:

- Be injectable Nest providers.
- Prefer constructor injection.
- Depend on repository interfaces and application ports through tokens.
- Throw application errors from `application/errors`.
- Keep methods focused on user or service actions.
- Coordinate compensation when a cross-service step succeeds but local persistence fails.

They should not:

- Build TypeORM queries.
- Return gRPC replies.
- Throw HTTP exceptions or `RpcException`.
- Reach directly into another service client.
- Duplicate controller validation that belongs at the transport boundary.

Use `clinic-service` staff management as the pattern for service dependency compensation. It provisions or updates auth identity through `AuthServicePort`, persists local staff state, and attempts rollback or cleanup if local persistence fails. It raises a consistency error with a correlation id when compensation fails.

## Infrastructure Persistence

Persistence is private to the owning microservice.

TypeORM entities:

- Live under `infrastructure/persistence/entities`.
- Use database column names and TypeORM decorators.
- Are never imported by another microservice.
- Are never exposed through contracts.

Mappers:

- Live under `infrastructure/persistence/mappers`.
- Convert TypeORM entities to domain entities and domain values back to persistence shapes when needed.
- Should be deterministic and free of business workflows.

Repositories:

- Live under `infrastructure/persistence/repositories`.
- Implement interfaces from `domain/repositories`.
- Own TypeORM query builders, transactions, constraints, and pagination queries.
- Translate persistence errors into application/domain errors before they leave infrastructure.
- Preserve tenant or clinic scoping in every query that reads or writes scoped data.

Migrations:

- Live under `infrastructure/persistence/migrations`.
- Belong only to the service that owns the database tables.
- Are registered in that service's `app.module.ts`.
- Must not create or modify tables owned by another service.

## gRPC Contracts

Contracts live in `libs/contracts/<context>`.

Each contract package should contain:

```txt
libs/contracts/<context>/
  src/
    index.ts
    lib/
      <context>.proto
      <context>.contract.ts
```

Responsibilities:

- `.proto` defines the service, RPC methods, request messages, and reply messages.
- `<context>.contract.ts` exports package names, service names, proto path resolution, request/reply TypeScript interfaces, and generated-client-compatible interfaces.
- `index.ts` exposes the public contract API.

Contracts are transport-focused. They must not contain TypeORM entities, use cases, repository interfaces, or business services.

When changing cross-service behavior:

1. Update the proto and contract interfaces.
2. Update the serving microservice gRPC controller and mapper.
3. Update API Gateway or consuming-service clients.
4. Update tests on both sides of the contract.

## gRPC Presentation In Microservices

`presentation/grpc` is the service boundary for incoming gRPC calls.

Use this structure:

```txt
presentation/grpc/
  controllers/
    <resource>.grpc-controller.ts
  <context>.grpc-inputs.ts
  <context>.grpc-mapper.ts
  <context>-rpc-error.ts
```

Controllers should:

- Use `@GrpcMethod(<SERVICE_NAME>, '<MethodName>')`.
- Accept validated input classes from `<context>.grpc-inputs.ts`.
- Convert transport date strings and optional values into application input values.
- Call exactly the required use case method.
- Return replies through the gRPC mapper.
- Catch unknown errors and delegate to `<context>-rpc-error.ts`.

Mappers should:

- Convert domain entities into contract replies.
- Normalize nullable domain values into the contract representation.
- Format `Date` values as ISO strings or the explicit contract format.
- Avoid business rules.

RPC error helpers should:

- Convert application errors into `RpcException` with gRPC status codes.
- Hide internal persistence or infrastructure details.
- Use `INVALID_ARGUMENT`, `NOT_FOUND`, `ALREADY_EXISTS`, `UNAVAILABLE`, and `INTERNAL` intentionally.

`RpcValidationPipe` should convert class-validator errors into `INVALID_ARGUMENT` RPC exceptions.

## gRPC Clients Inside Microservices

When one microservice needs another synchronously, define an application port in the consuming service and implement it in infrastructure with a gRPC adapter.

Use this shape:

```txt
<context>/application/ports/<provider>-service.port.ts
<context>/infrastructure/grpc/<provider>/
  <provider>-client.module.ts
  grpc-<provider>-service.adapter.ts
```

Rules:

- Use an application port as the use case dependency.
- Register `ClientsModule.registerAsync(...)` in the infrastructure client module.
- Use contract package constants and `resolve*ProtoPath()` from `libs/contracts`.
- Read the target URL from environment, for example `AUTH_SERVICE_GRPC_URL`.
- Implement `OnModuleInit` to get the typed generated service from `ClientGrpc`.
- Use `lastValueFrom` at the adapter boundary.
- Translate gRPC dependency errors into application errors meaningful to the consuming context.

Do not inject `ClientGrpc` directly into use cases.

## API Gateway Structure

The API Gateway is not a microservice bounded context. It is the external API composition layer.

Use this structure:

```txt
apps/backend/api-gateway/src/
  app.module.ts
  main.ts
  clients/
    <service>/
      <service>-service.client.ts
      grpc-<service>-service.client.ts
      <service>-client.module.ts
  common/
    auth/
    errors/
  configuration/
  health/
  modules/
    <external-feature>/
      controllers/
      dto/
      mappers/
      <feature>.facade.ts
      <feature>.module.ts
```

Gateway responsibilities:

- Expose external HTTP routes.
- Validate route params, query params, and request bodies.
- Apply authentication, authorization, role, tenant, and clinic scope guards.
- Build contract requests for backend services.
- Call service clients through facades.
- Map service errors to HTTP exceptions.
- Compose multiple service calls when a public API workflow requires it.
- Own SSE endpoints for browser streaming when the stream is an API concern.

Gateway non-responsibilities:

- No domain entities.
- No TypeORM entities.
- No migrations.
- No direct database access.
- No business rules owned by auth, clinic, patient, appointment, treatment, billing, or another bounded context.
- No generated gRPC clients injected directly into HTTP controllers.

Controllers stay thin. Facades coordinate gateway-level concerns and call typed client interfaces. `clients/<service>` owns gRPC `ClientGrpc` setup and generated contract adaptation.

## API Gateway Clients

Each backend service client in the gateway should use three files:

```txt
clients/<service>/
  <service>-service.client.ts
  grpc-<service>-service.client.ts
  <service>-client.module.ts
```

Responsibilities:

- `<service>-service.client.ts` defines the gateway-owned client interface and injection tokens.
- `grpc-<service>-service.client.ts` adapts the generated contract client to promise-returning gateway methods.
- `<service>-client.module.ts` registers the gRPC client and binds the interface token.

Gateway modules import the client module they need and inject only the client interface into facades.

## HTTP Controllers And DTOs

Gateway controllers should:

- Own route design and HTTP decorators.
- Use DTOs for request bodies and query validation.
- Use Nest pipes for simple param parsing.
- Include authenticated user, role, tenant, and clinic context checks through guards/decorators.
- Delegate service calls to a facade.

Gateway DTOs should mirror HTTP input, not database entities. They may differ from gRPC request types when route params, authenticated claims, or query strings must be merged into the service request.

## Error Handling

In microservices:

- Domain/application errors are thrown by use cases or repository adapters.
- Persistence errors are translated before leaving infrastructure.
- gRPC controllers map application errors to `RpcException`.
- Unknown internal errors become generic `INTERNAL` RPC errors.

In the API Gateway:

- gRPC errors are mapped to HTTP exceptions in facades or shared gateway mappers.
- `INVALID_ARGUMENT` maps to `400`.
- `ALREADY_EXISTS` maps to `409`.
- `NOT_FOUND` maps to `404`.
- `UNAVAILABLE` and `DEADLINE_EXCEEDED` map to `503`.
- Internal service failures should not leak database or stack details.

## NATS And Asynchronous Events

Use NATS for asynchronous service communication and browser-facing realtime updates. Use gRPC for synchronous request/response workflows.

Preferred reliable producer pattern:

```txt
application use case
  -> writes domain state
  -> writes outbox event through outbox repository
  -> infrastructure/nats outbox relay publishes pending events
  -> relay marks events published
```

Outbox responsibilities:

- The outbox table belongs to the producing service.
- `domain/repositories/outbox-repository.interface.ts` defines event persistence needs.
- `infrastructure/persistence/entities/outbox.typeorm-entity.ts` stores event type, JSON payload, publish status, and creation time.
- `infrastructure/persistence/repositories/outbox.repository.ts` reads unpublished events and marks them published.
- `infrastructure/nats/outbox-relay.service.ts` connects to NATS when `NATS_URL` exists, publishes in small batches, and drains on shutdown.

Event naming:

- Use stable subject names such as `queue.checked_in` or `queue.status.updated`.
- Keep event names past-tense or state-change oriented.
- Put event contract definitions in `libs/contracts/` once they are shared across services.
- Include `clinic_id` or the required tenant scope in payloads for filtering and anti-leak checks.

Reliability rules:

- Write events as part of the same business workflow that changes state.
- Prefer transactional outbox when the state change and event must commit together.
- Do not publish directly from controllers.
- Do not use NATS as a shortcut for synchronous reads or commands that need an immediate reply.
- Consumers must be idempotent when repeated delivery can happen.

The legacy appointment queue and treatment services show the pattern. Adapt that shape to Clinora paths and contracts before adding NATS to a current service.

## SSE Streaming Through The Gateway

SSE endpoints belong in the API Gateway when browser clients need realtime updates.

Recommended flow:

```txt
microservice use case writes outbox event
  -> outbox relay publishes NATS subject
  -> gateway NATS broadcaster subscribes
  -> gateway SSE controller filters by authenticated clinic scope
  -> browser receives event stream
```

Gateway SSE responsibilities:

- Authenticate the stream with the same auth guard strategy as HTTP routes.
- Validate the requested `clinicId` against authenticated clinic claims.
- Subscribe to NATS subjects through an infrastructure broadcaster service.
- Keep per-clinic streams isolated.
- Send periodic heartbeats so proxies and browsers keep the connection alive.
- Complete streams and drain NATS subscriptions during shutdown.

Do not stream one clinic's events to another clinic. The legacy SSE controller's clinic check is the baseline idea, but Clinora should implement it inside the current gateway `common/auth`, `modules`, and `clients` structure.

## Multi-Tenant And Clinic Scope

Tenant and clinic isolation is mandatory.

Rules:

- Every scoped repository method accepts and applies `clinicId` or the relevant tenant scope.
- Gateway route params are not trusted by themselves.
- Guards validate authenticated access to the requested clinic.
- Microservices still apply clinic scoping in repositories and use cases.
- Event payloads include clinic scope where consumers need filtering.
- Do not rely on frontend-selected clinic IDs for authorization.

## Shared Libraries

Use `libs/contracts/` for:

- Proto files.
- Generated or hand-maintained gRPC-compatible TypeScript contracts.
- Event contracts shared by more than one app.
- API contract types when shared across backend boundaries.

Use `libs/backend/` for:

- Stable technical infrastructure that is reused by multiple backend apps.
- Logging, tracing, config helpers, database helper modules, or NATS helpers only after actual reuse.

Do not put these in shared libraries:

- Domain entities.
- Repository interfaces.
- TypeORM entities.
- Migrations.
- Use cases.
- Business policies.

## Import Aliases

Microservices may use service-local aliases:

```txt
@domain/*      -> src/<bounded-context>/domain/*
@application/* -> src/<bounded-context>/application/*
@infra/*       -> src/<bounded-context>/infrastructure/*
@common/*      -> src/common/*
```

Use aliases for cross-folder imports inside the same microservice when they make dependencies clearer. Short relative imports are fine inside the same folder.

Aliases are local to one microservice. Do not use them to import another service's code. Do not apply these microservice aliases to the API Gateway.

## Naming Conventions

Use kebab-case file names:

```txt
manage-patients.use-case.ts
patient-repository.interface.ts
patient.typeorm-entity.ts
patient.mapper.ts
patient.grpc-controller.ts
patient-rpc-error.ts
```

Use clear suffixes:

- `.use-case.ts` for application use cases.
- `.interface.ts` for repository interfaces and ports when helpful.
- `.typeorm-entity.ts` for TypeORM persistence entities.
- `.mapper.ts` for deterministic mappers.
- `.grpc-controller.ts` for gRPC controllers.
- `.dto.ts` for HTTP DTOs in the gateway.
- `.port.ts` for application ports to external dependencies.

Prefer names that describe the business action, such as `ManagePatientsUseCase` or `ManageStaffMembersUseCase`, when a cohesive workflow owns several related operations. Split into smaller use cases when the class becomes difficult to understand or test.

## Testing

Match tests to the layer being changed:

- Domain entities: unit tests for computed behavior, invariants, and state transitions.
- Use cases: unit tests with mocked repository interfaces and application ports.
- Persistence mappers: deterministic mapping tests.
- TypeORM repositories: focused integration or adapter tests when query behavior or constraints are risky.
- gRPC controllers: transport mapping, date conversion, and RPC error translation tests.
- gRPC adapters: dependency error translation and contract request mapping tests.
- API Gateway controllers: route/DTO/facade delegation tests.
- API Gateway facades: gRPC to HTTP error mapping tests.
- NATS outbox relay and SSE broadcaster: connection-disabled behavior, subject filtering, payload parsing, and shutdown behavior.

Use pnpm and Nx targets. Do not add npm or yarn lockfiles.

## Migration From Legacy

When adapting legacy DentiFlow backend behavior:

1. Identify the owning Clinora bounded context.
2. Read the legacy use case, domain entities, repositories, mappers, gRPC controller, NATS/SSE code, and migrations involved in that behavior.
3. Extract the architectural intent and business rule.
4. Rebuild it inside the correct Clinora service folder structure.
5. Update `libs/contracts/` first when a cross-service operation or event contract changes.
6. Preserve service-local database ownership.
7. Use Clinora's API Gateway `clients` plus `modules` plus `facade` structure.
8. Verify with focused tests for the service and gateway paths changed.

Never import from `legacy/dentiflow` in production code.

## Decision Guide

Use these rules when deciding where code belongs:

- Domain concept with behavior: `<context>/domain/entities`.
- Domain enum: `<context>/domain/enums`.
- Persistence need expressed as an interface: `<context>/domain/repositories`.
- Business workflow: `<context>/application/use-cases`.
- Business/application error: `<context>/application/errors`.
- Dependency on another service: `<context>/application/ports`.
- gRPC adapter for another service: `<context>/infrastructure/grpc/<service>`.
- TypeORM entity: `<context>/infrastructure/persistence/entities`.
- TypeORM migration: `<context>/infrastructure/persistence/migrations`.
- TypeORM repository implementation: `<context>/infrastructure/persistence/repositories`.
- TypeORM/domain mapping: `<context>/infrastructure/persistence/mappers`.
- Incoming gRPC endpoint: `<context>/presentation/grpc`.
- Microservice environment validation: `src/configuration`.
- Microservice runtime startup: `src/main.ts`.
- Microservice infrastructure composition: `src/app.module.ts`.
- External HTTP route: `api-gateway/src/modules/<feature>/controllers`.
- Gateway HTTP DTO: `api-gateway/src/modules/<feature>/dto`.
- Gateway orchestration and error mapping: `api-gateway/src/modules/<feature>/<feature>.facade.ts`.
- Gateway gRPC client setup: `api-gateway/src/clients/<service>`.
- Shared proto or service contract: `libs/contracts/<context>`.
- Shared event contract: `libs/contracts/<event-domain>` or the owning contract package once reused.

## Implementation Principles

When implementing backend code:

1. Keep business logic in the owning microservice.
2. Keep domain independent from frameworks and transports.
3. Keep use cases explicit and testable.
4. Add ports for outside dependencies before adding adapters.
5. Keep TypeORM entities and migrations service-local.
6. Map domain to transport only at presentation boundaries.
7. Map persistence to domain only in infrastructure.
8. Keep API Gateway controllers thin.
9. Call backend services from gateway facades through typed client interfaces.
10. Use gRPC for synchronous cross-service operations.
11. Use NATS and outbox for asynchronous events.
12. Use SSE only through the gateway for browser-facing realtime streams.
13. Enforce clinic scope in gateway guards and service repositories.
14. Update contracts before implementation when service boundaries change.
15. Add shared backend libraries only for real, stable technical reuse.
16. Preserve existing conventions when modifying an established service, unless the task explicitly includes refactoring it.
