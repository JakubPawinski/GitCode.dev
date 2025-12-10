/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<any>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
      queue: process.env.NOTIFICATION_QUEUE_NAME || 'notification_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
