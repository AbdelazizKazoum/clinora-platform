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
  PatientDocumentReply,
  PatientDocumentsReply,
  SuccessReply,
} from '@clinora/contracts-patient';

import {
  CreatePatientDocumentDto,
  DeleteManyPatientDocumentsDto,
  ListClinicPatientDocumentsQueryDto,
  ListPatientDocumentsQueryDto,
  UpdatePatientDocumentDto,
} from '../dto/patient-document.dto';
import { PatientsFacade } from '../patients.facade';

@Controller('clinics/:clinicId')
export class PatientDocumentController {
  constructor(private readonly patients: PatientsFacade) {}

  @Post('patients/:patientId/documents')
  createPatientDocument(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() input: CreatePatientDocumentDto,
  ): Promise<PatientDocumentReply> {
    return this.patients.createPatientDocument({
      clinicId,
      patientId,
      ...input,
    });
  }

  @Get('patients/:patientId/documents')
  listPatientDocuments(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: ListPatientDocumentsQueryDto,
  ): Promise<PatientDocumentsReply> {
    return this.patients.listPatientDocuments({
      clinicId,
      patientId,
      type: query.type,
    });
  }

  @Get('patient-documents')
  async listClinicPatientDocuments(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: ListClinicPatientDocumentsQueryDto,
  ): Promise<PatientDocumentsReply> {
    const result = await this.patients.listClinicPatientDocuments({
      clinicId,
      type: query.type,
      patientId: query.patientId,
      search: query.search,
    });

    if (query.ids) {
      const ids = new Set(query.ids);
      return {
        documents: result.documents.filter((document) => ids.has(document.id)),
      };
    }

    return result;
  }

  @Get('patient-documents/:documentId')
  getPatientDocument(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<PatientDocumentReply> {
    return this.patients.getPatientDocument({
      clinicId,
      id: documentId,
    });
  }

  @Put('patient-documents/:documentId')
  updatePatientDocument(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() input: UpdatePatientDocumentDto,
  ): Promise<PatientDocumentReply> {
    return this.patients.updatePatientDocument({
      clinicId,
      documentId,
      ...input,
    });
  }

  @Delete('patient-documents/:documentId')
  deletePatientDocument(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<SuccessReply> {
    return this.patients.deletePatientDocument({
      clinicId,
      id: documentId,
    });
  }

  @Delete('patient-documents')
  deleteManyPatientDocuments(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() input: DeleteManyPatientDocumentsDto,
  ): Promise<SuccessReply> {
    return this.patients.deleteManyPatientDocuments({
      clinicId,
      ids: input.ids,
    });
  }
}
