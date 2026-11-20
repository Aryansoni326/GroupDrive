import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { colors, radius } from "../theme/tokens";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon = "📂",
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginHorizontal: 16,
    marginVertical: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  button: {
    backgroundColor: colors.velocity,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.md,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

