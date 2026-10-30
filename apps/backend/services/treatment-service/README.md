# Treatment service

This first bounded-context slice contains Clinora-owned Treatment domain rules.
It is intentionally not deployable yet: persistence, NestJS composition, gRPC
controllers, API Gateway routes, authorization adapters, and events belong to
the next vertical slice. The public boundary for those adapters is defined in
`@clinora/contracts-treatment`.

The domain keeps clinical findings separate from treatment acts and keeps
documentation authorship separate from clinical performance. Assigned assistants
and secretariat users can document and complete their assigned visit directly,
without a doctor approval step. Unassigned users cannot change that visit. No file in this service
depends on the odontogram renderer.
