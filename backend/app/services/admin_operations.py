"""관리자용 공지·감사 기록. 개인 원문과 분석 내용은 이 저장소에 복사하지 않는다."""
import copy
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from threading import RLock

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.config import get_settings
from app.services.firebase_admin_client import get_firebase_app


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class AnnouncementInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=5000)
    published: bool = False
    revision: int = Field(default=0, ge=0)

    @field_validator("title", "body")
    @classmethod
    def trim_text(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("제목과 내용을 입력해 주세요.")
        return value


class NoticeConflict(Exception):
    pass


def updated_notice(body, previous, actor, notice_id):
    if body.revision != (previous or {}).get("revision", 0):
        raise NoticeConflict()
    now = now_iso()
    return {"id": notice_id, "title": body.title, "body": body.body,
            "published": body.published, "revision": body.revision + 1,
            "createdAt": (previous or {}).get("createdAt", now), "updatedAt": now,
            "publishedAt": (previous or {}).get("publishedAt") if (previous or {}).get("published") and body.published
            else now if body.published else None, "updatedBy": actor}


def audit_entry(actor, action, target, outcome="success"):
    return {"id": uuid.uuid4().hex, "actorUid": actor, "action": action,
            "target": target, "outcome": outcome, "at": now_iso()}


class MemoryOperations:
    def __init__(self):
        self.notices = {}
        self.events = []
        self.lock = RLock()

    def list_notices(self):
        with self.lock:
            return sorted(copy.deepcopy(list(self.notices.values())), key=lambda item: item["updatedAt"], reverse=True)

    def save_notice(self, notice_id, body, actor, create=False):
        with self.lock:
            previous = self.notices.get(notice_id)
            if not create and not previous:
                raise KeyError(notice_id)
            if create and previous:
                raise NoticeConflict()
            notice = updated_notice(body, previous, actor, notice_id)
            event = audit_entry(actor, "notice_publish" if body.published else "notice_save", notice_id)
            self.notices[notice_id] = notice
            self.events.append(event)
            return copy.deepcopy(notice)

    def audit(self, actor, action, target, outcome="success"):
        with self.lock:
            self.events.append(audit_entry(actor, action, target, outcome))

    def list_audit(self):
        with self.lock:
            return copy.deepcopy(sorted(self.events, key=lambda item: item["at"], reverse=True)[:30])


class FirestoreOperations:
    def __init__(self):
        from firebase_admin import firestore
        self.db = firestore.client(app=get_firebase_app())
        self.notices = self.db.collection("adminAnnouncements")
        self.events = self.db.collection("adminAudit")

    def list_notices(self):
        return sorted([snap.to_dict() for snap in self.notices.stream()], key=lambda item: item["updatedAt"], reverse=True)

    def save_notice(self, notice_id, body, actor, create=False):
        from firebase_admin import firestore
        ref = self.notices.document(notice_id)

        @firestore.transactional
        def save(transaction):
            snap = ref.get(transaction=transaction)
            if not create and not snap.exists:
                raise KeyError(notice_id)
            if create and snap.exists:
                raise NoticeConflict()
            notice = updated_notice(body, snap.to_dict() if snap.exists else None, actor, notice_id)
            event = audit_entry(actor, "notice_publish" if body.published else "notice_save", notice_id)
            transaction.set(ref, notice)
            transaction.set(self.events.document(event["id"]), event)
            return notice

        return save(self.db.transaction())

    def audit(self, actor, action, target, outcome="success"):
        entry = audit_entry(actor, action, target, outcome)
        self.events.document(entry["id"]).set(entry)

    def list_audit(self):
        return [snap.to_dict() for snap in self.events.order_by("at", direction="DESCENDING").limit(30).stream()]


_operations_lock = RLock()


@lru_cache
def _operations_store():
    return FirestoreOperations() if get_settings().storage_backend == "firestore" else MemoryOperations()


def get_operations():
    with _operations_lock:
        return _operations_store()
