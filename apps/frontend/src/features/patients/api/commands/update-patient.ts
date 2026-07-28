import { apiClient } from '@/lib/api';
import {
  mapPatientFromDto,
  mapUpdatePatientCommandToDto,
  type Patient,
  type UpdatePatientCommand,
} from '../../model';
import type { PatientResponseDto } from '../dto';
import { patientApiPaths } from '../patient-api-paths';

export const updatePatient = async (
  command: UpdatePatientCommand,
): Promise<Patient> => {
  const response = await apiClient.put<PatientResponseDto>(
    patientApiPaths.patient(command.clinicId, command.patientId),
    mapUpdatePatientCommandToDto(command),
  );

  return mapPatientFromDto(response.data);
};
