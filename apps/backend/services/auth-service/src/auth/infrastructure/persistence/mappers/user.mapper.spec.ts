import { User } from '../../../domain/entities/user';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserTypeOrmEntity } from '../entities/user.typeorm-entity';
import { UserMapper } from './user.mapper';

function createEntity(overrides: Partial<UserTypeOrmEntity> = {}) {
  const entity = new UserTypeOrmEntity();
  entity.id = '00000000-0000-4000-8000-0000000000a1';
  entity.clinicId = '00000000-0000-4000-8000-000000000001';
  entity.email = 'admin@clinora.test';
  entity.passwordHash = 'hashed-password';
  entity.fullName = 'Clinic Admin';
  entity.role = UserRole.Admin;
  entity.isActive = true;
  entity.createdAt = new Date('2026-07-26T00:00:00.000Z');
  entity.updatedAt = new Date('2026-07-26T00:00:00.000Z');

  return Object.assign(entity, overrides);
}

describe(UserMapper.name, () => {
  it('maps persisted account availability into the domain user', () => {
    const user = UserMapper.toDomain(createEntity({ isActive: false }));

    expect(user.isActive).toBe(false);
  });

  it('maps domain account availability into persistence', () => {
    const user = new User({
      id: '00000000-0000-4000-8000-0000000000a1',
      clinicId: '00000000-0000-4000-8000-000000000001',
      email: 'admin@clinora.test',
      passwordHash: 'hashed-password',
      fullName: 'Clinic Admin',
      role: UserRole.Admin,
      isActive: false,
      createdAt: new Date('2026-07-26T00:00:00.000Z'),
    });

    expect(UserMapper.toPersistence(user)).toMatchObject({
      id: user.id,
      clinicId: user.clinicId,
      isActive: false,
    });
  });
});
