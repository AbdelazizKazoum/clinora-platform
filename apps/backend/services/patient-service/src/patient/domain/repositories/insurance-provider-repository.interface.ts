import { InsuranceProvider } from '../entities/insurance-provider';

export interface CreateInsuranceProvider {
  clinicId: string;
  name: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateInsuranceProvider {
  name?: string;
  code?: string | null;
  isActive?: boolean;
}

export interface InsuranceProviderRepository {
  create(input: CreateInsuranceProvider): Promise<InsuranceProvider>;
  findById(clinicId: string, id: string): Promise<InsuranceProvider | null>;
  list(
    clinicId: string,
    isActive?: boolean,
    search?: string,
  ): Promise<InsuranceProvider[]>;
  update(
    clinicId: string,
    id: string,
    input: UpdateInsuranceProvider,
  ): Promise<InsuranceProvider | null>;
  delete(clinicId: string, id: string): Promise<boolean>;
  setActive(
    clinicId: string,
    id: string,
    isActive: boolean,
  ): Promise<InsuranceProvider | null>;
}
