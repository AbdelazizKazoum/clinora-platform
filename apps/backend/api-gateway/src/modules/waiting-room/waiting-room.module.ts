import { Module } from '@nestjs/common';

import { AppointmentClientModule } from '../../clients/appointment/appointment-client.module';
import { WaitingRoomController } from './waiting-room.controller';
import { WaitingRoomFacade } from './waiting-room.facade';

@Module({
  imports: [AppointmentClientModule],
  controllers: [WaitingRoomController],
  providers: [WaitingRoomFacade],
})
export class WaitingRoomModule {}
