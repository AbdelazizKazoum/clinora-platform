import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ManageAppointmentsUseCase } from './application/use-cases/manage-appointments.use-case';
import { ManageChairsUseCase } from './application/use-cases/manage-chairs.use-case';
import { ManageQueueUseCase } from './application/use-cases/manage-queue.use-case';
import { ManageWaitingRoomUseCase } from './application/use-cases/manage-waiting-room.use-case';
import {
  APPOINTMENT_REPOSITORY,
  CHAIR_REPOSITORY,
  CLINIC_SERVICE_PORT,
  OUTBOX_REPOSITORY,
  PATIENT_SERVICE_PORT,
  QUEUE_REPOSITORY,
} from './appointment.tokens';
import { ClinicGrpcClientModule } from './infrastructure/grpc/clinic-grpc-client.module';
import { ClinicServiceGrpcAdapter } from './infrastructure/grpc/clinic-service-grpc.adapter';
import { OutboxRelayService } from './infrastructure/nats/outbox-relay.service';
import { PatientGrpcClientModule } from './infrastructure/grpc/patient-grpc-client.module';
import { PatientServiceGrpcAdapter } from './infrastructure/grpc/patient-service-grpc.adapter';
import { AppointmentTypeOrmEntity } from './infrastructure/persistence/entities/appointment.typeorm-entity';
import { ChairTypeOrmEntity } from './infrastructure/persistence/entities/chair.typeorm-entity';
import { OutboxTypeOrmEntity } from './infrastructure/persistence/entities/outbox.typeorm-entity';
import { QueueEntryTypeOrmEntity } from './infrastructure/persistence/entities/queue-entry.typeorm-entity';
import { AppointmentRepository } from './infrastructure/persistence/repositories/appointment.repository';
import { ChairRepository } from './infrastructure/persistence/repositories/chair.repository';
import { OutboxRepository } from './infrastructure/persistence/repositories/outbox.repository';
import { QueueRepository } from './infrastructure/persistence/repositories/queue.repository';
import { AppointmentGrpcController } from './presentation/grpc/appointment.grpc-controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentTypeOrmEntity,
      ChairTypeOrmEntity,
      QueueEntryTypeOrmEntity,
      OutboxTypeOrmEntity,
    ]),
    PatientGrpcClientModule,
    ClinicGrpcClientModule,
  ],
  controllers: [AppointmentGrpcController],
  providers: [
    ManageAppointmentsUseCase,
    ManageChairsUseCase,
    ManageQueueUseCase,
    ManageWaitingRoomUseCase,
    { provide: APPOINTMENT_REPOSITORY, useClass: AppointmentRepository },
    { provide: CHAIR_REPOSITORY, useClass: ChairRepository },
    { provide: QUEUE_REPOSITORY, useClass: QueueRepository },
    { provide: OUTBOX_REPOSITORY, useClass: OutboxRepository },
    { provide: PATIENT_SERVICE_PORT, useClass: PatientServiceGrpcAdapter },
    { provide: CLINIC_SERVICE_PORT, useClass: ClinicServiceGrpcAdapter },
    OutboxRelayService,
  ],
})
export class AppointmentModule {}
