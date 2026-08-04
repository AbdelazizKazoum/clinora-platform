'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateWaitingRoomNotes as updateWaitingRoomNotesCommand } from '../../api';
import type {
  UpdateWaitingRoomNotesCommand,
  WaitingRoomEntry,
} from '../../model';
import { mergeWaitingRoomEntryIntoCache } from './waiting-room-cache-updates';

export const useUpdateWaitingRoomNotes = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    WaitingRoomEntry,
    Error,
    UpdateWaitingRoomNotesCommand
  >({
    mutationFn: updateWaitingRoomNotesCommand,
    onSuccess: (entry) => {
      mergeWaitingRoomEntryIntoCache(queryClient, entry, 'queue.notes.updated');
    },
  });

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
    updateWaitingRoomNotes: mutation.mutateAsync,
  };
};
