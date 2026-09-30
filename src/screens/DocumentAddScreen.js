// 담당자 2 (문서 추가 / 입력 흐름) 소유
// 사진·앨범·PDF·텍스트를 백엔드(/api/documents/analyze)로 보내 접수→추출→검증을 실행한다.
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, TextInput, Alert, Platform,
  KeyboardAvoidingView, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, type, radius } from "../theme/theme";
import { analyzeFile, analyzeText } from "../services/api";

const INPUT_METHODS = [
  { id: "camera", label: "사진 촬영", icon: "camera-outline" },
  { id: "library", label: "앨범에서 선택", icon: "images-outline" },
  { id: "pdf", label: "PDF 업로드", icon: "document-text-outline" },
  { id: "text", label: "텍스트 붙여넣기", icon: "clipboard-outline" },
  { id: "link", label: "링크 붙여넣기", icon: "link-outline", soon: true },
  { id: "email", label: "이메일 전달", icon: "mail-outline", soon: true },
];

// 백엔드 파이프라인 단계에 맞춘 로딩 문구 (실제 진행률이 아니라 대기 중 안내용)
const STAGES = ["문서를 읽고 있어요…", "해야 할 일을 찾고 있어요…", "원문과 한 줄씩 대조하고 있어요…"];

function showError(message) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("분석하지 못했어요", message);
}

export default function DocumentAddScreen({ navigation }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const run = async (task) => {
    setAnalyzing(true);
    setStage(0);
    timer.current = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2500);
    try {
      const { documentId, view, analysis } = await task();
      setTextMode(false);
      setText("");
      navigation.navigate("AIAnalysis", { documentId, view, analysis });
    } catch (e) {
      showError(e.message);
    } finally {
      clearInterval(timer.current);
      setAnalyzing(false);
    }
  };

  const pickCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return showError("카메라 권한이 필요해요. 설정에서 허용해 주세요.");
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled) run(() => analyzeFile(r.assets[0]));
  };

  const pickLibrary = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled) run(() => analyzeFile(r.assets[0]));
  };

  const pickPdf = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (!r.canceled) run(() => analyzeFile(r.assets[0]));
  };

  const handlePick = (m) => {
    if (m.soon) return showError(`${m.label}는 준비 중이에요. 지금은 사진·PDF·텍스트로 추가해 주세요.`);
    if (m.id === "camera") return pickCamera();
    if (m.id === "library") return pickLibrary();
    if (m.id === "pdf") return pickPdf();
    if (m.id === "text") return setTextMode(true);
  };

  if (analyzing) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.stamp} />
        <Text style={styles.analyzingText}>{STAGES[stage]}</Text>
      </SafeAreaView>
    );
  }

  if (textMode) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={type.h1}>텍스트 붙여넣기</Text>
            <Text style={styles.subtitle}>공지문 내용을 그대로 붙여넣어 주세요</Text>
            <TextInput
              style={styles.input}
              multiline
              value={text}
              onChangeText={setText}
              placeholder={"예) 2026학년도 SW인재 장학금 신청 안내\n신청 기간: 9월 15일 ~ 9월 25일 17:00까지 …"}
              placeholderTextColor={colors.muted}
              textAlignVertical="top"
            />
            <PrimaryButton
              label="분석하기"
              tone="stamp"
              disabled={text.trim().length < 10}
              onPress={() => run(() => analyzeText(text))}
            />
            <View style={{ height: spacing.sm }} />
            <PrimaryButton label="다른 방법 선택" onPress={() => setTextMode(false)} />
          </ScrollView>
        </KeyboardAvoidingView>
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
            <Pressable key={m.id} style={[styles.tile, m.soon && styles.tileSoon]} onPress={() => handlePick(m)}>
              <Ionicons name={m.icon} size={26} color={m.soon ? colors.muted : colors.ink} />
              <Text style={[styles.tileLabel, m.soon && { color: colors.muted }]}>{m.label}</Text>
              {m.soon && <Text style={type.small}>준비 중</Text>}
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
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  tileSoon: { backgroundColor: colors.paper },
  tileLabel: { ...type.bodyStrong },
  analyzingText: { ...type.body, marginTop: spacing.md, color: colors.muted },
  input: {
    ...type.body,
    minHeight: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});
