import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { StaffRole } from '../../../domain/enums/staff-role.enum';
import { StaffStatus } from '../../../domain/enums/staff-status.enum';

@Entity({ name: 'staff_members' })
@Index('UQ_staff_members_clinic_user', ['clinicId', 'userId'], {
  unique: true,
})
@Index('UQ_staff_members_clinic_email', ['clinicId', 'email'], {
  unique: true,
})
@Index('IDX_staff_members_clinic_status', ['clinicId', 'status'])
export class StaffMemberTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'clinic_id', type: 'varchar', length: 36 })
  clinicId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'enum', enum: StaffRole })
  role!: StaffRole;

  @Column({
    type: 'enum',
    enum: StaffStatus,
    default: StaffStatus.Active,
  })
  status!: StaffStatus;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
