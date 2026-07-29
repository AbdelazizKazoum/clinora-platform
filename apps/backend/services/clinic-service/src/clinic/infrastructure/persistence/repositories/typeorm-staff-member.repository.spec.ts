import type { Repository } from 'typeorm';

import { StaffRole } from '../../../domain/enums/staff-role.enum';
import { StaffStatus } from '../../../domain/enums/staff-status.enum';
import { StaffMemberTypeOrmEntity } from '../entities/staff-member.typeorm-entity';
import { TypeOrmStaffMemberRepository } from './typeorm-staff-member.repository';

const clinicId = '00000000-0000-4000-8000-000000000001';
const staffMemberId = '00000000-0000-4000-8000-0000000000a1';

function createEntity(
  overrides: Partial<StaffMemberTypeOrmEntity> = {},
): StaffMemberTypeOrmEntity {
  const entity = new StaffMemberTypeOrmEntity();
  entity.id = staffMemberId;
  entity.clinicId = clinicId;
  entity.userId = '00000000-0000-4000-8000-0000000000b2';
  entity.role = StaffRole.Doctor;
  entity.status = StaffStatus.Active;
  entity.firstName = 'Clinic';
  entity.lastName = 'Doctor';
  entity.phone = null;
  entity.email = 'doctor@clinora.test';
  entity.specialization = null;
  entity.avatar = null;
  entity.isActive = true;
  entity.createdAt = new Date('2026-07-26T00:00:00.000Z');
  entity.updatedAt = new Date('2026-07-26T00:00:00.000Z');

  return Object.assign(entity, overrides);
}

describe(TypeOrmStaffMemberRepository.name, () => {
  const ormRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };
  let staffMembers: TypeOrmStaffMemberRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    ormRepository.manager.transaction.mockImplementation(
      async (
        work: (manager: {
          getRepository: () => typeof ormRepository;
        }) => Promise<unknown>,
      ) =>
        work({
          getRepository: () => ormRepository,
        }),
    );
    staffMembers = new TypeOrmStaffMemberRepository(
      ormRepository as unknown as Repository<StaffMemberTypeOrmEntity>,
    );
  });

  it('creates staff members as active and derives persisted compatibility data', async () => {
    ormRepository.create.mockImplementation(
      (entity: StaffMemberTypeOrmEntity) => entity,
    );
    ormRepository.save.mockImplementation(
      async (entity: StaffMemberTypeOrmEntity) => entity,
    );

    const member = await staffMembers.create({
      clinicId,
      userId: '00000000-0000-4000-8000-0000000000b2',
      role: StaffRole.Doctor,
      firstName: ' Clinic ',
      lastName: ' Doctor ',
      email: ' Doctor@Clinora.test ',
    });

    expect(ormRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: StaffStatus.Active,
        isActive: true,
      }),
    );
    expect(member.properties).toMatchObject({
      status: StaffStatus.Active,
      isActive: true,
    });
  });

  it.each([
    [StaffStatus.Active, true],
    [StaffStatus.OnLeave, true],
    [StaffStatus.Inactive, false],
  ])('derives persisted isActive when status changes to %s', async (status, isActive) => {
    ormRepository.findOneBy.mockResolvedValue(createEntity());
    ormRepository.save.mockImplementation(
      async (entity: StaffMemberTypeOrmEntity) => entity,
    );

    const member = await staffMembers.update(clinicId, staffMemberId, {
      status,
    });

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status,
        isActive,
      }),
    );
    expect(member?.properties.isActive).toBe(isActive);
  });

  it('re-derives compatibility data during partial profile updates', async () => {
    ormRepository.findOneBy.mockResolvedValue(
      createEntity({ status: StaffStatus.Inactive, isActive: true }),
    );
    ormRepository.save.mockImplementation(
      async (entity: StaffMemberTypeOrmEntity) => entity,
    );

    const member = await staffMembers.update(clinicId, staffMemberId, {
      firstName: ' Updated ',
    });

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Updated',
        status: StaffStatus.Inactive,
        isActive: false,
      }),
    );
    expect(member?.properties).toMatchObject({
      firstName: 'Updated',
      status: StaffStatus.Inactive,
      isActive: false,
    });
  });

  it('updates an enabled admin when another on-leave admin remains', async () => {
    ormRepository.findOne.mockResolvedValue(
      createEntity({
        role: StaffRole.Admin,
        status: StaffStatus.Active,
      }),
    );
    ormRepository.find.mockResolvedValue([
      createEntity({
        id: staffMemberId,
        role: StaffRole.Admin,
        status: StaffStatus.Active,
      }),
      createEntity({
        id: '00000000-0000-4000-8000-0000000000c3',
        role: StaffRole.Admin,
        status: StaffStatus.OnLeave,
      }),
    ]);
    ormRepository.save.mockImplementation(
      async (entity: StaffMemberTypeOrmEntity) => entity,
    );

    const result = await staffMembers.updatePreservingEnabledAdmin(
      clinicId,
      staffMemberId,
      { status: StaffStatus.Inactive },
    );

    expect(ormRepository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(ormRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        lock: { mode: 'pessimistic_write' },
      }),
    );
    expect(ormRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        lock: { mode: 'pessimistic_write' },
      }),
    );
    expect(result.outcome).toBe('updated');
  });

  it('rejects a guarded update that would remove the last enabled admin', async () => {
    ormRepository.findOne.mockResolvedValue(
      createEntity({
        role: StaffRole.Admin,
        status: StaffStatus.OnLeave,
      }),
    );
    ormRepository.find.mockResolvedValue([
      createEntity({
        id: staffMemberId,
        role: StaffRole.Admin,
        status: StaffStatus.OnLeave,
      }),
    ]);

    const result = await staffMembers.updatePreservingEnabledAdmin(
      clinicId,
      staffMemberId,
      { role: StaffRole.Doctor },
    );

    expect(result).toEqual({ outcome: 'last-enabled-admin' });
    expect(ormRepository.save).not.toHaveBeenCalled();
  });
});
