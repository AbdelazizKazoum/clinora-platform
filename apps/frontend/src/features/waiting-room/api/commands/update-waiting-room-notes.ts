import { apiClient } from '@/lib/api';

import {
  mapUpdateWaitingRoomNotesCommandToDto,
  mapWaitingRoomEntryFromDto,
  type UpdateWaitingRoomNotesCommand,
  type WaitingRoomEntry,
} from '../../model';
import type { WaitingRoomEntryResponseDto } from '../dto';
import { waitingRoomApiPaths } from '../waiting-room-api-paths';

export const updateWaitingRoomNotes = async (
  command: UpdateWaitingRoomNotesCommand,
): Promise<WaitingRoomEntry> => {
  const response = await apiClient.patch<WaitingRoomEntryResponseDto>(
    waitingRoomApiPaths.entryNotes(command.clinicId, command.entryId),
    mapUpdateWaitingRoomNotesCommandToDto(command),
  );

  return mapWaitingRoomEntryFromDto(response.data);
};
