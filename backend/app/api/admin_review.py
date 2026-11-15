"""관리자 문서 검토: 추출값·검증 이유와 저장된 원문 텍스트를 조회한다."""
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from fastapi.concurrency import run_in_threadpool

from app.api.admin_auth import require_admin
from app.api.authn import user_lock
from app.config import get_settings
from app.schemas import AnalysisResult
from app.services.account_state import require_active
from app.services.admin_operations import get_operations
from app.services.store import get_store

router = APIRouter(prefix="/api/admin/documents")
REVIEW_STATUSES = {"needs_review", "unverified"}


def review_record(owner_uid, doc_id, identity):
    require_admin(identity)
    require_active(owner_uid)
    store = get_store(owner_uid)
    record = store.get_record(doc_id)
    if not record:
        raise HTTPException(404, "문서를 찾을 수 없어요.")
    if not record.get("analysis"):
        raise HTTPException(409, "아직 확인할 분석 결과가 없어요. 문서의 분석 상태를 확인해 주세요.")
    return store, record, AnalysisResult.model_validate(record["analysis"])


@router.get("/{owner_uid}/{doc_id}/review")
async def document_review(
    owner_uid: str = Path(min_length=1, max_length=128, pattern=r"^[^/]+$"),
    doc_id: str = Path(min_length=1, max_length=128, pattern=r"^[^/]+$"),
    identity=Depends(require_admin),
):
    def read():
        store, record, analysis = review_record(owner_uid, doc_id, identity)
        source = store.get_source(doc_id)
        get_operations().audit(identity["uid"], "document_review_view", f"{owner_uid}/{doc_id}")
        # 검토 화면을 연 문서의 내용만 반환한다. 일반 목록에는 원문/추출값을 포함하지 않는다.
        return {
            "documentId": doc_id, "ownerUid": owner_uid,
            "title": record.get("title") or analysis.title,
            "status": record.get("status"), "updatedAt": record.get("updated_at") or "",
            "reviewThreshold": get_settings().review_threshold,
            "reviewCount": sum(field.status in REVIEW_STATUSES for field in analysis.fields),
            "fields": [field.model_dump(mode="json", exclude={"llm_confidence"}) for field in analysis.fields],
            "warnings": analysis.warnings,
            "sourceAvailable": bool(source and source.pages),
            "pageCount": len(source.pages) if source else 0,
            "sourceKind": source.source_kind if source else record.get("source_kind"),
        }
    async with user_lock(owner_uid):
        return await run_in_threadpool(read)


@router.get("/{owner_uid}/{doc_id}/review/source")
async def review_source(
    owner_uid: str = Path(min_length=1, max_length=128, pattern=r"^[^/]+$"),
    doc_id: str = Path(min_length=1, max_length=128, pattern=r"^[^/]+$"),
    page: int = Query(1, ge=1),
    field_id: str = Query("", max_length=128),
    updated_at: str | None = Query(None, max_length=100),
    identity=Depends(require_admin),
):
    def read():
        store, record, analysis = review_record(owner_uid, doc_id, identity)
        if updated_at is not None and updated_at != (record.get("updated_at") or ""):
            raise HTTPException(409, "문서가 변경됐어요. 검토 화면을 새로고침한 뒤 원문을 다시 열어 주세요.")
        source = store.get_source(doc_id)
        if not source or not source.pages:
            raise HTTPException(404, "저장된 원문 텍스트를 찾을 수 없어요.")
        if page > len(source.pages):
            raise HTTPException(404, "원문 페이지를 찾을 수 없어요.")
        field = next((item for item in analysis.fields if item.id == field_id), None) if field_id else None
        if field_id and field is None:
            raise HTTPException(409, "검토 항목이 변경됐어요. 검토 화면을 새로고침해 주세요.")
        text = source.pages[page - 1]
        segments = [{"text": text, "highlight": False}]
        highlight_kind = "none"
        if field:
            evidence = field.evidence
            start, end = evidence.char_start, evidence.char_end
            page_start = sum(len(part) + 2 for part in source.pages[:page - 1])
            if start is not None and end is not None:
                left, right = max(0, start - page_start), min(len(text), end - page_start)
                if 0 <= left < right <= len(text):
                    # 서버에서 문자열을 나눠 Python/JS의 이모지 문자 오프셋 차이를 피한다.
                    segments = [{"text": text[:left], "highlight": False},
                                {"text": text[left:right], "highlight": True},
                                {"text": text[right:], "highlight": False}]
                    grounded = field.status != "unverified" and any(
                        check.name == "evidence_found" and check.passed for check in field.checks)
                    highlight_kind = "evidence" if grounded else "candidate"
        origin = source.page_sources[page - 1] if len(source.page_sources) >= page else None
        get_operations().audit(identity["uid"], "document_source_view", f"{owner_uid}/{doc_id}/page-{page}")
        return {"page": page, "pageCount": len(source.pages), "segments": segments,
                "highlightKind": highlight_kind,
                "origin": origin.model_dump(mode="json") if origin else None}
    async with user_lock(owner_uid):
        return await run_in_threadpool(read)
