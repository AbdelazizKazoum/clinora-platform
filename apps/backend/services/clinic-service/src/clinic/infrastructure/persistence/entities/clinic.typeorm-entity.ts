import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ClinicLocale } from '../../../domain/enums/clinic-locale.enum';

@Entity({ name: 'clinics' })
@Index('UQ_clinics_slug', ['slug'], { unique: true })
export class ClinicTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'Africa/Casablanca',
  })
  timezone!: string;

  @Column({
    type: 'enum',
    enum: ClinicLocale,
    default: ClinicLocale.French,
  })
  locale!: ClinicLocale;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
