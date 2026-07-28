import { apiClient } from '@/lib/api';
import {
  mapListPatientsQueryToDto,
  mapPatientListItemFromDto,
  type ListPatientsQuery,
  type Patient,
} from '../../model';
import type { ListPatientsResponseDto } from '../dto';
import { patientApiPaths } from '../patient-api-paths';

export const listPatients = async (
  query: ListPatientsQuery,
): Promise<Patient[]> => {
  const response = await apiClient.get<ListPatientsResponseDto>(
    patientApiPaths.patients(query.clinicId),
    {
      params: mapListPatientsQueryToDto(query),
    },
  );

  return response.data.items.map(mapPatientListItemFromDto);
};
