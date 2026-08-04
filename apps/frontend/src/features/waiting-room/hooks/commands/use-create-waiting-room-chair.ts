'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createWaitingRoomChair as createWaitingRoomChairCommand } from '../../api';
import type {
  CreateWaitingRoomChairCommand,
  WaitingRoomChair,
} from '../../model';
import {
  invalidateWaitingRoomClinic,
  mergeWaitingRoomChairIntoCache,
} from './waiting-room-cache-updates';

export const useCreateWaitingRoomChair = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    WaitingRoomChair,
    Error,
    CreateWaitingRoomChairCommand
  >({
    mutationFn: createWaitingRoomChairCommand,
    onSuccess: async (chair) => {
      mergeWaitingRoomChairIntoCache(queryClient, chair);
      await invalidateWaitingRoomClinic(queryClient, chair.clinicId);
    },
  });

  return {
    createWaitingRoomChair: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
  };
};
