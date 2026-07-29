import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {
  CLINIC_PACKAGE_NAME,
  resolveClinicProtoPath,
} from '@clinora/contracts-clinic';

import {
  CLINIC_GRPC_CLIENT,
  CLINIC_SERVICE_CLIENT,
} from './clinic-service.client';
import { GrpcClinicServiceClient } from './grpc-clinic-service.client';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: CLINIC_GRPC_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: CLINIC_PACKAGE_NAME,
            protoPath: resolveClinicProtoPath(),
            url: config.getOrThrow<string>('CLINIC_SERVICE_GRPC_URL'),
          },
        }),
      },
    ]),
  ],
  providers: [
    GrpcClinicServiceClient,
    {
      provide: CLINIC_SERVICE_CLIENT,
      useExisting: GrpcClinicServiceClient,
    },
  ],
  exports: [CLINIC_SERVICE_CLIENT],
})
export class ClinicClientModule {}
