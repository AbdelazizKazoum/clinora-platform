import { Inject, Injectable } from '@nestjs/common';

import type {
  CreatePatient,
  ListPatients,
  PatientListResult,
  PatientRepository,
  UpdatePatient,
} from '../../domain/repositories/patient-repository.interface';
import { Patient } from '../../domain/entities/patient';
import { PATIENT_REPOSITORY } from '../../patient.tokens';
import { PatientRecordNotFoundError } from '../errors/patient.errors';

@Injectable()
export class ManagePatientsUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patients: PatientRepository,
  ) {}

  create(input: CreatePatient): Promise<Patient> {
    return this.patients.create(input);
  }

  async get(clinicId: string, id: string): Promise<Patient> {
    const patient = await this.patients.findById(clinicId, id);
    if (!patient) {
      throw new PatientRecordNotFoundError('Patient', id);
    }
    return patient;
  }

  async getByUserId(clinicId: string, userId: string): Promise<Patient> {
    const patient = await this.patients.findByUserId(clinicId, userId);
    if (!patient) {
      throw new PatientRecordNotFoundError('Patient for user', userId);
    }
    return patient;
  }

  list(query: ListPatients): Promise<PatientListResult> {
    return this.patients.list(query);
  }

  searchByName(
    clinicId: string,
    firstName?: string,
    lastName?: string,
  ): Promise<Patient[]> {
    return this.patients.searchByName(clinicId, firstName, lastName);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdatePatient,
  ): Promise<Patient> {
    const patient = await this.patients.update(clinicId, id, input);
    if (!patient) {
      throw new PatientRecordNotFoundError('Patient', id);
    }
    return patient;
  }

  async delete(clinicId: string, id: string): Promise<void> {
    if (!(await this.patients.delete(clinicId, id))) {
      throw new PatientRecordNotFoundError('Patient', id);
    }
  }

  async softDelete(clinicId: string, id: string): Promise<void> {
    if (!(await this.patients.softDelete(clinicId, id))) {
      throw new PatientRecordNotFoundError('Patient', id);
    }
  }

  async restore(clinicId: string, id: string): Promise<Patient> {
    const patient = await this.patients.restore(clinicId, id);
    if (!patient) {
      throw new PatientRecordNotFoundError('Patient', id);
    }
    return patient;
  }
}
