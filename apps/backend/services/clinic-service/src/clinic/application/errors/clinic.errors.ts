export class ClinicRecordNotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} "${id}" was not found`);
    this.name = ClinicRecordNotFoundError.name;
  }
}

export class ClinicRecordConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ClinicRecordConflictError.name;
  }
}

export class ClinicValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ClinicValidationError.name;
  }
}

export class ClinicDependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ClinicDependencyError.name;
  }
}

export class ClinicIdentityConsistencyError extends ClinicDependencyError {
  constructor(
    identityId: string,
    clinicId: string,
    correlationId: string,
    operation = 'deleteProvisionedIdentity',
  ) {
    super(
      `Staff identity compensation failed during "${operation}" for auth identity "${identityId}" in clinic "${clinicId}" (correlationId: ${correlationId})`,
    );
    this.name = ClinicIdentityConsistencyError.name;
  }
}

export class ClinicSelfDeactivationError extends Error {
  constructor() {
    super('Staff members cannot deactivate their own account');
    this.name = ClinicSelfDeactivationError.name;
  }
}

export class ClinicLastEnabledAdminError extends Error {
  constructor() {
    super('A clinic must retain at least one enabled administrator');
    this.name = ClinicLastEnabledAdminError.name;
  }
}
