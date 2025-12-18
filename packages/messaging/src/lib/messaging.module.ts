import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus.service.js';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RmqMetadataInterceptor } from './interceptors/rmq-metadata.interceptor.js';

@Global()
@Module({
  providers: [EventBus,
    {
      provide: APP_INTERCEPTOR,
      useClass: RmqMetadataInterceptor,
    }
  ],
  exports: [EventBus],
})
export class MessagingModule {
  static forRoot(urls: string[]): DynamicModule {
    return {
      module: MessagingModule,
      imports: [
        RabbitMQModule.forRoot({
          exchanges: [
            {
              name: 'gitcode_exchange',
              type: 'topic',
            },
          ],
          uri: urls[0],
          enableControllerDiscovery: true,
          connectionInitOptions: { wait: false },
        }),
      ],
    };
  }
}
