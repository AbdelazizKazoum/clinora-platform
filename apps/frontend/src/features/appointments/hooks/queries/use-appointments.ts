'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listAppointments } from '../../api';
import {
  appointmentQueryKeys,
  type ListAppointmentsQuery,
  type ListAppointmentsResult,
} from '../../model';

export const useAppointments = (
  query: ListAppointmentsQuery | null | undefined,
): UseQueryResult<ListAppointmentsResult, Error> => {
  const resolvedQuery = query ?? { clinicId: '' };

  return useQuery<ListAppointmentsResult, Error>({
    enabled: resolvedQuery.clinicId.length > 0,
    queryFn: () => listAppointments(resolvedQuery),
    queryKey: appointmentQueryKeys.list(resolvedQuery),
  });
};
