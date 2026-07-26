import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ManageInsuranceProvidersUseCase } from './application/use-cases/manage-insurance-providers.use-case';
import { ManageInsuranceTemplatesUseCase } from './application/use-cases/manage-insurance-templates.use-case';
import { ManagePatientDocumentsUseCase } from './application/use-cases/manage-patient-documents.use-case';
import { ManagePatientInsurancesUseCase } from './application/use-cases/manage-patient-insurances.use-case';
import { ManagePatientsUseCase } from './application/use-cases/manage-patients.use-case';
import { InsuranceProviderTypeOrmEntity } from './infrastructure/persistence/entities/insurance-provider.typeorm-entity';
import { InsuranceTemplateTypeOrmEntity } from './infrastructure/persistence/entities/insurance-template.typeorm-entity';
import { PatientDocumentTypeOrmEntity } from './infrastructure/persistence/entities/patient-document.typeorm-entity';
import { PatientInsuranceTypeOrmEntity } from './infrastructure/persistence/entities/patient-insurance.typeorm-entity';
import { PatientTypeOrmEntity } from './infrastructure/persistence/entities/patient.typeorm-entity';
import { TypeOrmInsuranceProviderRepository } from './infrastructure/persistence/repositories/typeorm-insurance-provider.repository';
import { TypeOrmInsuranceTemplateRepository } from './infrastructure/persistence/repositories/typeorm-insurance-template.repository';
import { TypeOrmPatientDocumentRepository } from './infrastructure/persistence/repositories/typeorm-patient-document.repository';
import { TypeOrmPatientInsuranceRepository } from './infrastructure/persistence/repositories/typeorm-patient-insurance.repository';
import { TypeOrmPatientRepository } from './infrastructure/persistence/repositories/typeorm-patient.repository';
import {
  INSURANCE_PROVIDER_REPOSITORY,
  INSURANCE_TEMPLATE_REPOSITORY,
  PATIENT_DOCUMENT_REPOSITORY,
  PATIENT_INSURANCE_REPOSITORY,
  PATIENT_REPOSITORY,
} from './patient.tokens';
import { InsuranceProviderGrpcController } from './presentation/grpc/controllers/insurance-provider.grpc-controller';
import { InsuranceTemplateGrpcController } from './presentation/grpc/controllers/insurance-template.grpc-controller';
import { PatientDocumentGrpcController } from './presentation/grpc/controllers/patient-document.grpc-controller';
import { PatientInsuranceGrpcController } from './presentation/grpc/controllers/patient-insurance.grpc-controller';
import { PatientGrpcController } from './presentation/grpc/controllers/patient.grpc-controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientTypeOrmEntity,
      InsuranceProviderTypeOrmEntity,
      InsuranceTemplateTypeOrmEntity,
      PatientInsuranceTypeOrmEntity,
      PatientDocumentTypeOrmEntity,
    ]),
  ],
  controllers: [
    PatientGrpcController,
    InsuranceProviderGrpcController,
    InsuranceTemplateGrpcController,
    PatientInsuranceGrpcController,
    PatientDocumentGrpcController,
  ],
  providers: [
    ManagePatientsUseCase,
    ManageInsuranceProvidersUseCase,
    ManageInsuranceTemplatesUseCase,
    ManagePatientInsurancesUseCase,
    ManagePatientDocumentsUseCase,
    { provide: PATIENT_REPOSITORY, useClass: TypeOrmPatientRepository },
    {
      provide: INSURANCE_PROVIDER_REPOSITORY,
      useClass: TypeOrmInsuranceProviderRepository,
    },
    {
      provide: INSURANCE_TEMPLATE_REPOSITORY,
      useClass: TypeOrmInsuranceTemplateRepository,
    },
    {
      provide: PATIENT_INSURANCE_REPOSITORY,
      useClass: TypeOrmPatientInsuranceRepository,
    },
    {
      provide: PATIENT_DOCUMENT_REPOSITORY,
      useClass: TypeOrmPatientDocumentRepository,
    },
  ],
})
export class PatientModule {}
