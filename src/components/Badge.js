// 담당자 1 (공통 컴포넌트) 소유
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/theme";

const TONES = {
  alert: { bg: colors.alertSoft, fg: colors.alert },
  stamp: { bg: colors.stampSoft, fg: colors.stamp },
  gold: { bg: colors.goldSoft, fg: colors.gold },
  neutral: { bg: colors.line, fg: colors.muted },
};

export default function Badge({ label, tone = "neutral" }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, fontWeight: "700" },
});
