'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listPatients } from '../../api';
import {
  patientQueryKeys,
  type ListPatientsQuery,
  type Patient,
} from '../../model';

const patientSearchLimit = 8;
const patientSearchMinimumLength = 2;

export const usePatientSearch = (
  clinicId: string | null | undefined,
  keyword: string,
): UseQueryResult<Patient[], Error> => {
  const normalizedKeyword = keyword.trim();
  const query: ListPatientsQuery = {
    clinicId: clinicId ?? '',
    limit: patientSearchLimit,
    page: 1,
    search: normalizedKeyword || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: 'ACTIVE',
  };

  return useQuery<Patient[], Error>({
    enabled:
      query.clinicId.length > 0 &&
      normalizedKeyword.length >= patientSearchMinimumLength,
    queryFn: async () => (await listPatients(query)).patients,
    queryKey: patientQueryKeys.list(query),
    staleTime: 30_000,
  });
};
