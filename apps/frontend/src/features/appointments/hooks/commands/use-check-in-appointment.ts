'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { checkInAppointment as checkInAppointmentCommand } from '../../api';
import {
  appointmentQueryKeys,
  appointmentQueueQueryKeys,
  type CheckInAppointmentCommand,
} from '../../model';
import type { QueueEntryResponseDto } from '../../api';

export const useCheckInAppointment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    QueueEntryResponseDto,
    Error,
    CheckInAppointmentCommand
  >({
    mutationFn: checkInAppointmentCommand,
    onSuccess: async (queueEntry) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: appointmentQueueQueryKeys.lists(queueEntry.clinicId),
        }),
        queryClient.invalidateQueries({
          queryKey: appointmentQueryKeys.lists(queueEntry.clinicId),
        }),
        queryClient.invalidateQueries({
          queryKey: appointmentQueryKeys.detail(
            queueEntry.clinicId,
            queueEntry.appointmentId,
          ),
        }),
      ]);
    },
  });

  return {
    checkInAppointment: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
  };
};
