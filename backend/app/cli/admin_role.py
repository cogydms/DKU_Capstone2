"""지정한 Google 계정의 관리자 권한 부여·회수. 기본 실행은 미리보기다."""
import argparse

from firebase_admin import auth

from app.services.admin_operations import get_operations
from app.services.firebase_admin_client import get_firebase_app


def main():
    parser = argparse.ArgumentParser(description="Google 계정의 관리자 권한을 관리합니다. --apply 없이 실행하면 변경하지 않습니다.")
    account = parser.add_mutually_exclusive_group(required=True)
    account.add_argument("--email", help="앱에 로그인한 Google 계정 이메일")
    account.add_argument("--uid", help="Firebase Authentication UID")
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--grant", action="store_true", help="관리자 권한 부여")
    action.add_argument("--revoke", action="store_true", help="관리자 권한 회수")
    parser.add_argument("--apply", action="store_true", help="권한 변경을 실제로 적용")
    args = parser.parse_args()
    app = get_firebase_app()
    user = auth.get_user_by_email(args.email.strip(), app=app) if args.email else auth.get_user(args.uid.strip(), app=app)
    if args.grant and (user.disabled or not any(provider.provider_id == "google.com" for provider in user.provider_data)):
        parser.error("활성화된 Google 로그인 계정에만 관리자 권한을 부여할 수 있어요. 먼저 앱에서 Google 로그인을 완료해 주세요.")
    claims = dict(user.custom_claims or {})
    print(f"대상: {user.uid} ({user.email or '이메일 없음'})")
    print("작업:", "관리자 권한 부여" if args.grant else "관리자 권한 회수")
    if not args.apply:
        print("미리보기입니다. 위 계정이 맞으면 동일 명령에 --apply를 추가해 적용하세요.")
        return
    operations = get_operations()
    action_name = "admin_grant" if args.grant else "admin_revoke"
    operations.audit("server-operator", action_name, user.uid, "started")
    if args.grant:
        claims["admin"] = True
    else:
        claims.pop("admin", None)
    try:
        auth.set_custom_user_claims(user.uid, claims, app=app)
        if args.revoke:
            auth.revoke_refresh_tokens(user.uid, app=app)
    except Exception:
        operations.audit("server-operator", action_name, user.uid, "failed")
        raise
    operations.audit("server-operator", action_name, user.uid)
    print("적용 완료. 설정에 다시 들어가거나 재로그인하면 관리자 메뉴가 표시됩니다." if args.grant
          else "권한 회수 완료. 해당 계정은 재로그인 후 일반 사용자로 이용할 수 있습니다.")


if __name__ == "__main__":
    main()
