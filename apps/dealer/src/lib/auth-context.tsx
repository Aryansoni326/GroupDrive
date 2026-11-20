
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import { useRouter } from "next/navigation";
import {
  DealerBranch,
  DealerEntity,
  DealerStaffMember,
  DealerStaffRole,
} from "@groupdrive/types";
import {
  dealerApi,
  setAccessToken,
  getAccessToken,
  registerSessionExpiredHandler,
  ApiClientError,
} from "./api";
import {
  MOCK_BRANCHES,
  MOCK_DEALER,
  MOCK_STAFF,
} from "./mock-data";

export interface RoleCapabilities {
  canSubmitQuotes: boolean;
  canManageStaff: boolean;
  canManageInventory: boolean;
  canViewAllBranches: boolean;
}

export const DEMO_ROLE_CREDENTIALS: Record<DealerStaffRole, { email: string; name: string; branch: string }> = {
  DEALER_OWNER: {
    email: "owner@kalyanimotors.com",
    name: "Vikram Kalyani",
    branch: "All Dealership Branches",
  },
  BRANCH_MANAGER: {
    email: "branchmgr@kalyanimotors.com",
    name: "Rajesh Rao",
    branch: "Whitefield Showroom",
  },
  SALES_MANAGER: {
    email: "salesmgr@kalyanimotors.com",
    name: "Arun Kumar",
    branch: "Whitefield Showroom",
  },
  SALES_EXECUTIVE: {
    email: "salesexec@kalyanimotors.com",
    name: "Pooja Sharma",
    branch: "Whitefield Showroom",
  },
  INVENTORY_MANAGER: {
    email: "inventorymgr@kalyanimotors.com",
    name: "Mahesh Gowda",
    branch: "Hosur Road Central Stockyard",
  },
  FINANCE_EXECUTIVE: {
    email: "financemgr@kalyanimotors.com",
    name: "Suresh Menon",
    branch: "Bannerghatta Flagship Showroom",
  },
};

export function computeCapabilities(role?: DealerStaffRole): RoleCapabilities {
  switch (role) {
    case "DEALER_OWNER":
      return {
        canSubmitQuotes: true,
        canManageStaff: true,
        canManageInventory: true,
        canViewAllBranches: true,
      };
    case "BRANCH_MANAGER":
      return {
        canSubmitQuotes: true,
        canManageStaff: true,
        canManageInventory: true,
        canViewAllBranches: false,
      };
    case "SALES_MANAGER":
      return {
        canSubmitQuotes: true,
        canManageStaff: false,
        canManageInventory: false,
        canViewAllBranches: false,
      };
    case "SALES_EXECUTIVE":
      return {
        canSubmitQuotes: false,
        canManageStaff: false,
        canManageInventory: false,
        canViewAllBranches: false,
      };
    case "INVENTORY_MANAGER":
      return {
        canSubmitQuotes: false,
        canManageStaff: false,
        canManageInventory: true,
        canViewAllBranches: false,
      };
    case "FINANCE_EXECUTIVE":
      return {
        canSubmitQuotes: false,
        canManageStaff: false,
        canManageInventory: false,
        canViewAllBranches: false,
      };
    default:
      return {
        canSubmitQuotes: false,
        canManageStaff: false,
        canManageInventory: false,
        canViewAllBranches: false,
      };
  }
}

interface AuthContextType {
  user: DealerStaffMember | null;
  dealer: DealerEntity | null;
  branches: DealerBranch[];
  currentBranch: DealerBranch | null;
  setCurrentBranch: (branch: DealerBranch | null) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  capabilities: RoleCapabilities;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRoleDemo: (role: DealerStaffRole) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refreshBranches: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<DealerStaffMember | null>(null);
  const [dealer, setDealer] = useState<DealerEntity | null>(null);
  const [branches, setBranches] = useState<DealerBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<DealerBranch | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const capabilities = useMemo(() => {
    return computeCapabilities(user?.staff_role);
  }, [user?.staff_role]);

  const logout = useCallback(async () => {
    try {
      await dealerApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setDealer(null);
      setBranches([]);
      setCurrentBranch(null);
      setIsAuthenticated(false);
      setError(null);
      setAccessToken(null);

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("gd_dealer_user");
        sessionStorage.removeItem("gd_dealer_entity");
        localStorage.removeItem("gd_dealer_branch_id");
      }

      router.push("/login");
    }
  }, [router]);

  // Register automatic session expiry handler
  useEffect(() => {
    registerSessionExpiredHandler(() => {
      logout();
      router.push("/login?expired=true");
    });
  }, [logout, router]);

  // Restore session from token / /auth/me on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const token = getAccessToken();
      if (!token) {
        // Check fallback cache in session storage for dev
        if (typeof window !== "undefined") {
          const cachedUser = sessionStorage.getItem("gd_dealer_user");
          const cachedDealer = sessionStorage.getItem("gd_dealer_entity");
          if (cachedUser && cachedDealer) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              const parsedDealer = JSON.parse(cachedDealer);
              if (isMounted) {
                setUser(parsedUser);
                setDealer(parsedDealer);
                setBranches(MOCK_BRANCHES);
                setIsAuthenticated(true);
                setIsLoading(false);
                return;
              }
            } catch {
              // Ignore parse error
            }
          }
        }
        if (isMounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
        }
        return;
      }

      try {
        const meRes = await dealerApi.getMe();
        if (meRes.success && meRes.data?.user) {
          const fetchedUser = meRes.data.user;
          const fetchedDealer = meRes.data.dealer || MOCK_DEALER;

          let fetchedBranches: DealerBranch[] = [];
          try {
            const bRes = await dealerApi.getBranches();
            fetchedBranches = bRes.data || MOCK_BRANCHES;
          } catch {
            fetchedBranches = MOCK_BRANCHES;
          }

          if (isMounted) {
            setUser(fetchedUser);
            setDealer(fetchedDealer);
            setBranches(fetchedBranches);
            setIsAuthenticated(true);

            // Handle branch selection
            if (fetchedUser.staff_role !== "DEALER_OWNER" && fetchedUser.branch_id) {
              const assigned = fetchedBranches.find((b) => b.id === fetchedUser.branch_id);
              setCurrentBranch(assigned || null);
            } else {
              const savedBranchId = localStorage.getItem("gd_dealer_branch_id");
              const savedBranch = fetchedBranches.find((b) => b.id === savedBranchId);
              setCurrentBranch(savedBranch || null);
            }
          }
        } else {
          // Token invalid or unverified
          setAccessToken(null);
          if (isMounted) {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (err: unknown) {
        if (err instanceof ApiClientError && err.status === 401) {
          setAccessToken(null);
          if (isMounted) {
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // If offline in dev, keep cached session if available
          if (typeof window !== "undefined") {
            const cachedUser = sessionStorage.getItem("gd_dealer_user");
            if (cachedUser) {
              setUser(JSON.parse(cachedUser));
              setDealer(MOCK_DEALER);
              setBranches(MOCK_BRANCHES);
              setIsAuthenticated(true);
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSetCurrentBranch = (targetBranch: DealerBranch | null): boolean => {
    // Branch-level access restriction enforcement:
    // Non-dealer owners can only view their assigned branch.
    if (user && user.staff_role !== "DEALER_OWNER") {
      if (targetBranch === null || targetBranch.id !== user.branch_id) {
        // Prohibit switching away from assigned branch
        return false;
      }
    }

    setCurrentBranch(targetBranch);
    try {
      if (targetBranch) {
        localStorage.setItem("gd_dealer_branch_id", targetBranch.id);
      } else {
        localStorage.removeItem("gd_dealer_branch_id");
      }
    } catch {
      // Ignore localStorage errors
    }
    return true;
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const res = await dealerApi.login(email, password);
      if (!res.success || !res.data) {
        const msg = res.message || "Authentication failed. Please verify credentials.";
        setError(msg);
        return { success: false, error: msg };
      }

      const userData = res.data.user;
      const dealerData = res.data.dealer;
      let branchList: DealerBranch[] = [];

      try {
        const branchesRes = await dealerApi.getBranches();
        branchList = branchesRes.data || MOCK_BRANCHES;
      } catch {
        branchList = MOCK_BRANCHES;
      }

      setUser(userData);
      setDealer(dealerData);
      setBranches(branchList);
      setIsAuthenticated(true);

      // Branch assignment based on role
      if (userData.staff_role !== "DEALER_OWNER" && userData.branch_id) {
        const assigned = branchList.find((b) => b.id === userData.branch_id);
        setCurrentBranch(assigned || null);
      } else {
        setCurrentBranch(null); // All Dealership Branches by default for Owner
      }

      // Persist user context for instant hydration
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gd_dealer_user", JSON.stringify(userData));
        sessionStorage.setItem("gd_dealer_entity", JSON.stringify(dealerData));
      }

      return { success: true };
    } catch (err: unknown) {
      let message = "Unable to complete sign in. Please verify your network and credentials.";
      if (err instanceof ApiClientError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      return { success: false, error: message };
    }
  };

  const switchRoleDemo = async (newRole: DealerStaffRole): Promise<boolean> => {
    const creds = DEMO_ROLE_CREDENTIALS[newRole];
    if (!creds) return false;
    const result = await login(creds.email, "Password@123");
    return result.success;
  };

  const refreshProfile = async () => {
    try {
      const res = await dealerApi.getProfile();
      if (res.success && res.data) {
        setDealer(res.data);
      }
    } catch {
      // Ignore
    }
  };

  const refreshBranches = async () => {
    try {
      const res = await dealerApi.getBranches();
      if (res.success && res.data) {
        setBranches(res.data);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dealer,
        branches,
        currentBranch,
        setCurrentBranch: handleSetCurrentBranch,
        isAuthenticated,
        isLoading,
        error,
        capabilities,
        login,
        logout,
        switchRoleDemo,
        refreshProfile,
        refreshBranches,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
