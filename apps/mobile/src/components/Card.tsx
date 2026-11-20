import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { colors, radius, shadows } from "../theme/tokens";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "flat";
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, variant = "default", style }: CardProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "elevated":
        return shadows.elevated;
      case "flat":
        return { borderWidth: 1, borderColor: colors.border };
      case "default":
      default:
        return {
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.card,
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
});
