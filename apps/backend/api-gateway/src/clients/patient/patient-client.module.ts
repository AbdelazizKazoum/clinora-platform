import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {
  PATIENT_PACKAGE_NAME,
  resolvePatientProtoPath,
} from '@clinora/contracts-patient';

import { GrpcPatientServiceClient } from './grpc-patient-service.client';
import {
  PATIENT_GRPC_CLIENT,
  PATIENT_SERVICE_CLIENT,
} from './patient-service.client';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PATIENT_GRPC_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: PATIENT_PACKAGE_NAME,
            protoPath: resolvePatientProtoPath(),
            url: config.getOrThrow<string>('PATIENT_SERVICE_GRPC_URL'),
          },
        }),
      },
    ]),
  ],
  providers: [
    GrpcPatientServiceClient,
    {
      provide: PATIENT_SERVICE_CLIENT,
      useExisting: GrpcPatientServiceClient,
    },
  ],
  exports: [PATIENT_SERVICE_CLIENT],
})
export class PatientClientModule {}
