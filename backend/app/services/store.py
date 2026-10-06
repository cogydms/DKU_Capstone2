"""문서·분석 결과 저장소. memory(개발용) / firestore(프론트와 같은 Firebase 프로젝트)."""
from __future__ import annotations

from functools import lru_cache
from typing import Protocol

from app.config import get_settings
from app.schemas import AnalysisResult, SourceDocument


class Store(Protocol):
    def save(self, analysis: AnalysisResult, source: SourceDocument) -> None: ...
    def get(self, doc_id: str) -> tuple[AnalysisResult, SourceDocument] | None: ...
    def list(self) -> list[AnalysisResult]: ...
    def update_analysis(self, analysis: AnalysisResult) -> None: ...


class MemoryStore:
    def __init__(self):
        self._data: dict[str, tuple[AnalysisResult, SourceDocument]] = {}

    def save(self, analysis, source):
        self._data[analysis.document_id] = (analysis, source)

    def get(self, doc_id):
        return self._data.get(doc_id)

    def list(self):
        return sorted((a for a, _ in self._data.values()), key=lambda a: a.created_at, reverse=True)

    def update_analysis(self, analysis):
        _, src = self._data[analysis.document_id]
        self._data[analysis.document_id] = (analysis, src)


class FirestoreStore:
    """컬렉션 구조
    documents/{id}          : 목록용 요약 (title, category, status, deadline, created_at) + analysis 전체
    documents/{id}/source/raw : 원문 페이지 (목록 조회 시 무거운 원문을 안 읽도록 분리)
    """

    def __init__(self):
        import firebase_admin
        from firebase_admin import credentials, firestore

        settings = get_settings()

        if not firebase_admin._apps:
            if settings.google_application_credentials:
                cred = credentials.Certificate(
                    settings.google_application_credentials
                )
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()

        self.db = firestore.client()
        self.col = self.db.collection("documents")

    def _summary(self, a: AnalysisResult) -> dict:
        deadline = next((f.normalized_datetime for f in a.fields if f.key.value == "deadline"), None)
        return {
            "title": a.title,
            "type": f"{a.doc_category.value} 문서",
            "status": "needs_review" if a.needs_review else "in_progress",
            "deadline": deadline,
            "created_at": a.created_at,
            "analysis": a.model_dump(mode="json"),
        }

    def save(self, analysis, source):
        ref = self.col.document(analysis.document_id)
        ref.set(self._summary(analysis))
        ref.collection("source").document("raw").set(source.model_dump(mode="json"))

    def get(self, doc_id):
        ref = self.col.document(doc_id)
        snap = ref.get()
        if not snap.exists:
            return None
        src = ref.collection("source").document("raw").get()
        return (
            AnalysisResult.model_validate(snap.to_dict()["analysis"]),
            SourceDocument.model_validate(src.to_dict()),
        )

    def list(self):
        from firebase_admin import firestore

        snaps = self.col.order_by("created_at", direction=firestore.Query.DESCENDING).limit(50).stream()
        return [AnalysisResult.model_validate(s.to_dict()["analysis"]) for s in snaps]

    def update_analysis(self, analysis):
        self.col.document(analysis.document_id).update(self._summary(analysis))


@lru_cache
def get_store() -> Store:
    if get_settings().storage_backend == "firestore":
        return FirestoreStore()
    return MemoryStore()
