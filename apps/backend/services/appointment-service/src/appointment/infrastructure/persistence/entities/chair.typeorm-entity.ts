import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('chairs')
@Index('idx_chairs_clinic_active_name', ['clinic_id', 'is_active', 'name'])
@Index('idx_chairs_clinic_active_code', ['clinic_id', 'is_active', 'code'])
export class ChairTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', length: 36 })
  clinic_id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50, default: '' })
  code!: string;

  @Column({ name: 'is_active', default: true })
  is_active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updated_at!: Date;
}
