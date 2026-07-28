import type { PatientGender, PatientStatus } from '../../model/patient';
import type {
  PatientSortField,
  PatientSortOrder,
} from '../../model/patient.queries';

export interface ListPatientsQueryDto {
  page?: number;
  limit?: number;
  status?: PatientStatus;
  gender?: PatientGender;
  search?: string;
  isNew?: boolean;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: PatientSortField;
  sortOrder?: PatientSortOrder;
}
