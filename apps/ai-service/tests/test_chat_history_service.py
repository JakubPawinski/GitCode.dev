from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from app.exceptions import MessageNotFoundError, SessionNotFoundError, UnauthorizedSessionError
from app.schemas.chat import ChatMessage, ChatSession
from app.services.chat_history.chat_history_service import ChatHistoryService


class FakeExecResult:
	def __init__(self, *, first_value=None, all_value=None):
		self._first_value = first_value
		self._all_value = all_value if all_value is not None else []

	def first(self):
		return self._first_value

	def all(self):
		return self._all_value


@pytest.fixture
def mock_db():
	db = Mock()
	db.exec = AsyncMock()
	db.add = Mock()
	db.commit = AsyncMock()
	db.refresh = AsyncMock()
	db.delete = AsyncMock()
	return db


@pytest.fixture
def service(mock_db):
	return ChatHistoryService(mock_db)


@pytest.mark.asyncio
async def test_get_or_create_session_returns_existing_session(service, mock_db):
	existing = ChatSession(id=10, user_id="u1", problem_slug="two-sum")
	mock_db.exec.return_value = FakeExecResult(first_value=existing)

	result = await service.get_or_create_session("u1", "two-sum")

	assert result is existing
	mock_db.add.assert_not_called()
	mock_db.commit.assert_not_called()
	mock_db.refresh.assert_not_called()


@pytest.mark.asyncio
async def test_get_or_create_session_creates_when_missing(service, mock_db):
	created_session = ChatSession(id=11, user_id="u2", problem_slug="reverse-string")
	mock_db.exec.return_value = FakeExecResult(first_value=None)

	async def refresh_side_effect(obj):
		obj.id = created_session.id

	mock_db.refresh.side_effect = refresh_side_effect

	result = await service.get_or_create_session("u2", "reverse-string")

	assert isinstance(result, ChatSession)
	assert result.user_id == "u2"
	assert result.problem_slug == "reverse-string"
	assert result.id == 11
	mock_db.add.assert_called_once_with(result)
	mock_db.commit.assert_awaited_once()
	mock_db.refresh.assert_awaited_once_with(result)


@pytest.mark.asyncio
async def test_add_message_persists_and_returns_message(service, mock_db):
	async def refresh_side_effect(obj):
		obj.id = 7

	mock_db.refresh.side_effect = refresh_side_effect

	result = await service.add_message(3, "user", "hej")

	assert isinstance(result, ChatMessage)
	assert result.id == 7
	assert result.session_id == 3
	assert result.role == "user"
	assert result.content == "hej"
	mock_db.add.assert_called_once_with(result)
	mock_db.commit.assert_awaited_once()
	mock_db.refresh.assert_awaited_once_with(result)


@pytest.mark.asyncio
async def test_get_session_messages_returns_all_messages(service, mock_db):
	messages = [
		ChatMessage(id=1, session_id=1, role="user", content="a"),
		ChatMessage(id=2, session_id=1, role="model", content="b"),
	]
	mock_db.exec.return_value = FakeExecResult(all_value=messages)

	result = await service.get_session_messages(1)

	assert result == messages
	mock_db.exec.assert_awaited_once()


def test_format_history_for_llm_maps_roles_correctly(service):
	messages = [
		ChatMessage(id=1, session_id=1, role="user", content="Pytanie"),
		ChatMessage(id=2, session_id=1, role="model", content="Odpowiedz"),
	]

	result = service.format_history_for_llm(messages)

	assert result == [
		{"role": "user", "content": "Pytanie"},
		{"role": "assistant", "content": "Odpowiedz"},
	]


@pytest.mark.asyncio
async def test_get_user_sessions_returns_limited_sessions(service, mock_db):
	sessions = [
		ChatSession(id=3, user_id="u1", problem_slug="p3"),
		ChatSession(id=2, user_id="u1", problem_slug="p2"),
	]
	mock_db.exec.return_value = FakeExecResult(all_value=sessions)

	result = await service.get_user_sessions("u1", limit=2)

	assert result == sessions
	mock_db.exec.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_session_raises_if_session_missing(service, mock_db):
	mock_db.exec.return_value = FakeExecResult(first_value=None)

	with pytest.raises(SessionNotFoundError):
		await service.delete_session(123, "u1")

	mock_db.delete.assert_not_called()
	mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_delete_session_raises_if_unauthorized(service, mock_db):
	session = ChatSession(id=5, user_id="owner", problem_slug="x")
	mock_db.exec.return_value = FakeExecResult(first_value=session)

	with pytest.raises(UnauthorizedSessionError):
		await service.delete_session(5, "other")

	mock_db.delete.assert_not_called()
	mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_delete_session_removes_owned_session(service, mock_db):
	session = ChatSession(id=5, user_id="owner", problem_slug="x")
	mock_db.exec.return_value = FakeExecResult(first_value=session)

	await service.delete_session(5, "owner")

	mock_db.delete.assert_awaited_once_with(session)
	mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_message_raises_when_session_missing(service, mock_db):
	mock_db.exec.return_value = FakeExecResult(first_value=None)

	with pytest.raises(SessionNotFoundError):
		await service.delete_message(1, 99, "u1")

	mock_db.delete.assert_not_called()
	mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_delete_message_raises_when_unauthorized(service, mock_db):
	session = ChatSession(id=8, user_id="owner", problem_slug="x")
	mock_db.exec.return_value = FakeExecResult(first_value=session)

	with pytest.raises(UnauthorizedSessionError):
		await service.delete_message(1, 8, "other")

	mock_db.delete.assert_not_called()
	mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_delete_message_raises_when_message_not_found(service, mock_db):
	session = ChatSession(id=8, user_id="owner", problem_slug="x")
	mock_db.exec.side_effect = [
		FakeExecResult(first_value=session),
		FakeExecResult(first_value=None),
	]

	with pytest.raises(MessageNotFoundError):
		await service.delete_message(77, 8, "owner")

	mock_db.delete.assert_not_called()
	mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_delete_message_removes_existing_message(service, mock_db):
	session = ChatSession(id=8, user_id="owner", problem_slug="x")
	message = SimpleNamespace(id=9, session_id=8)
	mock_db.exec.side_effect = [
		FakeExecResult(first_value=session),
		FakeExecResult(first_value=message),
	]

	await service.delete_message(9, 8, "owner")

	mock_db.delete.assert_awaited_once_with(message)
	mock_db.commit.assert_awaited_once()
