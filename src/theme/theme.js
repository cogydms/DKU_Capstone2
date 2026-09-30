export const colors = {
  ink: "#1F2E2B", // 본문 텍스트, 헤더
  paper: "#F7F8FA", // 배경 
  surface: "#FFFFFF", // 카드 표면
  line: "#E4E7EC", // 구분선, 테두리
  muted: "#8A94A6", // 보조 텍스트

  stamp: "#3b6deb", // 파란 도장 - 아이콘 배경/확인 버튼색
  stampSoft: "#E4EBFD",

  alert: "#b52e2e", // 마감 임박 / 확인 필요
  alertSoft: "#F4E4DC",

  gold: "#cf9f2f", // 진행중
  goldSoft: "#F3ECD8",

  green: "#2E7D4F", // 여유 있음 (초록)
  greenSoft: "#E1F0E6",
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
