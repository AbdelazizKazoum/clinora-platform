import type { StaffMemberResponseDto } from '../api/dto';
import { mapStaffMemberFromDto } from './staff.mapper';
import {
  staffRoleBadgeClassNames,
  staffRoleLabels,
  staffStatusBadgeClassNames,
  staffStatusLabels,
} from './staff';

const createStaffMemberDto = (
  overrides: Partial<StaffMemberResponseDto> = {},
): StaffMemberResponseDto => ({
  id: 'staff-1',
  clinicId: 'clinic-1',
  userId: 'user-1',
  role: 'DOCTOR',
  status: 'active',
  firstName: 'Salma',
  lastName: 'El Mansouri',
  phone: '',
  email: 'salma.elmansouri@clinora.test',
  specialization: '',
  avatar: '',
  isActive: true,
  createdAt: '2026-07-29T10:30:00.000Z',
  updatedAt: '2026-07-30T11:45:00.000Z',
  ...overrides,
});

describe('mapStaffMemberFromDto', () => {
  it('maps staff transport fields into the frontend model', () => {
    const staffMember = mapStaffMemberFromDto(
      createStaffMemberDto({
        phone: '+212600000000',
        specialization: 'Endodontics',
        avatar: 'https://cdn.clinora.test/salma.jpg',
      }),
    );

    expect(staffMember).toMatchObject({
      id: 'staff-1',
      clinicId: 'clinic-1',
      userId: 'user-1',
      role: 'DOCTOR',
      status: 'active',
      firstName: 'Salma',
      lastName: 'El Mansouri',
      fullName: 'Salma El Mansouri',
      phone: '+212600000000',
      email: 'salma.elmansouri@clinora.test',
      specialization: 'Endodontics',
      avatar: 'https://cdn.clinora.test/salma.jpg',
      isActive: true,
    });
    expect(staffMember.createdAt).toEqual(
      new Date('2026-07-29T10:30:00.000Z'),
    );
    expect(staffMember.updatedAt).toEqual(
      new Date('2026-07-30T11:45:00.000Z'),
    );
  });

  it('maps empty optional transport strings to null', () => {
    const staffMember = mapStaffMemberFromDto(createStaffMemberDto());

    expect(staffMember.phone).toBeNull();
    expect(staffMember.specialization).toBeNull();
    expect(staffMember.avatar).toBeNull();
  });

  it('centralizes role and status display metadata', () => {
    expect(staffRoleLabels.ADMIN).toBe('Administrator');
    expect(staffRoleBadgeClassNames.DENTAL_ASSISTANT).toContain('badge-soft');
    expect(staffStatusLabels['on-leave']).toBe('On Leave');
    expect(staffStatusBadgeClassNames.inactive).toContain('danger');
  });
});
