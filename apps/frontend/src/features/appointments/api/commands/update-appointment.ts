import { apiClient } from '@/lib/api';

import {
  mapAppointmentFromDto,
  mapUpdateAppointmentCommandToDto,
  type Appointment,
  type UpdateAppointmentCommand,
} from '../../model';
import type { AppointmentResponseDto } from '../dto';
import { appointmentApiPaths } from '../appointment-api-paths';

export const updateAppointment = async (
  command: UpdateAppointmentCommand,
): Promise<Appointment> => {
  const response = await apiClient.put<AppointmentResponseDto>(
    appointmentApiPaths.appointment(command.clinicId, command.appointmentId),
    mapUpdateAppointmentCommandToDto(command),
  );

  return mapAppointmentFromDto(response.data);
};
