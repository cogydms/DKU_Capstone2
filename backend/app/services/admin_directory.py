"""프로필 기준 이용 계정과 문서 목록. 인증 비밀정보는 반환하지 않는다."""
from collections import Counter
from datetime import datetime, timezone

from fastapi import HTTPException
from firebase_admin import auth, exceptions

from app.services.firebase_admin_client import get_firebase_app
from app.services.user_profiles import admin_profile_summaries
from app.services.store import admin_document_summaries


def auth_date(value):
    # Firebase Auth 메타데이터는 Unix 밀리초다.
    return datetime.fromtimestamp(value / 1000, timezone.utc).isoformat() if value else None


def account_summaries(profiles, documents):
    users = {}
    app = get_firebase_app()
    identifiers = [auth.UidIdentifier(profile["uid"]) for profile in profiles]
    try:
        for start in range(0, len(identifiers), 100):
            # 반환 순서는 요청 순서와 다를 수 있으므로 UID로 합친다.
            result = auth.get_users(identifiers[start:start + 100], app=app)
            for user in result.users:
                users[user.uid] = user
    except exceptions.FirebaseError as exc:
        raise HTTPException(503, "이용 계정 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.") from exc
    document_counts = Counter(item["ownerUid"] for item in documents)
    result = []
    for profile in profiles:
        uid = profile["uid"]
        user = users.get(uid)
        metadata = user.user_metadata if user else None
        result.append({"uid": uid, "email": user.email if user else None,
                       "displayName": user.display_name if user else None,
                       "providers": [provider.provider_id for provider in user.provider_data] if user else [],
                       "accountType": profile.get("accountType") or "unknown",
                       "authExists": user is not None, "disabled": user.disabled if user else False,
                       "admin": (user.custom_claims or {}).get("admin") is True if user else False,
                       "collegeId": profile.get("collegeId"), "departmentId": profile.get("departmentId"),
                       "collegeName": profile.get("collegeName"), "departmentName": profile.get("departmentName"),
                       "createdAt": (auth_date(metadata.creation_timestamp) if metadata else None) or profile.get("createdAt"),
                       "lastSignInAt": auth_date(metadata.last_sign_in_timestamp) if metadata else None,
                       "documentCount": document_counts[uid]})
    return sorted(result, key=lambda item: (item.get("createdAt") or "", item["uid"]), reverse=True)


def directory_snapshot():
    profiles = admin_profile_summaries()
    documents = admin_document_summaries()
    return account_summaries(profiles, documents), documents


def matches_account(item, query):
    values = [item.get(key) for key in ("uid", "email", "displayName", "collegeName", "departmentName")]
    return query in " ".join(str(value or "") for value in values).casefold()
