import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

import {
  PatientRecordConflictError,
  PatientRecordNotFoundError,
} from '../../application/errors/patient.errors';

export function rethrowPatientRpcError(error: unknown): never {
  if (error instanceof PatientRecordNotFoundError) {
    throw new RpcException({
      code: status.NOT_FOUND,
      message: error.message,
    });
  }
  if (error instanceof PatientRecordConflictError) {
    throw new RpcException({
      code: status.ALREADY_EXISTS,
      message: error.message,
    });
  }
  throw new RpcException({
    code: status.INTERNAL,
    message: 'Internal patient service error',
  });
}
