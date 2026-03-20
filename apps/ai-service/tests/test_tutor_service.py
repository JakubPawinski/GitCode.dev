from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from app.services.tutor import tutor_service as tutor_module


async def collect_stream(gen):
	chunks = []
	error = None
	try:
		async for chunk in gen:
			chunks.append(chunk)
	except Exception as exc:
		error = exc
	return chunks, error


@pytest.mark.asyncio
async def test_stream_chat_response_success(monkeypatch):
	fake_history = SimpleNamespace(
		get_or_create_session=AsyncMock(return_value=SimpleNamespace(id=10)),
		add_message=AsyncMock(side_effect=[SimpleNamespace(id=101), SimpleNamespace(id=102)]),
		get_session_messages=AsyncMock(return_value=[SimpleNamespace(role="user", content="q")]),
		format_history_for_llm=Mock(return_value=[]),
	)

	async def stream_ok(**kwargs):
		yield "A"
		yield "B"

	fake_llm = SimpleNamespace(stream_tutor_chat=stream_ok)

	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: fake_llm)

	service = tutor_module.TutorService(db=object())

	chunks, error = await collect_stream(
		service.stream_chat_response(
			user_id="u1",
			problem_slug="two-sum",
			code="print(1)",
			message="help",
			problem_description="desc",
			model="gpt",
		)
	)

	assert error is None
	assert chunks == ["A", "B"]
	assert fake_history.add_message.await_count == 2
	_, kwargs = fake_history.add_message.await_args_list[1]
	assert kwargs["role"] == "assistant"
	assert kwargs["content"] == "AB"


@pytest.mark.asyncio
async def test_stream_chat_response_stream_failure_yields_error_and_raises(monkeypatch):
	fake_history = SimpleNamespace(
		get_or_create_session=AsyncMock(return_value=SimpleNamespace(id=20)),
		add_message=AsyncMock(side_effect=[SimpleNamespace(id=201), SimpleNamespace(id=202)]),
		get_session_messages=AsyncMock(return_value=[SimpleNamespace(role="user", content="q")]),
		format_history_for_llm=Mock(return_value=[]),
	)

	async def stream_broken(**kwargs):
		yield "chunk"
		raise RuntimeError("stream broken")

	fake_llm = SimpleNamespace(stream_tutor_chat=stream_broken)

	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: fake_llm)

	service = tutor_module.TutorService(db=object())

	chunks, error = await collect_stream(
		service.stream_chat_response(
			user_id="u1",
			problem_slug="two-sum",
			code="print(1)",
			message="help",
			problem_description="desc",
			model="gpt",
		)
	)

	assert isinstance(error, RuntimeError)
	assert chunks[0] == "chunk"
	assert "[Stream interrupted: stream broken]" in chunks[1]
	_, kwargs = fake_history.add_message.await_args_list[1]
	assert "[Stream interrupted: stream broken]" in kwargs["content"]


@pytest.mark.asyncio
async def test_stream_chat_response_initialization_failure(monkeypatch):
	fake_history = SimpleNamespace(
		get_or_create_session=AsyncMock(side_effect=RuntimeError("db down")),
		add_message=AsyncMock(),
		get_session_messages=AsyncMock(),
		format_history_for_llm=Mock(return_value=[]),
	)

	async def stream_unused(**kwargs):
		if False:
			yield "never"

	fake_llm = SimpleNamespace(stream_tutor_chat=stream_unused)

	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: fake_llm)

	service = tutor_module.TutorService(db=object())

	chunks, error = await collect_stream(
		service.stream_chat_response(
			user_id="u1",
			problem_slug="two-sum",
			code="print(1)",
			message="help",
			problem_description="desc",
			model="gpt",
		)
	)

	assert isinstance(error, RuntimeError)
	assert chunks == ["Failed to initialize chat session"]
	fake_history.add_message.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_session_messages_delegates_to_history_service(monkeypatch):
	expected_session = SimpleNamespace(id=5)
	expected_messages = [SimpleNamespace(content="x")]
	fake_history = SimpleNamespace(
		get_or_create_session=AsyncMock(return_value=expected_session),
		get_session_messages=AsyncMock(return_value=expected_messages),
	)

	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace())

	service = tutor_module.TutorService(db=object())
	session, messages = await service.get_session_messages("u1", "two-sum")

	assert session is expected_session
	assert messages == expected_messages


@pytest.mark.asyncio
async def test_delete_session_rethrows_domain_exception(monkeypatch):
	fake_history = SimpleNamespace(
		delete_session=AsyncMock(side_effect=tutor_module.SessionNotFoundError("missing")),
	)

	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace())

	service = tutor_module.TutorService(db=object())

	with pytest.raises(tutor_module.SessionNotFoundError):
		await service.delete_session(1, "u1")


@pytest.mark.asyncio
async def test_get_user_sessions_delegates(monkeypatch):
	fake_history = SimpleNamespace(get_user_sessions=AsyncMock(return_value=[{"id": 1}]))

	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace())

	service = tutor_module.TutorService(db=object())
	result = await service.get_user_sessions("u1", limit=3)

	assert result == [{"id": 1}]


@pytest.mark.asyncio
async def test_delete_message_delegates(monkeypatch):
	fake_history = SimpleNamespace(delete_message=AsyncMock())

	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace())

	service = tutor_module.TutorService(db=object())
	await service.delete_message(10, 20, "u1")

	fake_history.delete_message.assert_awaited_once_with(10, 20, "u1")


@pytest.mark.asyncio
async def test_stream_chat_response_save_assistant_failure_warns(monkeypatch):
	fake_history = SimpleNamespace(
		get_or_create_session=AsyncMock(return_value=SimpleNamespace(id=30)),
		add_message=AsyncMock(side_effect=[SimpleNamespace(id=301), RuntimeError("save failed")]),
		get_session_messages=AsyncMock(return_value=[SimpleNamespace(role="user", content="q")]),
		format_history_for_llm=lambda msgs: [],
	)

	async def stream_ok(**kwargs):
		yield "ok"

	fake_llm = SimpleNamespace(stream_tutor_chat=stream_ok)

	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: fake_llm)

	service = tutor_module.TutorService(db=object())

	chunks, error = await collect_stream(
		service.stream_chat_response(
			user_id="u1",
			problem_slug="p",
			code="c",
			message="m",
			problem_description="d",
		)
	)

	assert error is None
	assert any("Response not saved to history" in c for c in chunks)


@pytest.mark.asyncio
async def test_stream_chat_response_user_message_save_failure(monkeypatch):
	fake_history = SimpleNamespace(
		get_or_create_session=AsyncMock(return_value=SimpleNamespace(id=40)),
		add_message=AsyncMock(side_effect=RuntimeError("save user failed")),
		get_session_messages=AsyncMock(),
		format_history_for_llm=lambda msgs: [],
	)
	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace(stream_tutor_chat=lambda **kwargs: None))

	service = tutor_module.TutorService(db=object())
	chunks, error = await collect_stream(
		service.stream_chat_response(
			user_id="u1",
			problem_slug="p",
			code="c",
			message="m",
			problem_description="d",
		)
	)

	assert isinstance(error, RuntimeError)
	assert chunks == ["Failed to save your message"]


@pytest.mark.asyncio
async def test_stream_chat_response_history_load_failure(monkeypatch):
	fake_history = SimpleNamespace(
		get_or_create_session=AsyncMock(return_value=SimpleNamespace(id=41)),
		add_message=AsyncMock(return_value=SimpleNamespace(id=401)),
		get_session_messages=AsyncMock(side_effect=RuntimeError("history fail")),
		format_history_for_llm=lambda msgs: [],
	)
	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace(stream_tutor_chat=lambda **kwargs: None))

	service = tutor_module.TutorService(db=object())
	chunks, error = await collect_stream(
		service.stream_chat_response(
			user_id="u1",
			problem_slug="p",
			code="c",
			message="m",
			problem_description="d",
		)
	)

	assert isinstance(error, RuntimeError)
	assert chunks == ["Failed to load chat history"]


@pytest.mark.asyncio
async def test_get_session_messages_rethrows_unexpected(monkeypatch):
	fake_history = SimpleNamespace(get_or_create_session=AsyncMock(side_effect=RuntimeError("db")))
	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace())
	service = tutor_module.TutorService(db=object())

	with pytest.raises(RuntimeError):
		await service.get_session_messages("u1", "p")


@pytest.mark.asyncio
async def test_get_user_sessions_rethrows_unexpected(monkeypatch):
	fake_history = SimpleNamespace(get_user_sessions=AsyncMock(side_effect=RuntimeError("db")))
	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace())
	service = tutor_module.TutorService(db=object())

	with pytest.raises(RuntimeError):
		await service.get_user_sessions("u1")


@pytest.mark.asyncio
async def test_delete_session_rethrows_unexpected(monkeypatch):
	fake_history = SimpleNamespace(delete_session=AsyncMock(side_effect=RuntimeError("db")))
	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace())
	service = tutor_module.TutorService(db=object())

	with pytest.raises(RuntimeError):
		await service.delete_session(1, "u1")


@pytest.mark.asyncio
async def test_delete_message_rethrows_unexpected(monkeypatch):
	fake_history = SimpleNamespace(delete_message=AsyncMock(side_effect=RuntimeError("db")))
	monkeypatch.setattr(tutor_module, "ChatHistoryService", lambda db: fake_history)
	monkeypatch.setattr(tutor_module, "OpenRouterClient", lambda: SimpleNamespace())
	service = tutor_module.TutorService(db=object())

	with pytest.raises(RuntimeError):
		await service.delete_message(1, 2, "u1")
