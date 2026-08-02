export interface PatientSnapshot {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface PatientServicePort {
  getPatient(id: string, clinicId: string): Promise<PatientSnapshot>;
}
