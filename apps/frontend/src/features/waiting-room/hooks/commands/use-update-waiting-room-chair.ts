'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateWaitingRoomChair as updateWaitingRoomChairCommand } from '../../api';
import type {
  UpdateWaitingRoomChairCommand,
  WaitingRoomChair,
} from '../../model';
import {
  invalidateWaitingRoomClinic,
  mergeWaitingRoomChairIntoCache,
} from './waiting-room-cache-updates';

export const useUpdateWaitingRoomChair = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    WaitingRoomChair,
    Error,
    UpdateWaitingRoomChairCommand
  >({
    mutationFn: updateWaitingRoomChairCommand,
    onSuccess: async (chair) => {
      mergeWaitingRoomChairIntoCache(queryClient, chair);
      await invalidateWaitingRoomClinic(queryClient, chair.clinicId);
    },
  });

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
    updateWaitingRoomChair: mutation.mutateAsync,
  };
};
