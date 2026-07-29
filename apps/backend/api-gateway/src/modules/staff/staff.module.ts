import { Module } from '@nestjs/common';

import { ClinicClientModule } from '../../clients/clinic/clinic-client.module';
import { StaffController } from './staff.controller';
import { StaffFacade } from './staff.facade';

@Module({
  imports: [ClinicClientModule],
  controllers: [StaffController],
  providers: [StaffFacade],
})
export class StaffModule {}
