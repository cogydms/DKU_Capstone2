"""관리자 계정·문서 CRUD. 실제 소유자의 잠금과 기존 삭제/계획 동기화를 사용한다."""
import re
import secrets
import time
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.concurrency import run_in_threadpool
from firebase_admin import auth, exceptions
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.api.admin_auth import require_admin
from app.api.authn import user_lock
from app.api.routes import analyze_document, _today
from app.services import originals
from app.services.account_deletion import finish_deletion
from app.services.account_state import get_account_state, require_active
from app.services.admin_directory import account_summaries
from app.services.admin_operations import get_operations
from app.services.firebase_admin_client import get_firebase_app
from app.services.preparation_plan import DocumentPatch, RevisionConflict, document_list_item
from app.services.store import admin_document_summaries, get_store
from app.services.user_profiles import ProfileSelection, admin_profile_summaries, get_profile_store, resolve_affiliation

router = APIRouter(prefix="/api/admin")


def identifier_path():
    # FastAPI는 Path 객체에 매개변수 이름을 기록하므로 매번 새 객체를 만든다.
    # 하나를 공유하면 owner_uid/doc_id까지 먼저 등록된 uid 별칭으로 덮인다.
    return Path(min_length=1, max_length=128, pattern=r"^[^/]+$")


class CreateAccount(ProfileSelection):
    email: str = Field(min_length=3, max_length=254)
    displayName: str = Field(min_length=1, max_length=100)

    @field_validator("email", "displayName")
    @classmethod
    def trim(cls, value):
        if not value.strip():
            raise ValueError("이름과 이메일을 입력해 주세요.")
        return value.strip()

    @field_validator("email")
    @classmethod
    def email_format(cls, value):
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("이메일 주소를 확인해 주세요.")
        return value


class UpdateAccount(BaseModel):
    model_config = ConfigDict(extra="forbid")
    displayName: str | None = Field(default=None, min_length=1, max_length=100)
    collegeId: str | None = Field(default=None, min_length=1, max_length=100)
    departmentId: str | None = Field(default=None, min_length=1, max_length=160)
    disabled: bool | None = None

    @model_validator(mode="after")
    def one_change(self):
        fields = self.model_fields_set
        if fields not in ({"displayName"}, {"collegeId", "departmentId"}, {"disabled"}):
            raise ValueError("이름, 소속, 사용 상태를 각각 저장해 주세요.")
        if any(getattr(self, key) is None for key in fields):
            raise ValueError("변경할 값을 입력해 주세요.")
        if self.displayName is not None:
            self.displayName = self.displayName.strip()
            if not self.displayName:
                raise ValueError("이름을 입력해 주세요.")
        return self


class DeleteConfirmation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    confirmed: Literal[True]
    targetId: str = Field(min_length=1, max_length=128)


class CreateDocument(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ownerUid: str = Field(min_length=1, max_length=128, pattern=r"^[^/]+$")
    text: str = Field(min_length=1, max_length=100_000)

    @field_validator("text")
    @classmethod
    def nonempty(cls, value):
        if not value.strip():
            raise ValueError("문서 내용을 입력해 주세요.")
        return value.strip()


class UpdateDocument(DocumentPatch):
    model_config = ConfigDict(extra="forbid")
    expectedUpdatedAt: str = Field(max_length=100)

    @model_validator(mode="after")
    def nonnull_changes(self):
        fields = self.model_fields_set - {"expectedUpdatedAt"}
        if not fields or any(getattr(self, key) is None for key in fields):
            raise ValueError("수정할 내용을 입력해 주세요.")
        return self


def recent_admin(identity):
    if not 0 <= time.time() - float(identity.get("auth_time", 0)) <= 300:
        raise HTTPException(403, {"code": "admin-reauth-required", "message": "Google 계정을 다시 확인한 뒤 진행해 주세요."})


def auth_user(uid, optional=False):
    try:
        return auth.get_user(uid, app=get_firebase_app())
    except auth.UserNotFoundError as exc:
        if optional:
            return None
        raise HTTPException(404, "인증 계정을 찾을 수 없어요.") from exc


def profile_summary(uid):
    return next((item for item in admin_profile_summaries() if item["uid"] == uid), None)


def protect_account(uid, target, identity):
    if uid == identity["uid"] or (target and (target.custom_claims or {}).get("admin") is True):
        raise HTTPException(409, "관리자 계정은 삭제하거나 사용 중지할 수 없어요. 권한 변경은 서버 운영자가 처리해야 합니다.")


async def mutate_target(uid, identity, action, target, task):
    async with user_lock(uid):
        def execute():
            # 잠금을 기다리는 동안 관리자 권한이 회수됐을 수도 있다.
            require_admin(identity)
            operations = get_operations()
            operations.audit(identity["uid"], action, target, "started")
            try:
                result = task()
            except exceptions.FirebaseError as exc:
                operations.audit(identity["uid"], action, target, "failed")
                raise HTTPException(503, "계정 서비스에 연결하지 못했어요. 목록을 새로고침해 처리 상태를 확인해 주세요.") from exc
            except Exception:
                operations.audit(identity["uid"], action, target, "failed")
                raise
            completed_target = f'{uid}/{result["documentId"]}' if action == "document_create" else target
            operations.audit(identity["uid"], action, completed_target)
            return result
        return await run_in_threadpool(execute)


@router.post("/users", status_code=201)
async def create_account(body: CreateAccount, identity=Depends(require_admin)):
    selection = ProfileSelection(collegeId=body.collegeId, departmentId=body.departmentId)
    try:
        resolve_affiliation(selection)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    uid = uuid.uuid4().hex

    def create():
        try:
            # Google 계정은 생성하지 않는다. 초기 비밀번호는 공개/저장하지 않고 소유자가 재설정한다.
            auth.create_user(uid=uid, email=body.email, display_name=body.displayName,
                             password=secrets.token_urlsafe(36), app=get_firebase_app())
        except auth.EmailAlreadyExistsError as exc:
            raise HTTPException(409, "이미 등록된 이메일이에요. 이용 계정 목록에서 검색해 주세요.") from exc
        except ValueError as exc:
            raise HTTPException(422, "계정 이름과 이메일 형식을 확인해 주세요.") from exc
        try:
            get_profile_store().save(uid, selection)
        except Exception:
            # 방금 생성한 계정만 삭제 대상으로 기록한다. 실패한 정리는 cleanup_worker가 재개한다.
            get_account_state().begin(uid)
            try:
                finish_deletion(uid)
            except Exception:
                pass
            raise
        return {"uid": uid, "email": body.email, "displayName": body.displayName}
    return await mutate_target(uid, identity, "account_create", uid, create)


@router.get("/users/{uid}")
async def read_account(uid: str = identifier_path(), identity=Depends(require_admin)):
    async with user_lock(uid):
        def read():
            profile = profile_summary(uid)
            if not profile:
                raise HTTPException(404, "이용 계정을 찾을 수 없어요.")
            get_operations().audit(identity["uid"], "account_view", uid)
            return account_summaries([profile], admin_document_summaries())[0]
        return await run_in_threadpool(read)


@router.patch("/users/{uid}")
async def update_account(body: UpdateAccount, uid: str = identifier_path(), identity=Depends(require_admin)):
    def update():
        require_active(uid)
        target = auth_user(uid)
        profile = profile_summary(uid)
        if not profile:
            raise HTTPException(404, "이용 계정을 찾을 수 없어요.")
        if body.disabled is not None:
            recent_admin(identity)
            protect_account(uid, target, identity)
            # 재활성화해도 사용 중지 전 세션은 되살리지 않는다.
            auth.revoke_refresh_tokens(uid, app=get_firebase_app())
            auth.update_user(uid, disabled=body.disabled, app=get_firebase_app())
        elif body.displayName is not None:
            auth.update_user(uid, display_name=body.displayName, app=get_firebase_app())
        else:
            if profile.get("accountType") == "guest":
                raise HTTPException(409, "게스트 계정은 회원 전환 후 소속을 설정할 수 있어요.")
            try:
                get_profile_store().save(uid, ProfileSelection(collegeId=body.collegeId, departmentId=body.departmentId))
            except ValueError as exc:
                raise HTTPException(422, str(exc)) from exc
        return {"updated": True}
    return await mutate_target(uid, identity, "account_update", uid, update)


@router.delete("/users/{uid}")
async def delete_account(body: DeleteConfirmation, uid: str = identifier_path(), identity=Depends(require_admin)):
    recent_admin(identity)
    if body.targetId != uid:
        raise HTTPException(422, "삭제할 계정을 다시 확인해 주세요.")

    def delete():
        recent_admin(identity)
        target = auth_user(uid, optional=True)
        protect_account(uid, target, identity)
        if not profile_summary(uid) and not get_account_state().pending(uid):
            raise HTTPException(404, "이용 계정을 찾을 수 없어요.")
        # 마커가 남으면 기존 백그라운드 작업이 삭제를 재시도하며, 저장 요청은 차단된다.
        finish_deletion(uid)
        return {"deleted": True}
    return await mutate_target(uid, identity, "account_delete", uid, delete)


@router.post("/documents", status_code=201)
async def create_document(body: CreateDocument, identity=Depends(require_admin)):
    def create():
        require_active(body.ownerUid)
        target = auth_user(body.ownerUid)
        if target.disabled or not profile_summary(body.ownerUid):
            raise HTTPException(409, "이용 가능한 소유자 계정을 선택해 주세요.")
        result = analyze_document(file=None, text=body.text, store=get_store(body.ownerUid))
        doc_id = result["documentId"]
        return {"documentId": doc_id, "status": get_store(body.ownerUid).get_record(doc_id).get("status")}
    return await mutate_target(body.ownerUid, identity, "document_create", body.ownerUid, create)


@router.get("/documents/{owner_uid}/{doc_id}")
async def read_document(owner_uid: str = identifier_path(), doc_id: str = identifier_path(), identity=Depends(require_admin)):
    async with user_lock(owner_uid):
        def read():
            require_active(owner_uid)
            record = get_store(owner_uid).get_record(doc_id)
            if not record:
                raise HTTPException(404, "문서를 찾을 수 없어요.")
            get_operations().audit(identity["uid"], "document_view", f"{owner_uid}/{doc_id}")
            summary = document_list_item(doc_id, record, _today())
            return {**summary, "ownerUid": owner_uid, "updatedAt": record.get("updated_at") or "",
                    "editableDeadline": any(s.get("isDeadline") for s in (record.get("plan") or {}).get("steps", [])),
                    "error": record.get("error"), "createdAt": record.get("created_at")}
        return await run_in_threadpool(read)


@router.patch("/documents/{owner_uid}/{doc_id}")
async def update_document(body: UpdateDocument, owner_uid: str = identifier_path(), doc_id: str = identifier_path(), identity=Depends(require_admin)):
    def update():
        require_active(owner_uid)
        changes = body.model_dump(exclude_unset=True, exclude={"expectedUpdatedAt"})
        try:
            get_store(owner_uid).mutate_document(doc_id, changes, expected_updated_at=body.expectedUpdatedAt)
        except KeyError as exc:
            raise HTTPException(404, "문서를 찾을 수 없어요.") from exc
        except RevisionConflict as exc:
            raise HTTPException(409, str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        return {"updated": True}
    return await mutate_target(owner_uid, identity, "document_update", f"{owner_uid}/{doc_id}", update)


@router.delete("/documents/{owner_uid}/{doc_id}")
async def delete_document(body: DeleteConfirmation, owner_uid: str = identifier_path(), doc_id: str = identifier_path(), identity=Depends(require_admin)):
    recent_admin(identity)
    if body.targetId != doc_id:
        raise HTTPException(422, "삭제할 문서를 다시 확인해 주세요.")

    def delete():
        recent_admin(identity)
        require_active(owner_uid)
        # 원본 정리가 실패하면 DB를 먼저 지우지 않아 같은 요청으로 재시도할 수 있다.
        originals.delete_originals(originals.scoped_id(owner_uid, doc_id))
        try:
            return get_store(owner_uid).delete_document(doc_id)
        except KeyError:
            return {"deleted": True, "deleted_todos": 0}
    return await mutate_target(owner_uid, identity, "document_delete", f"{owner_uid}/{doc_id}", delete)
