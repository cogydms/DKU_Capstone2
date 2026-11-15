import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Card from "../components/Card";
import { Text } from "../components/Typography";
import AdminLayout, { adminDenied, useAdminPage } from "../components/admin/AdminLayout";
import { AdminButton, AdminDialog, AdminFeedback } from "../components/admin/AdminControls";
import { getAdminDocumentReview, getAdminReviewSource } from "../services/adminApi";
import { colors, radius, spacing, type } from "../theme/theme";

const needsReview = field => ["needs_review", "unverified"].includes(field.status);
const STATUS = { needs_review: "확인 필요", unverified: "근거 없음", verified: "검증 통과", user_confirmed: "사용자가 직접 확인한 항목" };

export default function AdminDocumentReviewScreen({ route }) {
  const { ownerUid, documentId } = route.params || {};
  return <AdminLayout><Review key={`${ownerUid}/${documentId}`} ownerUid={ownerUid} documentId={documentId} /></AdminLayout>;
}

function Review({ ownerUid, documentId }) {
  const { deny, refreshKey } = useAdminPage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("review");
  const [sourceTarget, setSourceTarget] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setData(null); setSourceTarget(null);
    if (!ownerUid || !documentId) {
      setLoading(false); setError("문서 정보를 확인하지 못했어요. 목록에서 다시 열어 주세요.");
      return () => { active = false; };
    }
    getAdminDocumentReview({ ownerUid, documentId }).then(result => {
      if (!active) return;
      setData(result);
      if (!result.reviewCount) setFilter("all");
    }).catch(failure => {
      if (!active) return;
      if (adminDenied(failure)) deny(); else setError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ownerUid, documentId, deny, refreshKey, attempt]);
  const fields = data?.fields || [];
  const visible = fields.filter(field => filter === "all" || needsReview(field))
    .map((field, index) => ({ field, index })).sort((a, b) => Number(needsReview(b.field)) - Number(needsReview(a.field)) || a.index - b.index);
  return <>
    <View style={styles.row}><Text accessibilityRole="header" style={[type.h1, styles.flex]}>검토 내용</Text>
      <AdminButton label="새로고침" disabled={loading} onPress={() => setAttempt(n => n + 1)} /></View>
    <AdminFeedback error={error} />
    {loading && <ActivityIndicator color={colors.stamp} />}
    {!!data && <>
      <Card style={styles.gap}>
        <Text style={type.h2}>{data.title}</Text>
        <Text style={type.bodyStrong}>확인 필요 {data.reviewCount}개 / 전체 {fields.length}개 항목</Text>
        <Text style={type.small}>확인이 필요한 이유와 원문을 비교해 보세요.</Text>
        <AdminButton label="원문 전체 보기" disabled={!data.sourceAvailable} onPress={() => setSourceTarget({ field: null })} />
        {!data.sourceAvailable && <Text style={type.small}>저장된 원문 텍스트를 찾을 수 없어, 추출값과 검증 기록만 표시해요.</Text>}
      </Card>
      <View style={styles.row}>{[["review", `확인 필요 ${data.reviewCount}`], ["all", `전체 항목 ${fields.length}`]].map(([key, label]) =>
        <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: filter === key }} onPress={() => setFilter(key)} style={[styles.chip, filter === key && styles.selectedChip]}>
          <Text style={[type.bodyStrong, filter === key && { color: colors.surface }]}>{label}</Text>
        </Pressable>)}</View>
      {!visible.length && <Card><Text style={type.body}>현재 확인이 필요한 항목이 없어요.</Text></Card>}
      {visible.map(({ field }) => <FieldCard key={field.id} field={field} threshold={data.reviewThreshold} sourceAvailable={data.sourceAvailable} onSource={() => setSourceTarget({ field })} />)}
      {!!data.warnings?.length && <Card style={styles.gap}><Text style={type.h2}>분석 당시 안내</Text>{data.warnings.map((warning, index) => <Text key={index} style={type.body}>• {warning}</Text>)}</Card>}
      {!!sourceTarget && <SourceDialog document={data} field={sourceTarget.field} onClose={() => setSourceTarget(null)} />}
    </>}
  </>;
}

function FieldCard({ field, threshold, sourceAvailable, onSource }) {
  const review = needsReview(field);
  const confirmed = field.status === "user_confirmed";
  const checks = field.checks || [];
  const failures = checks.filter(check => !check.passed);
  const actual = field.evidence?.matched_text;
  const grounded = field.status !== "unverified" && checks.some(check => check.name === "evidence_found" && check.passed);
  const quote = field.evidence?.quote;
  return <Card style={[styles.gap, review && styles.reviewCard]}>
    <View style={styles.row}><Text style={[type.h2, styles.flex]}>{field.label}</Text>
      <Text style={[type.small, { color: review ? colors.alert : colors.green }]}>{STATUS[field.status] || field.status}</Text></View>
    {!confirmed && <Text style={type.small}>검증 점수 {field.confidence}점</Text>}
    <Text style={type.small}>추출한 내용</Text><Text selectable style={type.bodyStrong}>{field.value}</Text>
    {review && <View style={styles.reason}>
      <Text style={[type.bodyStrong, { color: colors.alert }]}>확인이 필요한 이유</Text>
      {failures.length ? failures.map((check, index) => <Text key={index} style={type.body}>• {check.detail}</Text>)
        : <Text style={type.body}>원문과 추출값을 대조한 점수가 검증 기준 {threshold}점에 미치지 못했어요.</Text>}
    </View>}
    {!!actual && <View style={styles.evidence}>
      <Text style={type.small}>{grounded ? "원문에서 찾은 근거 문장" : "원문 근거 후보 · 검증되지 않음"}</Text>
      <Text selectable style={type.body} numberOfLines={6}>{actual}</Text>
    </View>}
    {!!quote && quote !== actual && <>
      <Text style={type.small}>AI가 제시한 인용문</Text><Text selectable style={type.body} numberOfLines={4}>{quote}</Text>
    </>}
    <Text style={type.small}>{field.location || "근거 위치 정보 없음"}</Text>
    {confirmed && <Text style={type.small}>사용자가 직접 확인한 항목이에요. 근거 문장과 검사 내역은 AI 분석 당시 기록입니다.</Text>}
    <AdminButton label="원문에서 보기" disabled={!sourceAvailable} onPress={onSource} />

  </Card>;
}

function SourceDialog({ document, field, onClose }) {
  const { deny } = useAdminPage();
  const firstPage = Math.min(document.pageCount, Math.max(1, field?.evidence?.page || 1));
  const [page, setPage] = useState(firstPage);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const scroll = useRef(null);
  const highlightY = useRef(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setData(null); setError(""); highlightY.current = 0;
    getAdminReviewSource(document, { page, fieldId: field?.id, updatedAt: document.updatedAt }).then(result => {
      if (active) setData(result);
    }).catch(failure => {
      if (!active) return;
      if (adminDenied(failure)) deny(); else setError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [document.ownerUid, document.documentId, document.updatedAt, page, field?.id, deny, attempt]);
  const focus = y => { highlightY.current = Math.max(0, y - 24); scroll.current?.scrollTo({ y: highlightY.current, animated: false }); };
  return <AdminDialog title="원문 텍스트" onClose={onClose}>
    {!!field && <><Text style={type.bodyStrong}>{field.label} · {field.value}</Text>
      {field.status === "user_confirmed" && <Text style={type.small}>AI 분석 당시 원문 위치를 표시해요.</Text>}</>}
    <View style={styles.pageControls}><AdminButton label="‹ 이전" disabled={loading || page <= 1} onPress={() => setPage(value => value - 1)} />
      <Text style={type.bodyStrong}>{page} / {document.pageCount}페이지</Text>
      <AdminButton label="다음 ›" disabled={loading || page >= document.pageCount} onPress={() => setPage(value => value + 1)} /></View>
    {!!data?.origin && <Text style={type.small}>{data.origin.kind === "attachment" ? data.origin.filename || "첨부파일" : "본문"} · 원문 {data.origin.original_page}페이지</Text>}
    <AdminFeedback error={error} />
    <View style={styles.sourceFrame}>
      {loading ? <ActivityIndicator style={styles.sourceLoading} color={colors.stamp} /> : data && <ScrollView key={`${page}-${field?.id || "all"}`} ref={scroll} nestedScrollEnabled contentContainerStyle={styles.sourceContent}
        onContentSizeChange={() => scroll.current?.scrollTo({ y: highlightY.current, animated: false })}>
        <SourceText segments={data.segments} candidate={data.highlightKind === "candidate"} onHighlightLayout={focus} />
      </ScrollView>}
    </View>
    {data?.highlightKind === "candidate" && <Text style={[type.small, { color: colors.alert }]}>강조된 문장은 일치도가 낮거나 다시 찾은 근거 후보예요. 추출값을 뒷받침하는지 직접 대조해 주세요.</Text>}
    {data?.highlightKind === "evidence" && <Text style={type.small}>강조된 위치가 해당 항목의 원문 근거예요.</Text>}
    {!!field && data?.highlightKind === "none" && <Text style={type.small}>이 페이지에는 표시할 근거 위치가 없어요. 앞뒤 페이지를 살펴볼 수 있어요.</Text>}
    {!!error && <AdminButton label="다시 불러오기" onPress={() => setAttempt(value => value + 1)} />}
    {!!field?.evidence?.page && page !== firstPage && <AdminButton label="근거 페이지로 돌아가기" disabled={loading} onPress={() => setPage(firstPage)} />}
  </AdminDialog>;
}

function SourceText({ segments, candidate, onHighlightLayout }) {
  const text = segments.map(segment => segment.text).join("");
  let offset = 0, start = -1, end = -1;
  segments.forEach(segment => { if (segment.highlight) { start = offset; end = offset + segment.text.length; } offset += segment.text.length; });
  let lineOffset = 0, first = true;
  return <View>{text.split("\n").map((line, index) => {
    const left = Math.max(0, start - lineOffset), right = Math.min(line.length, end - lineOffset);
    const hit = start >= 0 && left < right;
    const focusLine = hit && first;
    if (hit) first = false;
    lineOffset += line.length + 1;
    return <Text key={index} selectable style={styles.sourceText} onLayout={focusLine ? event => onHighlightLayout(event.nativeEvent.layout.y) : undefined}>
      {hit ? <>{line.slice(0, left)}<Text style={{ backgroundColor: candidate ? "#FFE7A3" : "#FFD0D7", color: colors.ink }}>{line.slice(left, right)}</Text>{line.slice(right)}</> : line || " "}
    </Text>;
  })}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, gap: { gap: spacing.sm }, row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, minHeight: 44, justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.surface }, selectedChip: { backgroundColor: colors.ink },
  reviewCard: { borderColor: colors.alert, borderWidth: 1 }, reason: { padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.alertSoft, gap: spacing.sm },
  evidence: { backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.sm, gap: spacing.sm },
  pageControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  sourceFrame: { height: 320, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, overflow: "hidden" },
  sourceLoading: { flex: 1 }, sourceContent: { padding: spacing.md }, sourceText: { ...type.body, lineHeight: 25 },
});
