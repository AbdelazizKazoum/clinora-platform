import type { AxiosResponse } from 'axios';

import { apiClient } from '@/lib/api';

import type {
  WaitingRoomChairsListResponseDto,
  WaitingRoomStateResponseDto,
} from '../dto';
import { getWaitingRoomState } from './get-waiting-room-state';
import { listWaitingRoomChairs } from './list-waiting-room-chairs';

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

const stateResponse: WaitingRoomStateResponseDto = {
  entries: [
    {
      id: 'queue-1',
      clinicId: 'clinic A/1',
      appointmentId: 'appointment-1',
      patientId: 'patient-1',
      patientName: 'Sara Amrani',
      patientPhone: '',
      doctorId: 'doctor-1',
      doctorName: 'Dr. Salma El Mansouri',
      appointmentType: '',
      status: 'WAITING',
      priority: 'NORMAL',
      queueNotes: '',
      chairId: '',
      chairName: '',
      arrivedAt: '2026-08-04T08:00:00.000Z',
      calledAt: '',
      seatedAt: '',
      completedAt: '',
      updatedAt: '2026-08-04T08:00:00.000Z',
    },
  ],
  chairs: [],
  ordering: {
    mode: 'AUTO',
    manualStatuses: [],
  },
  generatedAt: '2026-08-04T08:00:00.000Z',
};

describe('waiting-room queries', () => {
  const apiClientGet = jest.mocked(apiClient.get);

  beforeEach(() => {
    apiClientGet.mockReset();
  });

  it('gets waiting-room state through the BFF-relative route', async () => {
    apiClientGet.mockResolvedValue(createAxiosResponse(stateResponse));

    const state = await getWaitingRoomState('clinic A/1');

    expect(apiClientGet).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/waiting-room',
    );
    expect(state.entries[0]).toMatchObject({
      id: 'queue-1',
      patientPhone: null,
    });
  });

  it('lists waiting-room chairs and maps transport strings', async () => {
    const response: WaitingRoomChairsListResponseDto = {
      chairs: [
        {
          id: 'chair-1',
          clinicId: 'clinic A/1',
          name: 'Operatory 1',
          code: '',
          isActive: true,
          isAvailable: true,
          occupiedByEntryId: '',
          createdAt: '2026-08-01T08:00:00.000Z',
          updatedAt: '2026-08-01T08:00:00.000Z',
        },
      ],
    };
    apiClientGet.mockResolvedValue(createAxiosResponse(response));

    const chairs = await listWaitingRoomChairs('clinic A/1');

    expect(apiClientGet).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/waiting-room/chairs',
    );
    expect(chairs[0]).toMatchObject({
      id: 'chair-1',
      code: null,
      occupiedByEntryId: null,
    });
  });
});
