import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { WaitingRoomChair, WaitingRoomEntry } from '../../model';
import { waitingRoomQueryKeys } from '../../model';
import { useAssignWaitingRoomChair } from './use-assign-waiting-room-chair';
import { useCreateWaitingRoomChair } from './use-create-waiting-room-chair';
import { useReorderWaitingRoomEntries } from './use-reorder-waiting-room-entries';
import { useUpdateWaitingRoomNotes } from './use-update-waiting-room-notes';
import { useUpdateWaitingRoomStatus } from './use-update-waiting-room-status';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../api', () => ({
  assignWaitingRoomChair: jest.fn(),
  createWaitingRoomChair: jest.fn(),
  reorderWaitingRoomEntries: jest.fn(),
  updateWaitingRoomNotes: jest.fn(),
  updateWaitingRoomStatus: jest.fn(),
}));

const useMutationMock = jest.mocked(useMutation);
const useQueryClientMock = jest.mocked(useQueryClient);
const now = new Date('2026-08-04T08:00:00.000Z');

const entry = (
  overrides: Partial<WaitingRoomEntry> = {},
): WaitingRoomEntry => ({
  id: 'queue-1',
  clinicId: 'clinic-a',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  patientName: 'Sara Amrani',
  patientPhone: null,
  doctorId: 'doctor-1',
  doctorName: 'Dr. Salma El Mansouri',
  appointmentType: null,
  status: 'WAITING',
  priority: 'NORMAL',
  queueNotes: null,
  chairId: null,
  chairName: null,
  manualOrder: null,
  arrivedAt: now,
  calledAt: null,
  seatedAt: null,
  completedAt: null,
  updatedAt: now,
  ...overrides,
});

const chair = (
  overrides: Partial<WaitingRoomChair> = {},
): WaitingRoomChair => ({
  id: 'chair-1',
  clinicId: 'clinic-a',
  name: 'Operatory 1',
  code: null,
  isActive: true,
  isAvailable: true,
  occupiedByEntryId: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const mutationReturn = {
  error: null,
  isPending: false,
  mutateAsync: jest.fn(),
  reset: jest.fn(),
};

describe('waiting-room mutation hooks', () => {
  const invalidateQueries = jest.fn();
  const setQueryData = jest.fn();

  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    setQueryData.mockReset();
    useMutationMock.mockReset();
    useMutationMock.mockReturnValue(mutationReturn as never);
    useQueryClientMock.mockReset();
    useQueryClientMock.mockReturnValue({
      invalidateQueries,
      setQueryData,
    } as never);
  });

  it('merges updated status entries and refreshes chairs when seated', async () => {
    useUpdateWaitingRoomStatus();

    const options = useMutationMock.mock.calls[0]?.[0] as {
      onSuccess: (updatedEntry: WaitingRoomEntry) => Promise<void>;
    };

    await options.onSuccess(
      entry({
        status: 'IN_CHAIR',
        chairId: 'chair-1',
      }),
    );

    expect(setQueryData).toHaveBeenCalledWith(
      waitingRoomQueryKeys.state('clinic-a'),
      expect.any(Function),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: waitingRoomQueryKeys.state('clinic-a'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: waitingRoomQueryKeys.chairs('clinic-a'),
    });
  });

  it('merges note updates without refreshing chair availability', () => {
    useUpdateWaitingRoomNotes();

    const options = useMutationMock.mock.calls[0]?.[0] as {
      onSuccess: (updatedEntry: WaitingRoomEntry) => void;
    };

    options.onSuccess(entry({ queueNotes: 'Needs assistance' }));

    expect(setQueryData).toHaveBeenCalledWith(
      waitingRoomQueryKeys.state('clinic-a'),
      expect.any(Function),
    );
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('refreshes waiting-room caches after chair assignment', async () => {
    useAssignWaitingRoomChair();

    const options = useMutationMock.mock.calls[0]?.[0] as {
      onSuccess: (updatedEntry: WaitingRoomEntry) => Promise<void>;
    };

    await options.onSuccess(entry({ status: 'IN_CHAIR', chairId: 'chair-1' }));

    expect(setQueryData).toHaveBeenCalledWith(
      waitingRoomQueryKeys.state('clinic-a'),
      expect.any(Function),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: waitingRoomQueryKeys.chairs('clinic-a'),
    });
  });

  it('merges manual reorder responses into state cache', async () => {
    useReorderWaitingRoomEntries();

    const options = useMutationMock.mock.calls[0]?.[0] as {
      onSuccess: (
        entries: WaitingRoomEntry[],
        command: { clinicId: string; mode: 'MANUAL'; status: 'WAITING' },
      ) => Promise<void>;
    };

    await options.onSuccess([entry({ manualOrder: 1 })], {
      clinicId: 'clinic-a',
      mode: 'MANUAL',
      status: 'WAITING',
    });

    expect(setQueryData).toHaveBeenCalledWith(
      waitingRoomQueryKeys.state('clinic-a'),
      expect.any(Function),
    );
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('merges created chairs and refreshes state availability', async () => {
    useCreateWaitingRoomChair();

    const options = useMutationMock.mock.calls[0]?.[0] as {
      onSuccess: (createdChair: WaitingRoomChair) => Promise<void>;
    };

    await options.onSuccess(chair());

    expect(setQueryData).toHaveBeenCalledWith(
      waitingRoomQueryKeys.state('clinic-a'),
      expect.any(Function),
    );
    expect(setQueryData).toHaveBeenCalledWith(
      waitingRoomQueryKeys.chairs('clinic-a'),
      expect.any(Function),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: waitingRoomQueryKeys.state('clinic-a'),
    });
  });
});
