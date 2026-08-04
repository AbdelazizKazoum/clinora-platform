import {
  Injectable,
  Logger,
  type MessageEvent,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, type NatsConnection, type Subscription } from 'nats';
import { Observable, Subject } from 'rxjs';

const QUEUE_SUBJECTS = [
  'queue.checked_in',
  'queue.status.updated',
  'queue.notes.updated',
  'queue.reordered',
  'queue.chair.assigned',
  'queue.chair.updated',
] as const;

type QueueSubject = (typeof QUEUE_SUBJECTS)[number];

interface QueueEventPayload {
  clinic_id?: string;
  [key: string]: unknown;
}

interface QueueStreamEvent {
  type: QueueSubject;
  clinic_id: string;
  entry?: Record<string, unknown>;
  entries?: Record<string, unknown>[];
  chair?: Record<string, unknown>;
  status?: unknown;
}

@Injectable()
export class QueueEventBroadcaster implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueEventBroadcaster.name);
  private connection?: NatsConnection;
  private readonly subscriptions: Subscription[] = [];
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const servers = this.config.get<string>('NATS_URL');
    if (!servers) {
      this.logger.warn('NATS_URL not set; SSE queue events disabled');
      return;
    }

    try {
      this.connection = await connect({ servers });
      for (const subject of QUEUE_SUBJECTS) {
        const subscription = this.connection.subscribe(subject);
        this.subscriptions.push(subscription);
        void this.drain(subscription, subject);
      }
      this.logger.log('Subscribed to NATS queue subjects');
    } catch (error) {
      this.logger.error(`NATS connect failed: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    if (this.connection) await this.connection.drain();
    this.streams.forEach((stream) => stream.complete());
    this.streams.clear();
  }

  getStream(clinicId: string): Observable<MessageEvent> {
    let stream = this.streams.get(clinicId);
    if (!stream) {
      stream = new Subject<MessageEvent>();
      this.streams.set(clinicId, stream);
    }
    return stream.asObservable();
  }

  private async drain(
    subscription: Subscription,
    subject: QueueSubject,
  ): Promise<void> {
    for await (const message of subscription) {
      try {
        const payload = JSON.parse(
          new TextDecoder().decode(message.data),
        ) as QueueEventPayload;
        const clinicId = payload.clinic_id;
        if (!clinicId) continue;

        const stream = this.streams.get(clinicId);
        if (!stream) continue;

        stream.next({
          data: JSON.stringify(this.toStreamEvent(subject, clinicId, payload)),
        });
      } catch (error) {
        this.logger.error(
          `Failed to parse NATS message on ${subject}: ${
            (error as Error).message
          }`,
        );
      }
    }
  }

  private toStreamEvent(
    subject: QueueSubject,
    clinicId: string,
    payload: QueueEventPayload,
  ): QueueStreamEvent {
    if (
      subject === 'queue.checked_in' ||
      subject === 'queue.status.updated' ||
      subject === 'queue.notes.updated'
    ) {
      return {
        type: subject,
        clinic_id: clinicId,
        entry: payload,
      };
    }

    if (subject === 'queue.reordered') {
      return {
        type: subject,
        clinic_id: clinicId,
        status: payload['status'],
        entries: Array.isArray(payload['entries'])
          ? payload['entries'].filter(this.isRecord)
          : [],
      };
    }

    if (subject === 'queue.chair.assigned') {
      return {
        type: subject,
        clinic_id: clinicId,
        entry: this.isRecord(payload['entry']) ? payload['entry'] : undefined,
        chair: this.isRecord(payload['chair']) ? payload['chair'] : undefined,
      };
    }

    return {
      type: subject,
      clinic_id: clinicId,
      chair: this.isRecord(payload['chair']) ? payload['chair'] : payload,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
