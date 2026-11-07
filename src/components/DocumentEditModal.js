import { inputSurface } from "../theme/theme";
import { Text, TextInput } from "./Typography";
import React, { useState } from "react";
import { Modal, View, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Card from "./Card";
import PrimaryButton from "./PrimaryButton";

import {
  CalendarDateField,
  TimeSelectionField,
} from "./PlanDateTimeFields";

import {
  colors,
  spacing,
  radius,
  type,
} from "../theme/theme";


export default function DocumentEditModal({
  document,
  onSave,
  onClose,
  onOpenAnalysis,
}) {
  const [title, setTitle] = useState(
    document?.title ?? ""
  );

  const [date, setDate] = useState(
    document?.deadline?.split("T")[0] ?? ""
  );

  const [time, setTime] = useState(
    document?.deadline?.includes("T")
      ? document.deadline.split("T")[1]
      : ""
  );

  const [saving, setSaving] = useState(false);
  const [openingAnalysis, setOpeningAnalysis] = useState(false);
  const [error, setError] = useState("");
  const busy = saving || openingAnalysis;

  const openAnalysis = async () => {
    if (busy || !onOpenAnalysis) return;
    setOpeningAnalysis(true);
    setError("");
    try {
      await onOpenAnalysis();
    } catch (e) {
      setError(e.message || "분석 결과를 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setOpeningAnalysis(false);
    }
  };

  const handleOpenAnalysis = () => {
    if (busy) return;
    const originalDeadline = document?.deadline || "";
    const changed = title !== (document?.title || "") || date !== originalDeadline.split("T")[0]
      || time !== (originalDeadline.includes("T") ? originalDeadline.split("T")[1] : "");
    if (!changed) return openAnalysis();
    const message = "저장하지 않은 프로젝트 수정 내용은 반영되지 않아요. 분석 결과로 이동할까요?";
    if (Platform.OS === "web") {
      if (window.confirm(message)) openAnalysis();
    } else {
      Alert.alert("분석 결과로 이동", message, [
        { text: "계속 수정", style: "cancel" },
        { text: "저장하지 않고 이동", onPress: openAnalysis },
      ]);
    }
  };

  const handleSave = async () => {
    if (busy) return;
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("프로젝트 제목을 입력해 주세요.");
      return;
    }

    if (time && !date) {
      setError(
        "시간을 지정하려면 날짜를 먼저 선택해 주세요."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave({
        title: trimmedTitle,
        deadline_date: date,
        deadline_time: time,
      });
    } catch (e) {
      setError(
        e.message ?? "프로젝트 수정에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        <SafeAreaView
          style={styles.safe}
          edges={["top", "bottom"]}
        >
          <Card style={styles.dialog}>
            <View style={styles.header}>
              <Text style={type.h1}>
                프로젝트 수정
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="프로젝트 수정 닫기"
                disabled={busy}
                onPress={onClose}
                hitSlop={8}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.ink}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.field}>
                <Text style={styles.label}>
                  프로젝트 제목
                </Text>

                <TextInput
                  value={title}
                  onChangeText={(value) => {
                    setTitle(value);
                    setError("");
                  }}
                  placeholder="프로젝트 제목"
                  placeholderTextColor={colors.muted}
                  maxLength={500}
                  style={styles.input}
                />
              </View>

              <CalendarDateField
                value={date}
                onChange={(value) => {
                  setDate(value);

                  if (!value) {
                    setTime("");
                  }

                  setError("");
                }}
                allowClear
              />

              <TimeSelectionField
                label="마감 시간 (선택)"
                value={time}
                onChange={(value) => {
                  setTime(value);
                  setError("");
                }}
              />

              {!!error && (
                <Text style={styles.error}>
                  {error}
                </Text>
              )}
            </ScrollView>

            <View style={styles.buttons}>
              <Pressable
                disabled={busy}
                onPress={onClose}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>
                  취소
                </Text>
              </Pressable>

              <View style={styles.saveButton}>
                <PrimaryButton
                  label={
                    saving
                      ? "저장 중…"
                      : "수정 저장"
                  }
                  disabled={busy}
                  onPress={handleSave}
                />
              </View>
            </View>
            {!!onOpenAnalysis && <View style={styles.analysisSection}>
              <Text style={styles.analysisDescription}>저장된 분석 결과와 원문 근거를 다시 확인할 수 있어요.</Text>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy}
                onPress={handleOpenAnalysis}
                style={({ pressed }) => [styles.analysisButton, pressed && { opacity: 0.7 }, busy && { opacity: 0.55 }]}>
                <Ionicons name="document-text-outline" size={19} color={colors.stamp} />
                <Text style={styles.analysisButtonText}>{openingAnalysis ? "분석 결과 불러오는 중…" : "AI 분석 결과로 돌아가기"}</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.stamp} />
              </Pressable>
            </View>}
          </Card>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(20, 24, 48, 0.35)",
  },
  safe: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  dialog: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    alignSelf: "center",
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    flexShrink: 1,
  },
  content: {
    paddingBottom: spacing.sm,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...type.bodyStrong,
    marginBottom: spacing.sm,
  },
  input: {
    ...type.body,
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: inputSurface,
    padding: spacing.md,
  },
  error: {
    ...type.small,
    color: colors.alert,
    marginBottom: spacing.md,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    padding: spacing.md,
  },
  cancelText: {
    ...type.bodyStrong,
    color: colors.muted,
  },
  saveButton: {
    flex: 1,
  },
  analysisSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line, gap: spacing.sm },
  analysisDescription: { ...type.small, lineHeight: 18 },
  analysisButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    borderWidth: 1, borderColor: colors.stamp, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.stampSoft },
  analysisButtonText: { ...type.bodyStrong, color: colors.stamp, flexShrink: 1 },
});
