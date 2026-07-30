import { apiClient } from '@/lib/api';

import {
  mapStaffMemberFromDto,
  type ListStaffMembersQuery,
  type ListStaffMembersResult,
} from '../../model';
import type { ListStaffMembersResponseDto } from '../dto';
import { staffApiPaths } from '../staff-api-paths';

export const listStaffMembers = async (
  query: ListStaffMembersQuery,
): Promise<ListStaffMembersResult> => {
  const response = await apiClient.get<ListStaffMembersResponseDto>(
    staffApiPaths.staffMembers(query.clinicId),
  );

  return response.data.items.map(mapStaffMemberFromDto);
};
