import { apiClient } from '@/lib/api';

import {
  mapCreateWaitingRoomChairCommandToDto,
  mapWaitingRoomChairFromDto,
  type CreateWaitingRoomChairCommand,
  type WaitingRoomChair,
} from '../../model';
import type { WaitingRoomChairResponseDto } from '../dto';
import { waitingRoomApiPaths } from '../waiting-room-api-paths';

export const createWaitingRoomChair = async (
  command: CreateWaitingRoomChairCommand,
): Promise<WaitingRoomChair> => {
  const response = await apiClient.post<WaitingRoomChairResponseDto>(
    waitingRoomApiPaths.chairs(command.clinicId),
    mapCreateWaitingRoomChairCommandToDto(command),
  );

  return mapWaitingRoomChairFromDto(response.data);
};
