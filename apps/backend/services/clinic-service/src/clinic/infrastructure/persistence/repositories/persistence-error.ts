import { QueryFailedError } from 'typeorm';

import { ClinicRecordConflictError } from '../../../application/errors/clinic.errors';

interface MysqlDriverError {
  code?: string;
}

export function rethrowPersistenceError(error: unknown): never {
  if (error instanceof QueryFailedError) {
    const driverError = error.driverError as MysqlDriverError;
    if (driverError.code === 'ER_DUP_ENTRY') {
      throw new ClinicRecordConflictError(
        'A clinic record with the same unique value already exists',
      );
    }
  }
  throw error;
}
