// 담당자 2 (AI 분석 결과 / 입력→분석 흐름) 소유
// TODO(담당자 2): 행동 정보 추출 에이전트 API 응답으로 mockData.analysisDetail 대체
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, type } from "../theme/theme";
import { analysisDetail } from "../data/mockData";

export default function AIAnalysisScreen({ navigation }) {
  const d = analysisDetail;
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Badge label={d.docType} tone="stamp" />
        <Text style={[type.h1, { marginTop: spacing.sm }]}>AI 분석 결과</Text>

        <Card style={styles.card}>
          <Text style={styles.label}>신청 대상</Text>
          {d.applicantCriteria.map((c, i) => (
            <Text key={i} style={type.body}>
              · {c.text}
            </Text>
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>해야 할 일</Text>
          {d.todos.map((t, i) => (
            <Text key={t.id} style={type.body}>
              {i + 1}. {t.text}
            </Text>
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>마감일</Text>
          <Text style={[type.h2, { color: colors.alert }]}>{d.deadline.text}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>준비물</Text>
          <Text style={type.body}>{d.requiredDocs.join(" · ")}</Text>
        </Card>

        <PrimaryButton
          label="원문 근거 확인하기"
          onPress={() => navigation.navigate("EvidenceCheck")}
        />
        <View style={{ height: spacing.md }} />
        <PrimaryButton
          label="행동 계획 만들기"
          tone="stamp"
          onPress={() => navigation.navigate("ActionPlan")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginTop: spacing.md, marginBottom: spacing.sm },
  label: { ...type.label, marginBottom: spacing.xs, textTransform: "none" },
});
