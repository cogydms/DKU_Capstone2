import { Platform } from "react-native";

export const colors = {
  ink: "#112342", // 본문 텍스트, 헤더
  paper: "#B9CBE0", // 청회색 배경
  surface: "#DFE9F6", // 푸른 유리 표면
  line: "#AFBFD4", // 구분선, 테두리
  muted: "#465E7C", // 보조 텍스트

  stamp: "#2F5EDD", // 마스코트의 코발트블루
  stampSoft: "#C9DAF3",

  alert: "#A34249", // 마감 임박 / 확인 필요
  alertSoft: "#F4E4E5",

  gold: "#936A34", // 진행중
  goldSoft: "#F1EBDD",

  green: "#28766B", // 여유 있음 (초록)
  greenSoft: "#E0EEEA",
};

export const evidenceReviewColors = { ink: "#8D2330", border: "#C34C59", surface: "#FBE0E3" };

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

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const gradients = {
  page: ["#B7C8DE", "#CCD9EA", "#9EB8D5"],
  glass: ["rgba(234,243,255,0.82)", "rgba(198,216,239,0.72)"],
  header: ["#D4E1F1", "#BBCEE6"],
  hero: ["#365781", "#4B74A4", "#6893C2"],
  action: ["#416FEF", "#2850C9"],
};

export const glass = {
  backgroundColor: "rgba(214,229,248,0.76)",
  borderWidth: 1, borderColor: "rgba(245,250,255,0.85)",
  shadowColor: "#203D67", shadowOpacity: 0.17, shadowRadius: 18,
  shadowOffset: { width: 0, height: 7 }, elevation: 4,
  ...Platform.select({ web: {
    backgroundImage: `linear-gradient(135deg, ${gradients.glass.join(", ")})`,
    backdropFilter: "blur(18px)",
  }, default: {} }),
};
export const dialogGlass = { ...glass, backgroundColor: "#DCE7F6" };
export const inputSurface = "rgba(238,245,255,0.6)";
export const pageContent = {
  width: "100%", maxWidth: 1120, alignSelf: "center", paddingBottom: 112,
};
