import { Transport, RmqOptions } from '@nestjs/microservices';

export const rabbitMQOptions: RmqOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
    queue: process.env.NOTIFICATION_QUEUE_NAME || 'notification_queue',
    queueOptions: {
      durable: true,
    },
  },
};
