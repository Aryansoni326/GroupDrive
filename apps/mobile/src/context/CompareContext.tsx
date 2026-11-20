import React, { createContext, useContext, useState, useCallback } from "react";
import { CatalogueModel, CatalogueVariant } from "@groupdrive/types";

export interface MobileComparedVehicle {
  id: string;
  brandName: string;
  name: string;
  bodyType: string;
  imageUrl: string;
  startingPrice: number;
  engine?: string;
  power?: string;
  torque?: string;
  mileage?: string;
  fuelType?: string;
  transmission?: string;
  seatingCapacity?: number;
  bootSpace?: string;
  safety?: string;
  groundClearance?: string;
  fuelTank?: string;
  dimensions?: string;
  airbags?: string;
  infotainment?: string;
  sunroof?: string;
  climateControl?: string;
  groupDiscount?: number;
  onRoadEstimate?: number;
}

interface CompareContextType {
  comparedVehicles: MobileComparedVehicle[];
  addVehicle: (vehicle: MobileComparedVehicle) => boolean;
  removeVehicle: (id: string) => void;
  toggleVehicle: (vehicle: MobileComparedVehicle) => void;
  clearVehicles: () => void;
  isVehicleComparing: (id: string) => boolean;
  limitAlert: string | null;
  dismissAlert: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [comparedVehicles, setComparedVehicles] = useState<MobileComparedVehicle[]>([
    {
      id: "mod-brezza-01",
      brandName: "Maruti Suzuki",
      name: "Brezza",
      bodyType: "Compact SUV",
      imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
      startingPrice: 834000,
      engine: "1.5L K15C Smart Hybrid Petrol",
      power: "103 PS @ 6000 rpm",
      torque: "136.8 Nm @ 4400 rpm",
      mileage: "19.8 kmpl",
      fuelType: "Petrol",
      transmission: "Manual / Automatic",
      seatingCapacity: 5,
      bootSpace: "328 Litres",
      safety: "4 Stars Global NCAP",
      groundClearance: "198 mm",
      fuelTank: "48 Litres",
      dimensions: "3,995 x 1,790 x 1,685 mm",
      airbags: "6 Airbags Standard",
      infotainment: "9-inch SmartPlay Pro+ Touchscreen",
      sunroof: "Electric Sunroof with Anti-Pinch",
      climateControl: "Automatic Climate Control",
      groupDiscount: 45000,
      onRoadEstimate: 965000,
    },
    {
      id: "mod-creta-01",
      brandName: "Hyundai",
      name: "Creta",
      bodyType: "Mid-Size SUV",
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
      startingPrice: 1099900,
      engine: "1.5L MPi Smartstream Petrol",
      power: "115 PS @ 6300 rpm",
      torque: "143.8 Nm @ 4500 rpm",
      mileage: "17.7 kmpl",
      fuelType: "Petrol / Diesel",
      transmission: "Manual / IVT / AT",
      seatingCapacity: 5,
      bootSpace: "433 Litres",
      safety: "Level 2 ADAS + 6 Airbags",
      groundClearance: "190 mm",
      fuelTank: "50 Litres",
      dimensions: "4,330 x 1,790 x 1,635 mm",
      airbags: "6 Airbags Standard",
      infotainment: "10.25-inch Touchscreen Navigation",
      sunroof: "Voice-Enabled Panoramic Sunroof",
      climateControl: "Dual-Zone Automatic Climate Control",
      groupDiscount: 55000,
      onRoadEstimate: 1270000,
    },
  ]);
  const [limitAlert, setLimitAlert] = useState<string | null>(null);

  const isVehicleComparing = useCallback(
    (id: string) => comparedVehicles.some((v) => v.id === id),
    [comparedVehicles]
  );

  const addVehicle = useCallback(
    (vehicle: MobileComparedVehicle): boolean => {
      if (comparedVehicles.some((v) => v.id === vehicle.id)) {
        return true;
      }
      if (comparedVehicles.length >= 3) {
        setLimitAlert("You can compare up to 3 vehicles simultaneously.");
        return false;
      }
      setComparedVehicles((prev) => [...prev, vehicle]);
      setLimitAlert(null);
      return true;
    },
    [comparedVehicles]
  );

  const removeVehicle = useCallback((id: string) => {
    setComparedVehicles((prev) => prev.filter((v) => v.id !== id));
    setLimitAlert(null);
  }, []);

  const toggleVehicle = useCallback(
    (vehicle: MobileComparedVehicle) => {
      if (comparedVehicles.some((v) => v.id === vehicle.id)) {
        removeVehicle(vehicle.id);
      } else {
        addVehicle(vehicle);
      }
    },
    [comparedVehicles, addVehicle, removeVehicle]
  );

  const clearVehicles = useCallback(() => {
    setComparedVehicles([]);
    setLimitAlert(null);
  }, []);

  const dismissAlert = useCallback(() => {
    setLimitAlert(null);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        comparedVehicles,
        addVehicle,
        removeVehicle,
        toggleVehicle,
        clearVehicles,
        isVehicleComparing,
        limitAlert,
        dismissAlert,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}

