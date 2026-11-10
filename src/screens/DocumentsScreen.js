import React, { useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import ScreenSurface from "../components/ScreenSurface";
import DocumentListPanel from "../components/DocumentListPanel";
import { colors, pageContent, spacing } from "../theme/theme";

export default function DocumentsScreen() {
  const scroll = useRef(null);
  useScrollToTop(scroll);

  return <ScreenSurface style={styles.safe} edges={["top"]}>
    <AppHeader title="문서" />
    <ScrollView ref={scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <DocumentListPanel />
    </ScrollView>
  </ScreenSurface>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { ...pageContent, paddingHorizontal: spacing.lg },
});
