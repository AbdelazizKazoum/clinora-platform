import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, type NatsConnection } from 'nats';

import { OUTBOX_REPOSITORY } from '../../appointment.tokens';
import type { IOutboxRepository } from '../../domain/repositories/outbox-repository.interface';

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private connection?: NatsConnection;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outbox: IOutboxRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const servers = this.config.get<string>('NATS_URL');
    if (!servers) {
      this.logger.warn('NATS_URL not configured; outbox relay disabled');
      return;
    }

    try {
      this.connection = await connect({ servers });
      this.timer = setInterval(() => {
        void this.publishPending();
      }, this.config.get<number>('OUTBOX_RELAY_INTERVAL_MS', 500));
      void this.publishPending();
      this.logger.log('Outbox relay connected to NATS');
    } catch (error) {
      this.logger.error(
        `Failed to connect outbox relay to NATS: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    if (this.connection) await this.connection.drain();
  }

  private async publishPending(): Promise<void> {
    if (!this.connection) return;

    const events = await this.outbox.findUnpublished(25);
    for (const event of events) {
      try {
        this.connection.publish(
          event.eventType,
          Buffer.from(JSON.stringify(event.payload)),
        );
        await this.outbox.markPublished(event.id);
      } catch (error) {
        this.logger.error(
          `Failed to publish outbox event ${event.id}: ${
            (error as Error).message
          }`,
        );
        return;
      }
    }
  }
}
