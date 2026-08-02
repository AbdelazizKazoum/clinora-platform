import { apiClient } from '@/lib/api';

import {
  mapAppointmentFromDto,
  type Appointment,
  type GetAppointmentQuery,
} from '../../model';
import type { AppointmentResponseDto } from '../dto';
import { appointmentApiPaths } from '../appointment-api-paths';

export const getAppointment = async (
  query: GetAppointmentQuery,
): Promise<Appointment> => {
  const response = await apiClient.get<AppointmentResponseDto>(
    appointmentApiPaths.appointment(query.clinicId, query.appointmentId),
  );

  return mapAppointmentFromDto(response.data);
};
