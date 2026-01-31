import json
import logging
from typing import Callable, Dict, Type, Any, Awaitable
from aio_pika import IncomingMessage
from pydantic import BaseModel, ValidationError

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
        
        Error handling strategy:
        - Validation errors (envelope/payload): NACK without requeue (poison pill)
        - Missing handler: NACK without requeue (misconfiguration)
        - Handler exceptions: NACK with requeue (transient failure, retry later)
        
        Args:
            message (IncomingMessage): The incoming RabbitMQ message.
        
        Returns:
            None
        """
        try:
            body = message.body.decode()
            logger.info(f"Received message: {message.routing_key}")

            try:
                data = json.loads(body)
                envelope = RuntimeEnvelope(**data)
            except (json.JSONDecodeError, ValidationError) as e:
                logger.error(f"Invalid Envelope format: {e}")
                await message.nack(requeue=False)
                return 

            handler_tuple = self._handlers.get(message.routing_key)
            if not handler_tuple:
                logger.warning(f"No handler registered for routing key: {message.routing_key}")
                await message.nack(requeue=False)
                return

            handler_func, model_class = handler_tuple

            try:
                event_payload = model_class(**envelope.payload)
            except ValidationError as e:
                logger.error(f"Payload validation error for {message.routing_key}: {e}")
                await message.nack(requeue=False)
                return 

            try:
                await handler_func(event_payload, envelope.metadata or {})
                await message.ack()
                logger.info(f"Successfully processed: {message.routing_key} (eventId: {envelope.eventId})")
            
            except Exception as e:
                logger.error(f"Handler error for {message.routing_key}: {e}", exc_info=True)
                # Transient failure - requeue for retry
                await message.nack(requeue=True)
                raise

        except Exception as e:
            logger.critical(f"CRITICAL: Unrecoverable error processing message: {e}", exc_info=True)
            try:
                await message.nack(requeue=False)
            except Exception as nack_error:
                logger.error(f"Failed to nack message: {nack_error}")

dispatcher = EventDispatcher()