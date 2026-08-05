'use client';

import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { waitingRoomApiPaths, type QueueStreamEventDto } from '../api';
import {
  applyWaitingRoomEventToChairs,
  applyWaitingRoomEventToState,
  mapQueueStreamEventFromDto,
  waitingRoomQueryKeys,
  type WaitingRoomChair,
  type WaitingRoomState,
} from '../model';

export type WaitingRoomConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'offline';

export interface WaitingRoomLiveState {
  connectionStatus: WaitingRoomConnectionStatus;
  isOnline: boolean;
  lastEventAt: Date | null;
  recentlyUpdatedEntryIds: string[];
  reconnect: () => void;
}

const RECENT_UPDATE_DURATION_MS = 4_000;

const getInitialOnlineState = (): boolean =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

export const getUpdatedEntryIdsFromQueueEvent = (
  dto: QueueStreamEventDto,
): string[] =>
  Array.from(
    new Set([
      ...(dto.entry ? [dto.entry.id] : []),
      ...(dto.entries?.map((entry) => entry.id) ?? []),
    ]),
  );

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
): WaitingRoomLiveState => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(getInitialOnlineState);
  const [connectionStatus, setConnectionStatus] =
    useState<WaitingRoomConnectionStatus>(
      getInitialOnlineState() ? 'connecting' : 'offline',
    );
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const [recentlyUpdatedEntryIds, setRecentlyUpdatedEntryIds] = useState<
    string[]
  >([]);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const recentUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const reconnect = useCallback(() => {
    if (!getInitialOnlineState()) return;

    setConnectionStatus('connecting');
    setReconnectAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus('connecting');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!clinicId) {
      setConnectionStatus(isOnline ? 'disconnected' : 'offline');
      return undefined;
    }
    if (!isOnline) {
      setConnectionStatus('offline');
      return undefined;
    }
    if (typeof EventSource === 'undefined') {
      setConnectionStatus('disconnected');
      return undefined;
    }

    setConnectionStatus('connecting');

    const source = new EventSource(waitingRoomApiPaths.queueEvents(clinicId), {
      withCredentials: true,
    });

    source.onopen = () => {
      setConnectionStatus('connected');
    };

    source.onmessage = (message) => {
      if (message.data === ':heartbeat') return;

      try {
        const dto = JSON.parse(message.data) as QueueStreamEventDto;
        mergeWaitingRoomStreamEvent(queryClient, dto);
        setConnectionStatus('connected');
        setLastEventAt(new Date());

        const updatedEntryIds = getUpdatedEntryIdsFromQueueEvent(dto);
        if (updatedEntryIds.length > 0) {
          setRecentlyUpdatedEntryIds(updatedEntryIds);
          if (recentUpdateTimerRef.current) {
            clearTimeout(recentUpdateTimerRef.current);
          }
          recentUpdateTimerRef.current = setTimeout(() => {
            setRecentlyUpdatedEntryIds([]);
          }, RECENT_UPDATE_DURATION_MS);
        }
      } catch {
        void queryClient.invalidateQueries({
          queryKey: waitingRoomQueryKeys.state(clinicId),
        });
      }
    };

    source.onerror = () => {
      setConnectionStatus(getInitialOnlineState() ? 'disconnected' : 'offline');
      void queryClient.invalidateQueries({
        queryKey: waitingRoomQueryKeys.state(clinicId),
      });
    };

    return () => {
      source.close();
    };
  }, [clinicId, isOnline, queryClient, reconnectAttempt]);

  useEffect(
    () => () => {
      if (recentUpdateTimerRef.current) {
        clearTimeout(recentUpdateTimerRef.current);
      }
    },
    [],
  );

  return {
    connectionStatus,
    isOnline,
    lastEventAt,
    recentlyUpdatedEntryIds,
    reconnect,
  };
};
