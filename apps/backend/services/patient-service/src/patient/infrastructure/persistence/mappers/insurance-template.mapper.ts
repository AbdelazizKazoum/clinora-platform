import { InsuranceTemplate } from '../../../domain/entities/insurance-template';
import { InsuranceTemplateTypeOrmEntity } from '../entities/insurance-template.typeorm-entity';

export class InsuranceTemplateMapper {
  static toDomain(entity: InsuranceTemplateTypeOrmEntity): InsuranceTemplate {
    return new InsuranceTemplate({
      id: entity.id,
      clinicId: entity.clinicId,
      insuranceProviderId: entity.insuranceProviderId,
      name: entity.name,
      fileUrl: entity.fileUrl,
      createdAt: entity.createdAt,
    });
  }
}
