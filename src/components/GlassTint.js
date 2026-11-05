import React from "react";
import { Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "../theme/theme";

// Web surfaces use the shared CSS gradient; native gets the same layer here.
export default function GlassTint({ radius = 24 }) {
  if (Platform.OS === "web") return null;
  return <LinearGradient pointerEvents="none" accessible={false} colors={gradients.glass}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={[StyleSheet.absoluteFill, { borderRadius: radius }]} />;
}
