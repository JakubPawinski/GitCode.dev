import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Logger } from '@nestjs/common';
import { RealtimeEvent } from '../notification/interfaces';

/**
 * Service responsible for real-time communication using Redis Pub/Sub.
 * It allows broadcasting events across multiple service instances and streaming them to users.
 */
@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;

  // Subject used to broadcast received events within the application
  private readonly eventsSubjects = new Subject<RealtimeEvent>();

  private logger = new Logger(RealtimeService.name);

  constructor(private readonly configService: ConfigService) {}

  /*
   *Initialize Redis connection and subscribe to channel
   */
  async onModuleInit() {
    this.logger.log('Initializing RealtimeService...');

    // Initialize Redis connections
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    // Separate connections are required for publishing and subscribing
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    // Subscribe to the global notifications channel
    await this.subscriber.subscribe('global_notifications');

    // Handle incoming messages from Redis
    this.subscriber.on('message', (channel: string, message: string) => {
      // Only process messages from the global_notifications channel
      if (channel === 'global_notifications') {
        // Parse the message and emit it to the RxJS stream
        const event: RealtimeEvent = JSON.parse(message);
        this.eventsSubjects.next(event);
      }
    });
  }

  /*
   * Clean up Redis connections on module destroy
   */
  async onModuleDestroy() {
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  /**
   * Publishes an event to the Redis channel to be received by all service instances.
   * @param userId Target user identifier
   * @param type Event type (e.g., 'notification')
   * @param payload Event data
   */
  async broadcastEvent(userId: string, type: string, payload: any) {
    const event: RealtimeEvent = { userId, type, payload };
    this.logger.log(`Broadcasting event: ${JSON.stringify(event)}`);
    await this.publisher.publish('global_notifications', JSON.stringify(event));
  }

  /**
   * Creates an Observable stream for a specific user.
   * Used by Server-Sent Events (SSE).
   * @param userId User identifier
   */
  getUserStream(userId: string): Observable<MessageEvent> {
    this.logger.log(`Creating event stream for user: ${userId}`);
    return this.eventsSubjects.asObservable().pipe(
      // Filter events belonging only to the specified user
      filter((event) => event.userId === userId),
      // Map to the format expected by SSE
      map(
        (event) =>
          ({
            data: event.payload,
          }) as MessageEvent,
      ),
    );
  }
}
