import { apiClient } from '@/lib/api';

import {
  mapAssignWaitingRoomChairCommandToDto,
  mapWaitingRoomEntryFromDto,
  type AssignWaitingRoomChairCommand,
  type WaitingRoomEntry,
} from '../../model';
import type { WaitingRoomEntryResponseDto } from '../dto';
import { waitingRoomApiPaths } from '../waiting-room-api-paths';

export const assignWaitingRoomChair = async (
  command: AssignWaitingRoomChairCommand,
): Promise<WaitingRoomEntry> => {
  const response = await apiClient.patch<WaitingRoomEntryResponseDto>(
    waitingRoomApiPaths.entryChair(command.clinicId, command.entryId),
    mapAssignWaitingRoomChairCommandToDto(command),
  );

  return mapWaitingRoomEntryFromDto(response.data);
};
