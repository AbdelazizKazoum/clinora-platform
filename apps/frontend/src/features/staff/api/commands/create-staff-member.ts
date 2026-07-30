import { apiClient } from '@/lib/api';

import {
  mapStaffMemberFromDto,
  type CreateStaffMemberCommand,
  type StaffMember,
} from '../../model';
import type { StaffMemberResponseDto } from '../dto';
import { staffApiPaths } from '../staff-api-paths';

type CreateStaffMemberRequestBody = Omit<
  CreateStaffMemberCommand,
  'clinicId'
>;

export const createStaffMember = async (
  command: CreateStaffMemberCommand,
): Promise<StaffMember> => {
  const { clinicId, ...body } = command;
  const response = await apiClient.post<StaffMemberResponseDto>(
    staffApiPaths.staffMembers(clinicId),
    body satisfies CreateStaffMemberRequestBody,
  );

  return mapStaffMemberFromDto(response.data);
};
