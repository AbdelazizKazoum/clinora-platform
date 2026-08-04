import { apiClient } from '@/lib/api';

import {
  mapUpdateWaitingRoomStatusCommandToDto,
  mapWaitingRoomEntryFromDto,
  type UpdateWaitingRoomStatusCommand,
  type WaitingRoomEntry,
} from '../../model';
import type { WaitingRoomEntryResponseDto } from '../dto';
import { waitingRoomApiPaths } from '../waiting-room-api-paths';

export const updateWaitingRoomStatus = async (
  command: UpdateWaitingRoomStatusCommand,
): Promise<WaitingRoomEntry> => {
  const response = await apiClient.patch<WaitingRoomEntryResponseDto>(
    waitingRoomApiPaths.entryStatus(command.clinicId, command.entryId),
    mapUpdateWaitingRoomStatusCommandToDto(command),
  );

  return mapWaitingRoomEntryFromDto(response.data);
};
