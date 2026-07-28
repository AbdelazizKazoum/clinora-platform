import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateGatewayEnvironment } from './configuration/gateway-environment';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateGatewayEnvironment,
    }),
    AuthModule,
    PatientsModule,
    HealthModule,
  ],
})
export class AppModule {}
