import { QueryFailedError } from 'typeorm';

import { PatientRecordConflictError } from '../../../application/errors/patient.errors';

interface MysqlDriverError {
  code?: string;
}

export function rethrowPersistenceError(error: unknown): never {
  if (error instanceof QueryFailedError) {
    const code = (error.driverError as MysqlDriverError).code;
    if (code === 'ER_DUP_ENTRY') {
      throw new PatientRecordConflictError(
        'A patient record with the same unique values already exists',
      );
    }
    if (
      code === 'ER_NO_REFERENCED_ROW_2' ||
      code === 'ER_ROW_IS_REFERENCED_2'
    ) {
      throw new PatientRecordConflictError(
        'The related patient record is invalid or still in use',
      );
    }
  }
  throw error;
}
