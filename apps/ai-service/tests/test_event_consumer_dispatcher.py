import json
from unittest.mock import AsyncMock

import pytest
from pydantic import BaseModel

from app.core.event_consumer import EventConsumer
from app.core.event_dispatcher import EventDispatcher


@pytest.mark.asyncio
async def test_event_consumer_connect_binds_and_consumes(monkeypatch):
    consumer = EventConsumer()

    fake_exchange = object()
    fake_queue = AsyncMock()
    fake_channel = AsyncMock()
    fake_channel.set_qos = AsyncMock()
    fake_channel.declare_exchange = AsyncMock(return_value=fake_exchange)
    fake_channel.declare_queue = AsyncMock(return_value=fake_queue)

    fake_connection = AsyncMock()
    fake_connection.channel = AsyncMock(return_value=fake_channel)

    monkeypatch.setattr("app.core.event_consumer.aio_pika.connect_robust", AsyncMock(return_value=fake_connection))
    monkeypatch.setattr("app.core.event_consumer.dispatcher.get_routing_keys", lambda: ["a.b", "c.d"])

    await consumer.connect()

    assert fake_queue.bind.await_count == 2
    fake_queue.consume.assert_awaited_once()


@pytest.mark.asyncio
async def test_event_consumer_close_closes_connection():
    consumer = EventConsumer()
    consumer.connection = AsyncMock()

    await consumer.close()

    consumer.connection.close.assert_awaited_once()


class Payload(BaseModel):
    value: str


@pytest.mark.asyncio
async def test_dispatcher_process_message_success_ack():
    dispatcher = EventDispatcher()
    handler = AsyncMock()
    dispatcher.subscribe("ai.ok", Payload)(handler)

    body = {
        "event": "ai.ok",
        "eventId": "1",
        "occurredOn": "2026-01-01T00:00:00Z",
        "payload": {"value": "v"},
        "metadata": {"x": 1},
    }

    message = AsyncMock()
    message.body = json.dumps(body).encode()
    message.routing_key = "ai.ok"

    await dispatcher.process_message(message)

    handler.assert_awaited_once()
    message.ack.assert_awaited_once()


@pytest.mark.asyncio
async def test_dispatcher_invalid_envelope_nack_no_requeue():
    dispatcher = EventDispatcher()
    message = AsyncMock()
    message.body = b"{invalid"
    message.routing_key = "ai.bad"

    await dispatcher.process_message(message)

    message.nack.assert_awaited_once_with(requeue=False)


@pytest.mark.asyncio
async def test_dispatcher_missing_handler_nack_no_requeue():
    dispatcher = EventDispatcher()
    body = {
        "event": "ai.missing",
        "eventId": "1",
        "occurredOn": "2026-01-01T00:00:00Z",
        "payload": {"value": "v"},
        "metadata": {},
    }
    message = AsyncMock()
    message.body = json.dumps(body).encode()
    message.routing_key = "ai.missing"

    await dispatcher.process_message(message)

    message.nack.assert_awaited_once_with(requeue=False)


@pytest.mark.asyncio
async def test_dispatcher_payload_validation_nack_no_requeue():
    dispatcher = EventDispatcher()
    handler = AsyncMock()
    dispatcher.subscribe("ai.validation", Payload)(handler)

    body = {
        "event": "ai.validation",
        "eventId": "1",
        "occurredOn": "2026-01-01T00:00:00Z",
        "payload": {"missing": "field"},
        "metadata": {},
    }
    message = AsyncMock()
    message.body = json.dumps(body).encode()
    message.routing_key = "ai.validation"

    await dispatcher.process_message(message)

    message.nack.assert_awaited_once_with(requeue=False)


@pytest.mark.asyncio
async def test_dispatcher_handler_error_nack_requeue_true():
    dispatcher = EventDispatcher()

    async def broken_handler(payload, metadata):
        raise RuntimeError("transient")

    dispatcher.subscribe("ai.fail", Payload)(broken_handler)

    body = {
        "event": "ai.fail",
        "eventId": "1",
        "occurredOn": "2026-01-01T00:00:00Z",
        "payload": {"value": "v"},
        "metadata": {},
    }
    message = AsyncMock()
    message.body = json.dumps(body).encode()
    message.routing_key = "ai.fail"

    await dispatcher.process_message(message)

    message.nack.assert_any_await(requeue=True)