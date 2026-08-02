import type { StaffMember } from '@/features/staff';

import {
  projectActiveDoctorProviders,
  toggleVisibleProviderId,
} from './appointment-provider';

const createStaffMember = (
  overrides: Partial<StaffMember> = {},
): StaffMember => ({
  id: 'staff-1',
  clinicId: 'clinic-1',
  userId: 'doctor-1',
  role: 'DOCTOR',
  status: 'active',
  firstName: 'Salma',
  lastName: 'El Mansouri',
  fullName: 'Salma El Mansouri',
  phone: null,
  email: 'salma.elmansouri@clinora.test',
  specialization: 'Endodontics',
  avatar: null,
  isActive: true,
  createdAt: new Date('2026-08-01T09:00:00.000Z'),
  updatedAt: new Date('2026-08-01T09:00:00.000Z'),
  ...overrides,
});

describe('appointment providers', () => {
  it('projects active doctors using staff user IDs as doctor IDs', () => {
    expect(
      projectActiveDoctorProviders([
        createStaffMember(),
        createStaffMember({
          id: 'staff-2',
          role: 'SECRETARY',
          userId: 'secretary-1',
        }),
        createStaffMember({
          id: 'staff-3',
          status: 'inactive',
          userId: 'doctor-3',
        }),
      ]),
    ).toMatchObject([
      {
        doctorId: 'doctor-1',
        initials: 'SE',
        name: 'Salma El Mansouri',
      },
    ]);
  });

  it('prevents disabling the last visible provider', () => {
    expect(toggleVisibleProviderId(['doctor-1'], 'doctor-1')).toEqual([
      'doctor-1',
    ]);
    expect(
      toggleVisibleProviderId(['doctor-1', 'doctor-2'], 'doctor-1'),
    ).toEqual(['doctor-2']);
    expect(toggleVisibleProviderId(['doctor-1'], 'doctor-2')).toEqual([
      'doctor-1',
      'doctor-2',
    ]);
  });
});
