# Staff Removal Policy

Status: Accepted  
Last updated: 2026-07-30

## Decision

Clinora uses inactivation as the staff removal policy for normal clinic
administration.

Administrators remove a staff member's access by setting the staff status to
`inactive` through the existing staff update workflow. The staff profile remains
in the clinic service for operational history and future audit requirements.

Permanent staff deletion is disabled. The legacy/internal
`DeleteStaffMember` gRPC operation is retained only for contract compatibility
and must reject requests. It must not hard-delete the clinic staff row or delete
the auth identity.

## Why

Hard-deleting only the clinic staff profile can leave a usable auth account.
Hard-deleting both clinic and auth records would also require explicit audit
retention, session invalidation, recovery, and cross-service failure
compensation rules that do not exist yet.

The current lifecycle model already gives Clinora a safe removal action:

- `active` staff can authenticate.
- `on-leave` staff remain enabled and can authenticate.
- `inactive` staff cannot log in or refresh a session.

Using `inactive` keeps the staff profile available while disabling account
access through the synchronized auth identity update.

## Product Behavior

The UI must use deactivation language, such as `Deactivate Account`, when a
status transition will set a staff member to `inactive`.

The UI must not expose permanent deletion, remove, or trash actions for staff
members.

Deactivation must be explicitly confirmed because it changes account access.

## Backend Behavior

Supported removal operation:

```txt
PATCH /clinics/{clinicId}/staff/{staffMemberId}
{ "status": "inactive" }
```

The API Gateway derives `actorUserId` from verified token claims. The browser
must not send it.

The clinic service must:

- Synchronize `inactive` to a disabled auth identity.
- Reject self-deactivation.
- Reject deactivation or demotion of the last enabled clinic administrator.
- Roll auth changes back if clinic persistence fails after auth synchronization.

Unsupported operation:

```txt
ClinicService.DeleteStaffMember
```

This operation must reject with a failed precondition/policy error and must not
delete either the staff profile or auth identity.

## Future Permanent Deletion Requirements

Permanent deletion can be reconsidered only after a separate product and
architecture decision defines:

- Auth identity cleanup.
- Session invalidation timing.
- Audit retention and legal hold behavior.
- Recovery expectations.
- Cross-service compensation and failure observability.
- Whether deleted staff should remain visible in historical appointments,
  billing, audit logs, and clinical records.
