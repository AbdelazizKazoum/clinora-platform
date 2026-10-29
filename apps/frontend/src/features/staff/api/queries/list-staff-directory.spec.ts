import { apiClient } from '@/lib/api';
import { listStaffDirectory } from './list-staff-directory';

jest.mock('@/lib/api', () => ({ apiClient: { get: jest.fn() } }));

describe('listStaffDirectory', () => {
  it('requests the clinic directory and maps names into staff options', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({
      data: {
        items: [
          {
            clinicId: 'clinic A/1',
            userId: 'assistant-1',
            firstName: 'Yasmine',
            lastName: 'Alaoui',
            role: 'DENTAL_ASSISTANT',
            status: 'active',
            isActive: true,
          },
        ],
      },
    });
    await expect(listStaffDirectory('clinic A/1')).resolves.toEqual([
      {
        clinicId: 'clinic A/1',
        userId: 'assistant-1',
        fullName: 'Yasmine Alaoui',
        role: 'DENTAL_ASSISTANT',
        status: 'active',
        isActive: true,
      },
    ]);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/staff/directory',
    );
  });

  it('normalizes an omitted empty collection', async () => {
    jest.mocked(apiClient.get).mockResolvedValue({ data: {} });
    await expect(listStaffDirectory('clinic-1')).resolves.toEqual([]);
  });
});
