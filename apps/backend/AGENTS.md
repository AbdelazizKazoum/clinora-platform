# Clinora Backend Agent Guide

## Scope

These instructions apply to all backend code under `apps/backend/`.

Read the root `AGENTS.md` first. This file adds backend-specific architecture rules for the Nx monorepo.

## Architecture Reference

Use `legacy/dentiflow/backend/services/` as the reference for proven backend service architecture.

Do not copy legacy code blindly. Analyze the intent, keep the clean architecture boundaries, then adapt the implementation to Clinora's current Nx layout, package names, contracts, and service boundaries.

## Nx Layout

- Runnable backend apps live under `apps/backend/`.
- The API Gateway lives at `apps/backend/api-gateway`.
- Microservices live at `apps/backend/services/<service-name>`.
- Shared backend technical infrastructure belongs in `libs/backend/` only when reuse is real.
- API, gRPC, event, and protobuf contracts belong in `libs/contracts/`.
- Microservice-owned entities, migrations, repositories, use cases, and domain types stay inside the owning service app.

Do not create a new shared library only because two files look similar. Create shared backend libraries only for stable technical infrastructure, never for business rules or persistence entities.

## Microservice Architecture

For backend microservices, preserve the legacy DentiFlow clean architecture shape:

```txt
apps/backend/services/<service>/src/<bounded-context>/
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
```

The exact folders should follow actual need. Do not create empty folders or premature layers.

## Microservice Import Aliases

Backend microservices support service-local layer aliases inspired by the
legacy DentiFlow services:

```txt
@domain/*      -> src/<bounded-context>/domain/*
@application/* -> src/<bounded-context>/application/*
@infra/*       -> src/<bounded-context>/infrastructure/*
@common/*      -> src/common/*
```

Use these aliases for imports that cross layer or folder boundaries inside the
same microservice, for example `@domain/entities/user` or
`@application/use-cases/login-user.use-case`. Short relative imports such as
`./user.mapper` are still fine inside the same folder.

Aliases are local to each service. Do not use `@domain`, `@application`,
`@infra`, or `@common` to reach into another microservice, and do not apply the
microservice domain/application/infrastructure aliases to the API Gateway.

## Dependency Direction

Keep dependencies pointing inward:

- `domain` contains business entities, value-like domain types, enums, and repository interfaces.
- `application` contains use cases, application ports, orchestration, and application errors.
- `infrastructure` implements persistence, gRPC/NATS adapters, external clients, mappers, and technical details.
- `presentation` exposes gRPC controllers and maps transport inputs/errors to application calls.
- Nest modules wire dependencies together; they should not contain business logic.

Domain code must not import NestJS, TypeORM, gRPC contracts, DTOs, or infrastructure classes.

Application use cases may depend on domain types and application ports/repository interfaces. They should not depend directly on TypeORM repositories, gRPC clients, controllers, or generated transport clients.

Infrastructure may depend on application ports and domain types to implement adapters and repositories.

Presentation may depend on application use cases and contracts, but it must keep business decisions out of controllers.

## Microservice Data Ownership

Each microservice owns its database model.

- TypeORM entities stay under the owning service's `infrastructure/persistence/entities`.
- Migrations stay under the owning service's `infrastructure/persistence/migrations`.
- Repository implementations stay under the owning service's `infrastructure/persistence/repositories`.
- Repository interfaces stay inside the owning bounded context, usually `domain/repositories`.
- Never share TypeORM entities across services.
- Never let one service read or write another service's database.
- Cross-service behavior uses gRPC for requests or NATS for asynchronous events.

When a service needs another service, define an application port in the consuming service and implement it with an infrastructure adapter.

## Contracts

Use `libs/contracts/` for shared API, protobuf, event, and generated gRPC contract types.

- Keep contracts transport-focused.
- Do not place business use cases or database concerns in contracts.
- Update contracts first when adding or changing a cross-service operation.
- Keep service implementation and gateway client code aligned with the generated/typed contract surface.

## NestJS Module Wiring

Follow the current Clinora pattern:

- One focused module per bounded context inside each service.
- Register TypeORM entities with `TypeOrmModule.forFeature(...)` only inside the owning service module.
- Bind repository and adapter interfaces through explicit provider tokens.
- Prefer constructor injection.
- Keep provider tokens close to the owning bounded context, for example `<context>.tokens.ts`.
- Avoid global modules except for intentional technical infrastructure.

## API Gateway Architecture

The Clinora API Gateway intentionally differs from the legacy DentiFlow gateway.

Do not reshape the new gateway into the legacy `presentation/*` plus direct helper style.

Use the current Clinora gateway structure:

```txt
apps/backend/api-gateway/src/
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
      <feature>.facade.ts
      <feature>.module.ts
```

Gateway responsibilities:

- Expose external HTTP/API routes.
- Validate and transform HTTP DTOs.
- Apply authentication, authorization, tenant, and clinic scope guards.
- Call service clients through facades.
- Map gRPC/service errors to HTTP exceptions.
- Compose calls when needed for API workflow orchestration.

Gateway non-responsibilities:

- No domain entities.
- No TypeORM entities, repositories, or migrations.
- No direct database access.
- No business rules that belong to auth, clinic, patient, appointment, treatment, billing, or another bounded context.
- No generated gRPC client usage directly inside HTTP controllers.

Controllers should stay thin. Facades coordinate gateway-level concerns and call typed service client interfaces. `clients/<service>` owns the gRPC `ClientGrpc` setup and generated contract adaptation.

## Error Handling

In microservices:

- Use application/domain errors from the owning bounded context.
- Map application errors to gRPC/RPC errors at the presentation boundary.
- Keep persistence errors inside infrastructure and translate them before they leave repositories or adapters.

In the API Gateway:

- Map gRPC errors to HTTP exceptions in facades or shared gateway error mappers.
- Return service-unavailable style errors when dependent services are unavailable or time out.
- Do not leak database or infrastructure error details to HTTP consumers.

## Events And Messaging

Use NATS for asynchronous service communication and outbox-style workflows when reliability matters.

- Event producers stay in the owning service infrastructure/application boundary.
- Event consumers should translate incoming messages into application use case calls.
- Event contracts belong in `libs/contracts/`.
- Do not use NATS as a shortcut for synchronous request/response operations that already belong in gRPC.

## Testing

Match tests to the layer being changed:

- Domain entities: unit tests for behavior and invariants.
- Use cases: unit tests with mocked repository interfaces and application ports.
- Infrastructure repositories/adapters: focused integration or adapter tests where behavior is risky.
- gRPC controllers: mapping and error translation tests.
- API Gateway controllers/facades: HTTP DTO mapping, guard expectations, service-client delegation, and error mapping tests.

Use pnpm and Nx targets. Do not add npm or yarn lockfiles.

## Migration From Legacy

When migrating or adapting a legacy DentiFlow backend capability:

1. Identify the owning Clinora bounded context.
2. Study the legacy domain behavior, use cases, ports, repositories, mappers, controllers, and migrations.
3. Keep the clean dependency direction.
4. Adapt names, contracts, module wiring, and paths to Clinora's Nx monorepo.
5. Preserve per-service data ownership.
6. For API Gateway work, use Clinora's `modules` plus `clients` plus `facade` structure, not the old gateway layout.
7. Verify with focused tests for the changed service or gateway module.

## Guardrails

- Avoid `any`.
- Keep methods and classes small.
- Do not put domain logic in controllers, facades, repositories, or mappers.
- Do not create cross-service imports from another app's `src` folder.
- Do not import from `legacy/dentiflow` in production code.
- Do not create circular service dependencies.
- Keep changes incremental: one service or one gateway feature at a time.
