import type { Repository } from 'typeorm';

import { User } from '../../../domain/entities/user';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserTypeOrmEntity } from '../entities/user.typeorm-entity';
import { TypeOrmUserRepository } from './typeorm-user.repository';

function createUser(overrides: Partial<User> = {}): User {
  return Object.assign(
    new User({
      id: '00000000-0000-4000-8000-0000000000a1',
      clinicId: '00000000-0000-4000-8000-000000000001',
      email: 'admin@clinora.test',
      passwordHash: 'hashed-password',
      fullName: 'Clinic Admin',
      role: UserRole.Admin,
      isActive: true,
      createdAt: new Date('2026-07-26T00:00:00.000Z'),
    }),
    overrides,
  );
}

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

describe(TypeOrmUserRepository.name, () => {
  const ormRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  let users: TypeOrmUserRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    users = new TypeOrmUserRepository(
      ormRepository as unknown as Repository<UserTypeOrmEntity>,
    );
  });

  it('persists account availability when saving a user', async () => {
    const inactiveUser = createUser({ isActive: false });
    ormRepository.save.mockImplementation(async (entity: UserTypeOrmEntity) =>
      createEntity({ isActive: entity.isActive }),
    );

    const savedUser = await users.save(inactiveUser);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
    expect(savedUser.isActive).toBe(false);
  });

  it('updates account availability for the addressed clinic identity', async () => {
    ormRepository.findOneBy.mockResolvedValue(createEntity());
    ormRepository.save.mockImplementation(async (entity: UserTypeOrmEntity) =>
      createEntity({ isActive: entity.isActive }),
    );

    const savedUser = await users.updateAvailability({
      userId: '00000000-0000-4000-8000-0000000000a1',
      clinicId: '00000000-0000-4000-8000-000000000001',
      isActive: false,
    });

    expect(ormRepository.findOneBy).toHaveBeenCalledWith({
      id: '00000000-0000-4000-8000-0000000000a1',
      clinicId: '00000000-0000-4000-8000-000000000001',
    });
    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
    expect(savedUser?.isActive).toBe(false);
  });

  it('returns null when updating availability for a missing identity', async () => {
    ormRepository.findOneBy.mockResolvedValue(null);

    await expect(
      users.updateAvailability({
        userId: 'missing-user',
        clinicId: '00000000-0000-4000-8000-000000000001',
        isActive: false,
      }),
    ).resolves.toBeNull();
    expect(ormRepository.save).not.toHaveBeenCalled();
  });
});
