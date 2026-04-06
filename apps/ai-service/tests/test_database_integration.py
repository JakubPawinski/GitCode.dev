from unittest.mock import AsyncMock

import pytest

from app.core import database


@pytest.mark.asyncio
async def test_init_db_skips_when_environment_is_production(monkeypatch):
	monkeypatch.setattr(database.settings, "ENVIRONMENT", "production")

	begin_called = False

	class DummyEngine:
		def begin(self):
			nonlocal begin_called
			begin_called = True
			raise AssertionError("engine.begin should not be called in production")

	monkeypatch.setattr(database, "engine", DummyEngine())

	await database.init_db()

	assert begin_called is False


@pytest.mark.asyncio
async def test_init_db_creates_tables_in_non_production(monkeypatch):
	monkeypatch.setattr(database.settings, "ENVIRONMENT", "development")

	run_sync_mock = AsyncMock()

	class DummyConn:
		run_sync = run_sync_mock

	class DummyBeginContext:
		async def __aenter__(self):
			return DummyConn()

		async def __aexit__(self, exc_type, exc, tb):
			return False

	class DummyEngine:
		def begin(self):
			return DummyBeginContext()

	monkeypatch.setattr(database, "engine", DummyEngine())

	await database.init_db()

	assert run_sync_mock.await_count == 1


@pytest.mark.asyncio
async def test_get_session_yields_session_from_sessionmaker(monkeypatch):
	fake_session = object()

	class DummySessionContext:
		async def __aenter__(self):
			return fake_session

		async def __aexit__(self, exc_type, exc, tb):
			return False

	class DummySessionFactory:
		def __call__(self):
			return DummySessionContext()

	monkeypatch.setattr(database, "sessionmaker", lambda *args, **kwargs: DummySessionFactory())

	gen = database.get_session()
	yielded = await anext(gen)

	assert yielded is fake_session

	await gen.aclose()
