import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

import {
  ClinicDependencyError,
  ClinicRecordConflictError,
  ClinicRecordNotFoundError,
  ClinicValidationError,
} from '../../application/errors/clinic.errors';

export function rethrowClinicRpcError(error: unknown): never {
  if (error instanceof ClinicRecordNotFoundError) {
    throw new RpcException({ code: status.NOT_FOUND, message: error.message });
  }
  if (error instanceof ClinicRecordConflictError) {
    throw new RpcException({
      code: status.ALREADY_EXISTS,
      message: error.message,
    });
  }
  if (error instanceof ClinicValidationError) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: error.message,
    });
  }
  if (error instanceof ClinicDependencyError) {
    throw new RpcException({
      code: status.UNAVAILABLE,
      message: error.message,
    });
  }
  throw new RpcException({
    code: status.INTERNAL,
    message: 'Internal clinic service error',
  });
}
