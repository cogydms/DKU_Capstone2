import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../theme/theme";

export default function ProgressBar({ progress = 0, color = colors.stamp }) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${Math.round(progress * 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
});