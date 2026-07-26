import { InsuranceProvider } from '../../../domain/entities/insurance-provider';
import { InsuranceProviderTypeOrmEntity } from '../entities/insurance-provider.typeorm-entity';

export class InsuranceProviderMapper {
  static toDomain(entity: InsuranceProviderTypeOrmEntity): InsuranceProvider {
    return new InsuranceProvider({
      id: entity.id,
      clinicId: entity.clinicId,
      name: entity.name,
      code: entity.code,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
