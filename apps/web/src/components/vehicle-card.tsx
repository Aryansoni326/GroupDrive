"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR } from "@groupdrive/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useCompare } from "@/lib/compare-context";

export interface VehicleCardProps {
  id: string;
  brandName: string;
  modelName: string;
  variantName?: string;
  bodyType: string;
  imageUrl: string;
  seatingCapacity?: number;
  startingPrice?: number;
  maxPrice?: number;
  activeGroupCount?: number;
  maxGroupSavings?: number;
  fuelTypes?: string[];
  transmissionTypes?: string[];
  power?: string;
  mileage?: string;
  viewMode?: "grid" | "list";
  isComparing?: boolean;
  dealerName?: string;
  isNewlyLaunched?: boolean;
  onToggleCompare?: (id: string) => void;
  onEnquire?: (modelId: string, modelName: string) => void;
}

export function VehicleCard({
  id,
  brandName,
  modelName,
  variantName,
  bodyType,
  imageUrl,
  seatingCapacity = 5,
  startingPrice = 850000,
  maxPrice = 1450000,
  activeGroupCount = 0,
  maxGroupSavings = 45000,
  fuelTypes = ["Petrol", "CNG"],
  transmissionTypes,
  power,
  mileage,
  viewMode = "grid",
  isComparing,
  dealerName,
  isNewlyLaunched = false,
  onToggleCompare,
  onEnquire,
}: VehicleCardProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const compareContext = useCompare();
  const effectiveIsComparing =
    isComparing !== undefined ? isComparing : compareContext.isVehicleComparing(id);

  const handleToggle = () => {
    if (onToggleCompare) {
      onToggleCompare(id);
    } else {
      compareContext.toggleVehicle({
        id,
        brandName,
        name: modelName,
        bodyType,
        imageUrl,
        startingPrice,
        fuelType: fuelTypes?.[0],
        transmission: transmissionTypes?.[0],
        power,
        mileage,
      });
    }
  };

  // =========================================================================
  // LIST VIEW PRESENTATION
  // =========================================================================
  if (viewMode === "list") {
    return (
      <div className="group relative flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-cardHover hover:border-slate-300 transition-all duration-300 overflow-hidden">
        {/* Compare Floating Checkbox */}
        <div className="absolute top-3 left-3 z-20">
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 cursor-pointer hover:bg-white select-none">
            <input
              type="checkbox"
              checked={effectiveIsComparing}
              onChange={handleToggle}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span>Compare</span>
          </label>
        </div>

        {/* Left Media Stage */}
        <Link
          href={`/cars/${id}`}
          className="relative block aspect-[16/10] md:aspect-auto md:w-72 lg:w-80 bg-slate-100 overflow-hidden shrink-0"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
              <span className="text-xs font-medium">Loading vehicle preview...</span>
            </div>
          )}
          <img
            src={imageUrl}
            alt={`${brandName} ${modelName}`}
            className={`h-full w-full object-cover object-center group-hover:scale-105 transition-all duration-500 ease-out ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
              setImageLoaded(true);
            }}
          />
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            {isNewlyLaunched && (
              <Badge variant="brand" size="sm" className="bg-amber-500 text-slate-950 font-black shadow-sm">
                ⭐ 2026 New Launch
              </Badge>
            )}
            <Badge variant="secondary" size="sm" className="bg-white/90 backdrop-blur-md shadow-sm md:hidden">
              {bodyType}
            </Badge>
          </div>
          {activeGroupCount > 0 && (
            <div className="absolute bottom-2.5 left-3 z-10">
              <Badge variant="success" size="sm" pulseDot>
                Save up to {formatINR(maxGroupSavings, { compact: true })}
              </Badge>
            </div>
          )}
        </Link>

        {/* Middle Specs & Details */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {brandName}
              </span>
              <span className="text-slate-300">•</span>
              <Badge variant="secondary" size="sm">
                {bodyType}
              </Badge>
              {isNewlyLaunched && (
                <span className="hidden md:inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  ⭐ Newly Launched 2026
                </span>
              )}
            </div>
            <Link href={`/cars/${id}`}>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                {modelName}
              </h3>
            </Link>
            {variantName && (
              <p className="text-xs font-semibold text-slate-600 mt-1">
                Featured Variant: <span className="text-slate-800">{variantName}</span>
              </p>
            )}
          </div>

          {/* Technical Specs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Fuel Type
              </span>
              <span className="font-semibold text-slate-800">{fuelTypes.join(", ")}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Transmission
              </span>
              <span className="font-semibold text-slate-800">
                {transmissionTypes && transmissionTypes.length > 0
                  ? transmissionTypes.join(", ")
                  : "Manual / Auto"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Power / Output
              </span>
              <span className="font-semibold text-slate-800">{power || "103 - 145 PS"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Efficiency / Range
              </span>
              <span className="font-semibold text-slate-800">{mileage || "19.8 kmpl"}</span>
            </div>
          </div>

          {/* Authorized Dealership Name Banner */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="truncate">
              <span className="text-slate-500 font-normal">Authorized Dealer:</span> {dealerName || `${brandName} Authorized Dealership Network`}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
              ✓ Verified OEM Partner
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Available at Authorized Regional OEM Dealership Showrooms</span>
          </div>
        </div>

        {/* Right Pricing & Actions Sidebar */}
        <div className="w-full md:w-64 bg-slate-50/80 p-5 md:p-6 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-between shrink-0 space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ex-Showroom Price
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
              {formatINR(startingPrice, { compact: true })}
            </p>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Up to {formatINR(maxPrice, { compact: true })} for top trim
            </span>

            {activeGroupCount > 0 && (
              <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                {activeGroupCount} active buyer {activeGroupCount === 1 ? "group" : "groups"} nearby
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Link href={`/cars/${id}`} className="block w-full">
              <Button variant="default" size="default" className="w-full font-bold">
                View Details →
              </Button>
            </Link>
            {onEnquire && (
              <Button
                variant="outline"
                size="default"
                className="w-full font-semibold"
                onClick={() => onEnquire(id, `${brandName} ${modelName}`)}
              >
                Book Test Drive
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GRID VIEW PRESENTATION (Default)
  // =========================================================================
  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-cardHover hover:border-slate-300 transition-all duration-300 overflow-hidden">
      {/* Compare Floating Checkbox */}
      <div className="absolute top-3 left-3 z-20">
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 cursor-pointer hover:bg-white select-none">
          <input
            type="checkbox"
            checked={effectiveIsComparing}
            onChange={handleToggle}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
          />
          <span>Compare</span>
        </label>
      </div>

      {/* Brand & Body Type Tag */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        {isNewlyLaunched && (
          <Badge variant="brand" size="sm" className="bg-amber-500 text-slate-950 font-black shadow-sm">
            ⭐ 2026 Launch
          </Badge>
        )}
        <Badge variant="secondary" size="sm" className="bg-white/90 backdrop-blur-md shadow-sm">
          {bodyType}
        </Badge>
      </div>

      {/* Vehicle Media Stage */}
      <Link href={`/cars/${id}`} className="relative block aspect-[16/10] w-full bg-slate-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
            <span className="text-xs font-medium">Loading vehicle preview...</span>
          </div>
        )}
        <img
          src={imageUrl}
          alt={`${brandName} ${modelName}`}
          className={`h-full w-full object-cover object-center group-hover:scale-105 transition-all duration-500 ease-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
            setImageLoaded(true);
          }}
        />
        {/* Subtle Bottom Shade */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />

        {/* Live Buyer Group Pill */}
        {activeGroupCount > 0 && (
          <div className="absolute bottom-2.5 left-3 z-10">
            <Badge variant="success" size="sm" pulseDot>
              {activeGroupCount} Live {activeGroupCount === 1 ? "Group" : "Groups"} - Save up to {formatINR(maxGroupSavings, { compact: true })}
            </Badge>
          </div>
        )}
      </Link>

      {/* Vehicle Details */}
      <div className="flex flex-col flex-grow p-5 space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            {brandName}
          </p>
          <Link href={`/cars/${id}`}>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {modelName}
            </h3>
          </Link>
          {variantName && (
            <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
              {variantName}
            </p>
          )}
        </div>

        {/* Specs Highlights */}
        <div className="flex items-center gap-3 text-xs text-slate-600 border-y border-slate-100 py-2.5">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{seatingCapacity} Seater</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{fuelTypes.slice(0, 2).join(" / ")}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <span>Verified Stock</span>
          </div>
        </div>

        {/* Authorized Dealership Name Banner */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-800">
          <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="truncate">
            <span className="text-slate-400 font-normal">Dealer:</span> {dealerName || `${brandName} Authorized Dealership`}
          </span>
          <span className="ml-auto text-emerald-600 font-bold text-xs" title="KYC Verified OEM Dealer">✓</span>
        </div>

        {/* Pricing Breakdown */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Starting From
            </span>
            <p className="text-lg font-black text-slate-900 font-mono tabular-nums">
              {formatINR(startingPrice, { compact: true })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Up to
            </span>
            <p className="text-sm font-semibold text-slate-600 font-mono tabular-nums">
              {formatINR(maxPrice, { compact: true })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-2 mt-auto">
          <Link href={`/cars/${id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full font-semibold">
              View Details
            </Button>
          </Link>
          {onEnquire ? (
            <Button
              variant="default"
              size="sm"
              className="w-full font-semibold"
              onClick={() => onEnquire(id, `${brandName} ${modelName}`)}
            >
              Test Drive
            </Button>
          ) : (
            <Link href={`/groups?model=${id}`} className="w-full">
              <Button variant="default" size="sm" className="w-full font-semibold">
                Join Group
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
