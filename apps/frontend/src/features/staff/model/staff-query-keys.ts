export const staffQueryKeys = {
  all: ['staff'] as const,
  directory: (clinicId: string) =>
    [...staffQueryKeys.list(clinicId), 'directory'] as const,
  lists: () => [...staffQueryKeys.all, 'list'] as const,
  list: (clinicId: string) =>
    [...staffQueryKeys.lists(), { clinicId }] as const,
};
