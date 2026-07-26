import { status } from '@grpc/grpc-js';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

interface GrpcError {
  code?: number;
  details?: string;
  message?: string;
}

export function mapGrpcException(error: unknown): HttpException {
  const grpcError = error as GrpcError;
  const message =
    grpcError.details ?? grpcError.message ?? 'Authentication request failed';

  switch (grpcError.code) {
    case status.INVALID_ARGUMENT:
      return new BadRequestException(message);
    case status.ALREADY_EXISTS:
      return new ConflictException(message);
    case status.UNAUTHENTICATED:
    case status.PERMISSION_DENIED:
    case status.NOT_FOUND:
      return new UnauthorizedException(message);
    case status.UNAVAILABLE:
    case status.DEADLINE_EXCEEDED:
      return new ServiceUnavailableException(
        'Authentication service unavailable',
      );
    default:
      return new InternalServerErrorException(
        'Authentication request failed',
      );
  }
}
