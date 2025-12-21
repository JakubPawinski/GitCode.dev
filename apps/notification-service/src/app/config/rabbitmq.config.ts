import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  queueName: process.env.NOTIFICATION_QUEUE_NAME || 'notification_queue',
  exchangeName: process.env.RABBITMQ_EXCHANGE_NAME || 'gitcode_exchange',
}));

export const RABBIT_CONFIG = {
  EXCHANGE: process.env.RABBITMQ_EXCHANGE_NAME || 'gitcode_exchange',
  QUEUE: process.env.NOTIFICATION_QUEUE_NAME || 'notification_queue',
}