import React, { useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from "react-native";
import { colors } from "../theme/tokens";

interface Props {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1600);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Center Brand Identity */}
      <View style={styles.centerStage}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>GD</Text>
        </View>
        <Text style={styles.brandTitle}>
          GROUP<Text style={styles.brandAccent}>DRIVE</Text>
        </Text>
        <Text style={styles.tagline}>
          Discover • Compare • Group • Drive
        </Text>
      </View>

      {/* Bottom Loading Indicator & Trust Message */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.footerText}>Verified OEM Dealership Network</Text>
        <Text style={styles.versionText}>Version 1.0.0 (Production Build)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
  },
  centerStage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoBadgeText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: "#3B82F6",
  },
  tagline: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  footer: {
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 8,
  },
  versionText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "500",
  },
});

