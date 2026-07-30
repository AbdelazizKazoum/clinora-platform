'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listStaffMembers } from '../../api/queries';
import {
  staffQueryKeys,
  type ListStaffMembersResult,
  type StaffMember,
} from '../../model';

export const useStaffMembers = (
  clinicId: string | null | undefined,
): UseQueryResult<ListStaffMembersResult, Error> => {
  const resolvedClinicId = clinicId ?? '';

  return useQuery<StaffMember[], Error>({
    enabled: resolvedClinicId.length > 0,
    queryFn: () => listStaffMembers({ clinicId: resolvedClinicId }),
    queryKey: staffQueryKeys.list(resolvedClinicId),
  });
};
