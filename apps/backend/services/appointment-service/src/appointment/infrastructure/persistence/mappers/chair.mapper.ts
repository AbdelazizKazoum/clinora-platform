import { Chair } from '../../../domain/entities/chair';
import { ChairTypeOrmEntity } from '../entities/chair.typeorm-entity';

export class ChairMapper {
  static toDomain(entity: ChairTypeOrmEntity): Chair {
    return new Chair({
      id: entity.id,
      clinicId: entity.clinic_id,
      name: entity.name,
      code: entity.code,
      isActive: entity.is_active,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }
}
