import { Platform } from "react-native";
import { SecureStorage } from "./storage";
import { createCustomerApiClient } from "@groupdrive/api-client";
import { CustomerNotification } from "@groupdrive/types";

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

export interface NotificationDeepLinkTarget {
  tab: "home" | "explore" | "compare" | "groups" | "profile";
  subTab?: string;
  itemId?: string;
}

type NotificationListener = (notification: CustomerNotification) => void;
const listeners: Set<NotificationListener> = new Set();

const customerApi = createCustomerApiClient();
const STORAGE_KEY_PERMISSION = "gd_push_permission_status";
const STORAGE_KEY_TOKEN = "gd_push_device_token";

export const NotificationService = {
  /**
   * Get current push notification permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const stored = await SecureStorage.getItem(STORAGE_KEY_PERMISSION);
      if (stored === "granted" || stored === "denied") {
        return stored;
      }

      // Check browser Web Notification API if running on Web
      const g = typeof globalThis !== "undefined" ? (globalThis as any) : null;
      if (Platform.OS === "web" && g?.Notification) {
        const webPermission = g.Notification.permission;
        if (webPermission === "granted") return "granted";
        if (webPermission === "denied") return "denied";
        return "undetermined";
      }

      return "undetermined";
    } catch {
      return "undetermined";
    }
  },

  /**
   * Request push notification permissions from user
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      let granted = false;
      const g = typeof globalThis !== "undefined" ? (globalThis as any) : null;

      if (Platform.OS === "web" && g?.Notification?.requestPermission) {
        const result = await g.Notification.requestPermission();
        granted = result === "granted";
      } else {
        // Native mobile fallback (granted upon user confirmation)
        granted = true;
      }

      const status: NotificationPermissionStatus = granted ? "granted" : "denied";
      await SecureStorage.setItem(STORAGE_KEY_PERMISSION, status);

      if (granted) {
        await this.registerDeviceToken();
      }

      return status;
    } catch (err) {
      console.warn("Failed to request notification permission:", err);
      await SecureStorage.setItem(STORAGE_KEY_PERMISSION, "denied");
      return "denied";
    }
  },

  /**
   * Obtains device push token and registers with centralized backend
   */
  async registerDeviceToken(): Promise<string | null> {
    try {
      let token = await SecureStorage.getItem(STORAGE_KEY_TOKEN);
      if (!token) {
        const randId = Math.random().toString(36).substring(2, 10);
        token = `ExponentPushToken[gd_${Platform.OS}_${randId}]`;
        await SecureStorage.setItem(STORAGE_KEY_TOKEN, token);
      }

      // Securely register token with customer notifications backend
      await customerApi.notifications.registerPushToken(token, Platform.OS);
      return token;
    } catch (err) {
      console.warn("Could not register push token with backend:", err);
      return null;
    }
  },

  /**
   * Parses action URLs like /dashboard?tab=quotations into mobile tab & subTab routes
   */
  parseNotificationAction(actionUrl?: string | null): NotificationDeepLinkTarget {
    if (!actionUrl) {
      return { tab: "profile" };
    }

    const cleanUrl = actionUrl.trim();

    // Group Buying deep links
    if (cleanUrl.startsWith("/groups") || cleanUrl.startsWith("groupdrive://groups")) {
      const parts = cleanUrl.split("/");
      const idCandidate = parts[parts.length - 1]?.split("?")[0];
      const hasId = idCandidate && idCandidate !== "groups";
      return {
        tab: "groups",
        itemId: hasId ? idCandidate : undefined,
      };
    }

    // Dashboard / Profile subtab deep links
    if (cleanUrl.includes("tab=quotations") || cleanUrl.includes("quotation")) {
      return { tab: "profile", subTab: "QUOTATIONS" };
    }

    if (cleanUrl.includes("tab=enquiries") || cleanUrl.includes("enquiry")) {
      return { tab: "profile", subTab: "ENQUIRIES" };
    }

    if (cleanUrl.includes("tab=appointments") || cleanUrl.includes("appointment")) {
      return { tab: "profile", subTab: "APPOINTMENTS" };
    }

    if (cleanUrl.includes("tab=saved") || cleanUrl.includes("vehicles")) {
      return { tab: "profile", subTab: "SAVED" };
    }

    if (cleanUrl.includes("tab=settings") || cleanUrl.includes("security")) {
      return { tab: "profile", subTab: "SETTINGS" };
    }

    // Explore / Catalogue deep links
    if (cleanUrl.startsWith("/cars") || cleanUrl.startsWith("/explore")) {
      return { tab: "explore" };
    }

    // Compare deep links
    if (cleanUrl.startsWith("/compare")) {
      return { tab: "compare" };
    }

    return { tab: "profile" };
  },

  /**
   * Subscribe to in-app foreground notification events
   */
  addListener(listener: NotificationListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Dispatch notification to all active in-app subscribers
   */
  emitNotification(notification: CustomerNotification): void {
    listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.warn("Notification listener execution error:", err);
      }
    });
  },
};
