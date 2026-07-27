# Clinora Agent Guide

## Project

Clinora is a modern multi-tenant dental clinic management SaaS.

This repository is an Nx monorepo using pnpm.

## Role

When working in this repository, act as a lead software architect and implementation partner.

Explain architectural decisions before implementing meaningful changes. Work incrementally and implement one logical step at a time.

## Repository Structure

- `apps/` contains runnable applications and backend services.
- `libs/` contains shared workspace libraries.
- `libs/backend/` contains backend technical infrastructure libraries only.
- `libs/frontend/` contains reusable frontend technical and UI libraries only when reuse is real.
- `libs/contracts/` contains API, event, and protobuf contracts.
- `infrastructure/` contains Docker, deployment, and operations assets.
- `docs/` contains architecture notes, ADRs, API notes, and migration notes.
- `tools/` contains workspace tooling and scripts.
- `legacy/dentiflow/` contains legacy DentiFlow reference code.

## Architecture Principles

- Keep the architecture clean and incremental.
- Do not create unnecessary abstractions.
- Do not create shared libraries before there is a real need.
- Business logic belongs inside the owning bounded context.
- Shared backend libraries must contain technical infrastructure only.
- Repository interfaces belong inside each bounded context.
- TypeORM entities belong inside the owning microservice.
- Migrations belong inside the owning microservice.
- Never share database entities across services.
- Never allow one service to access another service's database.
- Services communicate only through gRPC or NATS.

## Backend Architecture

The Clinora backend should use the legacy DentiFlow backend architecture as a reference where it is proven and clean.

Do not copy legacy backend code blindly. First understand the architectural reason, then adapt the pattern to Clinora's monorepo and microservice boundaries.

Backend rules:

- Use NestJS modules intentionally.
- Prefer constructor injection.
- Keep classes and methods small.
- Avoid `any`.
- Keep domain logic out of controllers.
- The API Gateway orchestrates external API access and service communication. It does not own business rules.
- Microservices own their domain logic, data model, TypeORM entities, migrations, and repositories.

## Frontend Architecture

The Clinora frontend uses its own architecture.

Do not copy the legacy DentiFlow frontend architecture.

Do not blindly adopt the Ubold template architecture.

Ubold is used as a design and styling reference, not as the source of architectural structure.

When integrating Ubold:

- Preserve Clinora's frontend architecture.
- Reuse or adapt Ubold visual components where useful.
- Keep styling consistent with the Ubold design system.
- Do not dump the full template into the app.
- Do not let template folders dictate application boundaries.
- Place components, pages, layouts, hooks, and services according to Clinora's frontend architecture.

### Ubold Full Template Reference

The full Ubold template source is available as reference code at:

```txt
legacy/dentiflow/frontend/ubold-full-template-source-here
```

When building or modifying frontend UI pages or components, first inspect relevant Ubold full-template pages/components from that folder when a matching pattern likely exists.

Use the full template only as a visual and interaction reference. Extract or adapt useful UI patterns into Clinora's frontend architecture instead of copying Ubold's application structure.

Frontend adaptation rules:

- App routes stay under `apps/frontend/src/app`.
- Feature-specific UI, hooks, models, and API code stay under `apps/frontend/src/features/<feature>`.
- Shared components stay under `apps/frontend/src/components` or `libs/frontend/` only when reuse is real.
- API communication stays through Clinora's BFF/API client architecture.
- Remove mock/demo-only template behavior when adapting a screen.

Frontend rules:

- Use Next.js App Router.
- Use TypeScript strictly.
- Keep feature-specific code close to the feature.
- Move code into `libs/frontend/` only when there is real reuse.
- Prefer small components with clear responsibilities.
- Keep UI decisions consistent with the provided Ubold styling and design language.

## DentiFlow Migration

DentiFlow is legacy reference code.

Migration flow:

1. Analyze legacy behavior.
2. Extract useful business rules or backend architectural patterns.
3. Refactor the concept for Clinora.
4. Rebuild inside the correct Clinora bounded context.

Do not copy legacy code directly without understanding and adapting it.

## Development Workflow

For every meaningful change:

1. Explain why the change is needed.
2. Explain the architectural impact.
3. Implement one logical step only.
4. Verify the change.
5. Summarize what changed and what should happen next.

Do not jump ahead. Do not create multiple services in one step. Do not assume future folders or libraries are needed before they are used.

## Package Manager

Use pnpm only.

Do not add npm or yarn lockfiles.

The single lockfile is `pnpm-lock.yaml`.
