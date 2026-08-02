import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {
  IOutboxRepository,
  OutboxEvent,
  OutboxEventInput,
} from "../../../domain/repositories/outbox-repository.interface";
import {OutboxTypeOrmEntity} from "../entities/outbox.typeorm-entity";

@Injectable()
export class OutboxRepository implements IOutboxRepository {
  constructor(
    @InjectRepository(OutboxTypeOrmEntity)
    private readonly repo: Repository<OutboxTypeOrmEntity>,
  ) {}

  async add(event: OutboxEventInput): Promise<void> {
    await this.repo.save({
      event_type: event.eventType,
      payload: event.payload,
      published: false,
    });
  }

  async findUnpublished(limit: number): Promise<OutboxEvent[]> {
    const entities = await this.repo.find({
      where: {published: false},
      order: {created_at: "ASC"},
      take: limit,
    });
    return entities.map((e) => ({
      id: e.id,
      eventType: e.event_type,
      payload: e.payload,
      published: e.published,
      createdAt: e.created_at,
    }));
  }

  async markPublished(id: string): Promise<void> {
    await this.repo.update(id, {published: true});
  }
}
