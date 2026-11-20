import React, { createContext, useContext, useState, useEffect } from "react";

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  retryConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  retryConnection: async () => {},
});

function getGlobalObject(): any {
  return typeof globalThis !== "undefined" ? (globalThis as any) : null;
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  // Monitor connectivity or ping
  const checkHealth = async () => {
    try {
      const g = getGlobalObject();
      const nav = g?.navigator;
      if (nav && typeof nav.onLine === "boolean") {
        setIsConnected(nav.onLine);
        setIsInternetReachable(nav.onLine);
      } else {
        setIsConnected(true);
        setIsInternetReachable(true);
      }
    } catch {
      setIsConnected(true);
      setIsInternetReachable(true);
    }
  };

  useEffect(() => {
    checkHealth();

    const g = getGlobalObject();
    const win = g?.window;

    if (win && typeof win.addEventListener === "function") {
      const handleOnline = () => {
        setIsConnected(true);
        setIsInternetReachable(true);
      };
      const handleOffline = () => {
        setIsConnected(false);
        setIsInternetReachable(false);
      };

      win.addEventListener("online", handleOnline);
      win.addEventListener("offline", handleOffline);

      return () => {
        win.removeEventListener("online", handleOnline);
        win.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        retryConnection: checkHealth,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
