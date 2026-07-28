import { Module } from '@nestjs/common';

import { PatientClientModule } from '../../clients/patient/patient-client.module';
import { InsuranceProviderController } from './controllers/insurance-provider.controller';
import { InsuranceTemplateController } from './controllers/insurance-template.controller';
import { PatientDocumentController } from './controllers/patient-document.controller';
import { PatientInsuranceController } from './controllers/patient-insurance.controller';
import { PatientsController } from './controllers/patients.controller';
import { PatientsFacade } from './patients.facade';

@Module({
  imports: [PatientClientModule],
  controllers: [
    PatientsController,
    InsuranceProviderController,
    InsuranceTemplateController,
    PatientInsuranceController,
    PatientDocumentController,
  ],
  providers: [PatientsFacade],
})
export class PatientsModule {}
