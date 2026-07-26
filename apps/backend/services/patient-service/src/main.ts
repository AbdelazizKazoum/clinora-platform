import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import {
  PATIENT_PACKAGE_NAME,
  resolvePatientProtoPath,
} from '@clinora/contracts-patient';

import { AppModule } from './app.module';
import { RpcValidationPipe } from './common/pipes/rpc-validation.pipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const httpPort = config.getOrThrow<number>('PORT');
  const grpcPort = config.getOrThrow<number>('GRPC_PORT');

  app.useGlobalPipes(new RpcValidationPipe());
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.GRPC,
      options: {
        package: PATIENT_PACKAGE_NAME,
        protoPath: resolvePatientProtoPath(),
        url: `0.0.0.0:${grpcPort}`,
      },
    },
    { inheritAppConfig: true },
  );
  app.enableShutdownHooks();

  await app.startAllMicroservices();
  await app.listen(httpPort, '0.0.0.0');
  Logger.log(
    `Patient service listening on HTTP ${httpPort} and gRPC ${grpcPort}`,
    'Bootstrap',
  );
}

bootstrap().catch((error: unknown) => {
  Logger.error('Patient service failed to start', error, 'Bootstrap');
  process.exit(1);
});
