import { apiClient } from '@/lib/api';
import type { StaffDirectoryMember } from '../../model';
import type { ListStaffDirectoryResponseDto } from '../dto';
import { staffApiPaths } from '../staff-api-paths';

export async function listStaffDirectory(
  clinicId: string,
): Promise<StaffDirectoryMember[]> {
  const response = await apiClient.get<ListStaffDirectoryResponseDto>(
    staffApiPaths.directory(clinicId),
  );
  return (response.data.items ?? []).map(
    ({ firstName, lastName, ...member }) => ({
      ...member,
      fullName: [firstName, lastName].filter(Boolean).join(' '),
    }),
  );
}
