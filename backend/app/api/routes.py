from __future__ import annotations

from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from google.genai import errors as genai_errors
from pydantic import BaseModel

from app.agents import intake
from app.config import get_settings
from app.llm import get_llm
from app.services import pipeline
from app.services.frontend_view import to_analysis_detail, to_list_item
from app.services.store import get_store
from app.utils.text import split_sentences

router = APIRouter(prefix="/api")

MAX_UPLOAD_BYTES = 15 * 1024 * 1024


def _today():
    return datetime.now(ZoneInfo(get_settings().timezone)).date()


def _response(analysis):
    return {"documentId": analysis.document_id, "view": to_analysis_detail(analysis), "analysis": analysis}


@router.post("/documents/analyze")
def analyze_document(file: Optional[UploadFile] = File(None), text: Optional[str] = Form(None)):
    """문서 접수 → 행동 정보 추출 → 근거 검증을 한 번에 실행한다.

    multipart/form-data 로 `file`(PDF·이미지·txt) 또는 `text` 중 하나를 보낸다.
    """
    llm = get_llm()
    try:
        if file is not None:
            data = file.file.read(MAX_UPLOAD_BYTES + 1)
            if len(data) > MAX_UPLOAD_BYTES:
                raise HTTPException(413, "파일은 15MB 이하만 올릴 수 있습니다.")
            source = intake.from_upload(data, file.content_type or "", file.filename or "", llm)
        elif text and text.strip():
            source = intake.from_text(text)
        else:
            raise HTTPException(400, "file 또는 text 중 하나가 필요합니다.")
    except intake.IntakeError as e:
        raise HTTPException(422, str(e)) from e
    except RuntimeError as e:  # mock 모드에서 이미지 업로드 등
        raise HTTPException(501, str(e)) from e

    try:
        analysis = pipeline.analyze(source, llm)
    except genai_errors.APIError as e:
        if e.code in (429, 503):
            raise HTTPException(503, "지금 AI 서버에 요청이 몰려 있어요. 잠시 후 다시 시도해 주세요.") from e
        raise HTTPException(502, f"AI 분석 중 오류가 났어요: {e.message or e}") from e
    get_store().save(analysis, source)
    return _response(analysis)


@router.get("/documents")
def list_documents():
    today = _today()
    return [to_list_item(a, today) for a in get_store().list()]


@router.get("/documents/{doc_id}")
def get_document(doc_id: str):
    found = get_store().get(doc_id)
    if not found:
        raise HTTPException(404, "문서를 찾을 수 없습니다.")
    return _response(found[0])


@router.get("/documents/{doc_id}/source")
def get_source(doc_id: str):
    """원문 근거 화면용: 페이지별 원문과 문장 오프셋 (하이라이트는 fields[].evidence.char_start/end 사용)"""
    found = get_store().get(doc_id)
    if not found:
        raise HTTPException(404, "문서를 찾을 수 없습니다.")
    _, source = found
    return {"pages": source.pages, "sentences": split_sentences(source)}


class ConfirmBody(BaseModel):
    value: Optional[str] = None  # 사용자가 고친 값 (없으면 그대로 승인)
    normalized_datetime: Optional[str] = None


@router.post("/documents/{doc_id}/fields/{field_id}/confirm")
def confirm_field(doc_id: str, field_id: str, body: ConfirmBody):
    """'사용자 확인 필요' 항목을 사용자가 확인/수정한다."""
    store = get_store()
    found = store.get(doc_id)
    if not found:
        raise HTTPException(404, "문서를 찾을 수 없습니다.")
    analysis, _ = found
    field = next((f for f in analysis.fields if f.id == field_id), None)
    if not field:
        raise HTTPException(404, "필드를 찾을 수 없습니다.")
    if body.value is not None:
        field.value = body.value
    if body.normalized_datetime is not None:
        field.normalized_datetime = body.normalized_datetime
    field.status = "user_confirmed"
    field.confidence = 100
    analysis.needs_review = any(f.status in ("needs_review", "unverified") for f in analysis.fields)
    store.update_analysis(analysis)
    return _response(analysis)


@router.delete("/documents/{doc_id}/fields/{field_id}")
def reject_field(doc_id: str, field_id: str):
    """잘못 추출된 항목을 사용자가 삭제한다."""
    store = get_store()
    found = store.get(doc_id)
    if not found:
        raise HTTPException(404, "문서를 찾을 수 없습니다.")
    analysis, _ = found
    before = len(analysis.fields)
    analysis.fields = [f for f in analysis.fields if f.id != field_id]
    if len(analysis.fields) == before:
        raise HTTPException(404, "필드를 찾을 수 없습니다.")
    analysis.needs_review = any(f.status in ("needs_review", "unverified") for f in analysis.fields)
    store.update_analysis(analysis)
    return _response(analysis)
