import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('PORT');
  const frontendOrigins = config.getOrThrow<string[]>('FRONTEND_ORIGINS');

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    credentials: true,
    origin: frontendOrigins,
  });
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  Logger.log(`API gateway listening on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error('API gateway failed to start', error, 'Bootstrap');
  process.exit(1);
});
