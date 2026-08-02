import { apiClient } from '@/lib/api';

import {
  mapAppointmentsListFromDto,
  mapListAppointmentsQueryToDto,
  type ListAppointmentsQuery,
  type ListAppointmentsResult,
} from '../../model';
import type { AppointmentsListResponseDto } from '../dto';
import { appointmentApiPaths } from '../appointment-api-paths';

export const listAppointments = async (
  query: ListAppointmentsQuery,
): Promise<ListAppointmentsResult> => {
  const response = await apiClient.get<AppointmentsListResponseDto>(
    appointmentApiPaths.appointments(query.clinicId),
    {
      params: mapListAppointmentsQueryToDto(query),
    },
  );

  return mapAppointmentsListFromDto(response.data);
};
