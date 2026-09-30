# ActionDoc Agent — 백엔드 (FastAPI + Gemini)

제안서의 6개 에이전트 중 **AGENT 01 문서 접수 · 02 행동 정보 추출 · 03 근거 검증**을 구현한 1단계 백엔드입니다.
계획 수립(04) · 실행(05) · 일정 관리(06)는 이 결과(`AnalysisResult`)를 입력으로 받아 다음 단계에서 붙입니다.

## 빠른 시작

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # 처음엔 LLM_PROVIDER=mock 그대로 두면 API 키 없이 동작
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API 문서(Swagger): http://localhost:8000/docs  ← 여기서 바로 공지문을 붙여넣어 테스트할 수 있어요
- 테스트: `pytest -q`

### Gemini 켜기

`.env`에서 `LLM_PROVIDER=gemini`로 바꾸고 둘 중 하나를 설정합니다.

- **Google AI Studio 키** (가장 간단): `GEMINI_API_KEY=...`
- **Vertex AI** (제안서 아키텍처): `USE_VERTEX=true`, `GCP_PROJECT=actiondoc-agent`, 그리고 `gcloud auth application-default login`

모델은 `GEMINI_MODEL`로 바꿀 수 있습니다. 제안서의 `gemini-1.5-flash`는 이미 서비스 종료된 모델이라 기본값을 `gemini-2.5-flash`로 두었습니다. 시연 시점에 쓸 수 있는 모델명은 Google 문서에서 한 번 확인해 주세요.

`mock` 모드는 규칙 기반 추출기라 텍스트 입력과 텍스트 PDF만 처리하고, 이미지·스캔 PDF는 Gemini 모드에서만 됩니다.

## 파이프라인

```
입력(text / PDF / 이미지)
  │ AGENT 01 intake.py        텍스트 PDF는 pypdf로 직접, 스캔본·이미지는 Gemini로 받아쓰기
  │                           → 주민번호·휴대폰 번호 마스킹 → 문장 분리(페이지·문장 번호·오프셋)
  ▼
  │ AGENT 02 extraction.py    [p1-s3] 형태로 번호 붙인 원문을 Gemini structured output으로 추출
  │                           모든 필드에 "원문 그대로 복사한 근거 문장"을 강제
  ▼
  │ AGENT 03 verification.py  LLM 결과를 믿지 않고 원문과 결정적으로 대조 → 필드별 신뢰도·상태
  ▼
AnalysisResult (저장소 저장, API 응답)
```

### 근거 검증이 잡아내는 것 (발표 포인트)

| 검사 | 잡아내는 LLM 실수 | 예시 |
|---|---|---|
| `evidence_found` | 원문에 없는 정보를 지어냄 | 없는 "지도교수 추천서"를 서류로 추가 → **unverified** |
| `value_in_evidence` | 근거 문장과 값이 안 맞음 | 인용문은 맞는데 날짜가 다름 |
| `date_time` | 시각을 지어내거나 틀림 | 원문엔 시각이 없는데 18:00 추가 |
| `date_role` | **날짜 의미 혼동** | 결과 발표일(10/2)을 마감일로 분류 |
| `date_range` | 기간 시작/끝 혼동 | "9/15 ~ 9/25"에서 9/15를 마감일로 |
| 재탐색 | 값은 맞는데 인용문을 의역 | 원문 문장을 다시 찾아 붙이고 사용자 확인 요청 |

최종 신뢰도 = `0.45 × 근거 일치도 + 0.35 × 값 검사 평균 + 0.20 × LLM 자기확신도`.
근거가 없으면 최대 40(`unverified`), 치명적 검사 실패가 있으면 최대 60, `REVIEW_THRESHOLD`(기본 80) 미만이면 `needs_review`(사용자 확인 필요)입니다.
LLM 자기확신도는 20%만 반영되므로 "AI가 98%라고 했으니 98%"가 아니라 **원문 대조로 계산한 신뢰도**라는 점이 제안서의 "근거 검증" 차별점과 연결됩니다.

`tests/test_verification.py`의 각 테스트가 위 실수 유형 하나씩을 재현하고 있어서, 발표 때 사례로 그대로 쓸 수 있습니다.

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/documents/analyze` | multipart로 `file` 또는 `text` → 접수·추출·검증 실행 |
| GET | `/api/documents` | 목록 (프론트 `mockData.documents` 모양) |
| GET | `/api/documents/{id}` | 분석 결과 |
| GET | `/api/documents/{id}/source` | 원문 페이지 + 문장 오프셋 (근거 하이라이트용) |
| POST | `/api/documents/{id}/fields/{fieldId}/confirm` | 확인 필요 항목 승인·수정 `{ "value"?, "normalized_datetime"? }` |
| DELETE | `/api/documents/{id}/fields/{fieldId}` | 잘못 추출된 항목 삭제 |

분석 응답은 두 가지를 함께 돌려줍니다.

- `view`: 프론트 `mockData.analysisDetail`과 **같은 키 구조**(`docType`, `applicantCriteria`, `todos`, `deadline`, `requiredDocs`, `evidence`) + `needsReview`, `warnings`. `AIAnalysisScreen`, `EvidenceCheckScreen`은 import만 바꾸면 됩니다.
- `analysis`: 필드별 `checks`, `evidence.char_start/char_end`, `status`까지 담긴 원본. 근거 하이라이트나 "왜 확인이 필요한지" 표시에 씁니다.

## 프론트 연결

`frontend_patch/src/services/api.js`를 프론트 `src/services/`에 복사하고, 프론트 `.env`에 `EXPO_PUBLIC_API_URL=http://<PC의 내부 IP>:8000`을 넣습니다. 실기기(Expo Go)에서는 `localhost`가 폰 자신을 가리키므로 PC IP를 써야 하고, 서버도 `--host 0.0.0.0`으로 띄워야 합니다.

```js
import { analyzeText } from "../services/api";
const { documentId, view } = await analyzeText(pastedText);
navigation.navigate("AIAnalysis", { documentId, analysis: view });
```

파일 업로드 헬퍼(`analyzeFile`)는 `{ uri, name, type }` 형태의 React Native FormData를 쓰기 때문에 iOS/Android 기준입니다. Expo 웹에서는 Blob으로 바꿔 보내야 합니다.

## 저장소

- `STORAGE_BACKEND=memory`: 개발용, 재시작하면 사라짐
- `STORAGE_BACKEND=firestore`: 프론트와 같은 Firebase 프로젝트 사용. `documents/{id}`에 요약과 분석 결과, `documents/{id}/source/raw`에 원문을 저장합니다. 로컬에선 Firebase 콘솔에서 받은 서비스 계정 키 경로를 `GOOGLE_APPLICATION_CREDENTIALS`에 넣고, Cloud Run에선 서비스 계정 권한으로 자동 인증됩니다.

## 배포 (Cloud Run)

```bash
gcloud run deploy actiondoc-api --source . --region asia-northeast3 \
  --set-env-vars LLM_PROVIDER=gemini,USE_VERTEX=true,GCP_PROJECT=actiondoc-agent,STORAGE_BACKEND=firestore
```

## 알아둘 한계

- 개인정보 마스킹은 텍스트 기준이라, 이미지·스캔 PDF는 받아쓰기를 위해 원본이 Gemini로 전송된 뒤 마스킹됩니다.
- 날짜 의미 판단(`date_role`)은 날짜 앞뒤 약 25자의 키워드로 합니다. 표 형식 공지처럼 키워드가 멀리 떨어진 경우엔 "의미 표현 없음"(점수 0.6)으로 확인 요청이 뜰 수 있습니다.
- 분석은 동기 처리입니다. Gemini 호출 포함 보통 수 초가 걸리며, 긴 문서가 많아지면 작업 큐로 분리하는 게 좋습니다.

## 다음 단계

1. **AGENT 04 계획 수립**: 검증된 `deadline`·`required_document`·`todo`로 마감일 역산 일정 생성 (발급 소요일, 주말 제외 등)
2. **AGENT 05 실행**: 공통 명령 형식(`{tool, action, payload, risk}`) 정의 → 승인된 항목만 Google Calendar·Firestore `todos`에 등록. 프론트 `ManagementScreen`이 이미 쓰는 `todos` 컬렉션(`order`, `is_completed`, `updated_at`)에 맞춰 쓰면 바로 연결됩니다.
3. **AGENT 06 일정 관리**: 진행률·알림 스케줄
4. 평가: 실제 학교 공지 20~30건에 정답 라벨을 달아 필드별 정확도와 "검증 전/후 오류율"을 측정 → 보고서의 정량 근거
