import { Module } from '@nestjs/common';

import { AppointmentClientModule } from '../../clients/appointment/appointment-client.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsFacade } from './appointments.facade';
import { QueueController } from './queue.controller';

@Module({
  imports: [AppointmentClientModule],
  controllers: [AppointmentsController, QueueController],
  providers: [AppointmentsFacade],
})
export class AppointmentsModule {}
