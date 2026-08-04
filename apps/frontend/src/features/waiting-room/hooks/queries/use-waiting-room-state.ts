'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getWaitingRoomState } from '../../api';
import { waitingRoomQueryKeys, type WaitingRoomState } from '../../model';

export const useWaitingRoomState = (
  clinicId: string | null | undefined,
): UseQueryResult<WaitingRoomState, Error> => {
  const resolvedClinicId = clinicId ?? '';

  return useQuery<WaitingRoomState, Error>({
    enabled: resolvedClinicId.length > 0,
    queryFn: () => getWaitingRoomState(resolvedClinicId),
    queryKey: waitingRoomQueryKeys.state(resolvedClinicId),
  });
};
