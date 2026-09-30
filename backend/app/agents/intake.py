"""AGENT 01 · 문서 접수 에이전트

다양한 입력(텍스트, PDF, 이미지)을 페이지별 원문 텍스트로 바꾸고 개인정보를 마스킹한다.
- 텍스트 PDF: pypdf로 직접 추출 (LLM 비용 0, 원문 그대로라 근거 검증에 유리)
- 스캔 PDF / 이미지: Gemini 멀티모달로 받아쓰기
"""
from __future__ import annotations

import io

from pypdf import PdfReader

from app.llm.base import LLMProvider
from app.schemas import SourceDocument
from app.utils.text import mask_pii

SUPPORTED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"}
_MIN_PDF_TEXT_CHARS = 30  # 이보다 적으면 스캔 PDF로 보고 OCR


class IntakeError(ValueError):
    pass


def _finalize(kind: str, pages: list[str]) -> SourceDocument:
    masked_pages, total = [], 0
    for p in pages:
        text, n = mask_pii(p.replace("\r\n", "\n").strip())
        masked_pages.append(text)
        total += n
    if not any(p.strip() for p in masked_pages):
        raise IntakeError("문서에서 텍스트를 찾지 못했습니다.")
    return SourceDocument(source_kind=kind, pages=masked_pages, masked_count=total)


def from_text(text: str) -> SourceDocument:
    pages = [p for p in text.split("\f")]  # 폼피드로 페이지를 나눌 수 있게
    return _finalize("text", pages)


def from_pdf(data: bytes, llm: LLMProvider) -> SourceDocument:
    try:
        reader = PdfReader(io.BytesIO(data))
        pages = [(page.extract_text() or "") for page in reader.pages]
    except Exception as e:  # 손상된 PDF
        raise IntakeError(f"PDF를 읽을 수 없습니다: {e}") from e
    if sum(len(p.strip()) for p in pages) >= _MIN_PDF_TEXT_CHARS:
        return _finalize("pdf", pages)
    return _finalize("pdf", llm.transcribe(data, "application/pdf"))


def from_image(data: bytes, mime_type: str, llm: LLMProvider) -> SourceDocument:
    if mime_type not in SUPPORTED_IMAGE_TYPES:
        raise IntakeError(f"지원하지 않는 이미지 형식: {mime_type}")
    return _finalize("image", llm.transcribe(data, mime_type))


def from_upload(data: bytes, mime_type: str, filename: str, llm: LLMProvider) -> SourceDocument:
    name = filename.lower()
    if mime_type == "application/pdf" or name.endswith(".pdf"):
        return from_pdf(data, llm)
    if mime_type.startswith("image/"):
        return from_image(data, mime_type, llm)
    if mime_type.startswith("text/") or name.endswith((".txt", ".md")):
        return from_text(data.decode("utf-8", errors="replace"))
    raise IntakeError(f"지원하지 않는 파일 형식: {mime_type or filename}")
