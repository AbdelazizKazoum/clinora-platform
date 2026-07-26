import { InsuranceTemplate } from '../entities/insurance-template';

export interface CreateInsuranceTemplate {
  clinicId: string;
  insuranceProviderId: string;
  name: string;
  fileUrl: string;
}

export interface UpdateInsuranceTemplate {
  name?: string;
  fileUrl?: string;
}

export interface InsuranceTemplateRepository {
  create(input: CreateInsuranceTemplate): Promise<InsuranceTemplate>;
  findById(clinicId: string, id: string): Promise<InsuranceTemplate | null>;
  list(
    clinicId: string,
    providerId?: string,
    providerIds?: string[],
    search?: string,
  ): Promise<InsuranceTemplate[]>;
  update(
    clinicId: string,
    id: string,
    input: UpdateInsuranceTemplate,
  ): Promise<InsuranceTemplate | null>;
  delete(clinicId: string, id: string): Promise<boolean>;
}
