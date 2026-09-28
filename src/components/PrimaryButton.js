// 담당자 1 (공통 컴포넌트) 소유
import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/theme";

export default function PrimaryButton({ label, onPress, tone = "ink", disabled }) {
  const bg = disabled ? colors.line : tone === "stamp" ? colors.stamp : colors.ink;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  label: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
