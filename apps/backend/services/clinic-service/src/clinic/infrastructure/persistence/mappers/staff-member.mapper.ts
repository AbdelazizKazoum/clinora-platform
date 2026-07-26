import { StaffMember } from '../../../domain/entities/staff-member';
import { StaffMemberTypeOrmEntity } from '../entities/staff-member.typeorm-entity';

export class StaffMemberMapper {
  static toDomain(entity: StaffMemberTypeOrmEntity): StaffMember {
    return new StaffMember({
      id: entity.id,
      clinicId: entity.clinicId,
      userId: entity.userId,
      role: entity.role,
      status: entity.status,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      email: entity.email,
      specialization: entity.specialization,
      avatar: entity.avatar,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
