import type { PatientGender, PatientStatus } from './patient';

export type PatientSortField =
  | 'firstName'
  | 'lastName'
  | 'createdAt'
  | 'updatedAt';

export type PatientSortOrder = 'asc' | 'desc';

export interface ListPatientsQuery {
  clinicId: string;
  page?: number;
  limit?: number;
  status?: PatientStatus;
  gender?: PatientGender;
  search?: string;
  isNew?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: PatientSortField;
  sortOrder?: PatientSortOrder;
}

export interface GetPatientQuery {
  clinicId: string;
  patientId: string;
}
