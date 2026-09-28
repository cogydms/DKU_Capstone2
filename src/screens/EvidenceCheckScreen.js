// 담당자 3 (원문 근거 확인 / 검증 흐름) 소유
// TODO(담당자 3): 근거 검증 에이전트 API로 원문 하이라이트 좌표 연결
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../components/Card";
import ConfidenceBar from "../components/ConfidenceBar";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, type } from "../theme/theme";
import { analysisDetail } from "../data/mockData";

export default function EvidenceCheckScreen({ navigation }) {
  const { evidence } = analysisDetail;
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={type.h1}>원문 근거 확인</Text>
        <Text style={styles.subtitle}>AI가 찾은 근거를 직접 확인하세요</Text>

        <Card style={styles.card}>
          <Text style={styles.label}>{evidence.location}</Text>
          <Text style={styles.excerpt}>{evidence.sourceExcerpt}</Text>
        </Card>

        <Text style={[type.h2, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          추출된 정보 신뢰도
        </Text>
        <Card style={styles.card}>
          {evidence.fields.map((f, i) => (
            <ConfidenceBar key={i} label={`${f.label} · ${f.value}`} pct={f.confidence} />
          ))}
        </Card>

        <PrimaryButton
          label="확인했어요, 이대로 진행"
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
  subtitle: { ...type.body, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  label: { ...type.label, marginBottom: spacing.sm },
  excerpt: { ...type.body, fontStyle: "italic" },
});
