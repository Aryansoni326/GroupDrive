import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, radius, typography } from "../theme/tokens";

export interface BadgeProps {
  label: string;
  variant?:
    | "velocity"
    | "emerald"
    | "amber"
    | "rose"
    | "secondary"
    | "obsidian"
    | "dark"
    | "default";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = "secondary",
  size = "md",
  style,
}: BadgeProps) {
  const resolvedVariant =
    variant === "dark" || variant === "default" ? "obsidian" : variant;

  const getContainerStyle = (): ViewStyle => {
    switch (resolvedVariant) {
      case "velocity":
        return { backgroundColor: colors.velocityLight, borderColor: "#BFDBFE" };
      case "emerald":
        return { backgroundColor: colors.emeraldLight, borderColor: "#A7F3D0" };
      case "amber":
        return { backgroundColor: colors.amberLight, borderColor: "#FDE68A" };
      case "rose":
        return { backgroundColor: colors.roseLight, borderColor: "#FECDD3" };
      case "obsidian":
        return { backgroundColor: colors.obsidian, borderColor: colors.charcoal };
      case "secondary":
      default:
        return { backgroundColor: colors.pearl, borderColor: colors.mist };
    }
  };

  const getTextColor = (): string => {
    switch (resolvedVariant) {
      case "velocity":
        return colors.velocityDark;
      case "emerald":
        return colors.emeraldDark;
      case "amber":
        return colors.amber;
      case "rose":
        return colors.rose;
      case "obsidian":
        return colors.textInverse;
      case "secondary":
      default:
        return colors.steel;
    }
  };

  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        getContainerStyle(),
        isSmall ? styles.badgeSm : styles.badgeMd,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: getTextColor() },
          isSmall ? styles.textSm : styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontWeight: typography.fontSemiBold,
  },
  textSm: {
    fontSize: typography.xs.fontSize,
  },
  textMd: {
    fontSize: typography.sm.fontSize,
  },
});
