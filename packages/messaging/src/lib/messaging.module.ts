import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus.service.js';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({})
export class MessagingModule {
  static forRoot(urls: string[]): DynamicModule {
    return {
      module: MessagingModule,
      providers: [EventBus],
      exports: [EventBus],
      imports: [
        ClientsModule.register([
          {
            name: 'RABBITMQ_CLIENT',
            transport: Transport.RMQ,
            options: {
              urls,
              queue: '',
            },
          },
        ]),
      ],
    };
  }
}
