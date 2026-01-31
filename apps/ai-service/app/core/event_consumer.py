import aio_pika
import logging
from app.core.config import settings
from app.core.event_dispatcher import dispatcher

logger = logging.getLogger(__name__)

class EventConsumer:
    def __init__(self):
        self.connection = None
        self.channel = None

    async def connect(self):
        """
        Establish connection to RabbitMQ, declare queue, bind routing keys, and start consuming messages.        
        """
        try:
            self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=10)

            # Declare exchange and queue
            exchange = await self.channel.declare_exchange(
                name=settings.RABBITMQ_EXCHANGE_NAME,
                type=aio_pika.ExchangeType.TOPIC,
                durable=True
            )
            queue = await self.channel.declare_queue(
                name=settings.AI_QUEUE_NAME,
                durable=True
            )

            keys = dispatcher.get_routing_keys()

            # Bind queue to all routing keys
            for key in keys:
                await queue.bind(exchange, routing_key=key)
                logger.info(f"Bound queue to topic: {key}")

            # Start consuming messages
            await queue.consume(dispatcher.process_message)
            logger.info("Event Consumer started listening...")

        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise e

    async def close(self):
        if self.connection:
            await self.connection.close()
            logger.info("RabbitMQ connection closed.")

event_consumer = EventConsumer()