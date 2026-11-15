import React from "react";
import { Modal, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../Card";
import { Text } from "../Typography";
import { colors, radius, spacing, type } from "../../theme/theme";

export function AdminButton({ label, onPress, disabled, danger = false }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, (pressed || disabled) && { opacity: 0.45 }]}>
    <Text style={[type.bodyStrong, { color: danger ? colors.alert : colors.stamp, flexShrink: 1 }]}>{label}</Text>
  </Pressable>;
}
export function AdminFeedback({ error, message }) {
  return <>{!!error && <Text accessibilityRole="alert" style={[type.body, { color: colors.alert }]}>{error}</Text>}
    {!!message && <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.green }]}>{message}</Text>}</>;
}
export function AdminDialog({ title, children, busy, onClose }) {
  return <Modal visible transparent animationType="fade" onRequestClose={() => { if (!busy) onClose(); }}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><Card style={styles.dialog}>
        <View style={styles.row}><Text accessibilityRole="header" style={[type.h2, { flex: 1 }]}>{title}</Text><AdminButton label="닫기" disabled={busy} onPress={onClose} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
      </Card></SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}
export const adminStyles = StyleSheet.create({
  gap: { gap: spacing.sm }, row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.md },
  input: { ...type.body, minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface, padding: spacing.md },
});
const styles = StyleSheet.create({
  button: { minHeight: 44, justifyContent: "center" }, row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  overlay: { flex: 1, backgroundColor: colors.overlay }, safe: { flex: 1, justifyContent: "center", padding: spacing.lg },
  dialog: { width: "100%", maxWidth: 560, maxHeight: "92%", alignSelf: "center" }, content: { gap: spacing.md, paddingBottom: spacing.sm },
});
