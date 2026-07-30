import { apiClient } from '@/lib/api';

import {
  mapStaffMemberFromDto,
  type StaffMember,
  type UpdateStaffMemberCommand,
} from '../../model';
import type { StaffMemberResponseDto } from '../dto';
import { staffApiPaths } from '../staff-api-paths';

type UpdateStaffMemberRequestBody = Omit<
  UpdateStaffMemberCommand,
  'clinicId' | 'staffMemberId'
>;

export const updateStaffMember = async (
  command: UpdateStaffMemberCommand,
): Promise<StaffMember> => {
  const { clinicId, staffMemberId, ...body } = command;
  const response = await apiClient.patch<StaffMemberResponseDto>(
    staffApiPaths.staffMember(clinicId, staffMemberId),
    body satisfies UpdateStaffMemberRequestBody,
  );

  return mapStaffMemberFromDto(response.data);
};
