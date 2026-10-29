'use client';

import { useQuery } from '@tanstack/react-query';
import { listStaffDirectory } from '../../api/queries/list-staff-directory';
import { staffQueryKeys } from '../../model';

export function useStaffDirectory(clinicId: string | null | undefined) {
  const resolvedClinicId = clinicId ?? '';
  return useQuery({
    enabled: resolvedClinicId.length > 0,
    queryFn: () => listStaffDirectory(resolvedClinicId),
    queryKey: staffQueryKeys.directory(resolvedClinicId),
  });
}
