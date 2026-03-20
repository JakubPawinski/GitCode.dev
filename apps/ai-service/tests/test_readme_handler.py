from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.handler import readme_handler
from app.models.generated import GenerateReadmeCommand


def test_extract_stats_data_handles_nested_and_flat():
    nested = {"data": {"problemsSolved": 10}}
    flat = {"problemsSolved": 20}

    assert readme_handler._extract_stats_data(nested) == {"problemsSolved": 10}
    assert readme_handler._extract_stats_data(flat) == flat


def test_extract_user_data_maps_defaults():
    data = {"data": {"username": "u", "email": "u@example.com"}}

    user = readme_handler._extract_user_data(data)

    assert user["username"] == "u"
    assert user["githubUsername"] == "u"
    assert user["avatarUrl"] == ""


@pytest.mark.asyncio
async def test_handle_generate_readme_success(monkeypatch):
    event = GenerateReadmeCommand(userId="user-1")

    class FakeResponse:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload

        def json(self):
            return self._payload

    class FakeAsyncClient:
        def __init__(self):
            self.calls = []

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url, headers=None):
            self.calls.append(url)
            if "stats/extended" in url:
                return FakeResponse(200, {"data": {"problemsSolved": 11}})
            return FakeResponse(200, {"data": {"username": "user", "email": "u@example.com"}})

    fake_service = SimpleNamespace(generate_readme=AsyncMock(return_value="# README"))
    publish_mock = AsyncMock()

    monkeypatch.setattr(readme_handler.httpx, "AsyncClient", FakeAsyncClient)
    monkeypatch.setattr(readme_handler, "ReadmeGeneratorService", lambda: fake_service)
    monkeypatch.setattr(readme_handler.event_bus, "publish", publish_mock)

    await readme_handler.handle_generate_readme(event, metadata={})

    assert publish_mock.await_count == 1
    _, kwargs = publish_mock.await_args
    assert kwargs["routing_key"] == readme_handler.AIPATTERNS.ai_readme_generated


@pytest.mark.asyncio
async def test_handle_generate_readme_stats_failure_publishes_failed_event(monkeypatch):
    event = GenerateReadmeCommand(userId="user-2")

    class FakeResponse:
        status_code = 500

        def json(self):
            return {}

    class FakeAsyncClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            return FakeResponse()

    publish_mock = AsyncMock()
    monkeypatch.setattr(readme_handler.httpx, "AsyncClient", FakeAsyncClient)
    monkeypatch.setattr(readme_handler.event_bus, "publish", publish_mock)

    await readme_handler.handle_generate_readme(event, metadata={})

    assert publish_mock.await_count == 1
    args, _ = publish_mock.await_args
    assert args[0] == readme_handler.AIPATTERNS.ai_readme_generation_failed