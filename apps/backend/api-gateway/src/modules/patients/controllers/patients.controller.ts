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
  PatientReply,
  PatientsListReply,
  PatientsReply,
  SuccessReply,
} from '@clinora/contracts-patient';

import {
  CreatePatientDto,
  ListPatientsQueryDto,
  SearchPatientsQueryDto,
  UpdatePatientDto,
} from '../dto/patient.dto';
import { PatientsFacade } from '../patients.facade';

@Controller('clinics/:clinicId')
export class PatientsController {
  constructor(private readonly patients: PatientsFacade) {}

  @Post('patients')
  createPatient(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: CreatePatientDto,
  ): Promise<PatientReply> {
    return this.patients.createPatient({ clinicId, ...input });
  }

  @Get('patients')
  listPatients(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: ListPatientsQueryDto,
  ): Promise<PatientsListReply> {
    return this.patients.listPatients({ clinicId, ...query });
  }

  @Get('patients/search')
  searchPatientsByName(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: SearchPatientsQueryDto,
  ): Promise<PatientsReply> {
    return this.patients.searchPatientsByName({ clinicId, ...query });
  }

  @Get('patients/by-user/:userId')
  getPatientByUserId(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<PatientReply> {
    return this.patients.getPatientByUserId({ clinicId, userId });
  }

  @Get('patients/:patientId')
  getPatient(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<PatientReply> {
    return this.patients.getPatient({ clinicId, id: patientId });
  }

  @Put('patients/:patientId')
  updatePatient(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() input: UpdatePatientDto,
  ): Promise<PatientReply> {
    return this.patients.updatePatient({
      clinicId,
      patientId,
      ...input,
    });
  }

  @Delete('patients/:patientId')
  deletePatient(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<SuccessReply> {
    return this.patients.deletePatient({ clinicId, id: patientId });
  }

  @Put('patients/:patientId/soft-delete')
  softDeletePatient(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<SuccessReply> {
    return this.patients.softDeletePatient({ clinicId, id: patientId });
  }

  @Put('patients/:patientId/restore')
  restorePatient(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<PatientReply> {
    return this.patients.restorePatient({ clinicId, id: patientId });
  }
}
