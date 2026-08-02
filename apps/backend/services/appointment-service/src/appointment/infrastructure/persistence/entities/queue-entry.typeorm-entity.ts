import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import {QueuePriority} from "../../../domain/enums/queue-priority.enum";
import {QueueStatus} from "../../../domain/enums/queue-status.enum";
import {AppointmentTypeOrmEntity} from "./appointment.typeorm-entity";

@Entity("queue_entries")
@Unique("uq_queue_appointment", ["appointment_id"])
@Index("idx_queue_clinic_waiting_room", [
  "clinic_id",
  "status",
  "priority",
  "arrived_at",
])
@Index("idx_queue_clinic_doctor", [
  "clinic_id",
  "doctor_id",
  "status",
  "priority",
])
@Index("idx_queue_clinic_date", ["clinic_id", "arrived_at"])
export class QueueEntryTypeOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({name: "clinic_id", length: 36})
  clinic_id!: string;

  @Column({name: "appointment_id", length: 36})
  appointment_id!: string;

  @ManyToOne(() => AppointmentTypeOrmEntity, {onDelete: "CASCADE"})
  @JoinColumn({name: "appointment_id"})
  appointment!: AppointmentTypeOrmEntity;

  @Column({name: "patient_id", length: 36})
  patient_id!: string;

  @Column({name: "patient_name", length: 255})
  patient_name!: string;

  @Column({name: "patient_phone", length: 30, nullable: true, type: "varchar"})
  patient_phone!: string | null;

  @Column({name: "doctor_id", length: 36})
  doctor_id!: string;

  @Column({name: "doctor_name", length: 255})
  doctor_name!: string;

  @Column({
    name: "appointment_type",
    length: 100,
    nullable: true,
    type: "varchar",
  })
  appointment_type!: string | null;

  @Column({type: "enum", enum: QueueStatus, default: QueueStatus.ARRIVED})
  status!: QueueStatus;

  @Column({type: "enum", enum: QueuePriority, default: QueuePriority.NORMAL})
  priority!: QueuePriority;

  @Column({name: "queue_notes", type: "text", nullable: true})
  queue_notes!: string | null;

  @Column({name: "arrived_at", type: "datetime"})
  arrived_at!: Date;

  @Column({name: "called_at", type: "datetime", nullable: true})
  called_at!: Date | null;

  @Column({name: "seated_at", type: "datetime", nullable: true})
  seated_at!: Date | null;

  @Column({name: "completed_at", type: "datetime", nullable: true})
  completed_at!: Date | null;

  @UpdateDateColumn({name: "updated_at"})
  updated_at!: Date;
}
