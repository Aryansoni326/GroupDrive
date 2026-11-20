import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { radius } from "../theme/tokens";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function VehicleCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={160} borderRadius={16} />
      <View style={styles.cardContent}>
        <View style={styles.row}>
          <Skeleton width="40%" height={16} />
          <Skeleton width="30%" height={18} />
        </View>
        <Skeleton width="60%" height={22} style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
        <View style={[styles.row, { marginTop: 14 }]}>
          <Skeleton width="48%" height={38} borderRadius={10} />
          <Skeleton width="48%" height={38} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E2E8F0",
  },
  cardSkeleton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 16,
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

