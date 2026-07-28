import { apiClient } from '@/lib/api';
import {
  mapCreatePatientCommandToDto,
  mapPatientFromDto,
  type CreatePatientCommand,
  type Patient,
} from '../../model';
import type { PatientResponseDto } from '../dto';
import { patientApiPaths } from '../patient-api-paths';

export const createPatient = async (
  command: CreatePatientCommand,
): Promise<Patient> => {
  const response = await apiClient.post<PatientResponseDto>(
    patientApiPaths.patients(command.clinicId),
    mapCreatePatientCommandToDto(command),
  );

  return mapPatientFromDto(response.data);
};
