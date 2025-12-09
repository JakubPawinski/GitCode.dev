import * as Joi from 'joi';

export default Joi.object({
  NOTIFICATION_PORT: Joi.number().default(4003),
  NOTIFICATION_DATABASE_URL: Joi.string().required(),
  RABBITMQ_URL: Joi.string().required(),
  NOTIFICATION_QUEUE_NAME: Joi.string().default('notification_queue'),
});
