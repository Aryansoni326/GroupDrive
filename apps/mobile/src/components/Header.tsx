import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../theme/tokens";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  city?: string;
  onCityPress?: () => void;
  rightAction?: React.ReactNode;
  unreadNotificationsCount?: number;
  onNotificationPress?: () => void;
}

export function Header({
  title = "GROUPDRIVE",
  subtitle = "Customer App",
  showBack = false,
  onBack,
  city = "Bengaluru",
  onCityPress,
  rightAction,
  unreadNotificationsCount = 0,
  onNotificationPress,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBack && onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>GD</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>
                GROUP<Text style={styles.brandHighlight}>DRIVE</Text>
              </Text>
              <Text style={styles.brandSubtitle}>{subtitle}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.actionsRow}>
            {city ? (
              <TouchableOpacity
                style={styles.cityBadge}
                onPress={onCityPress}
                activeOpacity={0.7}
              >
                <Text style={styles.cityPin}>📍</Text>
                <Text style={styles.cityText}>{city}</Text>
              </TouchableOpacity>
            ) : null}

            {onNotificationPress ? (
              <TouchableOpacity
                style={styles.notificationBtn}
                onPress={onNotificationPress}
                activeOpacity={0.7}
                accessibilityLabel="Open Notifications"
              >
                <Text style={styles.notificationIcon}>🔔</Text>
                {unreadNotificationsCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandHighlight: {
    color: colors.velocity || "#2563EB",
  },
  brandSubtitle: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: -2,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  backBtnText: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "bold",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cityPin: {
    fontSize: 10,
  },
  cityText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  notificationBtn: {
    position: "relative",
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: {
    fontSize: 15,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
});

