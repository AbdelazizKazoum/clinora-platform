# Clinora

Clinora is a modern multi-tenant dental clinic management SaaS.

This repository is an Nx monorepo using pnpm. It is being built incrementally with a clean architecture mindset: runnable applications live in `apps/`, reusable technical libraries live in `libs/`, and legacy DentiFlow code is kept separate for analysis only.

## Current Applications

```txt
apps/
  frontend/
  backend/
    api-gateway/
    services/
      auth-service/
```

## Repository Structure

```txt
apps/              Runnable applications and backend services
libs/              Shared workspace libraries
  frontend/        Frontend technical libraries
  backend/         Backend technical infrastructure libraries
  contracts/       API, event, and protobuf contracts
infrastructure/    Docker, deployment, and operations assets
docs/              Architecture, ADRs, API notes, and migration notes
tools/             Workspace tooling and scripts
legacy/dentiflow/  Legacy DentiFlow reference code
```

## Architecture Rules

- Business logic belongs inside its owning bounded context.
- Shared backend libraries must contain technical infrastructure only.
- Repository interfaces belong inside each service or bounded context.
- TypeORM entities and migrations belong inside the owning service.
- Services must not access another service's database.
- Service-to-service communication must go through gRPC or NATS.
- Legacy DentiFlow code must be analyzed and refactored before being moved into Clinora.

## Development

Install dependencies:

```sh
pnpm install
```

Run an Nx target:

```sh
pnpm nx <target> <project-name>
```

Examples:

```sh
pnpm nx serve frontend
pnpm nx serve api-gateway
pnpm nx serve auth-service
```

## Package Manager

This repository uses pnpm. The single lockfile is:

```txt
pnpm-lock.yaml
```
