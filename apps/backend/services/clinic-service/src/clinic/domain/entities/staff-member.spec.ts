import { StaffStatus } from '../enums/staff-status.enum';
import { StaffRole } from '../enums/staff-role.enum';
import {
  deriveStaffMemberIsActive,
  isEnabledStaffAdmin,
} from './staff-member';

describe(deriveStaffMemberIsActive.name, () => {
  it.each([
    [StaffStatus.Active, true],
    [StaffStatus.OnLeave, true],
    [StaffStatus.Inactive, false],
  ])('maps %s to isActive %s', (status, isActive) => {
    expect(deriveStaffMemberIsActive(status)).toBe(isActive);
  });
});

describe(isEnabledStaffAdmin.name, () => {
  it.each([
    [StaffRole.Admin, StaffStatus.Active, true],
    [StaffRole.Admin, StaffStatus.OnLeave, true],
    [StaffRole.Admin, StaffStatus.Inactive, false],
    [StaffRole.Doctor, StaffStatus.Active, false],
  ])('maps %s/%s to %s', (role, status, expected) => {
    expect(isEnabledStaffAdmin(role, status)).toBe(expected);
  });
});
