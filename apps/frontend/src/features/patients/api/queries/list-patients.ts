import { apiClient } from '@/lib/api';
import {
  mapListPatientsQueryToDto,
  mapPatientListItemFromDto,
  type ListPatientsQuery,
  type ListPatientsResult,
} from '../../model';
import type { ListPatientsResponseDto } from '../dto';
import { patientApiPaths } from '../patient-api-paths';

export const listPatients = async (
  query: ListPatientsQuery,
): Promise<ListPatientsResult> => {
  const response = await apiClient.get<ListPatientsResponseDto>(
    patientApiPaths.patients(query.clinicId),
    {
      params: mapListPatientsQueryToDto(query),
    },
  );

  return {
    patients: (response.data.items ?? []).map(mapPatientListItemFromDto),
    meta: response.data.meta,
  };
};
