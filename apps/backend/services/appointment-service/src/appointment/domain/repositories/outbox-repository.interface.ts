export interface OutboxEventInput {
  eventType: string;
  payload: Record<string, unknown>;
}

export interface OutboxEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  published: boolean;
  createdAt: Date;
}

export interface IOutboxRepository {
  add(event: OutboxEventInput): Promise<void>;
  findUnpublished(limit: number): Promise<OutboxEvent[]>;
  markPublished(id: string): Promise<void>;
}
