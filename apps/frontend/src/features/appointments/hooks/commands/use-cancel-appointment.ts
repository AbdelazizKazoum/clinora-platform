'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelAppointment as cancelAppointmentCommand } from '../../api';
import {
  appointmentQueryKeys,
  type Appointment,
  type CancelAppointmentCommand,
} from '../../model';

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Appointment, Error, CancelAppointmentCommand>({
    mutationFn: cancelAppointmentCommand,
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
    cancelAppointment: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
  };
};
