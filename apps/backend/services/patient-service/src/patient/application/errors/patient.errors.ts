export class PatientRecordNotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} "${id}" was not found`);
    this.name = PatientRecordNotFoundError.name;
  }
}

export class PatientRecordConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PatientRecordConflictError.name;
  }
}
