import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import ScreenSurface from "../ScreenSurface";
import { Text } from "../Typography";
import { useAuth } from "../../contexts/AuthContext";
import { currentAuthUser } from "../../services/auth";
import { getAdminAccess } from "../../services/adminApi";
import { colors, pageContent, spacing, type } from "../../theme/theme";
import { AdminButton } from "./AdminControls";

const Context = createContext(null);
export const useAdminPage = () => useContext(Context);
export const adminDenied = failure => [401, 403].includes(failure.status) && failure.code !== "admin-reauth-required";

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  return <Access key={user?.uid || "out"} user={user}>{children}</Access>;
}

function Access({ user, children }) {
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const deny = useCallback(() => setStatus("denied"), []);
  useFocusEffect(useCallback(() => {
    let active = true;
    getAdminAccess(user).then(access => {
      if (!active || currentAuthUser()?.uid !== user?.uid) return;
      setStatus(access.admin ? "allowed" : "denied");
      setRefreshKey(n => n + 1);
    }).catch(failure => {
      if (!active) return;
      setError(failure.message);
      setStatus(adminDenied(failure) ? "denied" : "error");
    });
    return () => { active = false; };
  }, [user, attempt]));
  return <ScreenSurface edges={["bottom"]}>
    {status === "allowed" ? <Context.Provider value={{ user, deny, refreshKey }}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
      </KeyboardAvoidingView>
    </Context.Provider> : <View style={styles.center}>
      {status === "checking" ? <><ActivityIndicator color={colors.stamp} /><Text style={type.body}>관리자 권한을 확인하고 있어요.</Text></>
        : <><Text style={type.h2}>{status === "denied" ? "관리자 권한이 필요해요" : "연결을 확인해 주세요"}</Text>
          <Text style={type.body}>{status === "denied" ? "관리자로 지정된 Google 계정으로 로그인해 주세요." : error}</Text>
          <AdminButton label="다시 확인" onPress={() => { setStatus("checking"); setAttempt(n => n + 1); }} /></>}
    </View>}
  </ScreenSurface>;
}

// 목록과 모달이 같은 오류/계정 변경 처리를 사용한다.
export function useAdminAction() {
  const { user, deny } = useAdminPage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);
  const active = useRef(true);
  React.useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const run = async (task, onSuccess, success = "") => {
    if (pending.current || currentAuthUser()?.uid !== user.uid) return false;
    pending.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const result = await task();
      if (!active.current || currentAuthUser()?.uid !== user.uid) return false;
      onSuccess?.(result); setMessage(success); return true;
    } catch (failure) {
      if (!active.current || currentAuthUser()?.uid !== user.uid) return false;
      if (adminDenied(failure)) deny(); else setError(failure.message);
      return false;
    } finally { pending.current = false; if (active.current) setBusy(false); }
  };
  return { busy, error, message, run, setError };
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { ...pageContent, padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, padding: spacing.xl, gap: spacing.md, alignItems: "center", justifyContent: "center" },
});
