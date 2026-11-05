import React, { useEffect, useState } from "react";
import { View, Pressable, StyleSheet, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Typography";
import { LinearGradient } from "expo-linear-gradient";
import GlassTint from "./GlassTint";
import { colors, glass, gradients } from "../theme/theme";

const items = {
  Home: ["홈", "home-outline", "home"],
  Calendar: ["캘린더", "calendar-outline", "calendar"],
  AddDocument: ["문서 추가", "add", "add"],
  Todos: ["할 일", "checkbox-outline", "checkbox"],
  Settings: ["설정", "settings-outline", "settings"],
};
export default function FloatingTabs({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardOpen) return null;
  return <View pointerEvents="box-none" style={[styles.dock, { bottom: Math.max(insets.bottom, 14) }]}>
    <View style={styles.bar}>
      <GlassTint radius={32} />
      {state.routes.map((route, index) => {
        const [label, icon, selectedIcon] = items[route.name];
        const selected = state.index === index;
        const add = route.name === "AddDocument";
        const onPress = () => {
          if (add) return navigation.navigate("DocumentAdd");
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!selected && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return <Pressable key={route.key} onPress={onPress}
          onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
          accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }}
          style={({ pressed }) => [styles.item, selected && styles.selected, pressed && { opacity: 0.7 }]}>
          {add ? <LinearGradient colors={gradients.action} style={styles.add}><Ionicons name="add" size={30} color="#FFFFFF" /></LinearGradient> : <>
            <Ionicons name={selected ? selectedIcon : icon} size={23} color={selected ? colors.stamp : colors.ink} />
            <Text style={[styles.label, { color: selected ? colors.stamp : colors.ink }]}>{label}</Text>
          </>}
        </Pressable>;
      })}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  dock: { position: "absolute", left: 0, right: 0, alignItems: "center", paddingHorizontal: 16 },
  bar: { ...glass, width: "100%", maxWidth: 600, borderRadius: 32, padding: 7, flexDirection: "row", gap: 4 },
  item: { flex: 1, minHeight: 55, borderRadius: 25, alignItems: "center", justifyContent: "center", gap: 4 },
  selected: { backgroundColor: "rgba(165,196,239,0.62)", borderWidth: 1, borderColor: "rgba(242,248,255,0.7)" },
  add: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.stamp, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#7799F1", shadowColor: colors.stamp, shadowOpacity: 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  label: { fontSize: 11, fontWeight: "600" },
});
