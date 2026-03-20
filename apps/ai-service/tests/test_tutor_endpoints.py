import json
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.endpoints import tutor as tutor_endpoints
from app.exceptions import MessageNotFoundError, SessionNotFoundError, UnauthorizedSessionError


@pytest.mark.asyncio
async def test_chat_with_tutor_raises_502_when_problem_service_fails(monkeypatch):
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

	monkeypatch.setattr(tutor_endpoints.httpx, "AsyncClient", FakeAsyncClient)

	request = SimpleNamespace(problem_slug="two-sum", code="", message="hi", model=None)
	user = SimpleNamespace(id="user-1")

	with pytest.raises(HTTPException) as exc:
		await tutor_endpoints.chat_with_tutor(request, user=user, db=object())

	assert exc.value.status_code == 502


@pytest.mark.asyncio
async def test_chat_with_tutor_raises_500_when_problem_fetch_crashes(monkeypatch):
	class FakeAsyncClient:
		async def __aenter__(self):
			return self

		async def __aexit__(self, exc_type, exc, tb):
			return False

		async def get(self, *args, **kwargs):
			raise RuntimeError("network down")

	monkeypatch.setattr(tutor_endpoints.httpx, "AsyncClient", FakeAsyncClient)

	request = SimpleNamespace(problem_slug="two-sum", code="", message="hi", model=None)
	user = SimpleNamespace(id="user-1")

	with pytest.raises(HTTPException) as exc:
		await tutor_endpoints.chat_with_tutor(request, user=user, db=object())

	assert exc.value.status_code == 500


@pytest.mark.asyncio
async def test_get_session_history_returns_serialized_messages(monkeypatch):
	now = datetime.now(UTC)

	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def get_session_messages(self, user_id, problem_slug):
			assert user_id == "user-1"
			assert problem_slug == "two-sum"
			session = SimpleNamespace(id=10, created_at=now)
			messages = [SimpleNamespace(role="user", content="hello", created_at=now)]
			return session, messages

	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	result = await tutor_endpoints.get_session_history(
		"two-sum",
		user=SimpleNamespace(id="user-1"),
		db=object(),
	)

	assert result["sessionId"] == 10
	assert result["messages"][0]["role"] == "user"
	assert result["createdAt"] == now


@pytest.mark.asyncio
async def test_get_user_sessions_returns_mapped_sessions(monkeypatch):
	now = datetime.now(UTC)

	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def get_user_sessions(self, user_id, limit=20):
			assert user_id == "user-1"
			assert limit == 20
			return [
				SimpleNamespace(id=1, problem_slug="two-sum", created_at=now, updated_at=now),
			]

	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	result = await tutor_endpoints.get_user_sessions(user=SimpleNamespace(id="user-1"), db=object())

	assert result["sessions"][0]["id"] == 1
	assert result["sessions"][0]["problemSlug"] == "two-sum"


@pytest.mark.asyncio
async def test_delete_session_maps_not_found_to_404(monkeypatch):
	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def delete_session(self, session_id, user_id):
			raise SessionNotFoundError(f"Session {session_id} not found")

	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	with pytest.raises(HTTPException) as exc:
		await tutor_endpoints.delete_session(123, user=SimpleNamespace(id="user-1"), db=object())

	assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_session_maps_unauthorized_to_403(monkeypatch):
	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def delete_session(self, session_id, user_id):
			raise UnauthorizedSessionError("no access")

	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	with pytest.raises(HTTPException) as exc:
		await tutor_endpoints.delete_session(123, user=SimpleNamespace(id="user-1"), db=object())

	assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_delete_session_maps_unexpected_to_500(monkeypatch):
	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def delete_session(self, session_id, user_id):
			raise RuntimeError("boom")

	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	with pytest.raises(HTTPException) as exc:
		await tutor_endpoints.delete_session(123, user=SimpleNamespace(id="user-1"), db=object())

	assert exc.value.status_code == 500


@pytest.mark.asyncio
async def test_delete_message_maps_unauthorized_to_403(monkeypatch):
	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def delete_message(self, message_id, session_id, user_id):
			raise UnauthorizedSessionError("no access")

	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	with pytest.raises(HTTPException) as exc:
		await tutor_endpoints.delete_message(1, 2, user=SimpleNamespace(id="user-1"), db=object())

	assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_delete_message_maps_missing_message_to_404(monkeypatch):
	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def delete_message(self, message_id, session_id, user_id):
			raise MessageNotFoundError("missing")

	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	with pytest.raises(HTTPException) as exc:
		await tutor_endpoints.delete_message(10, 20, user=SimpleNamespace(id="user-1"), db=object())

	assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_message_maps_unexpected_to_500(monkeypatch):
	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def delete_message(self, message_id, session_id, user_id):
			raise RuntimeError("boom")

	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	with pytest.raises(HTTPException) as exc:
		await tutor_endpoints.delete_message(10, 20, user=SimpleNamespace(id="user-1"), db=object())

	assert exc.value.status_code == 500


@pytest.mark.asyncio
async def test_chat_with_tutor_streams_chunks_and_done_event(monkeypatch):
	class FakeResponse:
		status_code = 200

		def json(self):
			return {"data": {"description": "Problem description"}}

	class FakeAsyncClient:
		async def __aenter__(self):
			return self

		async def __aexit__(self, exc_type, exc, tb):
			return False

		async def get(self, *args, **kwargs):
			return FakeResponse()

	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def stream_chat_response(self, **kwargs):
			yield "first"
			yield "second"

	monkeypatch.setattr(tutor_endpoints.httpx, "AsyncClient", FakeAsyncClient)
	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	request = SimpleNamespace(problem_slug="two-sum", code="x", message="help", model=None)
	user = SimpleNamespace(id="user-1")

	response = await tutor_endpoints.chat_with_tutor(request, user=user, db=object())

	chunks = []
	async for chunk in response.body_iterator:
		chunks.append(chunk)

	text = "".join(c.decode() if isinstance(c, bytes) else c for c in chunks)
	assert json.dumps({"text": "first", "done": False}) in text
	assert json.dumps({"text": "second", "done": False}) in text
	assert json.dumps({"text": "", "done": True}) in text


@pytest.mark.asyncio
async def test_chat_with_tutor_stream_emits_error_event_on_generator_exception(monkeypatch):
	class FakeResponse:
		status_code = 200

		def json(self):
			return {"data": {"description": "Problem description"}}

	class FakeAsyncClient:
		async def __aenter__(self):
			return self

		async def __aexit__(self, exc_type, exc, tb):
			return False

		async def get(self, *args, **kwargs):
			return FakeResponse()

	class FakeTutorService:
		def __init__(self, db):
			self.db = db

		async def stream_chat_response(self, **kwargs):
			raise RuntimeError("stream failed")
			yield "never"

	monkeypatch.setattr(tutor_endpoints.httpx, "AsyncClient", FakeAsyncClient)
	monkeypatch.setattr(tutor_endpoints, "TutorService", FakeTutorService)

	request = SimpleNamespace(problem_slug="two-sum", code="x", message="help", model=None)
	user = SimpleNamespace(id="user-1")

	response = await tutor_endpoints.chat_with_tutor(request, user=user, db=object())

	chunks = []
	async for chunk in response.body_iterator:
		chunks.append(chunk)

	text = "".join(c.decode() if isinstance(c, bytes) else c for c in chunks)
	assert json.dumps({"error": "An error occurred during generation"}) in text
