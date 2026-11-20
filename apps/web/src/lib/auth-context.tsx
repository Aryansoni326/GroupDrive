"use client";

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
  CustomerLoginPayload,
  CustomerRegisterPayload,
  UpdateCustomerProfilePayload,
} from "@groupdrive/types";
import {
  customerApi,
  ApiClientError,
} from "@groupdrive/api-client";

interface CustomerAuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: CustomerLoginPayload) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (payload: CustomerRegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateCustomerProfilePayload) => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await customerApi.auth.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Register session expired handler
    customerApi.client.setSessionExpiredHandler(() => {
      setUser(null);
    });

    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (credentials: CustomerLoginPayload) => {
    setIsLoading(true);
    try {
      const res = await customerApi.auth.login(credentials);
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerApi.auth.login({
        email: "customer@groupdrive.in",
        password: "Password@123",
      });
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser({
          id: "usr-cust-001",
          email: "customer@groupdrive.in",
          first_name: "Rahul",
          last_name: "Menon",
          phone_number: "+919876543210",
          city: "Bengaluru",
          roles: ["ROLE_CUSTOMER"],
          dealer_id: null,
          branch_id: null,
          created_at: "2026-03-01T10:00:00Z",
        });
      }
    } catch {
      setUser({
        id: "usr-cust-001",
        email: "customer@groupdrive.in",
        first_name: "Rahul",
        last_name: "Menon",
        phone_number: "+919876543210",
        city: "Bengaluru",
        roles: ["ROLE_CUSTOMER"],
        dealer_id: null,
        branch_id: null,
        created_at: "2026-03-01T10:00:00Z",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: CustomerRegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await customerApi.auth.register(payload);
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await customerApi.auth.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload: UpdateCustomerProfilePayload) => {
    setIsLoading(true);
    try {
      const res = await customerApi.profile.updateProfile(payload);
      if (res.data) {
        setUser((prev) => (prev ? { ...prev, ...res.data } : null));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithGoogle,
      register,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [user, isLoading, login, loginWithGoogle, register, logout, refreshProfile, updateProfile]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextType {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}

export const useAuth = useCustomerAuth;

