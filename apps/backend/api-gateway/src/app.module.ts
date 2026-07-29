import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './common/auth/strategies/jwt.strategy';
import { validateGatewayEnvironment } from './configuration/gateway-environment';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { StaffModule } from './modules/staff/staff.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateGatewayEnvironment,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    PatientsModule,
    StaffModule,
    HealthModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
