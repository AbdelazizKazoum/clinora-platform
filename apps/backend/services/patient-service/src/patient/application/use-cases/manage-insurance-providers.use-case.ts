import { Inject, Injectable } from '@nestjs/common';

import { InsuranceProvider } from '../../domain/entities/insurance-provider';
import type {
  CreateInsuranceProvider,
  InsuranceProviderRepository,
  UpdateInsuranceProvider,
} from '../../domain/repositories/insurance-provider-repository.interface';
import { INSURANCE_PROVIDER_REPOSITORY } from '../../patient.tokens';
import { PatientRecordNotFoundError } from '../errors/patient.errors';

@Injectable()
export class ManageInsuranceProvidersUseCase {
  constructor(
    @Inject(INSURANCE_PROVIDER_REPOSITORY)
    private readonly providers: InsuranceProviderRepository,
  ) {}

  create(input: CreateInsuranceProvider): Promise<InsuranceProvider> {
    return this.providers.create(input);
  }

  async get(clinicId: string, id: string): Promise<InsuranceProvider> {
    const provider = await this.providers.findById(clinicId, id);
    if (!provider) {
      throw new PatientRecordNotFoundError('Insurance provider', id);
    }
    return provider;
  }

  list(
    clinicId: string,
    isActive?: boolean,
    search?: string,
  ): Promise<InsuranceProvider[]> {
    return this.providers.list(clinicId, isActive, search);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdateInsuranceProvider,
  ): Promise<InsuranceProvider> {
    const provider = await this.providers.update(clinicId, id, input);
    if (!provider) {
      throw new PatientRecordNotFoundError('Insurance provider', id);
    }
    return provider;
  }

  async delete(clinicId: string, id: string): Promise<void> {
    if (!(await this.providers.delete(clinicId, id))) {
      throw new PatientRecordNotFoundError('Insurance provider', id);
    }
  }

  async setActive(
    clinicId: string,
    id: string,
    isActive: boolean,
  ): Promise<InsuranceProvider> {
    const provider = await this.providers.setActive(
      clinicId,
      id,
      isActive,
    );
    if (!provider) {
      throw new PatientRecordNotFoundError('Insurance provider', id);
    }
    return provider;
  }
}
