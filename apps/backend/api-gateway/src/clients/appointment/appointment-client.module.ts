import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {
  APPOINTMENT_PACKAGE_NAME,
  resolveAppointmentProtoPath,
} from '@clinora/contracts-appointment';

import {
  APPOINTMENT_GRPC_CLIENT,
  APPOINTMENT_SERVICE_CLIENT,
} from './appointment-service.client';
import { GrpcAppointmentServiceClient } from './grpc-appointment-service.client';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: APPOINTMENT_GRPC_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: APPOINTMENT_PACKAGE_NAME,
            protoPath: resolveAppointmentProtoPath(),
            url: config.getOrThrow<string>('APPOINTMENT_SERVICE_GRPC_URL'),
          },
        }),
      },
    ]),
  ],
  providers: [
    GrpcAppointmentServiceClient,
    {
      provide: APPOINTMENT_SERVICE_CLIENT,
      useExisting: GrpcAppointmentServiceClient,
    },
  ],
  exports: [APPOINTMENT_SERVICE_CLIENT],
})
export class AppointmentClientModule {}
