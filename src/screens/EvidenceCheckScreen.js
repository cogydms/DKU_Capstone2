// 담당자 3 (원문 근거 확인 / 검증 흐름) 소유
// 근거 검증 에이전트 결과를 보여주고, '확인 필요' 항목을 사용자가 승인하거나 삭제한다.
import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../components/Card";
import Badge from "../components/Badge";
import ConfidenceBar from "../components/ConfidenceBar";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, type, radius } from "../theme/theme";
import { analysisDetail as mockDetail } from "../data/mockData";
import { confirmField, rejectField } from "../services/api";

const STATUS_LABEL = {
  needs_review: { label: "확인 필요", tone: "gold" },
  unverified: { label: "근거 없음", tone: "alert" },
};

function showError(message) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("처리하지 못했어요", message);
}

function ReviewItem({ field, busy, onConfirm, onReject }) {
  const s = STATUS_LABEL[field.status];
  const failed = field.checks.filter((c) => !c.passed);
  const evidenceText = field.evidence.matched_text;
  return (
    <Card style={styles.card}>
      <View style={styles.reviewHeader}>
        <Text style={[type.bodyStrong, { flex: 1 }]}>
          {field.label} · {field.value}
        </Text>
        <Badge label={`${s.label} ${field.confidence}%`} tone={s.tone} />
      </View>

      <Text style={styles.label}>{evidenceText ? field.location ?? "원문" : "AI가 제시한 근거 (원문에서 찾지 못함)"}</Text>
      <Text style={styles.excerpt}>{evidenceText ?? field.evidence.quote}</Text>

      {failed.map((c) => (
        <Text key={c.name} style={styles.reason}>
          · {c.detail}
        </Text>
      ))}

      <View style={styles.actions}>
        {busy ? (
          <ActivityIndicator color={colors.stamp} />
        ) : (
          <>
            <Pressable style={[styles.smallBtn, styles.rejectBtn]} onPress={onReject}>
              <Text style={[styles.smallBtnText, { color: colors.alert }]}>잘못됐어요, 삭제</Text>
            </Pressable>
            <Pressable style={[styles.smallBtn, styles.confirmBtn]} onPress={onConfirm}>
              <Text style={[styles.smallBtnText, { color: "#fff" }]}>맞아요</Text>
            </Pressable>
          </>
        )}
      </View>
    </Card>
  );
}

export default function EvidenceCheckScreen({ navigation, route }) {
  const params = route.params ?? {};
  const [view, setView] = useState(params.view ?? mockDetail);
  const [analysis, setAnalysis] = useState(params.analysis ?? null);
  const [busyId, setBusyId] = useState(null);
  const documentId = params.documentId;
  const { evidence } = view;

  const reviewFields = (analysis?.fields ?? []).filter(
    (f) => f.status === "needs_review" || f.status === "unverified"
  );

  const act = async (fieldId, fn) => {
    setBusyId(fieldId);
    try {
      const res = await fn(documentId, fieldId);
      setView(res.view);
      setAnalysis(res.analysis);
    } catch (e) {
      showError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={type.h1}>원문 근거 확인</Text>
        <Text style={styles.subtitle}>AI가 찾은 근거를 직접 확인하세요</Text>

        {evidence.sourceExcerpt ? (
          <Card style={styles.card}>
            <Text style={styles.label}>{evidence.location ?? "원문"}</Text>
            <Text style={styles.excerpt}>{evidence.sourceExcerpt}</Text>
          </Card>
        ) : null}

        <Text style={[type.h2, styles.sectionTitle]}>추출된 정보 신뢰도</Text>
        <Card style={styles.card}>
          {evidence.fields.length === 0 && <Text style={type.small}>표시할 항목이 없어요</Text>}
          {evidence.fields.map((f, i) => (
            <ConfidenceBar key={i} label={`${f.label} · ${f.value}`} pct={f.confidence} />
          ))}
        </Card>

        {reviewFields.length > 0 && (
          <>
            <Text style={[type.h2, styles.sectionTitle]}>확인이 필요한 항목 {reviewFields.length}개</Text>
            <Text style={[type.small, { marginBottom: spacing.sm }]}>
              원문과 대조했을 때 확실하지 않은 항목이에요. 맞으면 승인하고, 틀리면 삭제해 주세요.
            </Text>
            {reviewFields.map((f) => (
              <ReviewItem
                key={f.id}
                field={f}
                busy={busyId === f.id}
                onConfirm={() => act(f.id, confirmField)}
                onReject={() => act(f.id, rejectField)}
              />
            ))}
          </>
        )}

        <PrimaryButton
          label={reviewFields.length ? "확인 필요 항목은 그대로 두고 진행" : "확인했어요, 이대로 진행"}
          tone="stamp"
          onPress={() => navigation.navigate("ActionPlan", { documentId, view, analysis })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { ...type.body, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { marginBottom: spacing.md },
  label: { ...type.label, marginBottom: spacing.sm },
  excerpt: { ...type.body, fontStyle: "italic" },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  reason: { ...type.small, color: colors.alert, marginTop: spacing.xs },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
  smallBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  confirmBtn: { backgroundColor: colors.stamp },
  rejectBtn: { backgroundColor: colors.alertSoft },
  smallBtnText: { fontSize: 13, fontWeight: "700" },
});
