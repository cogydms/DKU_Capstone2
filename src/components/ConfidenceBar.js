// 담당자 1 (공통 컴포넌트) 소유
// 근거 검증 신뢰도를 시각화. 90%+ 확인, 70~89% 주의, 70% 미만 "사용자 확인 필요".
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, confidenceColor, spacing } from "../theme/theme";

export default function ConfidenceBar({ label, pct }) {
  const color = confidenceColor(pct);
  const needsReview = pct < 80;
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.pct, { color }]}>
          {pct}% {needsReview ? "· 확인 필요" : ""}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { fontSize: 13, color: colors.ink, fontWeight: "600" },
  pct: { fontSize: 12, fontWeight: "700" },
  track: {
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
});
