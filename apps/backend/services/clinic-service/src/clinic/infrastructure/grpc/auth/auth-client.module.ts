import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {
  AUTH_PACKAGE_NAME,
  resolveAuthProtoPath,
} from '@clinora/contracts-auth';

import {
  AUTH_GRPC_CLIENT,
  AUTH_SERVICE_PORT,
} from '../../../clinic.tokens';
import { GrpcAuthServiceAdapter } from './grpc-auth-service.adapter';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_GRPC_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: AUTH_PACKAGE_NAME,
            protoPath: resolveAuthProtoPath(),
            url: config.getOrThrow<string>('AUTH_SERVICE_GRPC_URL'),
          },
        }),
      },
    ]),
  ],
  providers: [
    GrpcAuthServiceAdapter,
    {
      provide: AUTH_SERVICE_PORT,
      useExisting: GrpcAuthServiceAdapter,
    },
  ],
  exports: [AUTH_SERVICE_PORT],
})
export class AuthClientModule {}
