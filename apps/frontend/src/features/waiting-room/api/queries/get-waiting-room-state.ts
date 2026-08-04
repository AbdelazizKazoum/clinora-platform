import { apiClient } from '@/lib/api';

import { mapWaitingRoomStateFromDto, type WaitingRoomState } from '../../model';
import type { WaitingRoomStateResponseDto } from '../dto';
import { waitingRoomApiPaths } from '../waiting-room-api-paths';

export const getWaitingRoomState = async (
  clinicId: string,
): Promise<WaitingRoomState> => {
  const response = await apiClient.get<WaitingRoomStateResponseDto>(
    waitingRoomApiPaths.state(clinicId),
  );

  return mapWaitingRoomStateFromDto(response.data);
};
