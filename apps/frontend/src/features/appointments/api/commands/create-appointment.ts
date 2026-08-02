import { apiClient } from '@/lib/api';

import {
  mapAppointmentFromDto,
  mapCreateAppointmentCommandToDto,
  type Appointment,
  type CreateAppointmentCommand,
} from '../../model';
import type { AppointmentResponseDto } from '../dto';
import { appointmentApiPaths } from '../appointment-api-paths';

export const createAppointment = async (
  command: CreateAppointmentCommand,
): Promise<Appointment> => {
  const response = await apiClient.post<AppointmentResponseDto>(
    appointmentApiPaths.appointments(command.clinicId),
    mapCreateAppointmentCommandToDto(command),
  );

  return mapAppointmentFromDto(response.data);
};
