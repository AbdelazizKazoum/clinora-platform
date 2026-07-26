import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { validatePatientEnvironment } from './configuration/patient-environment';
import { HealthModule } from './health/health.module';
import { InsuranceProviderTypeOrmEntity } from './patient/infrastructure/persistence/entities/insurance-provider.typeorm-entity';
import { InsuranceTemplateTypeOrmEntity } from './patient/infrastructure/persistence/entities/insurance-template.typeorm-entity';
import { PatientDocumentTypeOrmEntity } from './patient/infrastructure/persistence/entities/patient-document.typeorm-entity';
import { PatientInsuranceTypeOrmEntity } from './patient/infrastructure/persistence/entities/patient-insurance.typeorm-entity';
import { PatientTypeOrmEntity } from './patient/infrastructure/persistence/entities/patient.typeorm-entity';
import { CreatePatientTables20260726010000 } from './patient/infrastructure/persistence/migrations/20260726010000-create-patient-tables';
import { PatientModule } from './patient/patient.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validatePatientEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        entities: [
          PatientTypeOrmEntity,
          InsuranceProviderTypeOrmEntity,
          InsuranceTemplateTypeOrmEntity,
          PatientInsuranceTypeOrmEntity,
          PatientDocumentTypeOrmEntity,
        ],
        migrations: [CreatePatientTables20260726010000],
        migrationsRun: config.getOrThrow<boolean>('DB_MIGRATIONS_RUN'),
        synchronize: false,
      }),
    }),
    PatientModule,
    HealthModule,
  ],
})
export class AppModule {}
