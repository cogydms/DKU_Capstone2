from __future__ import annotations

import re

from app.schemas import Sentence, SourceDocument

# 한국어 공지문 문장 경계: "~니다." "~요." 뒤 공백, 물음/느낌표 뒤 공백, 줄바꿈.
# "2026. 9. 25." 같은 날짜 속 마침표에서 자르지 않도록 일반 마침표로는 자르지 않는다.
_SENT_BOUNDARY = re.compile(r"(?<=[다요]\.)\s+|(?<=[!?])\s+|\n+")
_STRIP_CHARS = re.compile(r"[\s\"'“”‘’`·•▶▷■□◆◇○●※]")


def normalize(s: str) -> str:
    """공백·따옴표·글머리표를 제거해서 OCR/LLM의 사소한 차이를 흡수한다."""
    return _STRIP_CHARS.sub("", s)


def split_sentences(doc: SourceDocument) -> list[Sentence]:
    sentences: list[Sentence] = []
    offset = 0
    for page_no, page in enumerate(doc.pages, start=1):
        idx = 0
        pos = 0
        for m in list(_SENT_BOUNDARY.finditer(page)) + [None]:
            end = m.start() if m else len(page)
            chunk = page[pos:end]
            stripped = chunk.strip()
            if stripped:
                lead = len(chunk) - len(chunk.lstrip())
                idx += 1
                s = offset + pos + lead
                sentences.append(
                    Sentence(page=page_no, index=idx, text=stripped, char_start=s, char_end=s + len(stripped))
                )
            if m:
                pos = m.end()
        offset += len(page) + 2  # SourceDocument.full_text 의 "\n\n" 구분자
    return sentences


# ─────────────── 개인정보 마스킹 (LLM에 보내기 전) ───────────────
_PII = [
    (re.compile(r"\b\d{6}\s*-\s*[1-4]\d{6}\b"), "[주민번호]"),
    (re.compile(r"\b01[016789]\s*-?\s*\d{3,4}\s*-?\s*\d{4}\b"), "[휴대전화]"),
]


def mask_pii(text: str) -> tuple[str, int]:
    count = 0
    for pat, repl in _PII:
        text, n = pat.subn(repl, text)
        count += n
    return text, count
