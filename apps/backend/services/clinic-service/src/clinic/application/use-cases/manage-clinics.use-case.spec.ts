import { Clinic } from '../../domain/entities/clinic';
import { ClinicLocale } from '../../domain/enums/clinic-locale.enum';
import type { ClinicRepository } from '../../domain/repositories/clinic-repository.interface';
import { ClinicRecordConflictError } from '../errors/clinic.errors';
import { ManageClinicsUseCase } from './manage-clinics.use-case';

const clinic = new Clinic({
  id: '2c559690-6ef9-4f37-9586-465165c6c9ea',
  slug: 'clinora-casablanca',
  name: 'Clinora Casablanca',
  phone: null,
  email: null,
  address: null,
  timezone: 'Africa/Casablanca',
  locale: ClinicLocale.French,
  isActive: true,
  createdAt: new Date('2026-07-26T10:00:00.000Z'),
  updatedAt: new Date('2026-07-26T10:00:00.000Z'),
});

describe('ManageClinicsUseCase', () => {
  it('rejects a duplicate clinic slug before persistence', async () => {
    const repository = {
      findBySlug: jest.fn().mockResolvedValue(clinic),
      create: jest.fn(),
    } as unknown as ClinicRepository;
    const useCase = new ManageClinicsUseCase(repository);

    await expect(
      useCase.create({
        slug: 'clinora-casablanca',
        name: 'Another clinic',
      }),
    ).rejects.toBeInstanceOf(ClinicRecordConflictError);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
