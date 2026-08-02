import { apiClient } from '@/lib/api';

import {
  mapAppointmentFromDto,
  mapCancelAppointmentCommandToDto,
  type Appointment,
  type CancelAppointmentCommand,
} from '../../model';
import type { AppointmentResponseDto } from '../dto';
import { appointmentApiPaths } from '../appointment-api-paths';

export const cancelAppointment = async (
  command: CancelAppointmentCommand,
): Promise<Appointment> => {
  const response = await apiClient.put<AppointmentResponseDto>(
    appointmentApiPaths.appointment(command.clinicId, command.appointmentId),
    mapCancelAppointmentCommandToDto(command),
  );

  return mapAppointmentFromDto(response.data);
};
