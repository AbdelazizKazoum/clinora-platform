# Clinora Frontend Agent Guide

## Required Reading

Before creating, modifying, reviewing, or reorganizing frontend code, read:

- `../../docs/architecture/frontend.md`

Treat that document as the canonical source for Clinora's frontend architecture,
naming conventions, folder responsibilities, dependency rules, authentication
flow, and implementation standards.

If this file and the canonical architecture document appear to conflict, follow
the canonical architecture document and update this file as part of the same
change when appropriate.

## Scope

These instructions apply to all files under `apps/frontend`.

## Mandatory Architecture Rules

- Use the Next.js App Router.
- Keep route files, layouts, and route handlers under `src/app`.
- Keep route pages thin and focused on composition.
- Keep business-specific UI, models, hooks, schemas, stores, and API code under
  `src/features/<feature>`.
- Keep generic reusable UI under `src/components`.
- Keep shared technical infrastructure under `src/lib`.
- Move code to `libs/frontend` only after real cross-application reuse exists.
- Do not create empty folders or abstractions for anticipated future needs.
- Do not import another feature's implementation details. Use its public API,
  compose features at the route level, or extract genuinely shared code.

## Data And State

- Keep backend response DTOs at the owning feature's API boundary.
- Map response DTOs into frontend domain models when their shapes or semantics
  differ.
- Separate reads and writes with the documented lightweight query/command
  convention; do not introduce command buses or query buses without a concrete
  need.
- Keep server state in TanStack Query.
- Keep feature-specific client state inside its owning feature.
- Use root-level stores only for truly global application state.
- Keep reusable frontend business rules in pure functions and enforce all
  security-sensitive business rules again on the backend.

## Authentication And API Access

- Access backend functionality through Clinora's BFF and API Gateway
  architecture.
- Keep access and refresh tokens in server-only session data.
- Never expose tokens through the public Auth.js session, browser storage,
  React state, or browser-side Axios interceptors.
- Never treat a browser-provided clinic ID as authorization. The backend must
  validate clinic access from authenticated claims.

## Ubold

Before building or modifying a UI page or component, inspect the closest
matching implementation under:

- `../../legacy/dentiflow/frontend/ubold-full-template-source-here`

Use Ubold only as a visual, styling, and interaction reference. Adapt useful
patterns into Clinora's architecture and remove demo data, mock behavior, and
template-only options. Do not let the Ubold folder structure define Clinora's
application boundaries.

## Implementation Standards

- Use strict TypeScript and avoid `any`.
- Prefer Server Components and keep client boundaries as low as practical.
- Use kebab-case file names, PascalCase component and domain type names, and
  camelCase functions and variables.
- Use DTO suffixes only for transport contracts.
- Prefer small components and explicit code over architectural ceremony.
- Preserve the conventions of an established feature unless the task explicitly
  includes refactoring it.
- Use pnpm only and run workspace tasks through Nx where applicable.

## Workflow

For each meaningful frontend change:

1. Read the relevant sections of the canonical frontend architecture.
2. Inspect the current feature and related route structure.
3. Inspect the closest Ubold reference when a matching UI pattern likely exists.
4. Explain the intended placement and dependency impact.
5. Implement one logical step.
6. Verify the affected frontend targets.
7. Summarize the change and the next appropriate step.
