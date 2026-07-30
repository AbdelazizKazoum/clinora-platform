import type { AxiosResponse } from 'axios';

import { apiClient } from '@/lib/api';

import type { StaffMemberResponseDto } from '../dto';
import { createStaffMember } from './create-staff-member';

jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const createAxiosResponse = <TData>(data: TData): AxiosResponse<TData> =>
  ({
    data,
    status: 201,
    statusText: 'Created',
    headers: {},
    config: {},
  }) as AxiosResponse<TData>;

const createdStaffMember: StaffMemberResponseDto = {
  id: 'staff-1',
  clinicId: 'clinic A/1',
  userId: 'user-1',
  role: 'DOCTOR',
  status: 'active',
  firstName: 'Salma',
  lastName: 'El Mansouri',
  phone: '+212600000000',
  email: 'salma.elmansouri@clinora.test',
  specialization: 'Endodontics',
  avatar: '',
  isActive: true,
  createdAt: '2026-07-30T09:00:00.000Z',
  updatedAt: '2026-07-30T09:00:00.000Z',
};

describe('createStaffMember', () => {
  const apiClientPost = jest.mocked(apiClient.post);

  beforeEach(() => {
    apiClientPost.mockReset();
  });

  it('posts one clinic-scoped create request and maps the response', async () => {
    apiClientPost.mockResolvedValue(createAxiosResponse(createdStaffMember));

    const staffMember = await createStaffMember({
      clinicId: 'clinic A/1',
      role: 'DOCTOR',
      firstName: 'Salma',
      lastName: 'El Mansouri',
      phone: '+212600000000',
      email: 'salma.elmansouri@clinora.test',
      specialization: 'Endodontics',
      password: 'StrongPassword123!',
    });

    expect(apiClientPost).toHaveBeenCalledWith('/clinics/clinic%20A%2F1/staff', {
      role: 'DOCTOR',
      firstName: 'Salma',
      lastName: 'El Mansouri',
      phone: '+212600000000',
      email: 'salma.elmansouri@clinora.test',
      specialization: 'Endodontics',
      password: 'StrongPassword123!',
    });
    expect(staffMember.fullName).toBe('Salma El Mansouri');
    expect(staffMember.status).toBe('active');
  });

  it('does not include password confirmation in the backend payload', async () => {
    apiClientPost.mockResolvedValue(createAxiosResponse(createdStaffMember));

    await createStaffMember({
      clinicId: 'clinic-1',
      role: 'ADMIN',
      firstName: 'Nora',
      lastName: 'Admin',
      email: 'nora.admin@clinora.test',
      password: 'StrongPassword123!',
    });

    const payload = apiClientPost.mock.calls[0]?.[1] as Record<string, unknown>;

    expect(payload).not.toHaveProperty('passwordConfirmation');
  });
});
