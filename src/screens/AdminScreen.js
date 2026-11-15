import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { Text, TextInput } from "../components/Typography";
import AdminDirectory from "../components/admin/AdminDirectory";
import AdminLayout, { adminDenied, useAdminAction, useAdminPage } from "../components/admin/AdminLayout";
import { AdminButton, AdminFeedback, adminStyles } from "../components/admin/AdminControls";
import { getAdminNotices, saveAnnouncement } from "../services/adminApi";
import { colors, spacing, type } from "../theme/theme";

const MENU = [
  { title: "이용 계정", detail: "계정 조회와 사용 상태 관리", icon: "people-outline", route: "AdminUsers" },
  { title: "문서 관리", detail: "확인 필요 항목 검토와 분석 실패 처리", icon: "documents-outline", route: "AdminDocuments" },
  { title: "공지 관리", detail: "이용자에게 안내할 공지 작성과 게시", icon: "megaphone-outline", route: "AdminNotices" },
];
const dateLabel = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("ko-KR") : "시각 정보 없음";

function useAdminResource(fetchData) {
  const { deny, refreshKey } = useAdminPage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    fetchData().then(result => { if (active) setData(result); }).catch(failure => {
      if (!active) return;
      if (adminDenied(failure)) deny(); else setError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchData, deny, refreshKey, attempt]);
  return { data, loading, error, reload: () => setAttempt(n => n + 1) };
}
function ResourceHeader({ resource }) {
  return <><View style={styles.row}><Text style={[type.small, styles.flex]}>사용자에게 전할 소식을 관리해요.</Text><AdminButton label="새로고침" disabled={resource.loading} onPress={resource.reload} /></View>
    <AdminFeedback error={resource.error} />{resource.loading && <ActivityIndicator color={colors.stamp} />}</>;
}
export default function AdminScreen({ navigation }) {
  return <AdminLayout><Overview navigation={navigation} /></AdminLayout>;
}
function Overview({ navigation }) {
  return <>
    <Text style={type.body}>계정과 문서를 살피고, 필요한 소식을 전하세요.</Text>
    {MENU.map(item => <Card key={item.route} style={styles.menuCard}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} 열기`} onPress={() => navigation.navigate(item.route)}
        style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.6 }]}>
        <View style={styles.menuIcon}><Ionicons name={item.icon} size={24} color={colors.ink} /></View>
        <View style={[styles.flex, styles.gap]}><Text style={type.h2}>{item.title}</Text><Text style={type.small}>{item.detail}</Text></View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    </Card>)}
  </>;
}
export function AdminUsersScreen({ navigation }) {
  return <AdminLayout><AdminDirectory mode="users" onSelectUser={owner => navigation.push("AdminDocuments", { owner })} /></AdminLayout>;
}
export function AdminDocumentsScreen({ route, navigation }) {
  const { owner } = route.params || {};
  return <AdminLayout><AdminDirectory key={owner?.uid || "all"} mode="documents" owner={owner}
    onReviewDocument={item => navigation.push("AdminDocumentReview", { ownerUid: item.ownerUid, documentId: item.documentId })}
    onClearOwner={() => navigation.setParams({ owner: null })} /></AdminLayout>;
}
export function AdminNoticesScreen() {
  return <AdminLayout><Notices /></AdminLayout>;
}
function Notices() {
  const resource = useAdminResource(getAdminNotices);
  const action = useAdminAction();
  const [editor, setEditor] = useState(null);
  const save = published => {
    if (!editor.title.trim() || !editor.body.trim()) { action.setError("공지 제목과 내용을 입력해 주세요."); return; }
    action.run(() => saveAnnouncement(editor, published), () => { setEditor(null); resource.reload(); }, published ? "공지사항을 게시했어요." : "공지사항을 저장했어요.");
  };
  return <>
    <ResourceHeader resource={resource} /><AdminFeedback {...action} />
    {editor ? <Card style={styles.gap}>
      <Text style={type.h2}>{editor.id ? "공지 수정" : "새 공지 작성"}</Text><Text style={type.small}>게시하면 모든 사용자가 설정의 공지사항에서 볼 수 있어요.</Text>
      <TextInput accessibilityLabel="공지 제목" placeholder="공지 제목" maxLength={120} editable={!action.busy} value={editor.title} onChangeText={title => setEditor(previous => ({ ...previous, title }))} style={adminStyles.input} />
      <TextInput accessibilityLabel="공지 내용" placeholder="공지 내용" multiline maxLength={5000} editable={!action.busy} value={editor.body} onChangeText={body => setEditor(previous => ({ ...previous, body }))} style={[adminStyles.input, { minHeight: 170, textAlignVertical: "top" }]} />
      <PrimaryButton label={action.busy ? "저장 중…" : editor.published ? "게시 내용 수정" : "게시하기"} disabled={action.busy} onPress={() => save(true)} />
      <AdminButton label={editor.published ? "게시 내리고 저장" : "임시 저장"} disabled={action.busy} onPress={() => save(false)} />
      <AdminButton label="목록으로" disabled={action.busy} onPress={() => setEditor(null)} />
    </Card> : <>
      <PrimaryButton label="새 공지 작성" onPress={() => setEditor({ title: "", body: "", published: false, revision: 0 })} />
      {resource.data?.length === 0 && <Card><Text style={type.body}>등록된 공지가 없어요.</Text></Card>}
      {resource.data?.map(item => <Card key={item.id} style={styles.gap}>
        <View style={styles.row}><Text style={[type.h2, styles.flex]}>{item.title}</Text><Text style={type.small}>{item.published ? "게시 중" : "임시 저장"}</Text></View>
        <Text style={type.body} numberOfLines={3}>{item.body}</Text><Text style={type.small}>{dateLabel(item.updatedAt)}</Text>
        <AdminButton label="공지 수정" onPress={() => setEditor({ ...item })} />
      </Card>)}
    </>}
  </>;
}
const styles = StyleSheet.create({
  flex: { flex: 1 }, gap: { gap: spacing.sm }, row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 44 },
  menuCard: { padding: 0 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, minHeight: 100 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" },
});
