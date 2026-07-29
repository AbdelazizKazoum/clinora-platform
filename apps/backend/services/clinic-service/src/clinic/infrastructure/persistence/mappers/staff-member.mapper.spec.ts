import { StaffRole } from '../../../domain/enums/staff-role.enum';
import { StaffStatus } from '../../../domain/enums/staff-status.enum';
import { StaffMemberTypeOrmEntity } from '../entities/staff-member.typeorm-entity';
import { StaffMemberMapper } from './staff-member.mapper';

function createEntity(
  overrides: Partial<StaffMemberTypeOrmEntity> = {},
): StaffMemberTypeOrmEntity {
  const entity = new StaffMemberTypeOrmEntity();
  entity.id = '00000000-0000-4000-8000-0000000000a1';
  entity.clinicId = '00000000-0000-4000-8000-000000000001';
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

describe(StaffMemberMapper.name, () => {
  it.each([
    [StaffStatus.Active, true],
    [StaffStatus.OnLeave, true],
    [StaffStatus.Inactive, false],
  ])('derives read isActive from %s status', (status, isActive) => {
    const member = StaffMemberMapper.toDomain(
      createEntity({ status, isActive: !isActive }),
    );

    expect(member.properties.isActive).toBe(isActive);
  });
});
