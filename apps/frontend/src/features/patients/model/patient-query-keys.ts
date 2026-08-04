import type { ListPatientsQuery } from './patient.queries';

const dateKey = (value: Date | undefined): string | undefined =>
  value?.toISOString();

export const patientQueryKeys = {
  all: ['patients'] as const,
  clinics: () => [...patientQueryKeys.all, 'clinic'] as const,
  clinic: (clinicId: string) =>
    [...patientQueryKeys.clinics(), { clinicId }] as const,
  lists: (clinicId: string) =>
    [...patientQueryKeys.clinic(clinicId), 'list'] as const,
  list: (query: ListPatientsQuery) =>
    [
      ...patientQueryKeys.lists(query.clinicId),
      {
        createdFrom: dateKey(query.createdFrom),
        createdTo: dateKey(query.createdTo),
        gender: query.gender,
        isNew: query.isNew,
        limit: query.limit,
        page: query.page,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.status,
      },
    ] as const,
};
