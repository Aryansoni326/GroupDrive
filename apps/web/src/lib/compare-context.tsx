"use client";

import * as React from "react";

export interface ComparedVehicle {
  id: string;
  brandName: string;
  name: string;
  bodyType: string;
  imageUrl: string;
  startingPrice: number;
  engine?: string;
  power?: string;
  mileage?: string;
  safety?: string;
  bootSpace?: string;
  fuelType?: string;
  transmission?: string;
}

interface CompareContextType {
  comparedVehicles: ComparedVehicle[];
  addVehicle: (vehicle: ComparedVehicle) => boolean;
  removeVehicle: (id: string) => void;
  toggleVehicle: (vehicle: ComparedVehicle) => void;
  clearVehicles: () => void;
  isVehicleComparing: (id: string) => boolean;
  limitAlert: string | null;
  dismissAlert: () => void;
  setComparedVehicles: React.Dispatch<React.SetStateAction<ComparedVehicle[]>>;
}

const CompareContext = React.createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = "groupdrive_compared_vehicles";
const MAX_COMPARE_LIMIT = 3;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [comparedVehicles, setComparedVehicles] = React.useState<ComparedVehicle[]>([]);
  const [limitAlert, setLimitAlert] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load persistent comparison selection from localStorage on mount (for both guest and logged-in customers)
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setComparedVehicles(parsed.slice(0, MAX_COMPARE_LIMIT));
          }
        }
      }
    } catch (err) {
      console.warn("Could not read compared vehicles from storage:", err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist comparison selection changes to localStorage
  React.useEffect(() => {
    if (!isInitialized) return;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedVehicles));
      }
    } catch (err) {
      console.warn("Could not persist compared vehicles to storage:", err);
    }
  }, [comparedVehicles, isInitialized]);

  // Auto-dismiss limit alert after 4.5 seconds
  React.useEffect(() => {
    if (limitAlert) {
      const timer = setTimeout(() => {
        setLimitAlert(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [limitAlert]);

  const addVehicle = React.useCallback(
    (vehicle: ComparedVehicle): boolean => {
      // Check if already in comparison
      if (comparedVehicles.some((v) => v.id === vehicle.id)) {
        return true;
      }

      // Enforce comparison limit of 3 vehicles with clear user feedback
      if (comparedVehicles.length >= MAX_COMPARE_LIMIT) {
        setLimitAlert(
          `Comparison limit reached: You can compare up to ${MAX_COMPARE_LIMIT} vehicles simultaneously. Please remove a vehicle to add "${vehicle.name}".`
        );
        return false;
      }

      setComparedVehicles((prev) => [...prev, vehicle]);
      setLimitAlert(null);
      return true;
    },
    [comparedVehicles]
  );

  const removeVehicle = React.useCallback((id: string) => {
    setComparedVehicles((prev) => prev.filter((v) => v.id !== id));
    setLimitAlert(null);
  }, []);

  const toggleVehicle = React.useCallback(
    (vehicle: ComparedVehicle) => {
      const exists = comparedVehicles.some((v) => v.id === vehicle.id);
      if (exists) {
        removeVehicle(vehicle.id);
      } else {
        addVehicle(vehicle);
      }
    },
    [comparedVehicles, addVehicle, removeVehicle]
  );

  const clearVehicles = React.useCallback(() => {
    setComparedVehicles([]);
    setLimitAlert(null);
  }, []);

  const isVehicleComparing = React.useCallback(
    (id: string) => {
      return comparedVehicles.some((v) => v.id === id);
    },
    [comparedVehicles]
  );

  const dismissAlert = React.useCallback(() => {
    setLimitAlert(null);
  }, []);

  const value = React.useMemo(
    () => ({
      comparedVehicles,
      addVehicle,
      removeVehicle,
      toggleVehicle,
      clearVehicles,
      isVehicleComparing,
      limitAlert,
      dismissAlert,
      setComparedVehicles,
    }),
    [
      comparedVehicles,
      addVehicle,
      removeVehicle,
      toggleVehicle,
      clearVehicles,
      isVehicleComparing,
      limitAlert,
      dismissAlert,
    ]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = React.useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}

