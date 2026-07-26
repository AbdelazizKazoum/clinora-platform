import { Inject, Injectable } from '@nestjs/common';

import { PatientInsurance } from '../../domain/entities/patient-insurance';
import type {
  CreatePatientInsurance,
  PatientInsuranceRepository,
  UpdatePatientInsurance,
} from '../../domain/repositories/patient-insurance-repository.interface';
import { PATIENT_INSURANCE_REPOSITORY } from '../../patient.tokens';
import { PatientRecordNotFoundError } from '../errors/patient.errors';

@Injectable()
export class ManagePatientInsurancesUseCase {
  constructor(
    @Inject(PATIENT_INSURANCE_REPOSITORY)
    private readonly insurances: PatientInsuranceRepository,
  ) {}

  create(input: CreatePatientInsurance): Promise<PatientInsurance> {
    return this.insurances.create(input);
  }

  async get(clinicId: string, id: string): Promise<PatientInsurance> {
    const insurance = await this.insurances.findById(clinicId, id);
    if (!insurance) {
      throw new PatientRecordNotFoundError('Patient insurance', id);
    }
    return insurance;
  }

  listByPatient(
    clinicId: string,
    patientId: string,
    isActive?: boolean,
  ): Promise<PatientInsurance[]> {
    return this.insurances.listByPatient(clinicId, patientId, isActive);
  }

  listByClinic(
    clinicId: string,
    isActive?: boolean,
    providerId?: string,
  ): Promise<PatientInsurance[]> {
    return this.insurances.listByClinic(clinicId, isActive, providerId);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdatePatientInsurance,
  ): Promise<PatientInsurance> {
    const insurance = await this.insurances.update(clinicId, id, input);
    if (!insurance) {
      throw new PatientRecordNotFoundError('Patient insurance', id);
    }
    return insurance;
  }

  async delete(clinicId: string, id: string): Promise<void> {
    if (!(await this.insurances.delete(clinicId, id))) {
      throw new PatientRecordNotFoundError('Patient insurance', id);
    }
  }

  async setActive(
    clinicId: string,
    id: string,
    isActive: boolean,
  ): Promise<PatientInsurance> {
    const insurance = await this.insurances.setActive(
      clinicId,
      id,
      isActive,
    );
    if (!insurance) {
      throw new PatientRecordNotFoundError('Patient insurance', id);
    }
    return insurance;
  }

  setAllActive(
    clinicId: string,
    patientId: string,
    isActive: boolean,
  ): Promise<void> {
    return this.insurances.setAllActive(clinicId, patientId, isActive);
  }
}
