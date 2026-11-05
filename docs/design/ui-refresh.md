# 똑독 UI — Concept 04

사용자가 선택한 스모크 그레이 / 딥 네이비 / 청록 시안을 앱에 적용했습니다.

- Pretendard Regular–ExtraBold 유지
- 반투명 카드, 공통 배경, 읽기 영역 최대 너비 1120
- 홈: 요약 카드, 문서 추가 배너, 마감 목록과 오늘 할 일의 반응형 배치
- 하단 메뉴: 안전 영역을 고려한 떠 있는 메뉴, 키보드가 열리면 숨김
- 로그인, 캘린더, 할 일, 설정, 문서 추가, 분석 결과, 근거 확인, 준비 계획, 등록 후 관리, 알림과 공통 모달에 테마 적용
- 오류, 임박한 마감, 경고의 의미를 나타내는 색상은 별도로 유지

## 배너 이미지

파일: `assets/illustrations/document-glass.png`

내장 이미지 생성 도구로 제작했습니다. 사용한 프롬프트:

> Create a transparent-background isolated premium 3D UI illustration for a professional document planner app. Two overlapping frosted silver-white sheets of paper, rounded upper corner and folded top-right corner, four short dark slate horizontal text strokes, small deep petrol-teal glass rounded-square badge with two white four-point sparkles at bottom right. A single thin transparent glass elliptical ring wraps around lower half of the sheets. Soft realistic studio light, restrained satin finish, sophisticated navy/teal/silver palette, NOT purple, not childish, no text, no letters, no backdrop, no surrounding objects. Object centered, completely in frame, generous transparent margin, square composition, clean silhouette. Intended to sit on a dark navy-to-teal app hero banner.

## 확인

- 기존 프론트엔드 테스트 49개 통과
- src 내 JavaScript 65개 구문 변환 통과
- 브라우저에서 홈, 캘린더, 할 일, 설정, 문서 추가 및 기존 문서 상세 조회 확인
- 390px 모바일 폭과 1280px 데스크톱 폭 확인
- iOS/Android 실기기는 별도 검증 필요. 그라데이션은 expo-linear-gradient로 웹과 네이티브에 공통 적용하며, 배경 블러는 웹에서 적용합니다.

## 홈 배너 마스코트 교체

사용자가 제공한 `똑독 마스코트.jpeg`를 기반으로, 기존 입체 문서 이미지를 똑독 마스코트로 교체했습니다. 원본 파일은 유지하고 내장 이미지 생성 도구로 외부 흰 배경을 투명하게 정리했습니다.

사용 중인 파일: `assets/illustrations/ttokdoc-mascot.png`

편집 프롬프트:

> Use case: background-extraction. Edit target: the supplied original 똑독 mascot JPEG. Remove ONLY the exterior white/near-white background, including the soft oval floor shadow, so the background is genuinely transparent. Keep the original mascot EXACTLY the same: full white paper body, blue outline and folded corner, winking face, rosy pink cheeks, smiling mouth, blue hands and feet, blue checkmark, and two blue motion lines at upper left. Preserve the solid WHITE interior of the paper body and all white highlights: do NOT make these transparent. No redesign, no recoloring, no new 3D rendering, no change of pose, expression, proportions or line weights. Crop away the large exterior blank margins, framing the complete character snugly with about 5% transparent breathing space on each side, with no part cut off. This is an existing brand mascot cutout for a dark navy app banner. No additional text or objects.


## BLUE HOUR — 최종 배경 확장안 적용

선택한 블루 배경 시안을 전체 앱에 적용했습니다. 기존 레이아웃과 마스코트는 유지합니다.

- 배경: 청회색 `#B7C8DE → #CCD9EA → #9EB8D5` 그라데이션과 넓고 은은한 곡선 조명
- 카드·상단바·하단 메뉴: 푸른 유리 표면, 밝은 가장자리, 네이비 그림자
- 강조: 마스코트의 코발트블루 `#2F5EDD`, 딥 네이비 제목과 본문
- 문서 배너: 네이비에서 블루로 이어지는 그라데이션과 기존 마스코트
- 로그인·입력창·드롭다운·편집 모달·온보딩·분석·근거 확인 화면까지 공통 팔레트 적용
- 경고와 완료 상태의 의미 색상, 원문 종이 영역은 유지
- Expo 51에 맞는 expo-linear-gradient ~13.0.2 추가

확인: 프론트엔드 기존 테스트 49개 통과, JavaScript 변환 확인, 브라우저에서 주요 화면 이동과 입력창 대비 확인. 휴대폰 실기기 실행은 별도 검증이 필요합니다.
