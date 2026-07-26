import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'working_hours' })
@Index('UQ_working_hours_clinic_day', ['clinicId', 'dayOfWeek'], {
  unique: true,
})
export class WorkingHoursTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'clinic_id', type: 'varchar', length: 36 })
  clinicId!: string;

  @Column({ name: 'day_of_week', type: 'tinyint', unsigned: true })
  dayOfWeek!: number;

  @Column({ name: 'open_time', type: 'time', nullable: true })
  openTime!: string | null;

  @Column({ name: 'close_time', type: 'time', nullable: true })
  closeTime!: string | null;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed!: boolean;
}
