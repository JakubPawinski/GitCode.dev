from functools import lru_cache
from app.core.config import settings
from app.services.llm.base import BaseLLMClient
from app.services.llm.providers.gemini import GeminiClient
# from app.services.llm.providers.openai import OpenAIClient

@lru_cache()
def get_llm_client() -> BaseLLMClient:
    """
    Factory function to get the appropriate LLM client based on configuration.
    
    :return: An instance of BaseLLMClient
    :rtype: BaseLLMClient
    """
    
    if settings.LLM_PROVIDER == "gemini":
        return GeminiClient()
    
    # elif settings.LLM_PROVIDER == "openai":
    #     return OpenAIClient()
    
    raise ValueError(f"Unsupported LLM provider: {settings.LLM_PROVIDER}")