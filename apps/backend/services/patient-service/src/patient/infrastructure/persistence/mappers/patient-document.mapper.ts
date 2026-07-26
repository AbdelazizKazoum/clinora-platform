import { PatientDocument } from '../../../domain/entities/patient-document';
import { PatientDocumentTypeOrmEntity } from '../entities/patient-document.typeorm-entity';

export class PatientDocumentMapper {
  static toDomain(entity: PatientDocumentTypeOrmEntity): PatientDocument {
    return new PatientDocument({
      id: entity.id,
      clinicId: entity.clinicId,
      patientId: entity.patientId,
      type: entity.type,
      title: entity.title,
      fileUrl: entity.fileUrl,
      createdAt: entity.createdAt,
    });
  }
}
