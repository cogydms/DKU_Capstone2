import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Card from "../Card";
import { Text, TextInput } from "../Typography";
import { getAdminDocuments, getAdminUsers } from "../../services/adminApi";
import { colors, radius, spacing, type } from "../../theme/theme";
import { adminDenied, useAdminPage } from "./AdminLayout";
import { AdminButton as Button } from "./AdminControls";
import { accountLabel, ConfirmAdminAction } from "./AdminForms";

const ACCOUNT_FILTERS = [["all", "전체"], ["member", "회원"], ["guest", "게스트"]];
const DOCUMENT_FILTERS = [["all", "전체"], ["needs_review", "확인 필요"], ["analysis_failed", "분석 실패"]];
const STATUSES = { in_progress: "분석 완료", needs_review: "확인 필요", analysis_failed: "분석 실패", analyzing: "분석 중", completed: "완료" };
const dateLabel = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("ko-KR") : "기록 없음";

export default function AdminDirectory({ mode, owner, onSelectUser, onClearOwner, onReviewDocument }) {
  const { user: actor, deny, refreshKey } = useAdminPage();
  const usersMode = mode === "users";
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const ownerUid = owner?.uid || "";
  const changed = () => setReload(n => n + 1);
  useEffect(() => {
    let active = true;
    setLoading(true); setPage(null); setError("");
    const request = usersMode ? getAdminUsers({ q: query, kind: filter, offset })
      : getAdminDocuments({ q: query, ownerUid, status: filter, offset });
    request.then(result => { if (active) setPage(result); }).catch(failure => {
      if (!active) return;
      if (adminDenied(failure)) deny(); else setError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [usersMode, query, filter, offset, reload, ownerUid, deny, refreshKey]);
  const search = () => { setQuery(draft.trim()); setOffset(0); changed(); };
  return <View style={styles.container}>
    {!!owner && !usersMode && <Card style={styles.gap}>
      <Text style={type.bodyStrong}>{accountLabel(owner)}님의 문서</Text>{!!owner.email && <Text selectable style={type.small}>{owner.email}</Text>}
      <Button label="전체 계정의 문서 보기" onPress={onClearOwner} />
    </Card>}
    <View style={styles.search}>
      <TextInput accessibilityLabel={usersMode ? "이용 계정 검색" : "등록 문서 검색"} placeholder={usersMode ? "이름 또는 이메일 검색" : "문서 제목 또는 소유자 검색"}
        value={draft} maxLength={120} onChangeText={setDraft} returnKeyType="search" onSubmitEditing={search} style={styles.input} /><Button label="검색" onPress={search} />
    </View>
    <View style={styles.filters}>{(usersMode ? ACCOUNT_FILTERS : DOCUMENT_FILTERS).map(([key, label]) =>
      <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: filter === key }} onPress={() => { setFilter(key); setOffset(0); }}
        style={[styles.chip, filter === key && styles.chipSelected]}><Text style={[type.small, filter === key && { color: colors.surface }]}>{label}</Text></Pressable>)}</View>
    {usersMode && <Text style={type.small}>등록 프로필 기준의 계정 목록이에요. 게스트 계정 여러 개가 같은 이용자일 수 있어요.</Text>}
    {loading ? <ActivityIndicator color={colors.stamp} /> : error ? <Card>
      <Text accessibilityRole="alert" style={[type.body, { color: colors.alert }]}>{error}</Text><Button label="다시 불러오기" onPress={changed} />
    </Card> : page && <>
      <View style={styles.row}><Text style={[type.bodyStrong, styles.flex]}>검색 결과 {page.total.toLocaleString()}개</Text><Button label="새로고침" onPress={changed} /></View>
      {!page.items.length && <Card><Text style={type.body}>조건에 맞는 {usersMode ? "이용 계정" : "문서"}가 없어요.</Text></Card>}
      {usersMode ? page.items.map(user => {
        const protectedAccount = user.admin || user.uid === actor.uid;
        return <Card key={user.uid} style={styles.gap}>
          <View style={styles.row}><Text style={[type.h2, styles.flex]}>{accountLabel(user)}</Text><Text style={type.small}>{user.admin ? "관리자" : user.accountType === "guest" ? "게스트" : "회원"}</Text></View>
          {!!user.displayName && !!user.email && <Text selectable style={type.body}>{user.email}</Text>}
          <Text style={[type.small, user.disabled && { color: colors.alert }]}>{!user.authExists ? "인증 계정 연결 없음" : user.disabled ? "사용 중지됨" : "사용 가능"}</Text>
          <Text style={type.small}>{[user.collegeName, user.departmentName].filter(Boolean).join(" · ") || "소속 미등록"}</Text>
          <View style={styles.actions}>
            <Button label={`등록 문서 ${user.documentCount}개 보기 ›`} onPress={() => onSelectUser(user)} />
            {!protectedAccount && user.authExists && <Button label={user.disabled ? "재활성화" : "사용 중지"} onPress={() => setConfirm({ kind: "disabled", item: user })} />}
          </View>
        </Card>;
      }) : page.items.map(item => <Card key={`${item.ownerUid}/${item.documentId}`} style={styles.gap}>
        <View style={styles.row}><Text style={[type.h2, styles.flex]}>{item.title || "제목 없는 문서"}</Text><Text style={[type.small, { color: item.status === "analysis_failed" ? colors.alert : colors.muted }]}>{STATUSES[item.status] || item.status || "상태 없음"}</Text></View>
        <Text style={type.body}>소유자: {accountLabel(item.owner)}</Text>
        {!!item.owner.displayName && !!item.owner.email && <Text selectable style={type.small}>{item.owner.email}</Text>}
        <Text style={type.small}>{item.registered ? "계획 등록 완료" : "계획 등록 전"} · {item.source_kind === "pdf" ? "PDF" : item.source_kind === "image" ? "이미지" : "텍스트"}</Text>
        <Text style={type.small}>등록: {dateLabel(item.created_at)}</Text>
        {!!item.error && <Text style={[type.body, { color: colors.alert }]}>{item.error}</Text>}
        <View style={styles.actions}>
          {item.status === "needs_review" && <Button label="검토 내용 보기" onPress={() => onReviewDocument(item)} />}
          <Button label="삭제" danger onPress={() => setConfirm({ kind: "deleteDocument", item })} />
        </View>
        {item.status === "analysis_failed" && <Button label="저장된 원문으로 재분석" onPress={() => setConfirm({ kind: "retry", item })} />}
      </Card>)}
      {(page.offset > 0 || page.nextOffset != null) && <View style={styles.pagination}><Button label="이전" disabled={!page.offset} onPress={() => setOffset(Math.max(0, page.offset - 50))} />
        <Text style={type.small}>{Math.floor(page.offset / 50) + 1}페이지</Text><Button label="다음" disabled={page.nextOffset == null} onPress={() => setOffset(page.nextOffset)} /></View>}
    </>}
    {!!confirm && <ConfirmAdminAction target={confirm} onClose={() => setConfirm(null)} onChanged={changed} />}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.md }, gap: { gap: spacing.sm }, flex: { flex: 1 }, row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  search: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: { ...type.body, flex: 1, minWidth: 0, minHeight: 46, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, chip: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.surface }, chipSelected: { backgroundColor: colors.ink },
  actions: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.lg, borderTopWidth: 1, borderColor: colors.line },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
});
