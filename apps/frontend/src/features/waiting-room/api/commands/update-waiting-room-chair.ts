import { apiClient } from '@/lib/api';

import {
  mapUpdateWaitingRoomChairCommandToDto,
  mapWaitingRoomChairFromDto,
  type UpdateWaitingRoomChairCommand,
  type WaitingRoomChair,
} from '../../model';
import type { WaitingRoomChairResponseDto } from '../dto';
import { waitingRoomApiPaths } from '../waiting-room-api-paths';

export const updateWaitingRoomChair = async (
  command: UpdateWaitingRoomChairCommand,
): Promise<WaitingRoomChair> => {
  const response = await apiClient.patch<WaitingRoomChairResponseDto>(
    waitingRoomApiPaths.chair(command.clinicId, command.chairId),
    mapUpdateWaitingRoomChairCommandToDto(command),
  );

  return mapWaitingRoomChairFromDto(response.data);
};
