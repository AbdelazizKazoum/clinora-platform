import { apiClient } from '@/lib/api';

import {
  mapCheckAppointmentConflictsQueryToDto,
  type CheckAppointmentConflictsQuery,
  type ConflictResult,
} from '../../model';
import type { ConflictResponseDto } from '../dto';
import { appointmentApiPaths } from '../appointment-api-paths';

export const checkAppointmentConflicts = async (
  query: CheckAppointmentConflictsQuery,
): Promise<ConflictResult> => {
  const response = await apiClient.get<ConflictResponseDto>(
    appointmentApiPaths.appointmentConflicts(query.clinicId),
    {
      params: mapCheckAppointmentConflictsQueryToDto(query),
    },
  );

  return response.data;
};
