import { Inject, Injectable } from '@nestjs/common';

import { PatientDocument } from '../../domain/entities/patient-document';
import { DocumentType } from '../../domain/enums/document-type.enum';
import type {
  CreatePatientDocument,
  PatientDocumentRepository,
  UpdatePatientDocument,
} from '../../domain/repositories/patient-document-repository.interface';
import { PATIENT_DOCUMENT_REPOSITORY } from '../../patient.tokens';
import { PatientRecordNotFoundError } from '../errors/patient.errors';

@Injectable()
export class ManagePatientDocumentsUseCase {
  constructor(
    @Inject(PATIENT_DOCUMENT_REPOSITORY)
    private readonly documents: PatientDocumentRepository,
  ) {}

  create(input: CreatePatientDocument): Promise<PatientDocument> {
    return this.documents.create(input);
  }

  async get(clinicId: string, id: string): Promise<PatientDocument> {
    const document = await this.documents.findById(clinicId, id);
    if (!document) {
      throw new PatientRecordNotFoundError('Patient document', id);
    }
    return document;
  }

  listByPatient(
    clinicId: string,
    patientId: string,
    type?: DocumentType,
  ): Promise<PatientDocument[]> {
    return this.documents.listByPatient(clinicId, patientId, type);
  }

  listByClinic(
    clinicId: string,
    type?: DocumentType,
    patientId?: string,
    search?: string,
  ): Promise<PatientDocument[]> {
    return this.documents.listByClinic(
      clinicId,
      type,
      patientId,
      search,
    );
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdatePatientDocument,
  ): Promise<PatientDocument> {
    const document = await this.documents.update(clinicId, id, input);
    if (!document) {
      throw new PatientRecordNotFoundError('Patient document', id);
    }
    return document;
  }

  async delete(clinicId: string, id: string): Promise<void> {
    if (!(await this.documents.delete(clinicId, id))) {
      throw new PatientRecordNotFoundError('Patient document', id);
    }
  }

  deleteMany(clinicId: string, ids: string[]): Promise<void> {
    return this.documents.deleteMany(clinicId, ids);
  }
}
