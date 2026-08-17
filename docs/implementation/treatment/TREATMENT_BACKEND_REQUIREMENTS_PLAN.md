# Treatment Backend Requirements Handoff

Status: frontend requirements draft, not backend implementation
Date: 2026-08-16

This document freezes the clinical meaning discovered during the in-memory
Treatment and odontogram parity work. It does not create a backend service,
database entity, migration, API mutation, or SVG dependency.

## Aggregate Boundaries

- `TreatmentVisit`: patient/clinic context, responsible dentist, lifecycle,
  findings, acts, periodontal examination reference, documentation handoff, and
  audit history.
- `ClinicalFinding`: confirmed or draft clinical observation, typed target,
  typed details, author, verifier, timestamps, and entered-in-error history.
- `TreatmentAct`: planned/in-progress/completed/cancelled/entered-in-error
  treatment command record, typed target/details, approver, performer, and
  timestamps.
- `PeriodontalExamination`: six-site probing, derived CAL inputs, indices,
  furcation, mucogingival data, risk context, confirmation status, and author
  attribution.
- `DocumentationHandoff`: assistant assignment, submission, dentist review,
  return reason, revision number, and timestamps.
- `TreatmentAuditHistory`: append-only attribution for clinical entry,
  approval, lifecycle transition, periodontal confirmation, and handoff review.

## Commands

- Start, update, submit, return, accept, complete, or cancel a Treatment visit.
- Record, confirm, correct, or enter a clinical finding in error.
- Record, approve, start, complete, cancel, or enter a Treatment act in error.
- Update and confirm a periodontal examination.
- Assign documentation to an assistant and submit it for dentist review.
- Resolve active-plan conflicts with an explicit dentist decision.

## Queries

- Get a visit with confirmed status, active plan, draft state, and audit history.
- Get structured per-tooth summaries grouped by findings, planned acts,
  completed acts, and record-only details.
- Get periodontal examination data and derived summaries.
- Get documentation-handoff state and revision history.
- Get capability/vocabulary version metadata.

## Invariants

- Draft assistant data never becomes confirmed chart status without dentist
  verification.
- Cancelled and entered-in-error records remain auditable but do not project.
- Completed acts may contribute existing status only when their clinical meaning
  permits it.
- Active plans are independent from confirmed status and conflicts are
  deterministic.
- CAL and other derived periodontal values are calculated, never persisted as
  source values.
- mPI and mBI require an implant tooth; furcation entrances are position-gated.
- Fixed, removable, and implant prosthesis ownership must not be silently
  overwritten.

## Transport Requirements

- DTOs must carry clinical concepts, typed targets, lifecycle, attribution,
  vocabulary version, and optimistic-concurrency version.
- DTOs must not expose SVG layer IDs, SVG template IDs, normalized DOM IDs, or
  renderer implementation details.
- Commands require authenticated user, clinic tenancy, visit version, and an
  idempotency key where retry duplication is possible.
- Authorization must be enforced from authenticated claims: responsible dentist
  approval, assistant assignment, clinic access, and entered-in-error policy.

## Follow-Up Decisions

- Approve the 2017 periodontal classification formulas, terminology, and
  clinician-override policy before exposing release-ready classification.
- Select vocabulary/version migration policy for clinical finding and act codes.
- Define optimistic concurrency conflict response and audit retention policy.
- Define tenancy and authorization matrix with the Treatment bounded context.
