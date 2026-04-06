from app.core.config import settings
from app.services.llm.providers.open_router import OpenRouterClient
import json

import pytest


def create_client(monkeypatch) -> OpenRouterClient:
	monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "test-key")
	monkeypatch.setattr(settings, "OPENROUTER_BASE_URL", "https://openrouter.test")
	monkeypatch.setattr(settings, "DEFAULT_MODEL", "openai/gpt-4o-mini")
	monkeypatch.setattr(
		settings,
		"AVAILABLE_MODELS",
		"openai/gpt-4o-mini,anthropic/claude-3-5-sonnet",
	)
	return OpenRouterClient()


def test_init_raises_when_api_key_missing(monkeypatch):
	monkeypatch.setattr(settings, "OPENROUTER_API_KEY", None)

	with pytest.raises(ValueError):
		OpenRouterClient()


def test_get_available_models_parses_config(monkeypatch):
	client = create_client(monkeypatch)

	models = client.get_available_models()

	assert models == ["openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet"]


def test_is_model_available_checks_short_model_name(monkeypatch):
	client = create_client(monkeypatch)

	assert client.is_model_available("gpt-4o-mini") is True
	assert client.is_model_available("missing-model") is False


def test_validate_model_uses_exact_available_model(monkeypatch):
	client = create_client(monkeypatch)

	selected = client.validate_model("claude-3-5-sonnet")

	assert selected == "anthropic/claude-3-5-sonnet"


def test_validate_model_falls_back_to_default(monkeypatch):
	client = create_client(monkeypatch)

	selected = client.validate_model("not-available")

	assert selected == "openai/gpt-4o-mini"


def test_format_topics_and_languages(monkeypatch):
	client = create_client(monkeypatch)

	topics_output = client._format_topics(
		[{"topic": "arrays", "successRate": 80, "solved": 8, "attempted": 10}]
	)
	languages_output = client._format_languages(
		[{"language": "python", "submissions": 12, "successRate": 75, "avgExecutionTime": 15}]
	)

	assert "arrays" in topics_output
	assert "8/10" in topics_output
	assert "Python" in languages_output
	assert "12 submissions" in languages_output


def test_build_readme_prompt_contains_key_values(monkeypatch):
	client = create_client(monkeypatch)
	stats = {
		"problemsAttempted": 50,
		"problemsSolved": 35,
		"successRate": 70,
		"streak": {"currentStreak": 5, "longestStreak": 10, "activeToday": True},
		"aiFeedbackByType": {"total": 2, "bug": 1, "cleanCode": 1},
	}

	prompt = client._build_readme_prompt(stats)

	assert "Problems Attempted" in prompt
	assert "50" in prompt
	assert "Current Streak" in prompt
	assert "5 days" in prompt


def test_get_fallback_content_returns_valid_shape(monkeypatch):
	client = create_client(monkeypatch)
	stats = {
		"problemsSolved": 110,
		"successRate": 78,
		"streak": {"currentStreak": 14},
		"difficultyBreakdown": {"hard": 3},
	}

	fallback = client._get_fallback_content(stats)

	assert fallback.headline.startswith("Seasoned Problem Solver")
	assert len(fallback.keyStrengths) >= 3
	assert len(fallback.growthAreas) >= 2
	assert len(fallback.recommendedFocus) >= 2


@pytest.mark.asyncio
async def test_analyze_code_returns_parsed_response(monkeypatch):
	client = create_client(monkeypatch)

	class FakeResponse:
		class Choice:
			class Msg:
				content = json.dumps({"content": "ok", "feedback_type": "INFO", "severity": "INFO"})

			message = Msg()

		choices = [Choice()]

	completions = type("Completions", (), {"create": staticmethod(lambda **kwargs: None)})

	async def create(**kwargs):
		return FakeResponse()

	fake_client = type(
		"C",
		(),
		{
			"chat": type(
				"Chat",
				(),
				{"completions": type("Completions", (), {"create": staticmethod(create)})()},
			)()
		},
	)()

	monkeypatch.setattr(client, "_get_client", lambda: fake_client)

	result = await client.analyze_code("print(1)", "desc", model="gpt-4o-mini")

	assert result["content"] == "ok"


@pytest.mark.asyncio
async def test_analyze_code_returns_fallback_on_error(monkeypatch):
	client = create_client(monkeypatch)

	def broken_client():
		raise RuntimeError("network")

	monkeypatch.setattr(client, "_get_client", broken_client)

	result = await client.analyze_code("print(1)", "desc")

	assert result["severity"] == "ERROR"


@pytest.mark.asyncio
async def test_stream_tutor_chat_yields_chunks(monkeypatch):
	client = create_client(monkeypatch)

	class Delta:
		def __init__(self, content):
			self.content = content

	class Choice:
		def __init__(self, content):
			self.delta = Delta(content)

	class Chunk:
		def __init__(self, content):
			self.choices = [Choice(content)]

	async def fake_stream():
		yield Chunk("a")
		yield Chunk("b")

	async def create(**kwargs):
		return fake_stream()

	fake_client = type(
		"C",
		(),
		{
			"chat": type(
				"Chat",
				(),
				{"completions": type("Completions", (), {"create": staticmethod(create)})()},
			)()
		},
	)()

	monkeypatch.setattr(client, "_get_client", lambda: fake_client)

	chunks = []
	async for c in client.stream_tutor_chat("code", "desc", [], "msg", model="gpt-4o-mini"):
		chunks.append(c)

	assert chunks == ["a", "b"]


@pytest.mark.asyncio
async def test_stream_tutor_chat_yields_error_marker_on_exception(monkeypatch):
	client = create_client(monkeypatch)

	def broken_client():
		raise RuntimeError("down")

	monkeypatch.setattr(client, "_get_client", broken_client)

	chunks = []
	async for c in client.stream_tutor_chat("code", "desc", [], "msg"):
		chunks.append(c)

	assert "[Error: down]" in chunks[0]


@pytest.mark.asyncio
async def test_generate_readme_content_success(monkeypatch):
	client = create_client(monkeypatch)
	parsed = {
		"headline": "h",
		"bio": "b",
		"keyStrengths": ["s1", "s2", "s3"],
		"growthAreas": ["g1", "g2"],
		"recommendedFocus": ["r1", "r2"],
		"motivationalQuote": "q",
		"codeQualityAnalysis": "a",
		"personalizedRecommendations": "- x",
		"summary": "sum",
	}

	class FakeResponse:
		class Choice:
			class Msg:
				content = json.dumps(parsed)

			message = Msg()

		choices = [Choice()]

	async def create(**kwargs):
		return FakeResponse()

	fake_client = type(
		"C",
		(),
		{
			"chat": type(
				"Chat",
				(),
				{"completions": type("Completions", (), {"create": staticmethod(create)})()},
			)()
		},
	)()

	monkeypatch.setattr(client, "_get_client", lambda: fake_client)

	result = await client.generate_readme_content({"problemsSolved": 1}, model="gpt-4o-mini")

	assert result.headline == "h"


@pytest.mark.asyncio
async def test_generate_readme_content_falls_back_on_exception(monkeypatch):
	client = create_client(monkeypatch)

	def broken_client():
		raise RuntimeError("network")

	monkeypatch.setattr(client, "_get_client", broken_client)

	result = await client.generate_readme_content({"problemsSolved": 1})

	assert result.headline
