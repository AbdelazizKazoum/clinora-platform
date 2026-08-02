import { apiClient } from '@/lib/api';

import {
  mapCheckInAppointmentCommandToDto,
  type CheckInAppointmentCommand,
} from '../../model';
import type { QueueEntryResponseDto } from '../dto';
import { appointmentApiPaths } from '../appointment-api-paths';

export const checkInAppointment = async (
  command: CheckInAppointmentCommand,
): Promise<QueueEntryResponseDto> => {
  const response = await apiClient.post<QueueEntryResponseDto>(
    appointmentApiPaths.queueEntries(command.clinicId),
    mapCheckInAppointmentCommandToDto(command),
  );

  return response.data;
};
