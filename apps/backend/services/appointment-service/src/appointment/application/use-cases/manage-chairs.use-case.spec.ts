import { Chair } from '../../domain/entities/chair';
import { ManageChairsUseCase } from './manage-chairs.use-case';

const now = new Date('2026-08-04T08:00:00.000Z');

function chair(): Chair {
  return new Chair({
    id: 'chair-1',
    clinicId: 'clinic-1',
    name: 'Operatory 1',
    code: 'OP-1',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

describe(ManageChairsUseCase.name, () => {
  function setup() {
    const chairs = {
      create: jest.fn().mockResolvedValue(chair()),
      findById: jest.fn(),
      listByClinic: jest.fn().mockResolvedValue([chair()]),
      listActiveByClinic: jest.fn().mockResolvedValue([chair()]),
      update: jest.fn().mockResolvedValue(chair()),
    };
    const outbox = {
      add: jest.fn().mockResolvedValue(undefined),
      findUnpublished: jest.fn(),
      markPublished: jest.fn(),
    };

    return {
      useCase: new ManageChairsUseCase(chairs, outbox),
      chairs,
      outbox,
    };
  }

  it('creates a chair and writes a chair update event', async () => {
    const { useCase, chairs, outbox } = setup();

    await useCase.create({
      clinicId: 'clinic-1',
      name: 'Operatory 1',
      code: 'OP-1',
    });

    expect(chairs.create).toHaveBeenCalledWith({
      clinicId: 'clinic-1',
      name: 'Operatory 1',
      code: 'OP-1',
    });
    expect(outbox.add).toHaveBeenCalledWith({
      eventType: 'queue.chair.updated',
      payload: expect.objectContaining({
        id: 'chair-1',
        clinic_id: 'clinic-1',
        is_active: true,
      }),
    });
  });

  it('updates a chair and writes a chair update event', async () => {
    const { useCase, chairs, outbox } = setup();

    await useCase.update('clinic-1', 'chair-1', {
      isActive: false,
    });

    expect(chairs.update).toHaveBeenCalledWith('clinic-1', 'chair-1', {
      isActive: false,
    });
    expect(outbox.add).toHaveBeenCalledWith({
      eventType: 'queue.chair.updated',
      payload: expect.objectContaining({
        clinic_id: 'clinic-1',
      }),
    });
  });
});
