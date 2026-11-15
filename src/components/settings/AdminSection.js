import React, { useCallback, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { currentAuthUser, usesGoogleAccount } from "../../services/auth";
import { getAdminAccess } from "../../services/adminApi";
import Card from "../Card";
import { Text } from "../Typography";
import { colors, spacing, type } from "../../theme/theme";

export default function AdminSection() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [access, setAccess] = useState({ uid: null, allowed: false, error: "", loading: false });
  const [reload, setReload] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    if (!usesGoogleAccount(user)) { setAccess({ uid: user?.uid, allowed: false, error: "", loading: false }); return; }
    setAccess({ uid: user.uid, allowed: false, error: "", loading: true });
    getAdminAccess(user).then(result => {
      if (active && currentAuthUser()?.uid === user.uid) setAccess({ uid: user.uid, allowed: result.admin === true, error: "", loading: false });
    }).catch(error => {
      if (active && currentAuthUser()?.uid === user.uid) setAccess({ uid: user.uid, allowed: false, error: error.message, loading: false });
    });
    return () => { active = false; };
  }, [user, reload]));
  if (access.uid !== user?.uid || (!access.allowed && !access.error)) return null;
  return <View style={{ marginBottom: spacing.lg }}>
    {access.error ? <Card style={{ gap: spacing.sm }}>
      <Text style={type.small}>접근 권한을 확인하지 못했어요.</Text>
      <Pressable accessibilityRole="button" onPress={() => setReload(n => n + 1)} style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={[type.bodyStrong, { color: colors.stamp }]}>권한 다시 확인</Text>
      </Pressable>
    </Card> : <Card>
      <Pressable accessibilityRole="button" accessibilityLabel="관리자 전용 페이지 열기"
        onPress={() => navigation.navigate("Admin")} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 44 }}>
        <Ionicons name="shield-checkmark-outline" size={23} color={colors.stamp} />
        <View style={{ flex: 1 }}><Text style={type.bodyStrong}>관리자 전용 페이지</Text><Text style={type.small}>이용 계정 · 문서 · 공지 관리</Text></View>
        {access.loading ? <ActivityIndicator color={colors.stamp} /> : <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
      </Pressable>
    </Card>}
  </View>;
}
