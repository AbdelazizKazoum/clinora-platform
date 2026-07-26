import { DocumentType } from '../enums/document-type.enum';

export interface PatientDocumentProperties {
  id: string;
  clinicId: string;
  patientId: string;
  type: DocumentType;
  title: string | null;
  fileUrl: string;
  createdAt: Date;
}

export class PatientDocument {
  constructor(readonly properties: PatientDocumentProperties) {}

  get id(): string {
    return this.properties.id;
  }
}
