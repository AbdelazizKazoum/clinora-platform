import { Inject, Injectable } from '@nestjs/common';

import { InsuranceTemplate } from '../../domain/entities/insurance-template';
import type {
  CreateInsuranceTemplate,
  InsuranceTemplateRepository,
  UpdateInsuranceTemplate,
} from '../../domain/repositories/insurance-template-repository.interface';
import { INSURANCE_TEMPLATE_REPOSITORY } from '../../patient.tokens';
import { PatientRecordNotFoundError } from '../errors/patient.errors';

@Injectable()
export class ManageInsuranceTemplatesUseCase {
  constructor(
    @Inject(INSURANCE_TEMPLATE_REPOSITORY)
    private readonly templates: InsuranceTemplateRepository,
  ) {}

  create(input: CreateInsuranceTemplate): Promise<InsuranceTemplate> {
    return this.templates.create(input);
  }

  async get(clinicId: string, id: string): Promise<InsuranceTemplate> {
    const template = await this.templates.findById(clinicId, id);
    if (!template) {
      throw new PatientRecordNotFoundError('Insurance template', id);
    }
    return template;
  }

  list(
    clinicId: string,
    providerId?: string,
    providerIds?: string[],
    search?: string,
  ): Promise<InsuranceTemplate[]> {
    return this.templates.list(
      clinicId,
      providerId,
      providerIds,
      search,
    );
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdateInsuranceTemplate,
  ): Promise<InsuranceTemplate> {
    const template = await this.templates.update(clinicId, id, input);
    if (!template) {
      throw new PatientRecordNotFoundError('Insurance template', id);
    }
    return template;
  }

  async delete(clinicId: string, id: string): Promise<void> {
    if (!(await this.templates.delete(clinicId, id))) {
      throw new PatientRecordNotFoundError('Insurance template', id);
    }
  }
}
