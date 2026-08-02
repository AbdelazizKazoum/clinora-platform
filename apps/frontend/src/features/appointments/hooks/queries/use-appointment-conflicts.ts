'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { checkAppointmentConflicts } from '../../api';
import {
  appointmentQueryKeys,
  type CheckAppointmentConflictsQuery,
  type ConflictResult,
} from '../../model';

export const useAppointmentConflicts = (
  query: CheckAppointmentConflictsQuery | null | undefined,
): UseQueryResult<ConflictResult, Error> => {
  const resolvedQuery =
    query ??
    ({
      clinicId: '',
      doctorId: '',
      endAt: new Date(0),
      startAt: new Date(0),
    } satisfies CheckAppointmentConflictsQuery);

  return useQuery<ConflictResult, Error>({
    enabled:
      resolvedQuery.clinicId.length > 0 &&
      resolvedQuery.doctorId.length > 0 &&
      resolvedQuery.startAt.getTime() > 0 &&
      resolvedQuery.endAt.getTime() > 0,
    queryFn: () => checkAppointmentConflicts(resolvedQuery),
    queryKey: appointmentQueryKeys.conflict(resolvedQuery),
  });
};
