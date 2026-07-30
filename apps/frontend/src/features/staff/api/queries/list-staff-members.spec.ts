import type { AxiosResponse } from 'axios';

import { apiClient } from '@/lib/api';

import type { ListStaffMembersResponseDto } from '../dto';
import { listStaffMembers } from './list-staff-members';

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
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

describe('listStaffMembers', () => {
  const apiClientGet = jest.mocked(apiClient.get);

  beforeEach(() => {
    apiClientGet.mockReset();
  });

  it('calls the clinic-scoped staff endpoint and maps the response', async () => {
    const response: ListStaffMembersResponseDto = {
      items: [
        {
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
        },
      ],
    };

    apiClientGet.mockResolvedValue(createAxiosResponse(response));

    const staffMembers = await listStaffMembers({ clinicId: 'clinic A/1' });

    expect(apiClientGet).toHaveBeenCalledWith('/clinics/clinic%20A%2F1/staff');
    expect(staffMembers).toHaveLength(1);
    expect(staffMembers[0]).toMatchObject({
      id: 'staff-1',
      clinicId: 'clinic A/1',
      fullName: 'Nora Admin',
      phone: null,
      specialization: null,
      avatar: null,
    });
    expect(staffMembers[0].createdAt).toEqual(
      new Date('2026-07-29T09:00:00.000Z'),
    );
  });

  it('maps an omitted empty staff collection to an empty list', async () => {
    apiClientGet.mockResolvedValue(createAxiosResponse({}));

    await expect(
      listStaffMembers({ clinicId: 'clinic A/1' }),
    ).resolves.toEqual([]);
  });
});
