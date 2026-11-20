import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNetwork } from "../context/NetworkContext";

export function NetworkStatusBanner() {
  const { isConnected, retryConnection } = useNetwork();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.dot} />
        <Text style={styles.text}>
          No Internet Connection - Showing cached catalogue
        </Text>
      </View>
      <TouchableOpacity onPress={retryConnection} style={styles.retryBtn}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#B45309",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FDE68A",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});

