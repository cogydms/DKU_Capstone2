// src/screens/ManagementScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import { colors, spacing, type } from "../theme/theme";

// 🔥 Firebase 모듈: deleteDoc 추가
import { db } from "../services/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function ManagementScreen() {
  const [todoList, setTodoList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. [조회: Read] Firestore의 todos 컬렉션 가져오기
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "todos"), orderBy("order", "asc"));
      const querySnapshot = await getDocs(q);

      const items = [];
      querySnapshot.forEach((document) => {
        items.push({
          id: document.id,
          ...document.data(),
        });
      });

      setTodoList(items);
    } catch (error) {
      console.error("Firestore 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 2. [수정: Update] 체크박스 누를 때 DB is_completed 반영
  const handleToggle = async (todoId, currentStatus) => {
    const nextStatus = !currentStatus;

    setTodoList((prev) =>
      prev.map((item) => (item.id === todoId ? { ...item, is_completed: nextStatus } : item))
    );

    try {
      const todoDocRef = doc(db, "todos", todoId);
      await updateDoc(todoDocRef, {
        is_completed: nextStatus,
        updated_at: new Date(),
      });
      console.log(`DB 저장 성공! [ID: ${todoId}] -> is_completed: ${nextStatus}`);
    } catch (error) {
      console.error("DB 업데이트 실패:", error);
      setTodoList((prev) =>
        prev.map((item) => (item.id === todoId ? { ...item, is_completed: currentStatus } : item))
      );
      Alert.alert("오류", "상태 변경 저장에 실패했습니다.");
    }
  };

  // 3. [삭제: Delete] ⭐ 쓰레기통 터치 시 확인 팝업 후 Firestore DB에서 영구 삭제
  const handleDelete = (todoId, todoTitle) => {
    Alert.alert(
      "할 일 삭제",
      `'${todoTitle}' 항목을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            // UI에서 즉시 제거
            setTodoList((prev) => prev.filter((item) => item.id !== todoId));

            // Firestore DB에서 실제 문서 삭제
            try {
              const todoDocRef = doc(db, "todos", todoId);
              await deleteDoc(todoDocRef);
              console.log(`DB 삭제 성공! [문서 ID: ${todoId}]`);
            } catch (error) {
              console.error("DB 삭제 실패:", error);
              Alert.alert("오류", "DB에서 삭제하지 못했습니다. 다시 시도해 주세요.");
              fetchTodos(); // 실패 시 DB 목록 다시 불러오기
            }
          },
        },
      ]
    );
  };

  // 진행률 자동 계산
  const completedCount = todoList.filter((item) => item.is_completed).length;
  const progress = todoList.length > 0 ? completedCount / todoList.length : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.stamp} />
        <Text style={{ marginTop: spacing.md, color: colors.muted }}>할 일 목록을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={type.h1}>등록 후 관리</Text>
        <Text style={styles.subtitle}>마감일까지 진행 상황을 지켜볼게요</Text>

        <Card style={styles.card}>
          <Text style={type.bodyStrong}>
            {todoList[0]?.doc_title || "할 일 목록"}
          </Text>

          <View style={{ marginVertical: spacing.md }}>
            <ProgressBar progress={progress} />
            <Text style={styles.progressLabel}>
              {completedCount} / {todoList.length} 완료
            </Text>
          </View>

          {todoList.length === 0 ? (
            <Text style={styles.emptyText}>등록된 할 일이 없습니다.</Text>
          ) : (
            todoList.map((item) => (
              <View key={item.id} style={styles.stepRow}>
                {/* 체크박스 & 텍스트 영역 */}
                <Pressable
                  style={styles.todoContent}
                  onPress={() => handleToggle(item.id, item.is_completed)}
                >
                  <Ionicons
                    name={item.is_completed ? "checkbox" : "square-outline"}
                    size={20}
                    color={item.is_completed ? colors.stamp : colors.muted}
                  />
                  <Text style={[type.body, item.is_completed && styles.doneText]}>
                    {item.title}
                  </Text>
                </Pressable>

                {/* 쓰레기통 삭제 버튼 */}
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id, item.title)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.muted} />
                </Pressable>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  center: { alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { ...type.body, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  progressLabel: { ...type.small, marginTop: spacing.xs },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  todoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  doneText: { color: colors.muted, textDecorationLine: "line-through" },
  emptyText: { ...type.body, color: colors.muted, textAlign: "center", paddingVertical: spacing.lg },
});