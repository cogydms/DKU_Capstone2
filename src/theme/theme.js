// 담당자 1 (공통 파운데이션) 소유
// 문서 속 일을 "처리해주는" 느낌 - 관공서 서류 / 도장 확인 무드.
// 화려한 그라데이션 대신 잉크 네이비 + 종이빛 배경 + 확인 도장 그린 포인트.

export const colors = {
  ink: "#1F2E2B", // 본문 텍스트, 헤더
  paper: "#F1F0EA", // 배경 (종이빛, 따뜻한 크림 아님)
  surface: "#FFFFFF", // 카드 표면
  line: "#DCD8CC", // 구분선, 테두리
  muted: "#7A7A6E", // 보조 텍스트

  stamp: "#2F6F5E", // 확인/신뢰 포인트 (도장 그린)
  stampSoft: "#E4EFE9",

  alert: "#B5502E", // 마감 임박 / 확인 필요 (녹슨 주황)
  alertSoft: "#F4E4DC",

  gold: "#B08A2E", // 진행중 / 주의
  goldSoft: "#F3ECD8",
};

export const confidenceColor = (pct) => {
  if (pct >= 90) return colors.stamp;
  if (pct >= 70) return colors.gold;
  return colors.alert;
};

export const type = {
  display: { fontSize: 26, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
  h1: { fontSize: 20, fontWeight: "700", color: colors.ink },
  h2: { fontSize: 16, fontWeight: "700", color: colors.ink },
  body: { fontSize: 14, fontWeight: "400", color: colors.ink, lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: "600", color: colors.ink },
  small: { fontSize: 12, fontWeight: "400", color: colors.muted },
  label: { fontSize: 11, fontWeight: "600", color: colors.muted, letterSpacing: 0.2 },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
