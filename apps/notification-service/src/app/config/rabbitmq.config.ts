import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  queueName: process.env.NOTIFICATION_QUEUE_NAME || 'notification_queue',
}));
