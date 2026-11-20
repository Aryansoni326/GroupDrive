import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, radius, typography, shadows } from "../theme/tokens";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?:
    | "velocity"
    | "primary"
    | "obsidian"
    | "emerald"
    | "outline"
    | "secondary"
    | "dark"
    | "default";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "velocity",
  size = "md",
  isLoading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const resolvedVariant =
    variant === "dark" ? "obsidian" : variant === "default" ? "velocity" : variant;

  const getContainerStyle = (): ViewStyle => {
    switch (resolvedVariant) {
      case "velocity":
      case "primary":
        return { backgroundColor: colors.velocity };
      case "obsidian":
        return { backgroundColor: colors.obsidian };
      case "emerald":
        return { backgroundColor: colors.emerald };
      case "outline":
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.subtle,
        };
      case "secondary":
        return { backgroundColor: colors.pearl };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (resolvedVariant) {
      case "velocity":
      case "primary":
      case "obsidian":
      case "emerald":
        return { color: colors.textInverse };
      case "outline":
      case "secondary":
        return { color: colors.textPrimary };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.md };
      case "md":
        return { paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.lg };
      case "lg":
        return { paddingVertical: 15, paddingHorizontal: 24, borderRadius: radius.xl };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case "sm":
        return { fontSize: typography.xs.fontSize, fontWeight: typography.fontBold };
      case "md":
        return { fontSize: typography.sm.fontSize, fontWeight: typography.fontBold };
      case "lg":
        return { fontSize: typography.base.fontSize, fontWeight: typography.fontBold };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={[
        styles.buttonBase,
        getContainerStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "secondary"
              ? colors.velocity
              : colors.textInverse
          }
        />
      ) : (
        <Text style={[styles.textBase, getTextStyle(), getTextSizeStyle()]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  textBase: {
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
