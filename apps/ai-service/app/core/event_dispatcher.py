import json
import logging
from typing import Callable, Dict, Type, Any, Awaitable
from aio_pika import IncomingMessage
from pydantic import BaseModel
from app.models.generated import EventEnvelopeDto

logger = logging.getLogger(__name__)

class RuntimeEnvelope(BaseModel):
    """
    Runtime representation of an event envelope.
    """
    event: str
    eventId: str
    occurredOn: str
    correlationId: str | None = None
    payload: Dict[str, Any]
    metadata: Dict[str, Any] | None = None

class EventDispatcher:
    def __init__(self):
        self._handlers: Dict[str, tuple[Callable[[BaseModel, dict], Awaitable[None]], Type[BaseModel]]] = {}

    def subscribe(self, routing_key: str, model: Type[BaseModel]):
        def decorator(func):
            self._handlers[routing_key] = (func, model)
            return func
        return decorator

    def get_routing_keys(self):
        return self._handlers.keys()

    async def process_message(self, message: IncomingMessage):
        """
        Process an incoming message by deserializing it and invoking the appropriate handler.
        Args:
            message (IncomingMessage): The incoming RabbitMQ message.
        Returns:
            None
        """
        try:
            async with message.process(requeue=False):
                body = message.body.decode()
                logger.info(f"Received message: {message.routing_key}")

                try:
                    data = json.loads(body)
                    envelope = RuntimeEnvelope(**data)
                except Exception as e:
                    logger.error(f"Invalid Envelope format: {e}")
                    return 

                handler_tuple = self._handlers.get(message.routing_key)
                if not handler_tuple:
                    logger.warning(f"No handler for key: {message.routing_key}")
                    return

                handler_func, model_class = handler_tuple

                try:
                    event_payload = model_class(**envelope.payload)
                except Exception as e:
                    logger.error(f"Payload validation error for {message.routing_key}: {e}")
                    return 
                await handler_func(event_payload, envelope.metadata)
                logger.info(f"Successfully processed: {message.routing_key}")

        except Exception as e:
            logger.error(f"CRITICAL processing error: {e}", exc_info=True)
            raise e

dispatcher = EventDispatcher()