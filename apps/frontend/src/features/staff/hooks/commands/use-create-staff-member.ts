'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { createStaffMember as createStaffMemberCommand } from '../../api/commands';
import {
  staffQueryKeys,
  type CreateStaffMemberCommand,
  type StaffMember,
} from '../../model';

export const useCreateStaffMember = () => {
  const queryClient = useQueryClient();
  const pendingCommandRef = useRef<CreateStaffMemberCommand | null>(null);

  const mutation = useMutation<StaffMember, Error, void>({
    mutationFn: async () => {
      const command = pendingCommandRef.current;

      if (!command) {
        throw new Error('Create staff command is missing.');
      }

      return createStaffMemberCommand(command);
    },
    onSettled: () => {
      pendingCommandRef.current = null;
    },
    onSuccess: async (staffMember) => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.list(staffMember.clinicId),
      });
    },
  });

  const createStaffMember = useCallback(
    async (command: CreateStaffMemberCommand): Promise<StaffMember> => {
      pendingCommandRef.current = command;
      return mutation.mutateAsync();
    },
    [mutation],
  );

  return {
    createStaffMember,
    error: mutation.error,
    isPending: mutation.isPending,
    reset: mutation.reset,
  };
};
