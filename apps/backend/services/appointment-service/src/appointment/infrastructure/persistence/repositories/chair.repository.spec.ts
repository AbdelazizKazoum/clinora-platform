import { BadRequestException, ConflictException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { ChairTypeOrmEntity } from '../entities/chair.typeorm-entity';
import { ChairRepository } from './chair.repository';

const clinicId = '00000000-0000-4000-8000-000000000001';
const chairId = '00000000-0000-4000-8000-0000000000c1';

function createChairEntity(
  overrides: Partial<ChairTypeOrmEntity> = {},
): ChairTypeOrmEntity {
  const entity = new ChairTypeOrmEntity();
  entity.id = chairId;
  entity.clinic_id = clinicId;
  entity.name = 'Chair 1';
  entity.code = 'CH-1';
  entity.is_active = true;
  entity.created_at = new Date('2026-08-04T08:00:00.000Z');
  entity.updated_at = new Date('2026-08-04T08:00:00.000Z');

  return Object.assign(entity, overrides);
}

describe(ChairRepository.name, () => {
  const queryBuilder = {
    where: jest.fn(),
    andWhere: jest.fn(),
    getCount: jest.fn(),
  };
  const ormRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let chairs: ChairRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    queryBuilder.where.mockReturnThis();
    queryBuilder.andWhere.mockReturnThis();
    queryBuilder.getCount.mockResolvedValue(0);
    ormRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    ormRepository.save.mockImplementation(
      async (entity: Partial<ChairTypeOrmEntity>) =>
        createChairEntity({
          id: entity.id ?? chairId,
          clinic_id: entity.clinic_id ?? clinicId,
          name: entity.name ?? 'Chair 1',
          code: entity.code ?? '',
          is_active: entity.is_active ?? true,
        }),
    );
    chairs = new ChairRepository(
      ormRepository as unknown as Repository<ChairTypeOrmEntity>,
    );
  });

  it('creates an active clinic-scoped chair with normalized display fields', async () => {
    const chair = await chairs.create({
      clinicId,
      name: ' Chair 1 ',
      code: ' CH-1 ',
    });

    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('chair');
    expect(ormRepository.save).toHaveBeenCalledWith({
      clinic_id: clinicId,
      name: 'Chair 1',
      code: 'CH-1',
      is_active: true,
    });
    expect(chair.properties).toMatchObject({
      clinicId,
      name: 'Chair 1',
      code: 'CH-1',
      isActive: true,
    });
    expect(chair.isAssignable).toBe(true);
  });

  it('rejects active duplicate chair names or codes in the same clinic', async () => {
    queryBuilder.getCount.mockResolvedValueOnce(1);

    await expect(
      chairs.create({
        clinicId,
        name: 'Chair 1',
        code: 'CH-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(ormRepository.save).not.toHaveBeenCalled();
  });

  it('allows inactive chairs to retain duplicate historical names', async () => {
    await chairs.create({
      clinicId,
      name: 'Chair 1',
      code: 'CH-1',
      isActive: false,
    });

    expect(ormRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
  });

  it('lists active chairs separately for assignable chair selection', async () => {
    ormRepository.find.mockResolvedValue([
      createChairEntity({ name: 'Chair 2', code: '' }),
    ]);

    const activeChairs = await chairs.listActiveByClinic(clinicId);

    expect(ormRepository.find).toHaveBeenCalledWith({
      where: { clinic_id: clinicId, is_active: true },
      order: { name: 'ASC', code: 'ASC' },
    });
    expect(activeChairs).toHaveLength(1);
    expect(activeChairs[0].isAssignable).toBe(true);
  });

  it('keeps deactivated chairs stored but excludes them from active lists', async () => {
    ormRepository.findOne.mockResolvedValue(createChairEntity());
    ormRepository.save.mockImplementation(
      async (entity: ChairTypeOrmEntity) => entity,
    );

    const chair = await chairs.update(clinicId, chairId, {
      isActive: false,
    });

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
    expect(chair.isAssignable).toBe(false);
  });

  it('requires a non-empty chair name', async () => {
    await expect(
      chairs.create({
        clinicId,
        name: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(ormRepository.save).not.toHaveBeenCalled();
  });
});
