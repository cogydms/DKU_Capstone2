import { Text } from "./Typography";
// 담당자 1 (공통 컴포넌트) 소유
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, gradients } from "../theme/theme";

export default function PrimaryButton({ label, onPress, tone = "ink", disabled, style }) {
  const bg = disabled ? colors.line : tone === "stamp" ? colors.stamp : colors.ink;
  const showGradient = tone === "stamp" && !disabled && !StyleSheet.flatten(style)?.backgroundColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={!!disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {showGradient && <LinearGradient pointerEvents="none" colors={gradients.action}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]} />}
      <Text style={[styles.label, disabled && { color: colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  label: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
