export interface PatientInsuranceProperties {
  id: string;
  clinicId: string;
  patientId: string;
  insuranceProviderId: string;
  policyNumber: string | null;
  memberId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PatientInsurance {
  constructor(readonly properties: PatientInsuranceProperties) {}

  get id(): string {
    return this.properties.id;
  }
}
