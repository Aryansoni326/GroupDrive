import { Platform } from "react-native";

declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * GROUPDRIVE Mobile Environment Configuration
 * Centralized API endpoint resolution for iOS, Android emulator, physical device, and web
 */
export const ENV = {
  // Respect user override or detect appropriate local network address
  API_URL:
    (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
    (Platform.OS === "android"
      ? "http://10.0.2.2:8000/api/v1"
      : "http://localhost:8000/api/v1"),
  APP_NAME: "GROUPDRIVE",
  APP_VERSION: "1.0.0",
  SCHEME: "groupdrive",
  SUPPORT_PHONE: "+91-800-476-8737",
  SUPPORT_EMAIL: "concierge@groupdrive.in",
  DEFAULT_METRO_CITY: "Bengaluru",
};
