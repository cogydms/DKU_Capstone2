// 담당자 2 (AI 분석 결과 / 입력→분석 흐름) 소유
// DocumentAdd 에서 받은 API 응답(route.params.view)을 표시. 없으면 목업으로 표시한다.
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, type } from "../theme/theme";
import { analysisDetail as mockDetail } from "../data/mockData";

const REVIEW_THRESHOLD = 80; // 백엔드 REVIEW_THRESHOLD 와 맞춤

function Item({ text, confidence, prefix }) {
  const low = confidence != null && confidence < REVIEW_THRESHOLD;
  return (
    <View style={styles.itemRow}>
      <Text style={[type.body, { flex: 1 }]}>
        {prefix}
        {text}
      </Text>
      {low && <Badge label="확인 필요" tone="alert" />}
    </View>
  );
}

export default function AIAnalysisScreen({ navigation, route }) {
  const params = route.params ?? {};
  const d = params.view ?? mockDetail;
  const isMock = !params.view;
  const warnings = d.warnings ?? [];
  const next = { documentId: params.documentId, view: params.view, analysis: params.analysis };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.badgeRow}>
          <Badge label={d.docType} tone="stamp" />
          {isMock && <Badge label="예시 데이터" tone="neutral" />}
        </View>
        <Text style={[type.h1, { marginTop: spacing.sm }]}>{d.title ?? "AI 분석 결과"}</Text>

        {(d.needsReview || warnings.length > 0) && (
          <Card style={[styles.card, styles.warnCard]}>
            <Text style={[type.bodyStrong, { color: colors.alert, marginBottom: spacing.xs }]}>
              {d.needsReview ? "확인이 필요한 항목이 있어요" : "참고해 주세요"}
            </Text>
            {warnings.map((w, i) => (
              <Text key={i} style={type.body}>· {w}</Text>
            ))}
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.label}>신청 대상</Text>
          {d.applicantCriteria.length === 0 && <Text style={type.small}>찾지 못했어요</Text>}
          {d.applicantCriteria.map((c, i) => (
            <Item key={i} prefix="· " text={c.text} confidence={c.confidence} />
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>해야 할 일</Text>
          {d.todos.length === 0 && <Text style={type.small}>찾지 못했어요</Text>}
          {d.todos.map((t, i) => (
            <Item key={t.id} prefix={`${i + 1}. `} text={t.text} confidence={t.confidence} />
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>마감일</Text>
          {d.deadline ? (
            <View style={styles.itemRow}>
              <Text style={[type.h2, { color: colors.alert, flex: 1 }]}>{d.deadline.text}</Text>
              {d.deadline.confidence < REVIEW_THRESHOLD && <Badge label="확인 필요" tone="alert" />}
            </View>
          ) : (
            <Text style={type.small}>마감일을 찾지 못했어요. 원문을 확인해 주세요.</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>준비물</Text>
          <Text style={type.body}>{d.requiredDocs.length ? d.requiredDocs.join(" · ") : "없음"}</Text>
        </Card>

        <PrimaryButton label="원문 근거 확인하기" onPress={() => navigation.navigate("EvidenceCheck", next)} />
        <View style={{ height: spacing.md }} />
        <PrimaryButton label="행동 계획 만들기" tone="stamp" onPress={() => navigation.navigate("ActionPlan", next)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  badgeRow: { flexDirection: "row", gap: spacing.sm },
  card: { marginTop: spacing.md, marginBottom: spacing.sm },
  warnCard: { backgroundColor: colors.alertSoft, borderColor: colors.alertSoft },
  label: { ...type.label, marginBottom: spacing.xs, textTransform: "none" },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 2 },
});
