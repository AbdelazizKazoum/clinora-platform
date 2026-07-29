import { StaffStatus } from '../enums/staff-status.enum';
import { deriveStaffMemberIsActive } from './staff-member';

describe(deriveStaffMemberIsActive.name, () => {
  it.each([
    [StaffStatus.Active, true],
    [StaffStatus.OnLeave, true],
    [StaffStatus.Inactive, false],
  ])('maps %s to isActive %s', (status, isActive) => {
    expect(deriveStaffMemberIsActive(status)).toBe(isActive);
  });
});
