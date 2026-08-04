import type { AxiosResponse } from 'axios';

import { apiClient } from '@/lib/api';

import type {
  WaitingRoomChairResponseDto,
  WaitingRoomEntriesListResponseDto,
  WaitingRoomEntryResponseDto,
} from '../dto';
import { assignWaitingRoomChair } from './assign-waiting-room-chair';
import { createWaitingRoomChair } from './create-waiting-room-chair';
import { reorderWaitingRoomEntries } from './reorder-waiting-room-entries';
import { updateWaitingRoomChair } from './update-waiting-room-chair';
import { updateWaitingRoomNotes } from './update-waiting-room-notes';
import { updateWaitingRoomStatus } from './update-waiting-room-status';

jest.mock('@/lib/api', () => ({
  apiClient: {
    patch: jest.fn(),
    post: jest.fn(),
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

const entryResponse: WaitingRoomEntryResponseDto = {
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
};

const chairResponse: WaitingRoomChairResponseDto = {
  id: 'chair-1',
  clinicId: 'clinic A/1',
  name: 'Operatory 1',
  code: '',
  isActive: true,
  isAvailable: true,
  occupiedByEntryId: '',
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z',
};

describe('waiting-room commands', () => {
  const apiClientPatch = jest.mocked(apiClient.patch);
  const apiClientPost = jest.mocked(apiClient.post);

  beforeEach(() => {
    apiClientPatch.mockReset();
    apiClientPost.mockReset();
  });

  it('updates status and sends chair/order fields to the status route', async () => {
    apiClientPatch.mockResolvedValue(createAxiosResponse(entryResponse));

    await updateWaitingRoomStatus({
      clinicId: 'clinic A/1',
      entryId: 'entry A/1',
      status: 'IN_CHAIR',
      chairId: 'chair-1',
      targetOrderedEntryIds: ['entry-1', 'entry-2'],
    });

    expect(apiClientPatch).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/waiting-room/entries/entry%20A%2F1/status',
      {
        status: 'IN_CHAIR',
        chairId: 'chair-1',
        correctionReason: undefined,
        targetOrderedEntryIds: ['entry-1', 'entry-2'],
      },
    );
  });

  it('updates notes and sends an empty string when notes are cleared', async () => {
    apiClientPatch.mockResolvedValue(createAxiosResponse(entryResponse));

    await updateWaitingRoomNotes({
      clinicId: 'clinic A/1',
      entryId: 'entry A/1',
      queueNotes: null,
    });

    expect(apiClientPatch).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/waiting-room/entries/entry%20A%2F1/notes',
      { queueNotes: '' },
    );
  });

  it('assigns chairs and reorders entries through waiting-room endpoints', async () => {
    const reorderResponse: WaitingRoomEntriesListResponseDto = {
      queueEntries: [entryResponse],
    };
    apiClientPatch
      .mockResolvedValueOnce(createAxiosResponse(entryResponse))
      .mockResolvedValueOnce(createAxiosResponse(reorderResponse));

    await assignWaitingRoomChair({
      clinicId: 'clinic A/1',
      entryId: 'entry A/1',
      chairId: 'chair-1',
    });
    await reorderWaitingRoomEntries({
      clinicId: 'clinic A/1',
      mode: 'MANUAL',
      status: 'WAITING',
      orderedEntryIds: ['queue-1'],
    });

    expect(apiClientPatch).toHaveBeenNthCalledWith(
      1,
      '/clinics/clinic%20A%2F1/waiting-room/entries/entry%20A%2F1/chair',
      { chairId: 'chair-1' },
    );
    expect(apiClientPatch).toHaveBeenNthCalledWith(
      2,
      '/clinics/clinic%20A%2F1/waiting-room/reorder',
      {
        mode: 'MANUAL',
        status: 'WAITING',
        orderedEntryIds: ['queue-1'],
      },
    );
  });

  it('creates and updates chairs through chair management endpoints', async () => {
    apiClientPost.mockResolvedValue(createAxiosResponse(chairResponse));
    apiClientPatch.mockResolvedValue(createAxiosResponse(chairResponse));

    await createWaitingRoomChair({
      clinicId: 'clinic A/1',
      name: 'Operatory 1',
      code: null,
      isActive: true,
    });
    await updateWaitingRoomChair({
      clinicId: 'clinic A/1',
      chairId: 'chair A/1',
      code: null,
      isActive: false,
    });

    expect(apiClientPost).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/waiting-room/chairs',
      {
        name: 'Operatory 1',
        code: undefined,
        isActive: true,
      },
    );
    expect(apiClientPatch).toHaveBeenCalledWith(
      '/clinics/clinic%20A%2F1/waiting-room/chairs/chair%20A%2F1',
      {
        name: undefined,
        code: '',
        isActive: false,
      },
    );
  });
});
