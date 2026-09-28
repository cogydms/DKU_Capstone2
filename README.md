# ActionDoc Agent — 프론트엔드 (React Native / Expo)

근거 검증 기반 생활문서 이해 및 행동 실행 AI 에이전트 플랫폼의 프론트엔드 프로토타입.
지금 단계는 백엔드 없이 **목업 데이터(src/data/mockData.js)** 로 6개 화면의 흐름만 구현되어 있습니다.

## 실행 방법

```bash
npm install
npx expo start
```

QR코드를 Expo Go 앱으로 스캔하거나, `i`(iOS 시뮬레이터) / `a`(Android 에뮬레이터) / `w`(웹)를 눌러 실행하세요.

## 화면 흐름

```
Home ─▶ DocumentAdd ─▶ AIAnalysis ─┬─▶ EvidenceCheck ─▶ ActionPlan ─▶ Management
                                    └─▶ ActionPlan
```

## 프로젝트 구조

```
src/
  theme/       공통 디자인 토큰 (색상, 타이포, 간격)
  data/        목업 데이터 (추후 API 응답으로 교체)
  components/  공통 컴포넌트 (Badge, Card, ConfidenceBar, ProgressBar, PrimaryButton)
  navigation/  화면 라우팅
  screens/     6개 화면
```

## 역할 분담 (4인 기준)

각 파일 상단에 `// 담당자 N 소유` 주석으로 표시되어 있습니다.

| 담당자 | 영역 | 파일 |
|---|---|---|
| **1** | 공통 파운데이션 (디자인 시스템, 네비게이션, 홈 화면) | `theme/`, `navigation/`, `components/`, `screens/HomeScreen.js` |
| **2** | 입력 → 분석 흐름 (문서 접수 에이전트 / 행동 정보 추출 에이전트에 대응) | `screens/DocumentAddScreen.js`, `screens/AIAnalysisScreen.js` |
| **3** | 검증 → 계획 흐름 (근거 검증 에이전트 / 계획 수립 에이전트에 대응) | `screens/EvidenceCheckScreen.js`, `screens/ActionPlanScreen.js` |
| **4** | 실행 · 관리 흐름 (실행 에이전트 / 일정 관리 에이전트에 대응) | `screens/ManagementScreen.js` |

담당자 1은 다른 세 명이 화면을 만들기 전에 먼저 `theme`, `components`, `navigation` 뼈대를 잡아두는 역할이라
사실상 1번만 선행 작업이고, 나머지 2~4번은 병렬로 작업 가능합니다.

## 다음 기능 추가 순서 제안

1. 각 화면에 **실제 API 연결** (지금은 `mockData.js`를 그대로 씀 — 이 파일의 구조를 API 응답 스펙으로 그대로 써도 됨)
2. `DocumentAddScreen`에 실제 카메라/파일 피커(`expo-image-picker`, `expo-document-picker`) 연동
3. `EvidenceCheckScreen`에 원문 이미지 위 근거 하이라이트 오버레이
4. `ManagementScreen`에 실제 로컬 알림(`expo-notifications`) 연동
5. 외부 캘린더(Google Calendar 등) 연동은 실행 에이전트 API가 준비된 뒤 진행

## 디자인 컨셉

"문서를 읽어주는 AI가 아니라, 문서 속 일을 끝내주는 AI"라는 제안서의 핵심 문구에 맞춰
관공서 서류 확인 도장에서 착안한 톤을 사용했습니다: 잉크 네이비 텍스트, 종이빛 배경,
확인/신뢰를 뜻하는 도장 그린(`#2F6F5E`) 포인트, 마감 임박을 뜻하는 녹슨 주황(`#B5502E`) 경고색.
색상은 `src/theme/theme.js`에서 한 곳에서 관리합니다.
