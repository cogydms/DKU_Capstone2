// 담당자 1 (홈/전체 셸) 소유
import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { colors, spacing, type } from "../theme/theme";
import { documents, homeUpcoming } from "../data/mockData";

const ddayTone = (dday) => (dday >= -3 ? "alert" : dday >= -10 ? "gold" : "neutral");

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={type.display}>ActionDoc</Text>
          <Text style={styles.tagline}>공지 하나만 넣으면, 할 일을 끝까지 관리해요</Text>
        </View>

        <Text style={styles.sectionTitle}>다가오는 마감</Text>
        <Card style={{ marginBottom: spacing.xl }}>
          {homeUpcoming.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.upcomingRow, idx > 0 && styles.upcomingDivider]}
            >
              <Text style={type.bodyStrong}>{item.title}</Text>
              <Badge label={`D${item.dday}`} tone={ddayTone(item.dday)} />
            </View>
          ))}
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>내 문서</Text>
          <Text style={styles.sectionCount}>{documents.length}건</Text>
        </View>

        {documents.map((doc) => (
          <Pressable
            key={doc.id}
            onPress={() => navigation.navigate("AIAnalysis", { docId: doc.id })}
          >
            <Card style={{ marginBottom: spacing.md }}>
              <View style={styles.docRow}>
                <View style={{ flex: 1 }}>
                  <Text style={type.bodyStrong}>{doc.title}</Text>
                  <Text style={styles.docType}>{doc.type}</Text>
                </View>
                <Badge label={`D${doc.dday}`} tone={ddayTone(doc.dday)} />
              </View>
              {doc.status === "needs_review" && (
                <Text style={styles.reviewNote}>⚠ 항목 확인이 필요해요</Text>
              )}
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("DocumentAdd")}
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: 100 },
  header: { marginBottom: spacing.xl },
  tagline: { ...type.body, color: colors.muted, marginTop: 4 },
  sectionTitle: { ...type.h2, marginBottom: spacing.sm },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  sectionCount: { ...type.small },
  upcomingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  upcomingDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  docRow: { flexDirection: "row", alignItems: "center" },
  docType: { ...type.small, marginTop: 2 },
  reviewNote: { ...type.small, color: colors.alert, marginTop: spacing.sm, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.stamp,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
