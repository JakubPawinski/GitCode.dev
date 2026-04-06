from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.services.readme_generator.readme_generator_service import ReadmeGeneratorService


def test_normalize_stats_applies_defaults(monkeypatch):
    monkeypatch.setattr(
        "app.services.readme_generator.readme_generator_service.OpenRouterClient",
        lambda: SimpleNamespace(generate_readme_content=AsyncMock()),
    )
    service = ReadmeGeneratorService()

    normalized = service._normalize_stats({"problemsSolved": 5})

    assert normalized["problemsSolved"] == 5
    assert normalized["streak"]["currentStreak"] == 0
    assert normalized["difficultyBreakdown"]["easy"] == 0
    assert normalized["topicStats"] == []


@pytest.mark.asyncio
async def test_generate_readme_renders_template(monkeypatch):
    fake_ai = SimpleNamespace(model_dump=lambda: {"headline": "h", "bio": "b"})
    fake_llm = SimpleNamespace(generate_readme_content=AsyncMock(return_value=fake_ai))

    monkeypatch.setattr(
        "app.services.readme_generator.readme_generator_service.OpenRouterClient",
        lambda: fake_llm,
    )

    service = ReadmeGeneratorService()

    user_data = {"username": "user", "githubUsername": "gh", "email": "u@example.com", "avatarUrl": ""}
    stats_data = {"problemsSolved": 3}

    result = await service.generate_readme(user_data, stats_data)

    assert isinstance(result, str)
    assert len(result) > 0
    fake_llm.generate_readme_content.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_ai_content_only_returns_llm_result(monkeypatch):
    expected = {"headline": "x"}
    fake_llm = SimpleNamespace(generate_readme_content=AsyncMock(return_value=expected))

    monkeypatch.setattr(
        "app.services.readme_generator.readme_generator_service.OpenRouterClient",
        lambda: fake_llm,
    )

    service = ReadmeGeneratorService()
    result = await service.get_ai_content_only({"problemsSolved": 1})

    assert result == expected