import type { StaffMember } from './staff';
import {
  filterStaffMembers,
  getStaffInitials,
  getStaffSummary,
} from './staff-list.rules';

const createStaffMember = (
  overrides: Partial<StaffMember> = {},
): StaffMember => ({
  id: 'staff-1',
  clinicId: 'clinic-1',
  userId: 'user-1',
  role: 'DOCTOR',
  status: 'active',
  firstName: 'Salma',
  lastName: 'El Mansouri',
  fullName: 'Salma El Mansouri',
  phone: '+212600000001',
  email: 'salma.elmansouri@clinora.test',
  specialization: 'Endodontics',
  avatar: null,
  isActive: true,
  createdAt: new Date('2026-07-29T10:00:00.000Z'),
  updatedAt: new Date('2026-07-30T10:00:00.000Z'),
  ...overrides,
});

describe('staff list rules', () => {
  const staffMembers = [
    createStaffMember(),
    createStaffMember({
      id: 'staff-2',
      role: 'SECRETARY',
      status: 'on-leave',
      firstName: 'Adam',
      lastName: 'Front Desk',
      fullName: 'Adam Front Desk',
      email: 'adam.frontdesk@clinora.test',
      phone: null,
      specialization: null,
    }),
    createStaffMember({
      id: 'staff-3',
      role: 'ADMIN',
      status: 'inactive',
      firstName: 'Nora',
      lastName: 'Admin',
      fullName: 'Nora Admin',
      email: 'nora.admin@clinora.test',
      phone: '+212600000003',
      specialization: 'Operations',
    }),
  ];

  it('summarizes the complete staff list by canonical status', () => {
    expect(getStaffSummary(staffMembers)).toEqual({
      active: 1,
      inactive: 1,
      onLeave: 1,
      total: 3,
    });
  });

  it('filters by search, role, and status together', () => {
    expect(
      filterStaffMembers(staffMembers, {
        role: 'DOCTOR',
        search: 'endo',
        status: 'active',
      }).map((staffMember) => staffMember.id),
    ).toEqual(['staff-1']);
  });

  it('searches name, email, phone, and specialization', () => {
    expect(
      filterStaffMembers(staffMembers, {
        role: 'ALL',
        search: '+212600000001',
        status: 'ALL',
      }).map((staffMember) => staffMember.id),
    ).toEqual(['staff-1']);
    expect(
      filterStaffMembers(staffMembers, {
        role: 'ALL',
        search: 'frontdesk',
        status: 'ALL',
      }).map((staffMember) => staffMember.id),
    ).toEqual(['staff-2']);
  });

  it('builds initials from staff names', () => {
    expect(getStaffInitials(staffMembers[0])).toBe('SE');
    expect(
      getStaffInitials(
        createStaffMember({ firstName: '', lastName: '', fullName: '' }),
      ),
    ).toBe('SM');
  });
});
