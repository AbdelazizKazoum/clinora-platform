import { WorkingHours } from '../../../domain/entities/working-hours';
import { WorkingHoursTypeOrmEntity } from '../entities/working-hours.typeorm-entity';

export class WorkingHoursMapper {
  static toDomain(entity: WorkingHoursTypeOrmEntity): WorkingHours {
    return new WorkingHours({
      id: entity.id,
      clinicId: entity.clinicId,
      dayOfWeek: entity.dayOfWeek,
      openTime: entity.openTime,
      closeTime: entity.closeTime,
      isClosed: entity.isClosed,
    });
  }
}
