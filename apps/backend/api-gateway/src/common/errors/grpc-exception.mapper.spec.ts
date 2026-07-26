import { status } from '@grpc/grpc-js';
import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { mapGrpcException } from './grpc-exception.mapper';

describe(mapGrpcException.name, () => {
  it.each([
    [status.INVALID_ARGUMENT, BadRequestException],
    [status.ALREADY_EXISTS, ConflictException],
    [status.UNAUTHENTICATED, UnauthorizedException],
    [status.UNAVAILABLE, ServiceUnavailableException],
  ])('maps gRPC status %s to the expected HTTP error', (code, ErrorType) => {
    expect(mapGrpcException({ code, details: 'request failed' })).toBeInstanceOf(
      ErrorType,
    );
  });
});
