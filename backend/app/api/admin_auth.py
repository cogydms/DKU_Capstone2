"""관리자 권한은 Firebase의 서버 전용 custom claim으로만 지정한다."""
from fastapi import Depends, HTTPException
from firebase_admin import auth, exceptions

from app.api.authn import verified_identity
from app.services.account_state import require_active
from app.services.firebase_admin_client import get_firebase_app


def has_admin_access(identity):
    provider = identity.get("firebase")
    if not isinstance(provider, dict) or provider.get("sign_in_provider") != "google.com":
        return False
    if identity.get("admin") is not True:
        return False
    try:
        # 토큰이 아직 유효하더라도 회수된 관리자 권한을 즉시 차단한다.
        user = auth.get_user(identity["uid"], app=get_firebase_app())
    except (auth.UserNotFoundError, auth.UserDisabledError):
        return False
    except exceptions.FirebaseError as exc:
        raise HTTPException(503, "관리자 권한을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.") from exc
    return not user.disabled and (user.custom_claims or {}).get("admin") is True


def require_admin(identity=Depends(verified_identity)):
    require_active(identity["uid"])
    if not has_admin_access(identity):
        raise HTTPException(403, "관리자 권한이 필요해요.")
    return identity
