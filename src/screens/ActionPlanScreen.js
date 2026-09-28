// 담당자 3 (AI 행동 계획 / 검증→계획 흐름) 소유
// TODO(담당자 3): 계획 수립 에이전트가 생성한 Action Graph로 steps 대체
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, type } from "../theme/theme";
import { actionPlan } from "../data/mockData";

export default function ActionPlanScreen({ navigation }) {
  const [steps, setSteps] = useState(actionPlan.steps);

  const toggleStep = (id) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={type.h1}>AI 행동 계획</Text>
        <Text style={styles.subtitle}>마감일까지 필요한 일정을 단계별로 준비해요</Text>

        <View style={styles.timeline}>
          {steps.map((s, i) => (
            <Pressable key={s.id} onPress={() => toggleStep(s.id)} style={styles.stepRow}>
              <View style={styles.stepMarkerCol}>
                <Ionicons
                  name={s.done ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={s.done ? colors.stamp : s.isDeadline ? colors.alert : colors.muted}
                />
                {i < steps.length - 1 && <View style={styles.connector} />}
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepDate}>{s.date}</Text>
                <Text
                  style={[
                    type.bodyStrong,
                    s.done && styles.doneText,
                    s.isDeadline && { color: colors.alert },
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <PrimaryButton
          label="캘린더 · 할 일 목록에 등록"
          tone="stamp"
          onPress={() => navigation.navigate("Management")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { ...type.body, color: colors.muted, marginTop: 4, marginBottom: spacing.xl },
  timeline: { marginBottom: spacing.xl },
  stepRow: { flexDirection: "row" },
  stepMarkerCol: { alignItems: "center", width: 32 },
  connector: { width: 2, flex: 1, backgroundColor: colors.line, marginVertical: 2 },
  stepBody: { flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.sm },
  stepDate: { ...type.small, marginBottom: 2 },
  doneText: { color: colors.muted, textDecorationLine: "line-through" },
});
