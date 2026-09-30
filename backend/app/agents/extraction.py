"""AGENT 02 · 행동 정보 추출 에이전트

문장 번호가 붙은 원문을 LLM에 보내 LLMExtraction(구조화 JSON)을 받는다.
여기서는 LLM 출력을 '믿지 않는다'. 형식만 정리하고, 사실 여부는 근거 검증 에이전트가 판단한다.
"""
from __future__ import annotations

from app.llm.base import LLMProvider
from app.schemas import LLMExtraction, Sentence


def extract(sentences: list[Sentence], llm: LLMProvider, today: str) -> LLMExtraction:
    result = llm.extract(sentences, today)

    seen: set[tuple[str, str]] = set()
    cleaned = []
    for f in result.fields:
        value = (f.value or "").strip()
        if not value:
            continue
        sig = (f.key.value, value.replace(" ", ""))
        if sig in seen:
            continue
        seen.add(sig)
        f.value = value
        f.evidence_quote = (f.evidence_quote or "").strip()
        f.confidence = min(max(f.confidence, 0.0), 1.0)
        cleaned.append(f)
    result.fields = cleaned
    return result
