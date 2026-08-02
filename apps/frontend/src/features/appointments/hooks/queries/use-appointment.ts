'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getAppointment } from '../../api';
import {
  appointmentQueryKeys,
  type Appointment,
  type GetAppointmentQuery,
} from '../../model';

export const useAppointment = (
  query: GetAppointmentQuery | null | undefined,
): UseQueryResult<Appointment, Error> => {
  const clinicId = query?.clinicId ?? '';
  const appointmentId = query?.appointmentId ?? '';

  return useQuery<Appointment, Error>({
    enabled: clinicId.length > 0 && appointmentId.length > 0,
    queryFn: () => getAppointment({ clinicId, appointmentId }),
    queryKey: appointmentQueryKeys.detail(clinicId, appointmentId),
  });
};
