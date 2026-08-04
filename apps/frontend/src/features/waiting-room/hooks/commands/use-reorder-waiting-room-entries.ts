'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reorderWaitingRoomEntries as reorderWaitingRoomEntriesCommand } from '../../api';
import type { ReorderWaitingRoomCommand, WaitingRoomEntry } from '../../model';
import {
  invalidateWaitingRoomClinic,
  mergeWaitingRoomReorderIntoCache,
} from './waiting-room-cache-updates';

export const useReorderWaitingRoomEntries = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    WaitingRoomEntry[],
    Error,
    ReorderWaitingRoomCommand
  >({
    mutationFn: reorderWaitingRoomEntriesCommand,
    onSuccess: async (entries, command) => {
      mergeWaitingRoomReorderIntoCache(
        queryClient,
        command.clinicId,
        entries,
        command.status,
      );
      if (command.mode === 'AUTO' && !command.status) {
        await invalidateWaitingRoomClinic(queryClient, command.clinicId);
      }
    },
  });

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    reorderWaitingRoomEntries: mutation.mutateAsync,
    reset: mutation.reset,
  };
};
