import type { StaffMember } from '../model';
import {
  mapEditStaffFormToCommand,
  mapStaffMemberToEditStaffForm,
  validateEditStaffForm,
} from './edit-staff-form.schema';

const staffMember: StaffMember = {
  id: 'staff-1',
  clinicId: 'clinic-1',
  userId: 'user-1',
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
  createdAt: new Date('2026-07-29T10:00:00.000Z'),
  updatedAt: new Date('2026-07-30T10:00:00.000Z'),
};

describe('edit staff form schema', () => {
  it('maps a staff member into editable form values', () => {
    expect(mapStaffMemberToEditStaffForm(staffMember)).toEqual({
      firstName: 'Salma',
      lastName: 'El Mansouri',
      email: 'salma.elmansouri@clinora.test',
      phone: '',
      role: 'DOCTOR',
      status: 'active',
      specialization: 'Endodontics',
      avatar: '',
    });
  });

  it('validates profile, role, status, and optional URL fields', () => {
    const result = validateEditStaffForm({
      ...mapStaffMemberToEditStaffForm(staffMember),
      avatar: 'not-a-url',
      email: 'bad-email',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Enter a valid email address.');
    expect(result.errors.avatar).toBe('Enter a valid image URL.');
  });

  it('maps form values into one update command with empty strings for cleared optional fields', () => {
    expect(
      mapEditStaffFormToCommand(staffMember, {
        ...mapStaffMemberToEditStaffForm(staffMember),
        email: ' SALMA.UPDATED@CLINORA.TEST ',
        phone: '',
        specialization: '',
        status: 'on-leave',
      }),
    ).toEqual({
      clinicId: 'clinic-1',
      staffMemberId: 'staff-1',
      role: 'DOCTOR',
      status: 'on-leave',
      firstName: 'Salma',
      lastName: 'El Mansouri',
      phone: '',
      email: 'salma.updated@clinora.test',
      specialization: '',
      avatar: '',
    });
  });
});
