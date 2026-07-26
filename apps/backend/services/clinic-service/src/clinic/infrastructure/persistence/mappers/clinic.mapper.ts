import { Clinic } from '../../../domain/entities/clinic';
import { ClinicTypeOrmEntity } from '../entities/clinic.typeorm-entity';

export class ClinicMapper {
  static toDomain(entity: ClinicTypeOrmEntity): Clinic {
    return new Clinic({
      id: entity.id,
      slug: entity.slug,
      name: entity.name,
      phone: entity.phone,
      email: entity.email,
      address: entity.address,
      timezone: entity.timezone,
      locale: entity.locale,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
