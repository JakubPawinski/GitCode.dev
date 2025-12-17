import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

export interface RealtimeEvent {
  userId: string;
  type: string;
  payload: any;
}

@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;

  private readonly eventsSubjects = new Subject<RealtimeEvent>();
  private logger = new Logger(RealtimeService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing RealtimeService...');
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    await this.subscriber.subscribe('global_notifications');
    this.subscriber.on('message', (channel: string, message: string) => {
      if (channel === 'global_notifications') {
        const event: RealtimeEvent = JSON.parse(message);
        this.eventsSubjects.next(event);
      }
    });
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  async broadcastEvent(userId: string, type: string, payload: any) {
    const event: RealtimeEvent = { userId, type, payload };
    this.logger.log(`Broadcasting event: ${JSON.stringify(event)}`);
    await this.publisher.publish('global_notifications', JSON.stringify(event));
  }

  getUserStream(userId: string): Observable<MessageEvent> {
    this.logger.log(`Creating event stream for user: ${userId}`);
    return this.eventsSubjects.asObservable().pipe(
      filter((event) => event.userId === userId),
      map(
        (event) =>
          ({
            data: event.payload,
          }) as MessageEvent,
      ),
    );
  }
}
