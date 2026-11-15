"""모든 관리자 데이터와 변경은 서버에서 권한을 다시 확인한다."""
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from app.api.admin_auth import has_admin_access, require_admin
from app.api.authn import active_uid, locked_identity, user_lock
from app.api.routes import _analyze_saved
from app.llm import get_llm
from app.services.account_state import require_active
from app.services.admin_operations import AnnouncementInput, NoticeConflict, get_operations, now_iso
from app.services.admin_directory import directory_snapshot, matches_account
from app.services.store import admin_document_summaries, get_store
from app.services.user_profiles import get_profile_store, admin_profile_summaries

router = APIRouter(prefix="/api")


@router.get("/me/access")
def access(identity=Depends(locked_identity)):
    require_active(identity["uid"])
    return {"admin": has_admin_access(identity)}


@router.get("/announcements")
def announcements(uid=Depends(active_uid)):
    fields = ("id", "title", "body", "publishedAt", "updatedAt")
    return [{key: item.get(key) for key in fields}
            for item in get_operations().list_notices() if item["published"]][:30]


@router.get("/admin/dashboard")
def dashboard(offset: int = Query(0, ge=0, le=1_000_000), identity=Depends(require_admin)):
    records = admin_document_summaries()
    failures = sorted([item for item in records if item.get("status") == "analysis_failed"],
                      key=lambda item: str(item.get("updated_at") or item.get("created_at") or ""), reverse=True)
    users = admin_profile_summaries()
    return {"stats": {"userCount": len(users), "documentCount": len(records),
                      "memberCount": sum(item.get("accountType") == "member" for item in users),
                      "guestCount": sum(item.get("accountType") == "guest" for item in users),
                      "analysisSuccessCount": sum(item.get("status") in ("in_progress", "needs_review", "completed") for item in records),
                      "analysisFailedCount": len(failures),
                      "analyzingCount": sum(item.get("status") == "analyzing" for item in records),
                      "needsReviewCount": sum(item.get("status") == "needs_review" for item in records)},
            "failures": failures[offset:offset + 50], "failureOffset": offset,
            "nextOffset": offset + 50 if offset + 50 < len(failures) else None,
            "announcements": get_operations().list_notices(), "audit": get_operations().list_audit(),
            "generatedAt": now_iso()}


@router.get("/admin/users")
def list_accounts(q: str = Query("", max_length=120), kind: Literal["all", "member", "guest", "missing"] = "all",
                  offset: int = Query(0, ge=0, le=1_000_000), identity=Depends(require_admin)):
    users, _ = directory_snapshot()
    query = q.strip().casefold()
    visible = [item for item in users if matches_account(item, query)
               and (kind == "all" or (kind == "missing" and not item["authExists"])
                    or (kind in ("member", "guest") and item["accountType"] == kind))]
    get_operations().audit(identity["uid"], "account_list_view", "users")
    return {"items": visible[offset:offset + 50], "total": len(visible), "allCount": len(users),
            "memberCount": sum(item["accountType"] == "member" for item in users),
            "guestCount": sum(item["accountType"] == "guest" for item in users),
            "missingCount": sum(not item["authExists"] for item in users), "offset": offset,
            "nextOffset": offset + 50 if offset + 50 < len(visible) else None}


@router.get("/admin/documents")
def list_admin_documents(q: str = Query("", max_length=120), owner_uid: str = Query("", max_length=128),
                         status: Literal["all", "success", "analyzing", "analysis_failed", "needs_review", "in_progress", "completed", "registered"] = "all",
                         offset: int = Query(0, ge=0, le=1_000_000), identity=Depends(require_admin)):
    users, documents = directory_snapshot()
    owners = {item["uid"]: item for item in users}
    query = q.strip().casefold()
    visible = []
    for item in documents:
        if owner_uid and item["ownerUid"] != owner_uid:
            continue
        if status == "success":
            if item.get("status") not in ("in_progress", "needs_review", "completed"):
                continue
        elif status == "registered":
            if not item["registered"]:
                continue
        elif status != "all" and item.get("status") != status:
            continue
        owner = owners.get(item["ownerUid"], {"uid": item["ownerUid"]})
        if query not in str(item.get("title") or "").casefold() and query not in item["documentId"].casefold() and not matches_account(owner, query):
            continue
        # 문서 행에는 소유자를 식별할 최소한의 정보만 붙인다.
        visible.append({**item, "owner": {key: owner.get(key) for key in ("uid", "email", "displayName", "accountType", "authExists")}})
    visible.sort(key=lambda item: (str(item.get("created_at") or ""), item["documentId"]), reverse=True)
    get_operations().audit(identity["uid"], "document_list_view", owner_uid or "all-documents")
    return {"items": visible[offset:offset + 50], "total": len(visible), "allCount": len(documents),
            "offset": offset, "nextOffset": offset + 50 if offset + 50 < len(visible) else None}


@router.post("/admin/documents/{owner_uid}/{doc_id}/retry")
async def retry_analysis(owner_uid: str, doc_id: str, identity=Depends(require_admin)):
    if len(owner_uid) > 128 or len(doc_id) > 128:
        raise HTTPException(422, "문서 식별자를 확인해 주세요.")

    def retry():
        require_active(owner_uid)
        if not get_profile_store().get(owner_uid):
            raise HTTPException(404, "사용자 계정을 찾을 수 없어요.")
        store = get_store(owner_uid)
        record = store.get_record(doc_id)
        if not record:
            raise HTTPException(404, "문서를 찾을 수 없어요.")
        if record.get("analysis") or record.get("status") != "analysis_failed":
            raise HTTPException(409, "현재 실패 상태인 문서만 재처리할 수 있어요. 목록을 새로고침해 주세요.")
        target = f"{owner_uid}/{doc_id}"
        operations = get_operations()
        operations.audit(identity["uid"], "analysis_retry", target, "started")
        try:
            _analyze_saved(doc_id, get_llm(), store)
        except Exception:
            operations.audit(identity["uid"], "analysis_retry", target, "failed")
            raise
        operations.audit(identity["uid"], "analysis_retry", target)
        return {"documentId": doc_id, "status": (store.get_record(doc_id) or {}).get("status")}

    async with user_lock(owner_uid):
        return await run_in_threadpool(retry)


def save_notice(notice_id, body, identity, create=False):
    try:
        return get_operations().save_notice(notice_id, body, identity["uid"], create=create)
    except KeyError as exc:
        raise HTTPException(404, "공지를 찾을 수 없어요.") from exc
    except NoticeConflict as exc:
        raise HTTPException(409, "다른 관리자가 공지를 변경했어요. 새로고침 후 다시 수정해 주세요.") from exc


@router.get("/admin/announcements")
def list_admin_announcements(identity=Depends(require_admin)):
    return get_operations().list_notices()


@router.get("/admin/audit")
def list_admin_audit(identity=Depends(require_admin)):
    return get_operations().list_audit()


@router.post("/admin/announcements", status_code=201)
def create_announcement(body: AnnouncementInput, identity=Depends(require_admin)):
    return save_notice(uuid.uuid4().hex, body, identity, create=True)


@router.put("/admin/announcements/{notice_id}")
def update_announcement(notice_id: str, body: AnnouncementInput, identity=Depends(require_admin)):
    return save_notice(notice_id, body, identity)
