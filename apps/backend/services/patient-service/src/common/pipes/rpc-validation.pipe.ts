import { ValidationPipe } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import type { ValidationError } from 'class-validator';

export class RpcValidationPipe extends ValidationPipe {
  constructor() {
    super({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new RpcException({
          code: status.INVALID_ARGUMENT,
          message: errors
            .flatMap((error) => Object.values(error.constraints ?? {}))
            .join(', '),
        }),
    });
  }
}
