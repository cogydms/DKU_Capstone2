// 담당자 1 (공통 컴포넌트) 소유
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import GlassTint from "./GlassTint";
import { radius, spacing, glass } from "../theme/theme";

export default function Card({ children, style }) {
  const customBackground = StyleSheet.flatten(style)?.backgroundColor;
  return <View style={[styles.card, style, customBackground && Platform.OS === "web" && { backgroundImage: "none" }]}>
    {!customBackground && <GlassTint radius={StyleSheet.flatten([styles.card, style]).borderRadius} />}
    {children}
  </View>;
}

const styles = StyleSheet.create({
  card: {
    ...glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.borderColor,
    padding: spacing.lg,
  },
});
