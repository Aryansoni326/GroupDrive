import { ApiResponse } from "@groupdrive/types";

declare const process: any;
declare const window: any;
declare const sessionStorage: any;
declare const localStorage: any;
declare const document: any;

export class ApiClientError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

export interface AuthStorageAdapter {
  getToken(): string | Promise<string | null> | null;
  setToken(token: string | null): void | Promise<void>;
}

export class MemoryStorageAdapter implements AuthStorageAdapter {
  private token: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }
}

export class WebStorageAdapter implements AuthStorageAdapter {
  private inMemoryToken: string | null = null;
  private key: string;

  constructor(key = "gd_customer_token") {
    this.key = key;
  }

  getToken(): string | null {
    if (this.inMemoryToken) return this.inMemoryToken;
    if (typeof window !== "undefined") {
      try {
        const token = sessionStorage.getItem(this.key) || localStorage.getItem(this.key);
        if (token) {
          this.inMemoryToken = token;
          return token;
        }
      } catch {
        // Fallback for sandboxed iframes or restricted environments
      }
    }
    return null;
  }

  setToken(token: string | null): void {
    this.inMemoryToken = token;
    if (typeof window !== "undefined") {
      try {
        if (token) {
          sessionStorage.setItem(this.key, token);
          localStorage.setItem(this.key, token);
          document.cookie = `${this.key}=${token}; path=/; max-age=3600; SameSite=Lax`;
        } else {
          sessionStorage.removeItem(this.key);
          localStorage.removeItem(this.key);
          document.cookie = `${this.key}=; path=/; max-age=0`;
        }
      } catch {
        // Restricted storage fallback
      }
    }
  }
}

export interface ApiClientConfig {
  baseUrl?: string;
  storageAdapter?: AuthStorageAdapter;
  onSessionExpired?: () => void;
  isDevFallbackEnabled?: boolean;
}

export function getDefaultApiBaseUrl(): string {
  // Check Next.js public env, Expo public env, or fallback
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
  }
  return "http://localhost:8000/api/v1";
}

export interface RequestOptions extends RequestInit {
  token?: string;
}

export function createApiClient(customConfig: ApiClientConfig = {}) {
  const baseUrl = customConfig.baseUrl || getDefaultApiBaseUrl();
  const storage = customConfig.storageAdapter || (typeof window !== "undefined" ? new WebStorageAdapter() : new MemoryStorageAdapter());
  const isDevFallbackEnabled = customConfig.isDevFallbackEnabled !== undefined
    ? customConfig.isDevFallbackEnabled
    : (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production");

  let sessionExpiredCallback = customConfig.onSessionExpired;

  async function request<T>(
    endpoint: string,
    mockFallback: T,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { token, ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers || {});
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const resolvedToken = token || (await storage.getToken());
    if (resolvedToken) {
      headers.set("Authorization", `Bearer ${resolvedToken}`);
    }

    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        return json;
      }

      if (res.status === 401) {
        const errorBody = await res.json().catch(() => null);
        if (sessionExpiredCallback) {
          sessionExpiredCallback();
        }
        throw new ApiClientError(
          errorBody?.detail || "Session expired. Please sign in again.",
          401,
          "SESSION_EXPIRED"
        );
      }

      const errorBody = await res.json().catch(() => null);
      const message =
        errorBody?.detail ||
        errorBody?.message ||
        `API request failed with HTTP ${res.status}`;
      throw new ApiClientError(message, res.status, errorBody?.error_code);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        throw err;
      }

      // If network unreachable in development, gracefully fall back to mock store
      if (isDevFallbackEnabled && mockFallback !== undefined && mockFallback !== null) {
        return {
          success: true,
          data: mockFallback,
          message: "Loaded from fallback development store",
        };
      }

      throw new ApiClientError(
        "Unable to connect to centralized GroupDrive API service. Please check your network connection.",
        503,
        "SERVICE_UNAVAILABLE"
      );
    }
  }

  return {
    baseUrl,
    storage,
    request,
    setSessionExpiredHandler: (handler: () => void) => {
      sessionExpiredCallback = handler;
    },
    getAccessToken: async () => storage.getToken(),
    setAccessToken: async (token: string | null) => storage.setToken(token),
  };
}
