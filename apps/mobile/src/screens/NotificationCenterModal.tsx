
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import { createCustomerApiClient } from "@groupdrive/api-client";
import {
  CustomerNotification,
  CustomerNotificationPreferences,
} from "@groupdrive/types";
import {
  NotificationService,
  NotificationDeepLinkTarget,
  NotificationPermissionStatus,
} from "../services/notificationService";
import { colors } from "../theme/tokens";

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToTarget: (target: NotificationDeepLinkTarget) => void;
  onUnreadCountChange?: (count: number) => void;
}

type FilterType = "ALL" | "UNREAD" | "QUOTATION" | "GROUP" | "ENQUIRY" | "APPOINTMENT" | "SYSTEM";

const customerApi = createCustomerApiClient();

export function NotificationCenterModal({
  visible,
  onClose,
  onNavigateToTarget,
  onUnreadCountChange,
}: NotificationCenterModalProps) {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>("undetermined");
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CustomerNotificationPreferences>({
    email_notifications: true,
    sms_alerts: true,
    whatsapp_updates: true,
    quotation_alerts: true,
    group_milestones: true,
    promotional_offers: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [dismissedPermissionPrompt, setDismissedPermissionPrompt] = useState(false);

  // Load notifications and preferences from centralized backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifsRes, prefsRes, perm] = await Promise.all([
        customerApi.notifications.getNotifications(),
        customerApi.notifications.getPreferences(),
        NotificationService.getPermissionStatus(),
      ]);

      if (notifsRes.data) {
        setNotifications(notifsRes.data);
        const unread = notifsRes.data.filter((n) => !n.is_read).length;
        onUnreadCountChange?.(unread);
      }
      if (prefsRes.data) {
        setPreferences(prefsRes.data);
      }
      setPermissionStatus(perm);
    } catch (err) {
      console.warn("Failed to fetch customer notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  // Request push permissions
  const handleRequestPermissions = async () => {
    const status = await NotificationService.requestPermissions();
    setPermissionStatus(status);
    if (status === "granted") {
      Alert.alert(
        "Notifications Activated",
        "You will now receive real-time alerts for dealership bids, group milestones, and appointment updates."
      );
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const updatedUnread = notifications.filter((n) => (n.id === id ? false : !n.is_read)).length;
    onUnreadCountChange?.(updatedUnread);

    try {
      await customerApi.notifications.markAsRead(id);
    } catch (err) {
      console.warn("Failed to mark notification read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onUnreadCountChange?.(0);

    try {
      await customerApi.notifications.markAllAsRead();
    } catch (err) {
      console.warn("Failed to mark all notifications read:", err);
    }
  };

  // Dismiss / delete single notification
  const handleDeleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) {
      const remainingUnread = notifications.filter((n) => n.id !== id && !n.is_read).length;
      onUnreadCountChange?.(remainingUnread);
    }

    try {
      await customerApi.notifications.deleteNotification(id);
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
  };

  // Clear all read notifications
  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    try {
      await customerApi.notifications.clearReadNotifications();
    } catch (err) {
      console.warn("Failed to clear read notifications:", err);
    }
  };

  // Action / Deep Link handler
  const handleNotificationPress = async (notification: CustomerNotification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    const target = NotificationService.parseNotificationAction(notification.action_url);
    onClose();
    onNavigateToTarget(target);
  };

  // Toggle Notification Preference
  const handleTogglePreference = async (key: keyof CustomerNotificationPreferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);
    setSavingPrefs(true);
    try {
      await customerApi.notifications.updatePreferences(updated);
    } catch (err) {
      console.warn("Failed to save notification preference:", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "UNREAD") return !item.is_read;
    return item.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;

  const getEventBadge = (type: string) => {
    switch (type) {
      case "QUOTATION":
        return { label: "QUOTATION", icon: "🏷️", color: "#2563EB", bg: "#EFF6FF" };
      case "GROUP":
        return { label: "GROUP BUYING", icon: "👥", color: "#0D9488", bg: "#F0FDFA" };
      case "ENQUIRY":
        return { label: "ENQUIRY", icon: "📋", color: "#D97706", bg: "#FFFBEB" };
      case "APPOINTMENT":
        return { label: "TEST DRIVE", icon: "📅", color: "#7C3AED", bg: "#F5F3FF" };
      case "SYSTEM":
        return { label: "SECURITY", icon: "🛡️", color: "#475569", bg: "#F1F5F9" };
      default:
        return { label: "NOTIFICATION", icon: "🔔", color: "#2563EB", bg: "#EFF6FF" };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeContainer}>
        {/* Top App Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => setShowPreferences(!showPreferences)}
            style={[styles.prefBtn, showPreferences && styles.prefBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={styles.prefBtnIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Drawer / View */}
        {showPreferences ? (
          <ScrollView style={styles.preferencesCard} contentContainerStyle={styles.prefScrollContent}>
            <View style={styles.prefHeaderRow}>
              <View>
                <Text style={styles.prefTitle}>Notification Channels</Text>
                <Text style={styles.prefSubtitle}>
                  Choose how and when dealers and GROUPDRIVE can contact you.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPreferences(false)} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.prefItem}>
              <View style={styles.prefInfo}>
                <Text style={styles.prefItemTitle}>Quotation Alerts</Text>
                <Text style={styles.prefItemDesc}>
                  Receive real-time alerts when authorized dealers submit bids.
                </Text>
              </View>
              <Switch
                value={preferences.quotation_alerts}
                onValueChange={() => handleTogglePreference("quotation_alerts")}
                trackColor={{ false: "#CBD5E1", true: colors.velocity }}
              />
            </View>

            <View style={styles.prefItem}>
              <View style={styles.prefInfo}>
                <Text style={styles.prefItemTitle}>Group Buying Milestones</Text>
                <Text style={styles.prefItemDesc}>
                  Track member count thresholds and collective volume price drops.
                </Text>
              </View>
              <Switch
                value={preferences.group_milestones}
                onValueChange={() => handleTogglePreference("group_milestones")}
                trackColor={{ false: "#CBD5E1", true: colors.velocity }}
              />
            </View>

            <View style={styles.prefItem}>
              <View style={styles.prefInfo}>
                <Text style={styles.prefItemTitle}>WhatsApp Direct Updates</Text>
                <Text style={styles.prefItemDesc}>
                  Instant WhatsApp confirmations, quote links, and dealership visits.
                </Text>
              </View>
              <Switch
                value={preferences.whatsapp_updates}
                onValueChange={() => handleTogglePreference("whatsapp_updates")}
                trackColor={{ false: "#CBD5E1", true: colors.velocity }}
              />
            </View>

            <View style={styles.prefItem}>
              <View style={styles.prefInfo}>
                <Text style={styles.prefItemTitle}>SMS Flash Notifications</Text>
                <Text style={styles.prefItemDesc}>
                  Crucial verification codes and appointment confirmations.
                </Text>
              </View>
              <Switch
                value={preferences.sms_alerts}
                onValueChange={() => handleTogglePreference("sms_alerts")}
                trackColor={{ false: "#CBD5E1", true: colors.velocity }}
              />
            </View>

            <View style={styles.prefItem}>
              <View style={styles.prefInfo}>
                <Text style={styles.prefItemTitle}>Email Documents & Reports</Text>
                <Text style={styles.prefItemDesc}>
                  Detailed quotation breakdowns, invoice estimates, and specs.
                </Text>
              </View>
              <Switch
                value={preferences.email_notifications}
                onValueChange={() => handleTogglePreference("email_notifications")}
                trackColor={{ false: "#CBD5E1", true: colors.velocity }}
              />
            </View>

            <View style={styles.prefItem}>
              <View style={styles.prefInfo}>
                <Text style={styles.prefItemTitle}>Promotional Deals & Incentives</Text>
                <Text style={styles.prefItemDesc}>
                  Seasonal festive rebates, zero processing fee offers, and campaigns.
                </Text>
              </View>
              <Switch
                value={preferences.promotional_offers}
                onValueChange={() => handleTogglePreference("promotional_offers")}
                trackColor={{ false: "#CBD5E1", true: colors.velocity }}
              />
            </View>
          </ScrollView>
        ) : null}

        {/* Push Notification Opt-in Banner */}
        {!dismissedPermissionPrompt && permissionStatus !== "granted" ? (
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconBadge}>
              <Text style={styles.permissionIcon}>🔔</Text>
            </View>
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Enable Push Notifications</Text>
              <Text style={styles.permissionSubtitle}>
                Get instant dealer quotes, expiry alerts, and group milestones on your phone.
              </Text>
              <View style={styles.permissionActions}>
                <TouchableOpacity
                  onPress={handleRequestPermissions}
                  style={styles.enableBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.enableBtnText}>Enable Alerts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDismissedPermissionPrompt(true)}
                  style={styles.dismissBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissBtnText}>Not Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Filter Pills */}
        <View style={styles.filterBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              onPress={() => setActiveFilter("ALL")}
              style={[styles.filterChip, activeFilter === "ALL" && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === "ALL" && styles.filterChipTextActive]}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("UNREAD")}
              style={[styles.filterChip, activeFilter === "UNREAD" && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === "UNREAD" && styles.filterChipTextActive]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("QUOTATION")}
              style={[styles.filterChip, activeFilter === "QUOTATION" && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === "QUOTATION" && styles.filterChipTextActive]}>
                Quotations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("GROUP")}
              style={[styles.filterChip, activeFilter === "GROUP" && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === "GROUP" && styles.filterChipTextActive]}>
                Buyer Groups
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("ENQUIRY")}
              style={[styles.filterChip, activeFilter === "ENQUIRY" && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === "ENQUIRY" && styles.filterChipTextActive]}>
                Enquiries
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("APPOINTMENT")}
              style={[styles.filterChip, activeFilter === "APPOINTMENT" && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === "APPOINTMENT" && styles.filterChipTextActive]}>
                Test Drives
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter("SYSTEM")}
              style={[styles.filterChip, activeFilter === "SYSTEM" && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === "SYSTEM" && styles.filterChipTextActive]}>
                Security
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Global Action Bar */}
        <View style={styles.actionsBar}>
          <Text style={styles.resultCountText}>
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
          </Text>

          <View style={styles.actionsGroup}>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionLink} activeOpacity={0.7}>
                <Text style={styles.actionLinkText}>Mark all as read</Text>
              </TouchableOpacity>
            ) : null}

            {readCount > 0 ? (
              <TouchableOpacity onPress={handleClearRead} style={styles.actionLink} activeOpacity={0.7}>
                <Text style={styles.actionLinkTextMuted}>Clear read</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Notification Feed */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.velocity} />
            <Text style={styles.loadingText}>Fetching notification history...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>You are all caught up</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === "UNREAD"
                ? "No unread notifications. You are up to date on all quotes and groups."
                : "No notifications found in this category."}
            </Text>
            {activeFilter !== "ALL" && (
              <TouchableOpacity onPress={() => setActiveFilter("ALL")} style={styles.resetFilterBtn}>
                <Text style={styles.resetFilterBtnText}>Show All Notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={loadData}
            refreshing={loading}
            renderItem={({ item }) => {
              const meta = getEventBadge(item.type);
              return (
                <View style={[styles.card, !item.is_read && styles.cardUnread]}>
                  {/* Left event indicator bar for unread */}
                  {!item.is_read && <View style={styles.unreadIndicatorBar} />}

                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                        <Text style={styles.typeIcon}>{meta.icon}</Text>
                        <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      <Text style={styles.timestamp}>{formatRelativeTime(item.created_at)}</Text>
                    </View>

                    <View style={styles.cardActions}>
                      {!item.is_read ? (
                        <TouchableOpacity
                          onPress={() => handleMarkAsRead(item.id)}
                          style={styles.markReadBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.markReadBtnText}>✓</Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        onPress={() => handleDeleteNotification(item.id)}
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardMessage}>{item.message}</Text>

                  {/* Action Navigation Pill */}
                  <TouchableOpacity
                    onPress={() => handleNotificationPress(item)}
                    style={styles.viewActionPill}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewActionText}>
                      {item.type === "QUOTATION"
                        ? "View Quotation Details →"
                        : item.type === "GROUP"
                        ? "View Group Buying Progress →"
                        : item.type === "APPOINTMENT"
                        ? "View Test Drive Details →"
                        : item.type === "ENQUIRY"
                        ? "View Enquiry Status →"
                        : "Open Account Security →"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "bold",
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  unreadBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: colors.velocity || "#2563EB",
    fontSize: 11,
    fontWeight: "800",
  },
  prefBtn: {
    padding: 8,
    borderRadius: 8,
  },
  prefBtnActive: {
    backgroundColor: "#F1F5F9",
  },
  prefBtnIcon: {
    fontSize: 18,
  },
  // Preferences Dropdown Card
  preferencesCard: {
    maxHeight: 380,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  prefScrollContent: {
    padding: 16,
    gap: 14,
  },
  prefHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    paddingBottom: 10,
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  prefSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    maxWidth: 260,
  },
  doneBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  prefItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prefInfo: {
    flex: 1,
    paddingRight: 12,
  },
  prefItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  prefItemDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  // Push Notification Prompt Card
  permissionCard: {
    margin: 14,
    marginBottom: 6,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  permissionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionIcon: {
    fontSize: 18,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  permissionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  permissionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  enableBtn: {
    backgroundColor: colors.velocity || "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enableBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  dismissBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dismissBtnText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  // Filter Bar
  filterBarContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Action Bar
  actionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  actionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  actionLink: {
    paddingVertical: 2,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.velocity || "#2563EB",
  },
  actionLinkTextMuted: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  // Notification List Content
  listContent: {
    padding: 14,
    gap: 10,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    borderColor: "#BFDBFE",
    backgroundColor: "#FFFFFF",
  },
  unreadIndicatorBar: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.velocity || "#2563EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeIcon: {
    fontSize: 10,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  markReadBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  markReadBtnText: {
    color: colors.velocity || "#2563EB",
    fontSize: 11,
    fontWeight: "bold",
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "bold",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  cardTitleUnread: {
    color: "#0F172A",
    fontWeight: "800",
  },
  cardMessage: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 10,
  },
  viewActionPill: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  viewActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.velocity || "#2563EB",
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
    color: "#94A3B8",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  resetFilterBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#0F172A",
  },
  resetFilterBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
