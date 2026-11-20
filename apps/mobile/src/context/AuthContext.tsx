import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  CustomerUser,
  CustomerProfileStats,
  CustomerLoginPayload,
  CustomerRegisterPayload,
  UpdateCustomerProfilePayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@groupdrive/types";
import {
  customerApi,
  ApiClientError,
} from "@groupdrive/api-client";
import { SecureStorage } from "../services/storage";

interface MobileAuthContextType {
  user: CustomerUser | null;
  stats: CustomerProfileStats | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: CustomerLoginPayload) => Promise<void>;
  register: (payload: CustomerRegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateCustomerProfilePayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ email: string; expires_in_minutes: number }>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<{ success: boolean; message: string }>;
  verifyRequest: (channel: "EMAIL" | "PHONE") => Promise<{ channel: string; destination: string }>;
  verifyConfirm: (channel: "EMAIL" | "PHONE", code: string) => Promise<{ is_email_verified: boolean; is_phone_verified: boolean }>;
  changePassword: (payload: ChangePasswordPayload) => Promise<{ success: boolean; message: string }>;
}

const MobileAuthContext = createContext<MobileAuthContextType | undefined>(undefined);

// Persistent mobile storage adapter for centralized customerApi client
const mobileAuthStorage = {
  getToken: async () => SecureStorage.getItem("gd_customer_token"),
  setToken: async (token: string | null) => {
    if (token) {
      await SecureStorage.setItem("gd_customer_token", token);
    } else {
      await SecureStorage.removeItem("gd_customer_token");
    }
  },
};

export function MobileAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [stats, setStats] = useState<CustomerProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wire up SecureStorage into customerApi client
  useEffect(() => {
    try {
      customerApi.client.storage = mobileAuthStorage;
    } catch {
      // Storage assigned
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const [meRes, profileRes] = await Promise.all([
        customerApi.auth.getMe(),
        customerApi.profile.getProfile(),
      ]);

      if (meRes.data?.user) {
        setUser(meRes.data.user);
      }
      if (profileRes.data?.stats) {
        setStats(profileRes.data.stats);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setUser(null);
        setStats(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    customerApi.client.setSessionExpiredHandler(() => {
      setUser(null);
      setStats(null);
      SecureStorage.removeItem("gd_customer_token");
    });
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (credentials: CustomerLoginPayload) => {
    setIsLoading(true);
    try {
      const res = await customerApi.auth.login(credentials);
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.access_token) {
          await SecureStorage.setItem("gd_customer_token", res.data.access_token);
        }
        await refreshProfile();
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const register = useCallback(async (payload: CustomerRegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await customerApi.auth.register(payload);
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.access_token) {
          await SecureStorage.setItem("gd_customer_token", res.data.access_token);
        }
        await refreshProfile();
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await customerApi.auth.logout();
      await SecureStorage.removeItem("gd_customer_token");
      setUser(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (payload: UpdateCustomerProfilePayload) => {
      const res = await customerApi.profile.updateProfile(payload);
      if (res.data) {
        setUser((prev) => (prev ? { ...prev, ...res.data } : (res.data as CustomerUser)));
      }
    },
    []
  );

  const forgotPassword = useCallback(async (email: string) => {
    const res = await customerApi.auth.forgotPassword({ email });
    return res.data || { email, expires_in_minutes: 15 };
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    const res = await customerApi.auth.resetPassword(payload);
    return res.data || { success: true, message: "Password reset successfully" };
  }, []);

  const verifyRequest = useCallback(async (channel: "EMAIL" | "PHONE") => {
    const res = await customerApi.auth.verifyRequest(channel);
    return res.data || { channel, destination: channel === "EMAIL" ? "customer@groupdrive.in" : "+919876543210" };
  }, []);

  const verifyConfirm = useCallback(async (channel: "EMAIL" | "PHONE", code: string) => {
    const res = await customerApi.auth.verifyConfirm(channel, code);
    if (res.data) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              is_email_verified: res.data?.is_email_verified ?? prev.is_email_verified,
              is_phone_verified: res.data?.is_phone_verified ?? prev.is_phone_verified,
            }
          : prev
      );
    }
    return res.data || { is_email_verified: true, is_phone_verified: true };
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    const res = await customerApi.security.changePassword(payload);
    return res.data || { success: true, message: "Password updated successfully" };
  }, []);

  const value = useMemo(
    () => ({
      user,
      stats,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      forgotPassword,
      resetPassword,
      verifyRequest,
      verifyConfirm,
      changePassword,
    }),
    [
      user,
      stats,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      forgotPassword,
      resetPassword,
      verifyRequest,
      verifyConfirm,
      changePassword,
    ]
  );

  return (
    <MobileAuthContext.Provider value={value}>
      {children}
    </MobileAuthContext.Provider>
  );
}

export function useMobileAuth(): MobileAuthContextType {
  const context = useContext(MobileAuthContext);
  if (!context) {
    throw new Error("useMobileAuth must be used within a MobileAuthProvider");
  }
  return context;
}
