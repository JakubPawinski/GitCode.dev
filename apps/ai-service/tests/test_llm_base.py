import pytest

from app.services.llm.base import BaseLLMClient


class DummyLLMClient(BaseLLMClient):
    async def analyze_code(self, code: str, problem_description: str):
        return await BaseLLMClient.analyze_code(self, code, problem_description)

    async def generate_readme_content(self, stats: dict):
        return await BaseLLMClient.generate_readme_content(self, stats)

    async def stream_tutor_chat(self, code: str, problem_description: str, chat_history: list[dict], user_message: str):
        return await BaseLLMClient.stream_tutor_chat(self, code, problem_description, chat_history, user_message)


@pytest.mark.asyncio
async def test_base_llm_default_abstract_bodies_are_callable_via_super():
    client = DummyLLMClient()

    assert await client.analyze_code("code", "desc") is None
    assert await client.generate_readme_content({}) is None

    assert await client.stream_tutor_chat("c", "d", [], "m") is None