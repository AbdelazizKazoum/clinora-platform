export const staffQueryKeys = {
  all: ['staff'] as const,
  lists: () => [...staffQueryKeys.all, 'list'] as const,
  list: (clinicId: string) =>
    [...staffQueryKeys.lists(), { clinicId }] as const,
};
