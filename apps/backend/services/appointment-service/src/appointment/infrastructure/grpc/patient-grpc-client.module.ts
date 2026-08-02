import {Module} from "@nestjs/common";
import {ClientsModule, Transport} from "@nestjs/microservices";
import {ConfigService} from "@nestjs/config";
import {
  PATIENT_PACKAGE_NAME,
  resolvePatientProtoPath,
} from "@clinora/contracts-patient";
import {PATIENT_GRPC_CLIENT} from "../../appointment.tokens";

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
            url: config.getOrThrow<string>("PATIENT_SERVICE_GRPC_URL"),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class PatientGrpcClientModule {}
