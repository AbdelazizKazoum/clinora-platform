import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClinicModule } from './clinic/clinic.module';
import { ClinicTypeOrmEntity } from './clinic/infrastructure/persistence/entities/clinic.typeorm-entity';
import { StaffMemberTypeOrmEntity } from './clinic/infrastructure/persistence/entities/staff-member.typeorm-entity';
import { WorkingHoursTypeOrmEntity } from './clinic/infrastructure/persistence/entities/working-hours.typeorm-entity';
import { CreateClinicTables20260726020000 } from './clinic/infrastructure/persistence/migrations/20260726020000-create-clinic-tables';
import { SeedDefaultClinic20260726021000 } from './clinic/infrastructure/persistence/migrations/20260726021000-seed-default-clinic';
import { validateClinicEnvironment } from './configuration/clinic-environment';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateClinicEnvironment,
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
          ClinicTypeOrmEntity,
          StaffMemberTypeOrmEntity,
          WorkingHoursTypeOrmEntity,
        ],
        migrations: [
          CreateClinicTables20260726020000,
          SeedDefaultClinic20260726021000,
        ],
        migrationsRun: config.getOrThrow<boolean>('DB_MIGRATIONS_RUN'),
        synchronize: false,
      }),
    }),
    ClinicModule,
    HealthModule,
  ],
})
export class AppModule {}
