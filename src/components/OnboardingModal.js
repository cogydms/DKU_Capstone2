import { Text } from "./Typography";
// 첫 실행 안내 (3장). 로그인 화면과 설정의 앱 소개 다시 보기에서도 사용한다.
import React, { useEffect, useRef, useState } from "react";
import { Modal, Alert, View, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "./PrimaryButton";
import { colors, radius, spacing, type } from "../theme/theme";
import { finishOnboarding, onShowOnboarding, shouldShowOnboarding } from "../services/onboarding";
import { isNotificationEnabled, notificationsSupported, permissionStatus, setNotificationEnabled } from "../services/notifications";

const PAGES = [
  {
    icon: "document-text-outline",
    title: "공지를 넣으면\n해야 할 일이 보여요",
    body: "PDF, 사진, 복사한 글 무엇이든 가운데 ➕로 올리면 신청 대상, 마감일, 제출 서류를 정리해 드려요.",
  },
  {
    icon: "search-outline",
    title: "원문에서\n근거를 확인해요",
    body: "AI가 찾은 정보가 원문 어디에 있는지 형광펜으로 보여 주고, 확실하지 않으면 ‘확인 필요’로 알려 드려요.",
  },
  {
    icon: "notifications-outline",
    title: "마감까지\n챙겨 드려요",
    body: "준비 계획을 등록하면 문서 마감을 알려 드려요. 알림을 받을 시점은 설정에서 고를 수 있어요.",
  },
];

export default function OnboardingModal({ autoShow = true, allowNotificationPermission = true }) {
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const [offerPermission, setOfferPermission] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const scroll = useRef(null);
  const pageWidth = viewport.width;
  const compact = viewport.height > 0 && viewport.height < 620;

  useEffect(() => {
    let active = true;
    if (autoShow) shouldShowOnboarding().then((show) => { if (active && show) setVisible(true); });
    const off = onShowOnboarding(() => { setPage(0); setVisible(true); });
    return () => { active = false; off(); };
  }, [autoShow]);

  useEffect(() => {
    if (!visible || !notificationsSupported || !allowNotificationPermission) {
      setOfferPermission(false);
      return;
    }
    let active = true;
    Promise.all([permissionStatus(), isNotificationEnabled()]).then(([status, enabled]) => {
      if (active) setOfferPermission(enabled && ["undetermined", "denied"].includes(status));
    }).catch(() => { if (active) setOfferPermission(false); });
    return () => { active = false; };
  }, [visible, allowNotificationPermission]);

  const close = () => {
    finishOnboarding();
    setVisible(false);
    setPage(0);
    setOfferPermission(false);
  };

  const allowNotifications = async () => {
    setRequesting(true);
    try { await setNotificationEnabled(true); close(); }
    catch { Alert.alert("알림 권한을 확인하지 못했어요", "설정에서 다시 시도해 주세요."); }
    finally { setRequesting(false); }
  };

  const goTo = (index) => {
    if (requesting || !pageWidth) return;
    setPage(index);
    scroll.current?.scrollTo({ x: index * pageWidth, animated: true });
  };

  // Modal의 안전 영역을 실제로 측정해 회전/화면 크기 변경 때도 페이지 폭을 맞춘다.
  useEffect(() => {
    if (!visible || !pageWidth) return;
    const frame = requestAnimationFrame(() => scroll.current?.scrollTo({ x: page * pageWidth, animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [visible, pageWidth]);

  const last = page === PAGES.length - 1;

  return (
    <Modal visible={visible} animationType="fade" onShow={() => scroll.current?.scrollTo({ x: 0, animated: false })}
      onRequestClose={() => { if (!requesting) close(); }}>
      <SafeAreaProvider style={styles.modalRoot}>
      <SafeAreaView style={styles.safe} edges={["top", "right", "bottom", "left"]}>
        <View style={styles.frame} onLayout={({ nativeEvent: { layout } }) => {
          setViewport(previous => previous.width === layout.width && previous.height === layout.height
            ? previous : { width: layout.width, height: layout.height });
        }}>
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={last ? "앱 소개 닫기" : "앱 소개 건너뛰기"}
              disabled={requesting} onPress={close} hitSlop={4}
              style={({ pressed }) => [styles.skipButton, (pressed || requesting) && styles.dim]}>
              <Text style={styles.skip}>{last ? "닫기" : "건너뛰기"}</Text>
            </Pressable>
          </View>

          <View style={styles.pager}>
          {pageWidth > 0 && (
          <ScrollView
            ref={scroll}
            horizontal
            pagingEnabled
            scrollEnabled={!requesting}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.max(0, Math.min(PAGES.length - 1,
              Math.round(e.nativeEvent.contentOffset.x / pageWidth))))}
            scrollEventThrottle={16}
            style={styles.carousel}
            contentContainerStyle={styles.slides}
          >
            {PAGES.map((item) => (
              <ScrollView key={item.title} style={[styles.slide, { width: pageWidth }]}
                contentContainerStyle={[styles.page, compact && styles.compactPage]}
                nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <View style={[styles.iconCircle, compact && styles.compactIcon]}>
                  <Ionicons name={item.icon} size={compact ? 38 : 44} color={colors.stamp} />
                </View>
                <Text style={[styles.title, compact && styles.compactTitle]}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </ScrollView>
            ))}
          </ScrollView>
          )}
          </View>

          <View style={styles.bottom}>
          <View style={styles.dots}>
            {PAGES.map((item, index) => (
              <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${index + 1}번째 안내`}
                accessibilityState={{ selected: page === index, disabled: requesting }} disabled={requesting}
                onPress={() => goTo(index)} style={styles.dotButton}>
                <View style={[styles.dot, page === index && styles.dotOn]} />
              </Pressable>
            ))}
          </View>

            {last && offerPermission ? (
              <>
                <PrimaryButton tone="stamp" label="알림 허용하고 시작하기" disabled={requesting} onPress={allowNotifications} />
                <Pressable accessibilityRole="button" disabled={requesting} onPress={close} style={styles.later}>
                  <Text style={styles.skip}>나중에</Text>
                </Pressable>
              </>
            ) : (
              <PrimaryButton tone="stamp" label={last ? "시작하기" : "다음"} disabled={requesting || !pageWidth}
                onPress={() => (last ? close() : goTo(page + 1))} />
            )}
          </View>
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: colors.paper },
  safe: { flex: 1, backgroundColor: colors.paper },
  frame: { flex: 1, width: "100%", maxWidth: 480, alignSelf: "center" },
  topRow: { minHeight: 68, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, zIndex: 1 },
  skipButton: { minWidth: 100, minHeight: 44, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  dim: { opacity: 0.5 },
  skip: { ...type.bodyStrong, color: colors.muted },
  pager: { flex: 1, minHeight: 0 },
  carousel: { flex: 1 }, slides: { alignItems: "stretch" }, slide: { flexGrow: 0, flexShrink: 0 },
  page: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, alignItems: "center", justifyContent: "center" },
  compactPage: { paddingVertical: spacing.md },
  iconCircle: {
    width: 104, height: 104, borderRadius: 52, backgroundColor: colors.stampSoft,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.xl,
  },
  compactIcon: { width: 88, height: 88, borderRadius: 44, marginBottom: spacing.lg },
  title: { ...type.display, textAlign: "center", lineHeight: 34, marginBottom: spacing.md },
  compactTitle: { fontSize: 24, lineHeight: 31 },
  body: { ...type.body, color: colors.muted, textAlign: "center", fontSize: 15, lineHeight: 23, maxWidth: 350 },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: spacing.md },
  dotButton: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.line },
  dotOn: { width: 22, backgroundColor: colors.stamp },
  bottom: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  later: { minHeight: 44, alignItems: "center", justifyContent: "center", padding: spacing.sm, marginTop: spacing.xs },
});
