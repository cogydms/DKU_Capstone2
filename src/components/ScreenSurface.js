import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, gradients } from "../theme/theme";

export default function ScreenSurface({ children, style, ...props }) {
  return <SafeAreaView {...props} style={[styles.root, style]}>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradients.page} locations={[0, 0.48, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.sweep} />
      <View style={styles.lowerLight} />
    </View>
    {children}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, overflow: "hidden" },
  sweep: { position: "absolute", width: "160%", height: 460, left: "-35%", top: -270,
    borderBottomLeftRadius: 600, borderBottomRightRadius: 600,
    backgroundColor: "rgba(238,246,255,0.18)", transform: [{ rotate: "-13deg" }] },
  lowerLight: { position: "absolute", width: "150%", height: 400, right: "-65%", bottom: -220,
    borderRadius: 300, backgroundColor: "rgba(72,118,184,0.08)", transform: [{ rotate: "-18deg" }] },
});
