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
  constructor(identityId: string, clinicId: string, correlationId: string) {
    super(
      `Staff identity compensation failed for auth identity "${identityId}" in clinic "${clinicId}" (correlationId: ${correlationId})`,
    );
    this.name = ClinicIdentityConsistencyError.name;
  }
}
