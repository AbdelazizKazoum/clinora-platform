'use client';

import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';

import { waitingRoomApiPaths, type QueueStreamEventDto } from '../api';
import {
  applyWaitingRoomEventToChairs,
  applyWaitingRoomEventToState,
  mapQueueStreamEventFromDto,
  waitingRoomQueryKeys,
  type WaitingRoomChair,
  type WaitingRoomState,
} from '../model';

export const mergeWaitingRoomStreamEvent = (
  queryClient: QueryClient,
  dto: QueueStreamEventDto,
): void => {
  const event = mapQueueStreamEventFromDto(dto);

  queryClient.setQueryData<WaitingRoomState>(
    waitingRoomQueryKeys.state(event.clinicId),
    (state) => applyWaitingRoomEventToState(state, event),
  );
  queryClient.setQueryData<WaitingRoomChair[]>(
    waitingRoomQueryKeys.chairs(event.clinicId),
    (chairs) => applyWaitingRoomEventToChairs(chairs, event),
  );

  if (event.type === 'queue.chair.updated') {
    void queryClient.invalidateQueries({
      queryKey: waitingRoomQueryKeys.state(event.clinicId),
    });
    void queryClient.invalidateQueries({
      queryKey: waitingRoomQueryKeys.chairs(event.clinicId),
    });
  }
};

export const useWaitingRoomEvents = (
  clinicId: string | null | undefined,
): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!clinicId || typeof EventSource === 'undefined') return undefined;

    const source = new EventSource(waitingRoomApiPaths.queueEvents(clinicId), {
      withCredentials: true,
    });

    source.onmessage = (message) => {
      if (message.data === ':heartbeat') return;

      try {
        mergeWaitingRoomStreamEvent(
          queryClient,
          JSON.parse(message.data) as QueueStreamEventDto,
        );
      } catch {
        void queryClient.invalidateQueries({
          queryKey: waitingRoomQueryKeys.state(clinicId),
        });
      }
    };

    source.onerror = () => {
      void queryClient.invalidateQueries({
        queryKey: waitingRoomQueryKeys.state(clinicId),
      });
    };

    return () => {
      source.close();
    };
  }, [clinicId, queryClient]);
};
