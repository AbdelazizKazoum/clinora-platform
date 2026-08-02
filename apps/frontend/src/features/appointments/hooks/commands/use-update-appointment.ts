'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateAppointment as updateAppointmentCommand } from '../../api';
import {
  appointmentQueryKeys,
  type Appointment,
  type UpdateAppointmentCommand,
} from '../../model';

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Appointment, Error, UpdateAppointmentCommand>({
    mutationFn: updateAppointmentCommand,
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
    updateAppointment: mutation.mutateAsync,
  };
};
