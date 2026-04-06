from unittest.mock import AsyncMock

import pytest
from pydantic import BaseModel

from app.core.event_bus import EventBus


class DummyEvent(BaseModel):
    value: str


@pytest.mark.asyncio
async def test_event_bus_connect_declares_exchange(monkeypatch):
    bus = EventBus()

    fake_exchange = object()
    fake_channel = AsyncMock()
    fake_channel.declare_exchange = AsyncMock(return_value=fake_exchange)

    fake_connection = AsyncMock()
    fake_connection.channel = AsyncMock(return_value=fake_channel)

    monkeypatch.setattr("app.core.event_bus.aio_pika.connect_robust", AsyncMock(return_value=fake_connection))

    await bus.connect()

    assert bus._connection is fake_connection
    assert bus._channel is fake_channel
    assert bus._exchange is fake_exchange


@pytest.mark.asyncio
async def test_event_bus_publish_requires_connection():
    bus = EventBus()

    with pytest.raises(RuntimeError):
        await bus.publish("rk", DummyEvent(value="x"))


@pytest.mark.asyncio
async def test_event_bus_publish_sends_to_exchange():
    bus = EventBus()
    fake_exchange = AsyncMock()
    bus._exchange = fake_exchange

    await bus.publish("ai.test", DummyEvent(value="ok"), metadata={"correlationId": "corr-1"})

    assert fake_exchange.publish.await_count == 1
    _, kwargs = fake_exchange.publish.await_args
    assert kwargs["routing_key"] == "ai.test"


@pytest.mark.asyncio
async def test_event_bus_close_closes_connection():
    bus = EventBus()
    fake_connection = AsyncMock()
    bus._connection = fake_connection

    await bus.close()

    fake_connection.close.assert_awaited_once()