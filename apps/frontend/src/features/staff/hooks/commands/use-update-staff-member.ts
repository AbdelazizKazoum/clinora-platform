'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateStaffMember as updateStaffMemberCommand } from '../../api/commands';
import {
  staffQueryKeys,
  type StaffMember,
  type UpdateStaffMemberCommand,
} from '../../model';

export const useUpdateStaffMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<StaffMember, Error, UpdateStaffMemberCommand>({
    mutationFn: updateStaffMemberCommand,
    onSuccess: async (staffMember) => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.list(staffMember.clinicId),
      });
    },
  });

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
    updateStaffMember: mutation.mutateAsync,
  };
};
