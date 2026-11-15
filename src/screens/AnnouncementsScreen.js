import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import ScreenSurface from "../components/ScreenSurface";
import Card from "../components/Card";
import { Text } from "../components/Typography";
import { useAuth } from "../contexts/AuthContext";
import { listAnnouncements } from "../services/adminApi";
import { colors, pageContent, spacing, type } from "../theme/theme";

export default function AnnouncementsScreen() {
  const { user } = useAuth();
  return <AnnouncementList key={user?.uid || "signed-out"} />;
}

function AnnouncementList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError("");
    listAnnouncements().then(list => { if (active) setItems(list); })
      .catch(failure => { if (active) { setError(failure.message); setItems([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]));
  return <ScreenSurface edges={["bottom"]}>
    <ScrollView contentContainerStyle={{ ...pageContent, padding: spacing.lg, gap: spacing.md }}>
      {loading ? <ActivityIndicator color={colors.stamp} /> : error ? <Card>
        <Text accessibilityRole="alert" style={[type.body, { color: colors.alert }]}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={() => setReload(n => n + 1)} style={{ minHeight: 44, justifyContent: "center" }}><Text style={type.bodyStrong}>다시 불러오기</Text></Pressable>
      </Card> : !items.length ? <Card><Text style={type.body}>등록된 공지사항이 없어요.</Text></Card> : items.map(item => <Card key={item.id} style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.xs }}><Text accessibilityRole="header" style={type.h2}>{item.title}</Text>
          <Text style={type.small}>{new Date(item.publishedAt || item.updatedAt).toLocaleDateString("ko-KR")}</Text></View>
        <Text style={type.body}>{item.body}</Text>
      </Card>)}
    </ScrollView>
  </ScreenSurface>;
}
