import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import type {
  PatientInsuranceReply,
  PatientInsurancesReply,
  SuccessReply,
} from '@clinora/contracts-patient';

import {
  CreatePatientInsuranceDto,
  ListClinicPatientInsurancesQueryDto,
  ListPatientInsurancesQueryDto,
  UpdatePatientInsuranceDto,
} from '../dto/patient-insurance.dto';
import { PatientsFacade } from '../patients.facade';

@Controller('clinics/:clinicId')
export class PatientInsuranceController {
  constructor(private readonly patients: PatientsFacade) {}

  @Post('patients/:patientId/insurance')
  createPatientInsurance(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() input: CreatePatientInsuranceDto,
  ): Promise<PatientInsuranceReply> {
    return this.patients.createPatientInsurance({
      clinicId,
      patientId,
      ...input,
    });
  }

  @Get('patients/:patientId/insurance')
  listPatientInsurances(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: ListPatientInsurancesQueryDto,
  ): Promise<PatientInsurancesReply> {
    return this.patients.listPatientInsurances({
      clinicId,
      patientId,
      isActive: query.isActive,
    });
  }

  @Put('patients/:patientId/insurance/activate-all')
  activateAllPatientInsurances(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<SuccessReply> {
    return this.patients.setAllPatientInsurancesActive({
      clinicId,
      patientId,
      isActive: true,
    });
  }

  @Put('patients/:patientId/insurance/deactivate-all')
  deactivateAllPatientInsurances(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<SuccessReply> {
    return this.patients.setAllPatientInsurancesActive({
      clinicId,
      patientId,
      isActive: false,
    });
  }

  @Get('patient-insurance')
  async listClinicPatientInsurances(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: ListClinicPatientInsurancesQueryDto,
  ): Promise<PatientInsurancesReply> {
    const result = await this.patients.listClinicPatientInsurances({
      clinicId,
      insuranceProviderId: query.insuranceProviderId,
      isActive: query.isActive,
    });

    if (query.policyNumber) {
      return {
        insurances: result.insurances.filter(
          (insurance) => insurance.policyNumber === query.policyNumber,
        ),
      };
    }

    if (query.memberId) {
      return {
        insurances: result.insurances.filter(
          (insurance) => insurance.memberId === query.memberId,
        ),
      };
    }

    return result;
  }

  @Get('patient-insurance/:insuranceId')
  getPatientInsurance(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('insuranceId', ParseUUIDPipe) insuranceId: string,
  ): Promise<PatientInsuranceReply> {
    return this.patients.getPatientInsurance({
      clinicId,
      id: insuranceId,
    });
  }

  @Put('patient-insurance/:insuranceId')
  updatePatientInsurance(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('insuranceId', ParseUUIDPipe) insuranceId: string,
    @Body() input: UpdatePatientInsuranceDto,
  ): Promise<PatientInsuranceReply> {
    return this.patients.updatePatientInsurance({
      clinicId,
      insuranceId,
      ...input,
    });
  }

  @Delete('patient-insurance/:insuranceId')
  deletePatientInsurance(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('insuranceId', ParseUUIDPipe) insuranceId: string,
  ): Promise<SuccessReply> {
    return this.patients.deletePatientInsurance({
      clinicId,
      id: insuranceId,
    });
  }

  @Put('patient-insurance/:insuranceId/activate')
  activatePatientInsurance(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('insuranceId', ParseUUIDPipe) insuranceId: string,
  ): Promise<PatientInsuranceReply> {
    return this.patients.activatePatientInsurance({
      clinicId,
      id: insuranceId,
    });
  }

  @Put('patient-insurance/:insuranceId/deactivate')
  deactivatePatientInsurance(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('insuranceId', ParseUUIDPipe) insuranceId: string,
  ): Promise<PatientInsuranceReply> {
    return this.patients.deactivatePatientInsurance({
      clinicId,
      id: insuranceId,
    });
  }
}
