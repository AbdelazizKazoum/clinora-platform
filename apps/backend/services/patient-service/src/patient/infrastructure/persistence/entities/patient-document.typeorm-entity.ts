import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

import { DocumentType } from '../../../domain/enums/document-type.enum';

@Entity({ name: 'patient_documents' })
@Index('IDX_patient_documents_clinic_patient', ['clinicId', 'patientId'])
export class PatientDocumentTypeOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'clinic_id', type: 'varchar', length: 36 })
  clinicId!: string;

  @Column({ name: 'patient_id', type: 'varchar', length: 36 })
  patientId!: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.General,
  })
  type!: DocumentType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
