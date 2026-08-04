'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listWaitingRoomChairs } from '../../api';
import { waitingRoomQueryKeys, type WaitingRoomChair } from '../../model';

export const useWaitingRoomChairs = (
  clinicId: string | null | undefined,
): UseQueryResult<WaitingRoomChair[], Error> => {
  const resolvedClinicId = clinicId ?? '';

  return useQuery<WaitingRoomChair[], Error>({
    enabled: resolvedClinicId.length > 0,
    queryFn: () => listWaitingRoomChairs(resolvedClinicId),
    queryKey: waitingRoomQueryKeys.chairs(resolvedClinicId),
  });
};
