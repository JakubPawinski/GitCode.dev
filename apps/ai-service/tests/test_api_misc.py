from types import SimpleNamespace
from unittest.mock import AsyncMock
import runpy

import pytest
from fastapi import HTTPException

from app.api.endpoints import models as models_endpoint
from app.api.endpoints import readme as readme_endpoint
from app.api import routers as api_routers
from app import main as app_main


@pytest.mark.asyncio
async def test_models_available_splits_provider_prefix(monkeypatch):
    class FakeClient:
        def get_available_models(self):
            return ["openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet"]

    monkeypatch.setattr(models_endpoint, "OpenRouterClient", lambda: FakeClient())

    result = await models_endpoint.get_available_models()

    assert result == {"available_models": ["gpt-4o-mini", "claude-3-5-sonnet"]}


@pytest.mark.asyncio
async def test_generate_readme_endpoint_publishes_command(monkeypatch):
    publish_mock = AsyncMock()
    monkeypatch.setattr(readme_endpoint.event_bus, "publish", publish_mock)

    result = await readme_endpoint.generate_readme(user=SimpleNamespace(id="u1"))

    assert result["success"] is True
    assert result["userId"] == "u1"
    publish_mock.assert_awaited_once()


@pytest.mark.asyncio
async def test_generate_readme_endpoint_raises_500_on_failure(monkeypatch):
    monkeypatch.setattr(readme_endpoint.event_bus, "publish", AsyncMock(side_effect=RuntimeError("bus error")))

    with pytest.raises(HTTPException) as exc:
        await readme_endpoint.generate_readme(user=SimpleNamespace(id="u1"))

    assert exc.value.status_code == 500


def test_api_router_contains_expected_paths():
    paths = {route.path for route in api_routers.router.routes}

    assert "/health" in paths
    assert "/tutor/stream" in paths
    assert "/readme/generate" in paths
    assert "/models/available" in paths


@pytest.mark.asyncio
async def test_main_lifespan_connects_and_closes(monkeypatch):
    connect_consumer = AsyncMock()
    close_consumer = AsyncMock()
    connect_bus = AsyncMock()
    close_bus = AsyncMock()
    init_db = AsyncMock()

    monkeypatch.setattr(app_main.event_consumer, "connect", connect_consumer)
    monkeypatch.setattr(app_main.event_consumer, "close", close_consumer)
    monkeypatch.setattr(app_main.event_bus, "connect", connect_bus)
    monkeypatch.setattr(app_main.event_bus, "close", close_bus)
    monkeypatch.setattr(app_main, "init_db", init_db)

    async with app_main.lifespan(app_main.app):
        pass

    connect_consumer.assert_awaited_once()
    connect_bus.assert_awaited_once()
    init_db.assert_awaited_once()
    close_consumer.assert_awaited_once()
    close_bus.assert_awaited_once()


def test_main_app_has_ai_health_route():
    paths = {route.path for route in app_main.app.routes}
    assert "/ai/health" in paths


def test_main_module_entrypoint_runs(monkeypatch):
    config_calls = []
    signal_calls = []

    class FakeConfig:
        def __init__(self, *args, **kwargs):
            config_calls.append((args, kwargs))

    class FakeServer:
        def __init__(self, config):
            self.config = config

        def serve(self):
            return "served"

    monkeypatch.setattr("uvicorn.Config", FakeConfig)
    monkeypatch.setattr("uvicorn.Server", FakeServer)
    monkeypatch.setattr("signal.signal", lambda sig, handler: signal_calls.append(sig))
    monkeypatch.setattr("asyncio.run", lambda coro: None)

    runpy.run_module("app.main", run_name="__main__")

    assert len(config_calls) == 1
    assert len(signal_calls) == 2