import {Module} from "@nestjs/common";
import {ClientsModule, Transport} from "@nestjs/microservices";
import {ConfigService} from "@nestjs/config";
import {
  CLINIC_PACKAGE_NAME,
  resolveClinicProtoPath,
} from "@clinora/contracts-clinic";
import {CLINIC_GRPC_CLIENT} from "../../appointment.tokens";

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
            url: config.getOrThrow<string>("CLINIC_SERVICE_GRPC_URL"),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class ClinicGrpcClientModule {}
