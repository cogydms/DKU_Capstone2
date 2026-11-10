import React, { createContext, forwardRef, useContext } from "react";
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from "react-native";

const WeightContext = createContext("400");
const families = {
  400: "Pretendard-Regular",
  500: "Pretendard-Medium",
  600: "Pretendard-SemiBold",
  700: "Pretendard-Bold",
  800: "Pretendard-ExtraBold",
};

function resolveTypography(style, inheritedWeight) {
  const flat = StyleSheet.flatten(style) || {};
  const weight = flat.fontWeight === "bold" ? "700"
    : flat.fontWeight === "normal" ? "400" : flat.fontWeight || inheritedWeight;
  // Each bundled font is a real weight; avoid platform-dependent synthetic bold.
  const fontStyle = flat.fontFamily ? null : {
    fontFamily: families[weight] || families[400],
    fontWeight: "normal",
  };
  return { weight, fontStyle };
}

export const Text = forwardRef(function Text({ style, children, ...props }, ref) {
  const inheritedWeight = useContext(WeightContext);
  const { weight, fontStyle } = resolveTypography(style, inheritedWeight);
  return (
    <WeightContext.Provider value={weight}>
      <NativeText {...props} ref={ref} style={[style, fontStyle]}>{children}</NativeText>
    </WeightContext.Provider>
  );
});

export const TextInput = forwardRef(function TextInput({ style, ...props }, ref) {
  const { fontStyle } = resolveTypography(style, "400");
  return <NativeTextInput {...props} ref={ref} style={[style, fontStyle]} />;
});
