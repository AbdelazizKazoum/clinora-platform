import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import {
  AUTH_PACKAGE_NAME,
  resolveAuthProtoPath,
} from '@clinora/contracts-auth';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const httpPort = config.getOrThrow<number>('PORT');
  const grpcPort = config.getOrThrow<number>('GRPC_PORT');

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.GRPC,
      options: {
        package: AUTH_PACKAGE_NAME,
        protoPath: resolveAuthProtoPath(),
        url: `0.0.0.0:${grpcPort}`,
      },
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservices();
  await app.listen(httpPort, '0.0.0.0');

  Logger.log(
    `Auth service listening on HTTP ${httpPort} and gRPC ${grpcPort}`,
    'Bootstrap',
  );
}

bootstrap().catch((error: unknown) => {
  Logger.error('Auth service failed to start', error, 'Bootstrap');
  process.exit(1);
});
