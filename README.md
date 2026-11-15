# 똑독 | Ttokdoc

문서의 주요 정보를 AI로 분석하고, 원문 근거 확인부터 준비 계획과 할 일 관리까지 돕는 서비스입니다.

- [프로젝트 소개 및 제출 자료](https://github.com/sungjw0408/DKU_Capstone2/tree/main)
- [시연 영상](https://youtu.be/5QPw21AZITA)

## 앱 실행

Node.js 20과 npm이 필요합니다.
아래 명령은 Windows 명령 프롬프트(CMD) 기준입니다.

### 1. 코드 내려받기

```bat
git clone --branch develop https://github.com/sungjw0408/DKU_Capstone2.git
cd DKU_Capstone2
npm ci
```

이미 프로젝트가 있다면 다시 clone하지 않고 기존 폴더를 사용합니다.

### 2. 백엔드 주소 설정

프로젝트 최상위 폴더에 `.env` 파일을 만들고 다음 내용을 입력합니다.

```dotenv
EXPO_PUBLIC_API_URL=https://actiondoc-api-835397104507.asia-northeast3.run.app
```

배포된 백엔드를 사용하므로 로컬 백엔드는 따로 실행하지 않아도 됩니다.
Gemini API 키는 프론트엔드에 입력하지 않습니다.

### 3. 웹 실행

```bat
npx expo start --web
```

환경 변수를 변경했다면 Expo를 종료한 뒤 다음 명령으로 다시 실행합니다.

```bat
npx expo start --web -c
```

모바일 네이티브 실행은 별도의 개발 빌드와 플랫폼 설정이 필요할 수 있습니다.
기기 알림 등 일부 기능은 웹에서 지원되지 않습니다.

## 백엔드 로컬 실행

백엔드를 직접 개발하거나 테스트할 때만 필요합니다.
Python 3.12를 설치한 뒤 프로젝트 최상위 폴더에서 실행합니다.

```bat
cd backend
py -3.12 -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
copy .env.example .env
```

`backend/.env`에서 실제 AI 호출 없이 테스트하도록 설정합니다.

```dotenv
LLM_PROVIDER=mock
STORAGE_BACKEND=memory
USE_VERTEX=false
GOOGLE_APPLICATION_CREDENTIALS=
```

서버를 실행합니다.

```bat
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- 상태 확인: http://localhost:8000/health
- API 문서: http://localhost:8000/docs

프론트엔드를 로컬 서버에 연결하려면 최상위 `.env`를 변경하고 Expo를 재시작합니다.

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8000
```

이 주소는 같은 PC의 웹 브라우저에서 실행할 때 사용합니다.
실제 휴대폰으로 연결하려면 PC의 네트워크 IP와 외부 접속 설정이 필요합니다.

Mock 모드는 실제 Gemini 분석을 수행하지 않습니다.
메모리 저장소의 데이터는 서버 종료 시 사라집니다.
인증이 필요한 API는 로그인한 사용자의 Firebase ID 토큰이 필요합니다.

## 주요 기술

| 구분 | 기술 |
| --- | --- |
| 프론트엔드 | React Native, Expo, JavaScript |
| 백엔드 | Python, FastAPI |
| 인증·데이터 저장 | Firebase Authentication, Firestore |
| AI | Google Gemini API |
| 백엔드 배포 | Docker, Google Cloud Run |

## Render 웹 배포

Render의 `ttokdoc` Static Site에서 브랜치를 `develop`로, Auto-Deploy를 `On Commit`으로 설정합니다.
Build Command에는 `npm ci && npm run build:render`를, Publish Directory에는 `dist`를 사용합니다.
웹 빌드에 필요한 기존 환경변수는 Render의 Environment에서 관리합니다.

Render 빌드는 배포 커밋 SHA가 담긴 `/deploy-info.json`을 게시합니다.
`develop`에 변경이 들어오면 GitHub Actions가 공개 사이트에서 같은 SHA를 확인하고,
저장소의 **Deployments → Render Production**에 사이트 링크와 성공 상태를 등록합니다.
Render 빌드가 늦게 완료되면 해당 커밋의 Actions 작업을 다시 실행할 수 있습니다.

## 개발 참고

- `.env`와 서비스 계정 키는 Git에 올리지 않습니다.
- 기능 개발은 최신 `develop`에서 만든 `feature/*` 브랜치에서 진행합니다.
- [백엔드 상세 안내](backend/README.md)
- [문서 분석 평가 안내](backend/eval/README.md)
