import type { AxiosResponse } from 'axios';

import { apiClient } from '@/lib/api';

import type { StaffMemberResponseDto } from '../dto';
import { updateStaffMember } from './update-staff-member';

jest.mock('@/lib/api', () => ({
  apiClient: {
    patch: jest.fn(),
  },
}));

const createAxiosResponse = <TData>(data: TData): AxiosResponse<TData> =>
  ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }) as AxiosResponse<TData>;

const updatedStaffMember: StaffMemberResponseDto = {
  id: 'staff-1',
  clinicId: 'clinic A/1',
  userId: 'user-1',
  role: 'ADMIN',
  status: 'on-leave',
  firstName: 'Nora',
  lastName: 'Admin',
  phone: '',
  email: 'nora.admin@clinora.test',
  specialization: '',
  avatar: '',
  isActive: true,
  createdAt: '2026-07-29T09:00:00.000Z',
  updatedAt: '2026-07-30T09:00:00.000Z',
};

describe('updateStaffMember', () => {
  const apiClientPatch = jest.mocked(apiClient.patch);

  beforeEach(() => {
    apiClientPatch.mockReset();
  });

  it('patches one clinic-scoped staff member and maps the response', async () => {
    apiClientPatch.mockResolvedValue(createAxiosResponse(updatedStaffMember));

    const staffMember = await updateStaffMember({
      clinicId: 'clinic A/1',
      staffMemberId: 'staff 1/2',
      role: 'ADMIN',
      status: 'on-leave',
      firstName: 'Nora',
      lastName: 'Admin',
      email: 'nora.admin@clinora.test',
      phone: '',
    });

    expect(apiClientPatch).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/staff/staff%201%2F2',
      {
        role: 'ADMIN',
        status: 'on-leave',
        firstName: 'Nora',
        lastName: 'Admin',
        email: 'nora.admin@clinora.test',
        phone: '',
      },
    );
    expect(staffMember.status).toBe('on-leave');
    expect(staffMember.phone).toBeNull();
  });
});
