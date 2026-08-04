'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assignWaitingRoomChair as assignWaitingRoomChairCommand } from '../../api';
import type {
  AssignWaitingRoomChairCommand,
  WaitingRoomEntry,
} from '../../model';
import {
  invalidateWaitingRoomClinic,
  mergeWaitingRoomEntryIntoCache,
} from './waiting-room-cache-updates';

export const useAssignWaitingRoomChair = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    WaitingRoomEntry,
    Error,
    AssignWaitingRoomChairCommand
  >({
    mutationFn: assignWaitingRoomChairCommand,
    onSuccess: async (entry) => {
      mergeWaitingRoomEntryIntoCache(
        queryClient,
        entry,
        'queue.chair.assigned',
      );
      await invalidateWaitingRoomClinic(queryClient, entry.clinicId);
    },
  });

  return {
    assignWaitingRoomChair: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
  };
};
