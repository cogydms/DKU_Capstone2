// 담당자 2 (문서 추가 / 입력 흐름) 소유
// 지금은 실제 업로드 대신 목업 분석 파이프라인을 시뮬레이션한다.
// TODO(담당자 2): 실제 카메라/파일 피커 연동, 문서 접수 에이전트 API 연결
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, type, radius } from "../theme/theme";

const INPUT_METHODS = [
  { id: "photo", label: "사진 촬영", icon: "camera-outline" },
  { id: "pdf", label: "PDF 업로드", icon: "document-text-outline" },
  { id: "link", label: "링크 붙여넣기", icon: "link-outline" },
  { id: "email", label: "이메일 전달", icon: "mail-outline" },
];

export default function DocumentAddScreen({ navigation }) {
  const [analyzing, setAnalyzing] = useState(false);

  const handlePick = (methodId) => {
    // 목업: 실제로는 여기서 문서 접수 에이전트에 파일을 업로드
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      navigation.navigate("AIAnalysis", { docId: "doc-1" });
    }, 900);
  };

  if (analyzing) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.stamp} />
        <Text style={styles.analyzingText}>문서 종류를 확인하고 있어요…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={type.h1}>문서 추가하기</Text>
        <Text style={styles.subtitle}>다양한 방법으로 문서를 공유할 수 있어요</Text>

        <View style={styles.grid}>
          {INPUT_METHODS.map((m) => (
            <Pressable key={m.id} style={styles.tile} onPress={() => handlePick(m.id)}>
              <Ionicons name={m.icon} size={26} color={colors.ink} />
              <Text style={styles.tileLabel}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  center: { alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg },
  subtitle: { ...type.body, color: colors.muted, marginTop: 4, marginBottom: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%",
    aspectRatio: 1.3,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  tileLabel: { ...type.bodyStrong },
  analyzingText: { ...type.body, marginTop: spacing.md, color: colors.muted },
});
