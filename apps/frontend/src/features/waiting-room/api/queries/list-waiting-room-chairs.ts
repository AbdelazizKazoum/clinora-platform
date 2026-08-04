import { apiClient } from '@/lib/api';

import {
  mapWaitingRoomChairsListFromDto,
  type WaitingRoomChair,
} from '../../model';
import type { WaitingRoomChairsListResponseDto } from '../dto';
import { waitingRoomApiPaths } from '../waiting-room-api-paths';

export const listWaitingRoomChairs = async (
  clinicId: string,
): Promise<WaitingRoomChair[]> => {
  const response = await apiClient.get<WaitingRoomChairsListResponseDto>(
    waitingRoomApiPaths.chairs(clinicId),
  );

  return mapWaitingRoomChairsListFromDto(response.data);
};
