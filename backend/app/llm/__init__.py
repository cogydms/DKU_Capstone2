from functools import lru_cache

from app.config import get_settings
from app.llm.base import LLMProvider


@lru_cache
def get_llm() -> LLMProvider:
    s = get_settings()
    if s.llm_provider == "gemini":
        from app.llm.gemini import GeminiProvider

        return GeminiProvider(s)
    from app.llm.mock import MockProvider

    return MockProvider()
