import { apiClient } from '@/lib/api';

import {
  mapAppointmentFromDto,
  mapRescheduleAppointmentCommandToDto,
  type Appointment,
  type RescheduleAppointmentCommand,
} from '../../model';
import type { AppointmentResponseDto } from '../dto';
import { appointmentApiPaths } from '../appointment-api-paths';

export const rescheduleAppointment = async (
  command: RescheduleAppointmentCommand,
): Promise<Appointment> => {
  const response = await apiClient.patch<AppointmentResponseDto>(
    appointmentApiPaths.appointmentTiming(
      command.clinicId,
      command.appointmentId,
    ),
    mapRescheduleAppointmentCommandToDto(command),
  );

  return mapAppointmentFromDto(response.data);
};
