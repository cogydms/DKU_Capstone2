"""AnalysisResult → 프론트 mockData.analysisDetail 과 같은 모양으로 변환.

프론트 화면(AIAnalysisScreen, EvidenceCheckScreen)은 import 만 API 응답으로 바꾸면 그대로 동작한다.
"""
from __future__ import annotations

from datetime import date

from app.schemas import AnalysisResult, FieldKey, VerifiedField
from app.utils.dates import parse_iso


def _usable(fields: list[VerifiedField], key: FieldKey) -> list[VerifiedField]:
    return [f for f in fields if f.key == key and f.status != "unverified"]


def dday(a: AnalysisResult, today: date) -> int | None:
    """프론트 규칙: D-5 → -5"""
    dl = next(iter(_usable(a.fields, FieldKey.DEADLINE)), None)
    d = parse_iso(dl.normalized_datetime) if dl else None
    if not d or not d.year:
        return None
    return -(date(d.year, d.month, d.day) - today).days


def to_analysis_detail(a: AnalysisResult) -> dict:
    criteria = _usable(a.fields, FieldKey.APPLICANT_CRITERIA)
    todos = _usable(a.fields, FieldKey.TODO)
    deadline = next(iter(_usable(a.fields, FieldKey.DEADLINE)), None)
    docs = _usable(a.fields, FieldKey.REQUIRED_DOCUMENT)
    method = next(iter(_usable(a.fields, FieldKey.SUBMISSION_METHOD)), None)

    # 근거 화면: 핵심 필드의 원문 문장을 원문 순서대로 모은다
    key_fields = [*criteria, *([deadline] if deadline else []), *([method] if method else [])]
    spans = sorted({(f.evidence.char_start, f.evidence.matched_text) for f in key_fields if f.evidence.matched_text},
                   key=lambda x: x[0] or 0)
    ev_fields = []
    if criteria:
        ev_fields.append({"label": "신청 대상", "value": " / ".join(c.value for c in criteria),
                          "confidence": min(c.confidence for c in criteria)})
    if deadline:
        ev_fields.append({"label": "마감일", "value": deadline.value, "confidence": deadline.confidence})
    if method:
        ev_fields.append({"label": "제출 방법", "value": method.value, "confidence": method.confidence})

    return {
        "id": a.document_id,
        "title": a.title,
        "docType": a.doc_subtype,
        "docCategory": a.doc_category.value,
        "applicantCriteria": [{"text": c.value, "confidence": c.confidence} for c in criteria],
        "todos": [{"id": f"t{i}", "text": t.value, "confidence": t.confidence} for i, t in enumerate(todos, 1)],
        "deadline": {"text": deadline.value, "confidence": deadline.confidence,
                     "datetime": deadline.normalized_datetime} if deadline else None,
        "requiredDocs": [d.value for d in docs],
        "evidence": {
            "location": (deadline or (key_fields[0] if key_fields else None)).location if key_fields else None,
            "sourceExcerpt": " ".join(t for _, t in spans),
            "fields": ev_fields,
        },
        "needsReview": a.needs_review,
        "warnings": a.warnings,
    }


def to_list_item(a: AnalysisResult, today: date) -> dict:
    """프론트 mockData.documents 모양"""
    return {
        "id": a.document_id,
        "title": a.title,
        "type": f"{a.doc_category.value} 문서",
        "dday": dday(a, today),
        "status": "needs_review" if a.needs_review else "in_progress",
    }
