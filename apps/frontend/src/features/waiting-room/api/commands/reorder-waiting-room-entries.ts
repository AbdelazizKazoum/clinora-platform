import { apiClient } from '@/lib/api';

import {
  mapReorderWaitingRoomCommandToDto,
  mapWaitingRoomEntryFromDto,
  type ReorderWaitingRoomCommand,
  type WaitingRoomEntry,
} from '../../model';
import type { WaitingRoomEntriesListResponseDto } from '../dto/waiting-room-response.dto';
import { waitingRoomApiPaths } from '../waiting-room-api-paths';

export const reorderWaitingRoomEntries = async (
  command: ReorderWaitingRoomCommand,
): Promise<WaitingRoomEntry[]> => {
  const response = await apiClient.patch<WaitingRoomEntriesListResponseDto>(
    waitingRoomApiPaths.reorder(command.clinicId),
    mapReorderWaitingRoomCommandToDto(command),
  );

  return (response.data.queueEntries ?? []).map(mapWaitingRoomEntryFromDto);
};
