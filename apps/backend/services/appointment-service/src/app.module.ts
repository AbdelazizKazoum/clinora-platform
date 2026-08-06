import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentModule } from './appointment/appointment.module';
import { AppointmentTypeOrmEntity } from './appointment/infrastructure/persistence/entities/appointment.typeorm-entity';
import { ChairTypeOrmEntity } from './appointment/infrastructure/persistence/entities/chair.typeorm-entity';
import { OutboxTypeOrmEntity } from './appointment/infrastructure/persistence/entities/outbox.typeorm-entity';
import { QueueEntryTypeOrmEntity } from './appointment/infrastructure/persistence/entities/queue-entry.typeorm-entity';
import { CreateAppointmentTables20260511000001 } from './appointment/infrastructure/persistence/migrations/20260511000001-CreateAppointmentTables';
import { SeedInitialAppointments20260511000002 } from './appointment/infrastructure/persistence/migrations/20260511000002-SeedInitialAppointments';
import { CreateWaitingRoomChairs20260804000001 } from './appointment/infrastructure/persistence/migrations/20260804000001-CreateWaitingRoomChairs';
import { AddWaitingRoomQueueFields20260804000002 } from './appointment/infrastructure/persistence/migrations/20260804000002-AddWaitingRoomQueueFields';
import { SeedWaitingRoomChairs20260806000003 } from './appointment/infrastructure/persistence/migrations/20260806000003-SeedWaitingRoomChairs';
import { validateAppointmentEnvironment } from './configuration/appointment-environment';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateAppointmentEnvironment,
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
          AppointmentTypeOrmEntity,
          ChairTypeOrmEntity,
          QueueEntryTypeOrmEntity,
          OutboxTypeOrmEntity,
        ],
        migrations: [
          CreateAppointmentTables20260511000001,
          SeedInitialAppointments20260511000002,
          CreateWaitingRoomChairs20260804000001,
          AddWaitingRoomQueueFields20260804000002,
          SeedWaitingRoomChairs20260806000003,
        ],
        migrationsRun: config.getOrThrow<boolean>('DB_MIGRATIONS_RUN'),
        synchronize: false,
      }),
    }),
    AppointmentModule,
    HealthModule,
  ],
})
export class AppModule {}
