const encodePathPart = (value: string): string => encodeURIComponent(value);

export const patientApiPaths = {
  patients: (clinicId: string): string =>
    `/clinics/${encodePathPart(clinicId)}/patients`,
  patient: (clinicId: string, patientId: string): string =>
    `${patientApiPaths.patients(clinicId)}/${encodePathPart(patientId)}`,
  softDeletePatient: (clinicId: string, patientId: string): string =>
    `${patientApiPaths.patient(clinicId, patientId)}/soft-delete`,
  restorePatient: (clinicId: string, patientId: string): string =>
    `${patientApiPaths.patient(clinicId, patientId)}/restore`,
};
