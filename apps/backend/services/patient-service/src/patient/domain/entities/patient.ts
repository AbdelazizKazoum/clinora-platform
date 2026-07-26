import { PatientGender } from '../enums/patient-gender.enum';
import { PatientStatus } from '../enums/patient-status.enum';

export interface PatientProperties {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  status: PatientStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: Date | null;
  gender: PatientGender | null;
  address: string | null;
  notes: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  medicalNotes: string | null;
  deletedAt: Date | null;
}

export class Patient {
  constructor(readonly properties: PatientProperties) {}

  get id(): string {
    return this.properties.id;
  }

  get clinicId(): string {
    return this.properties.clinicId;
  }

  get fullName(): string {
    return `${this.properties.firstName} ${this.properties.lastName}`;
  }
}
