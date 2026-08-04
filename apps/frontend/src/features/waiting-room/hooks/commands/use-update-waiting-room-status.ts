'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateWaitingRoomStatus as updateWaitingRoomStatusCommand } from '../../api';
import type {
  UpdateWaitingRoomStatusCommand,
  WaitingRoomEntry,
} from '../../model';
import {
  invalidateWaitingRoomClinic,
  mergeWaitingRoomEntryIntoCache,
} from './waiting-room-cache-updates';

export const useUpdateWaitingRoomStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    WaitingRoomEntry,
    Error,
    UpdateWaitingRoomStatusCommand
  >({
    mutationFn: updateWaitingRoomStatusCommand,
    onSuccess: async (entry) => {
      mergeWaitingRoomEntryIntoCache(
        queryClient,
        entry,
        'queue.status.updated',
      );
      if (entry.status === 'IN_CHAIR') {
        await invalidateWaitingRoomClinic(queryClient, entry.clinicId);
      }
    },
  });

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
    updateWaitingRoomStatus: mutation.mutateAsync,
  };
};
