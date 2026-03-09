import * as Joi from 'joi';

export default Joi.object({
  RABBITMQ_URL: Joi.string().required(),
  ACHIEVEMENT_QUEUE_NAME: Joi.string().default('achievement_queue'),
  RABBITMQ_EXCHANGE_NAME: Joi.string().default('gitcode_exchange'),
  INTERNAL_API_KEY: Joi.string().required(),
  PROBLEM_SERVICE_URL: Joi.string().uri().required(),
  ACHIEVEMENT_PORT: Joi.number().required(),
});
