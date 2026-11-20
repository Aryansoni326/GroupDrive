import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { colors, radius } from "../theme/tokens";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function ErrorState({
  title = "Unable to load data",
  message = "A network or server connectivity issue occurred. Please check your connection and retry.",
  onRetry,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFF1F2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FECDD3",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconText: {
    fontSize: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#9F1239",
    marginBottom: 4,
    textAlign: "center",
  },
  message: {
    fontSize: 12,
    color: "#BE123C",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
    maxWidth: 270,
  },
  retryBtn: {
    backgroundColor: "#E11D48",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

