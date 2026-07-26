import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ManageClinicsUseCase } from './application/use-cases/manage-clinics.use-case';
import { ManageStaffMembersUseCase } from './application/use-cases/manage-staff-members.use-case';
import { ManageWorkingHoursUseCase } from './application/use-cases/manage-working-hours.use-case';
import {
  CLINIC_REPOSITORY,
  STAFF_MEMBER_REPOSITORY,
  WORKING_HOURS_REPOSITORY,
} from './clinic.tokens';
import { AuthClientModule } from './infrastructure/grpc/auth/auth-client.module';
import { ClinicTypeOrmEntity } from './infrastructure/persistence/entities/clinic.typeorm-entity';
import { StaffMemberTypeOrmEntity } from './infrastructure/persistence/entities/staff-member.typeorm-entity';
import { WorkingHoursTypeOrmEntity } from './infrastructure/persistence/entities/working-hours.typeorm-entity';
import { TypeOrmClinicRepository } from './infrastructure/persistence/repositories/typeorm-clinic.repository';
import { TypeOrmStaffMemberRepository } from './infrastructure/persistence/repositories/typeorm-staff-member.repository';
import { TypeOrmWorkingHoursRepository } from './infrastructure/persistence/repositories/typeorm-working-hours.repository';
import { ClinicGrpcController } from './presentation/grpc/clinic.grpc-controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicTypeOrmEntity,
      StaffMemberTypeOrmEntity,
      WorkingHoursTypeOrmEntity,
    ]),
    AuthClientModule,
  ],
  controllers: [ClinicGrpcController],
  providers: [
    ManageClinicsUseCase,
    ManageWorkingHoursUseCase,
    ManageStaffMembersUseCase,
    { provide: CLINIC_REPOSITORY, useClass: TypeOrmClinicRepository },
    {
      provide: STAFF_MEMBER_REPOSITORY,
      useClass: TypeOrmStaffMemberRepository,
    },
    {
      provide: WORKING_HOURS_REPOSITORY,
      useClass: TypeOrmWorkingHoursRepository,
    },
  ],
})
export class ClinicModule {}
