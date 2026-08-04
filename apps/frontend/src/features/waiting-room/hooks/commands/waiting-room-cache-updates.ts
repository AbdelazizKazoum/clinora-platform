import type { QueryClient } from '@tanstack/react-query';

import {
  applyWaitingRoomEventToChairs,
  applyWaitingRoomEventToState,
  waitingRoomQueryKeys,
  type QueueStatus,
  type WaitingRoomChair,
  type WaitingRoomEntry,
  type WaitingRoomState,
} from '../../model';

export const mergeWaitingRoomEntryIntoCache = (
  queryClient: QueryClient,
  entry: WaitingRoomEntry,
  type: 'queue.status.updated' | 'queue.notes.updated' | 'queue.chair.assigned',
): void => {
  queryClient.setQueryData<WaitingRoomState>(
    waitingRoomQueryKeys.state(entry.clinicId),
    (state) =>
      applyWaitingRoomEventToState(state, {
        type,
        clinicId: entry.clinicId,
        entry,
      }),
  );
};

export const mergeWaitingRoomReorderIntoCache = (
  queryClient: QueryClient,
  clinicId: string,
  entries: WaitingRoomEntry[],
  status?: QueueStatus,
): void => {
  queryClient.setQueryData<WaitingRoomState>(
    waitingRoomQueryKeys.state(clinicId),
    (state) =>
      applyWaitingRoomEventToState(state, {
        type: 'queue.reordered',
        clinicId,
        entries,
        status,
      }),
  );
};

export const mergeWaitingRoomChairIntoCache = (
  queryClient: QueryClient,
  chair: WaitingRoomChair,
): void => {
  queryClient.setQueryData<WaitingRoomState>(
    waitingRoomQueryKeys.state(chair.clinicId),
    (state) =>
      applyWaitingRoomEventToState(state, {
        type: 'queue.chair.updated',
        clinicId: chair.clinicId,
        chair,
      }),
  );
  queryClient.setQueryData<WaitingRoomChair[]>(
    waitingRoomQueryKeys.chairs(chair.clinicId),
    (chairs) =>
      applyWaitingRoomEventToChairs(chairs, {
        type: 'queue.chair.updated',
        clinicId: chair.clinicId,
        chair,
      }),
  );
};

export const invalidateWaitingRoomClinic = async (
  queryClient: QueryClient,
  clinicId: string,
): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: waitingRoomQueryKeys.state(clinicId),
    }),
    queryClient.invalidateQueries({
      queryKey: waitingRoomQueryKeys.chairs(clinicId),
    }),
  ]);
};
