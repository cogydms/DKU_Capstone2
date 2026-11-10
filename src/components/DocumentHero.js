import React from "react";
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "./Typography";
import { LinearGradient } from "expo-linear-gradient";
import { gradients, radius } from "../theme/theme";

export default function DocumentHero({ onPress }) {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  return <View style={[styles.hero, compact && styles.compact]}>
    <LinearGradient pointerEvents="none" colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={styles.sweep} />
    <View style={styles.copy}>
      <Text style={[styles.title, compact && styles.smallTitle]}>문서 한 장으로 시작하세요</Text>
      <Text style={styles.description}>AI가 중요한 일정과 할 일을{compact ? "\n" : " "}정리해 드려요.</Text>
      <Pressable accessibilityRole="button" onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
        <Text style={styles.label}>문서 추가 ＋</Text>
      </Pressable>
    </View>
    <Image accessible={false} source={require("../../assets/illustrations/ttokdoc-mascot.png")}
      resizeMode="contain" style={[styles.art, compact && styles.smallArt]} />
  </View>;
}
const styles = StyleSheet.create({
  hero: { backgroundColor: "#365781", minHeight: 222, borderRadius: radius.lg,
    padding: 30, marginBottom: 24, overflow: "hidden", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(229,240,255,0.6)",
    shadowColor: "#203D67", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  sweep: { position: "absolute", width: "110%", height: 220, right: "-25%", bottom: -150,
    borderRadius: 300, backgroundColor: "rgba(87,143,220,0.17)", transform: [{ rotate: "-18deg" }] },
  compact: { padding: 20, minHeight: 200 },
  copy: { zIndex: 1, maxWidth: "76%", alignItems: "flex-start" },
  title: { fontSize: 29, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.8 },
  smallTitle: { fontSize: 20, lineHeight: 28 },
  description: { fontSize: 15, lineHeight: 23, color: "#E3EDFC", marginTop: 10, maxWidth: 360 },
  button: { backgroundColor: "#DFE9F8", borderRadius: 18, paddingHorizontal: 22, paddingVertical: 12, marginTop: 22,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.8)" },
  label: { color: "#142C52", fontSize: 15, fontWeight: "700" },
  art: { position: "absolute", right: 24, bottom: 14, width: "28%", height: 194 },
  smallArt: { right: 6, bottom: 14, width: "34%", height: 124 },
});
