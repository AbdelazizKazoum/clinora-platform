import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PatientGender } from '../../../domain/enums/patient-gender.enum';
import { PatientStatus } from '../../../domain/enums/patient-status.enum';

@Entity({ name: 'patients' })
@Index('IDX_patients_clinic_id_id', ['clinicId', 'id'], { unique: true })
@Index('IDX_patients_clinic_name', ['clinicId', 'lastName', 'firstName'])
@Index('IDX_patients_clinic_status', ['clinicId', 'status'])
@Index('UQ_patients_clinic_user', ['clinicId', 'userId'], { unique: true })
export class PatientTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'clinic_id', type: 'varchar', length: 36 })
  clinicId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36, nullable: true })
  userId!: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'enum', enum: PatientGender, nullable: true })
  gender!: PatientGender | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'text', nullable: true })
  allergies!: string | null;

  @Column({ name: 'chronic_conditions', type: 'text', nullable: true })
  chronicConditions!: string | null;

  @Column({ name: 'current_medications', type: 'text', nullable: true })
  currentMedications!: string | null;

  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medicalNotes!: string | null;

  @Column({
    type: 'enum',
    enum: PatientStatus,
    default: PatientStatus.Active,
  })
  status!: PatientStatus;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
