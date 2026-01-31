import aio_pika
import logging
import uuid
import json
from datetime import datetime
from typing import Optional, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, Field, ConfigDict
from app.core.config import settings

T = TypeVar("T")

logger = logging.getLogger(__name__)

class EventEnvelope(BaseModel, Generic[T]):
    """
    Generic Event Envelope for publishing events to the message bus.
    Attributes:
        event (str): The routing key of the event.
        eventId (str): Unique identifier for the event.
        occurredOn (str): Timestamp of when the event occurred.
        correlationId (Optional[str]): Correlation ID for tracing.
        payload (T): The actual event data.
        metadata (Dict[str, Any]): Additional metadata for the event.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    event: str
    eventId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    occurredOn: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    correlationId: Optional[str] = None
    payload: T
    metadata: Dict[str, Any] = Field(default_factory=dict)

class EventBus:
    def __init__(self):
        self._connection: Optional[aio_pika.RobustConnection] = None
        self._channel: Optional[aio_pika.RobustChannel] = None
        self._exchange: Optional[aio_pika.RobustExchange] = None

    async def connect(self):
        """
        Establish connection to RabbitMQ and declare exchange.
        """
        if not self._connection:
            try:
                self._connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
                self._channel = await self._connection.channel()
                self._exchange = await self._channel.declare_exchange(
                    name=settings.RABBITMQ_EXCHANGE_NAME,
                    type=aio_pika.ExchangeType.TOPIC,
                    durable=True
                )
                logger.info("Event Bus (Producer) connected.")
            except Exception as e:
                logger.error(f"Failed to connect Event Bus: {e}")
                raise e

    async def close(self):
        if self._connection:
            await self._connection.close()
            logger.info("Event Bus disconnected.")

    async def publish(self, routing_key: str, event_data: BaseModel, metadata: Dict[str, Any] = None):
        """
        Publish an event to the RabbitMQ exchange.

        Args:
            routing_key (str): The routing key for the event.
            event_data (BaseModel): The event data to publish.
            metadata (Dict[str, Any], optional): Additional metadata for the event.

        Raises:
            RuntimeError: If the Event Bus is not connected.
        """
        if not self._exchange:
            raise RuntimeError("Event Bus not connected!")

        # Create the event envelope
        envelope = EventEnvelope[BaseModel](
            event=routing_key,
            correlationId=metadata.get("correlationId") if metadata else str(uuid.uuid4()),
            payload=event_data,
            metadata={**(metadata or {}), "source": "ai-service"}
        )

        envelope_dict = envelope.model_dump()
        envelope_dict["payload"] = event_data.model_dump()
        
        message_body = json.dumps(envelope_dict).encode()

        # Create the message
        message = aio_pika.Message(
            body=message_body,
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            headers={
                "source": "ai-service",
                "type": routing_key
            }
        )

        logger.info(f"Publishing event: {routing_key} [message: {message_body.decode()}]")

        # Publish the message
        await self._exchange.publish(message, routing_key=routing_key)
        logger.info(f"Published event: {routing_key} [ID: {envelope.eventId}]")

event_bus = EventBus()