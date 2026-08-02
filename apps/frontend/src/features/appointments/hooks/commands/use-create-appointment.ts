'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createAppointment as createAppointmentCommand } from '../../api';
import {
  appointmentQueryKeys,
  type Appointment,
  type CreateAppointmentCommand,
} from '../../model';

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Appointment, Error, CreateAppointmentCommand>({
    mutationFn: createAppointmentCommand,
    onSuccess: async (appointment) => {
      await queryClient.invalidateQueries({
        queryKey: appointmentQueryKeys.lists(appointment.clinicId),
      });
    },
  });

  return {
    createAppointment: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
  };
};
