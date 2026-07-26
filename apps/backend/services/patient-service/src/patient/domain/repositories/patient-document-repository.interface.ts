import { PatientDocument } from '../entities/patient-document';
import { DocumentType } from '../enums/document-type.enum';

export interface CreatePatientDocument {
  clinicId: string;
  patientId: string;
  type: DocumentType;
  title?: string;
  fileUrl: string;
}

export interface UpdatePatientDocument {
  type?: DocumentType;
  title?: string | null;
  fileUrl?: string;
}

export interface PatientDocumentRepository {
  create(input: CreatePatientDocument): Promise<PatientDocument>;
  findById(clinicId: string, id: string): Promise<PatientDocument | null>;
  listByPatient(
    clinicId: string,
    patientId: string,
    type?: DocumentType,
  ): Promise<PatientDocument[]>;
  listByClinic(
    clinicId: string,
    type?: DocumentType,
    patientId?: string,
    search?: string,
  ): Promise<PatientDocument[]>;
  update(
    clinicId: string,
    id: string,
    input: UpdatePatientDocument,
  ): Promise<PatientDocument | null>;
  delete(clinicId: string, id: string): Promise<boolean>;
  deleteMany(clinicId: string, ids: string[]): Promise<void>;
}
