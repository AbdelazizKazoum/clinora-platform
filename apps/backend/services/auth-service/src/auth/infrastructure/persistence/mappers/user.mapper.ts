import { User } from '../../../domain/entities/user';
import { UserTypeOrmEntity } from '../entities/user.typeorm-entity';

export class UserMapper {
  static toDomain(entity: UserTypeOrmEntity): User {
    return new User({
      id: entity.id,
      clinicId: entity.clinicId,
      email: entity.email,
      passwordHash: entity.passwordHash,
      fullName: entity.fullName,
      role: entity.role,
      createdAt: entity.createdAt,
    });
  }

  static toPersistence(user: User): UserTypeOrmEntity {
    const entity = new UserTypeOrmEntity();
    entity.id = user.id;
    entity.clinicId = user.clinicId;
    entity.email = user.email;
    entity.passwordHash = user.passwordHash;
    entity.fullName = user.fullName;
    entity.role = user.role;
    entity.createdAt = user.createdAt;
    return entity;
  }
}
