# Clinora Nx Monorepo Guide

This is the practical guide for changing the Clinora Nx monorepo: adding apps, creating backend microservices, adding shared libraries, and placing infrastructure files.

Use `AGENTS.md` as the architectural source of truth. Use this file as the day-to-day workflow guide.

## Main Rules

- Use `pnpm` only.
- Use Nx commands through `pnpm nx`.
- Runnable projects live in `apps/`.
- Shared libraries live in `libs/` only when reuse is real.
- Infrastructure lives in `infrastructure/`.
- Do not create future folders or libraries before code needs them.
- Do not share TypeORM entities, repositories, migrations, or databases across services.
- Services communicate only through gRPC or NATS.

## Current Shape

```txt
apps/
  backend/
    api-gateway/
    services/
      auth-service/
  frontend/
  frontend-e2e/

libs/
  backend/
  contracts/
  frontend/

infrastructure/
docs/
tools/
legacy/
```

## Common Nx Commands

```bash
pnpm nx show projects
pnpm nx show project <project>
pnpm nx serve <project>
pnpm nx build <project>
pnpm nx test <project>
pnpm nx lint <project>
pnpm nx affected -t lint test build
pnpm nx graph
pnpm nx format:write
```

## Project Tags

Every Nx project should have tags in `project.json`.

Use:

```txt
platform:backend
platform:frontend
platform:contracts
type:app
type:lib
type:e2e
scope:<domain>
```

Examples:

```json
["platform:backend", "type:app", "scope:auth"]
```

```json
["platform:contracts", "type:lib", "scope:appointments"]
```

## Add A Backend Microservice

Create a microservice only when it owns a real bounded context, its own data, and its own business rules.

Generate it under `apps/backend/services/`:

```bash
pnpm nx g @nx/nest:application apps/backend/services/patient-service \
  --name=patient-service \
  --linter=eslint \
  --unitTestRunner=jest \
  --e2eTestRunner=jest \
  --useProjectJson=true \
  --tags=platform:backend,type:app,scope:patients
```

After creating it:

- Keep domain logic inside the service.
- Keep TypeORM entities inside the service.
- Keep migrations inside the service.
- Add contracts to `libs/contracts/` only when another app or service needs them.
- Add backend technical reuse to `libs/backend/` only when reuse is real.
- Update infrastructure only when the service must run locally or deploy.

Recommended structure:

```txt
apps/backend/services/patient-service/
  src/
    app/
    patients/
      application/
      domain/
      infrastructure/
      presentation/
    main.ts
  project.json
```

Start smaller if the service is still small.

## Change The API Gateway

Use `apps/backend/api-gateway` for external API access.

The gateway may:

- Authenticate external requests.
- Validate HTTP request shape.
- Call backend services through gRPC or NATS.
- Map service responses to external responses.

The gateway must not:

- Own business rules for a bounded context.
- Own service database models.
- Query service databases directly.
- Import service internals.

## Add A Frontend Application

Create another frontend app only for a real product or deployment boundary, such as an admin portal or patient portal.

```bash
pnpm nx g @nx/next:application apps/patient-portal \
  --name=patient-portal \
  --appDir=true \
  --src=true \
  --style=scss \
  --linter=eslint \
  --unitTestRunner=jest \
  --e2eTestRunner=playwright \
  --useProjectJson=true \
  --tags=platform:frontend,type:app,scope:patient-portal
```

Frontend rules:

- Use Next.js App Router.
- Keep routes thin.
- Keep feature code in the app until real reuse appears.
- Use `libs/frontend/` only for reusable frontend technical or UI code.
- Follow [frontend.md](./frontend.md) for the main frontend structure.

## Add A Shared Library

Create a library only when more than one project needs the code.

Contracts:

```bash
pnpm nx g @nx/js:library libs/contracts/appointments \
  --name=contracts-appointments \
  --bundler=tsc \
  --linter=eslint \
  --unitTestRunner=jest \
  --useProjectJson=true \
  --tags=platform:contracts,type:lib,scope:appointments
```

Backend technical infrastructure:

```bash
pnpm nx g @nx/js:library libs/backend/nats \
  --name=backend-nats \
  --bundler=tsc \
  --linter=eslint \
  --unitTestRunner=jest \
  --useProjectJson=true \
  --tags=platform:backend,type:lib,scope:shared
```

Frontend reuse:

```bash
pnpm nx g @nx/js:library libs/frontend/ui \
  --name=frontend-ui \
  --bundler=tsc \
  --linter=eslint \
  --unitTestRunner=jest \
  --useProjectJson=true \
  --tags=platform:frontend,type:lib,scope:shared
```

## Infrastructure

Infrastructure files belong in `infrastructure/`.

Use this structure when needed:

```txt
infrastructure/
  docker/
    api-gateway/
      Dockerfile
    services/
      auth-service/
        Dockerfile
      patient-service/
        Dockerfile
    frontend/
      Dockerfile
  compose/
    docker-compose.yml
    docker-compose.local.yml
  kubernetes/
    base/
    overlays/
      local/
      staging/
      production/
  nginx/
    nginx.conf
    conf.d/
  scripts/
```

Do not create all of these folders upfront. Add each folder when there is a real file to place in it.

## Dockerfiles

Add one Dockerfile per deployable app or service.

Use:

```txt
infrastructure/docker/<app-or-service>/Dockerfile
```

Examples:

```txt
infrastructure/docker/api-gateway/Dockerfile
infrastructure/docker/services/auth-service/Dockerfile
infrastructure/docker/frontend/Dockerfile
```

Dockerfiles should:

- Build from the workspace root context.
- Use `pnpm`.
- Build the target through Nx.
- Copy only the runtime output needed by that app.
- Avoid depending on another service's source code at runtime.

## Docker Compose

Use Docker Compose for local development and integration testing.

Place files in:

```txt
infrastructure/compose/
```

Recommended files:

```txt
docker-compose.yml
docker-compose.local.yml
```

Compose may include:

- API Gateway.
- Backend services.
- Frontend.
- Postgres databases.
- NATS.
- Redis, if needed.
- Local observability tools, if needed.

Each service should use its own database or schema according to the service boundary.

## Kubernetes

Use Kubernetes files for deployment environments.

Place manifests in:

```txt
infrastructure/kubernetes/
```

Recommended structure:

```txt
kubernetes/
  base/
    api-gateway/
    services/
    frontend/
    nats/
    ingress/
  overlays/
    staging/
    production/
```

Kubernetes manifests should keep deployment concerns separate from application source code.

## Nginx

Use Nginx files only for reverse proxy, routing, TLS termination, compression, caching, or static asset serving concerns.

Place files in:

```txt
infrastructure/nginx/
```

Do not put application business routing logic in Nginx. Backend routing still belongs in the API Gateway and service contracts.

## Before Merging Changes

Run the smallest useful checks:

```bash
pnpm nx lint <project>
pnpm nx test <project>
pnpm nx build <project>
```

For broader changes:

```bash
pnpm nx affected -t lint test build
```

Check:

- Code lives in the correct app, library, or infrastructure folder.
- No service imports another service's internals.
- No unnecessary shared library was created.
- Contracts live in `libs/contracts/`.
- Docker, Compose, Kubernetes, and Nginx files live in `infrastructure/`.
- Only `pnpm-lock.yaml` exists.

