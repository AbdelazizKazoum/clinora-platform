'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rescheduleAppointment as rescheduleAppointmentCommand } from '../../api';
import {
  appointmentQueryKeys,
  type Appointment,
  type RescheduleAppointmentCommand,
} from '../../model';

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Appointment,
    Error,
    RescheduleAppointmentCommand
  >({
    mutationFn: rescheduleAppointmentCommand,
    onSuccess: async (appointment) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: appointmentQueryKeys.lists(appointment.clinicId),
        }),
        queryClient.invalidateQueries({
          queryKey: appointmentQueryKeys.detail(
            appointment.clinicId,
            appointment.id,
          ),
        }),
      ]);
    },
  });

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
    rescheduleAppointment: mutation.mutateAsync,
  };
};
