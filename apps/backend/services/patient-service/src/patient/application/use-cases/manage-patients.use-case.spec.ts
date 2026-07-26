import type { PatientRepository } from '../../domain/repositories/patient-repository.interface';
import { Patient } from '../../domain/entities/patient';
import { PatientStatus } from '../../domain/enums/patient-status.enum';
import { PatientRecordNotFoundError } from '../errors/patient.errors';
import { ManagePatientsUseCase } from './manage-patients.use-case';

describe(ManagePatientsUseCase.name, () => {
  const clinicId = '00000000-0000-4000-8000-000000000001';
  const patientId = '00000000-0000-4000-8000-000000000002';
  const patient = new Patient({
    id: patientId,
    clinicId,
    firstName: 'Nora',
    lastName: 'Patient',
    status: PatientStatus.Active,
    createdAt: new Date('2026-07-26T00:00:00.000Z'),
    updatedAt: new Date('2026-07-26T00:00:00.000Z'),
    userId: null,
    phone: null,
    email: null,
    dateOfBirth: null,
    gender: null,
    address: null,
    notes: null,
    allergies: null,
    chronicConditions: null,
    currentMedications: null,
    medicalNotes: null,
    deletedAt: null,
  });
  const repository: jest.Mocked<PatientRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    list: jest.fn(),
    searchByName: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('always scopes patient lookup to a clinic', async () => {
    repository.findById.mockResolvedValue(patient);

    const result = await new ManagePatientsUseCase(repository).get(
      clinicId,
      patientId,
    );

    expect(repository.findById).toHaveBeenCalledWith(clinicId, patientId);
    expect(result).toBe(patient);
  });

  it('reports a missing tenant-owned patient explicitly', async () => {
    repository.findById.mockResolvedValue(null);

    const result = new ManagePatientsUseCase(repository).get(
      clinicId,
      patientId,
    );

    await expect(result).rejects.toBeInstanceOf(
      PatientRecordNotFoundError,
    );
  });

  it('returns the updated patient from the repository', async () => {
    repository.update.mockResolvedValue(patient);

    const result = await new ManagePatientsUseCase(repository).update(
      clinicId,
      patientId,
      { firstName: 'Updated' },
    );

    expect(repository.update).toHaveBeenCalledWith(clinicId, patientId, {
      firstName: 'Updated',
    });
    expect(result).toBe(patient);
  });

  it('does not report success when deletion affects no patient', async () => {
    repository.delete.mockResolvedValue(false);

    const result = new ManagePatientsUseCase(repository).delete(
      clinicId,
      patientId,
    );

    await expect(result).rejects.toBeInstanceOf(
      PatientRecordNotFoundError,
    );
  });
});
