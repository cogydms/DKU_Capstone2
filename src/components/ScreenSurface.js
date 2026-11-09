import React, { useContext, useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { NavigationContext, NavigationRouteContext } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, gradients } from "../theme/theme";
import useReducedMotion from "../hooks/useReducedMotion";

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);
const TAB_SCREENS = new Set(["Home", "Calendar", "Todos", "Documents"]);

export default function ScreenSurface({ children, style, ...props }) {
  const navigation = useContext(NavigationContext);
  const route = useContext(NavigationRouteContext);
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const shouldAnimate = !reducedMotion && (Platform.OS === "web" || TAB_SCREENS.has(route?.name));

  useEffect(() => {
    const finish = () => { progress.stopAnimation(); progress.setValue(1); };
    const enter = () => {
      if (!shouldAnimate) return finish();
      progress.stopAnimation();
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web",
      }).start();
    };
    if (!navigation || navigation.isFocused()) enter();
    const offFocus = navigation?.addListener("focus", enter);
    const offBlur = navigation?.addListener("blur", finish);
    return () => { offFocus?.(); offBlur?.(); finish(); };
  }, [navigation, progress, shouldAnimate]);

  return <AnimatedSafeAreaView {...props} style={[styles.root, style, {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
    transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  }]}>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradients.page} locations={[0, 0.48, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.sweep} />
      <View style={styles.lowerLight} />
    </View>
    {children}
  </AnimatedSafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, overflow: "hidden" },
  sweep: { position: "absolute", width: "160%", height: 460, left: "-35%", top: -270,
    borderBottomLeftRadius: 600, borderBottomRightRadius: 600,
    backgroundColor: "rgba(238,246,255,0.18)", transform: [{ rotate: "-13deg" }] },
  lowerLight: { position: "absolute", width: "150%", height: 400, right: "-65%", bottom: -220,
    borderRadius: 300, backgroundColor: "rgba(72,118,184,0.08)", transform: [{ rotate: "-18deg" }] },
});
