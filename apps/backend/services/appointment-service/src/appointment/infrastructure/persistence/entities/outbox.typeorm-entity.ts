import {Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn} from "typeorm";

@Entity("outbox")
@Index("idx_outbox_unpublished", ["published", "created_at"])
export class OutboxTypeOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({name: "event_type", length: 100})
  event_type!: string;

  @Column({type: "json"})
  payload!: Record<string, unknown>;

  @Column({default: false})
  published!: boolean;

  @CreateDateColumn({name: "created_at"})
  created_at!: Date;
}
