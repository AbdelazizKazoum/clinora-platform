import type { ClinicRepository } from '../../domain/repositories/clinic-repository.interface';
import type { WorkingHoursRepository } from '../../domain/repositories/working-hours-repository.interface';
import { ClinicValidationError } from '../errors/clinic.errors';
import { ManageWorkingHoursUseCase } from './manage-working-hours.use-case';

describe('ManageWorkingHoursUseCase', () => {
  const clinics = {
    findById: jest.fn().mockResolvedValue({ id: 'clinic-id' }),
  } as unknown as ClinicRepository;
  const hours = {
    upsert: jest.fn().mockResolvedValue([]),
    list: jest.fn().mockResolvedValue([]),
  } as unknown as WorkingHoursRepository;

  beforeEach(() => jest.clearAllMocks());

  it('rejects duplicate weekdays', async () => {
    const useCase = new ManageWorkingHoursUseCase(clinics, hours);

    await expect(
      useCase.upsert('clinic-id', [
        {
          dayOfWeek: 1,
          openTime: '09:00',
          closeTime: '17:00',
          isClosed: false,
        },
        { dayOfWeek: 1, isClosed: true },
      ]),
    ).rejects.toBeInstanceOf(ClinicValidationError);
    expect(hours.upsert).not.toHaveBeenCalled();
  });

  it('rejects closing times that are not after opening times', async () => {
    const useCase = new ManageWorkingHoursUseCase(clinics, hours);

    await expect(
      useCase.upsert('clinic-id', [
        {
          dayOfWeek: 2,
          openTime: '18:00',
          closeTime: '08:00',
          isClosed: false,
        },
      ]),
    ).rejects.toBeInstanceOf(ClinicValidationError);
  });
});
