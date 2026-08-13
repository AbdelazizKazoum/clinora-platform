# Frontend low-memory development

Use the low-memory frontend command when the default Next.js/Turbopack process
exhausts local RAM:

```bash
pnpm dev:frontend:low-memory
```

This command runs the frontend directly with Next.js, uses webpack, disables
development source maps, and limits the Node.js old-generation heap to 2 GiB.
It intentionally bypasses the Nx daemon and project-graph startup for this one
development process. Nx remains the normal runner for lint, test, and build.

Stop the server with `Ctrl+C` before starting another frontend development
server. Running the default and low-memory servers together defeats the memory
savings.

On a constrained workstation, also stop Docker Desktop when backend containers
are not needed. Docker is not required for the current mock Treatment frontend.
