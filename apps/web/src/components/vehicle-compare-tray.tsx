"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatINR } from "@groupdrive/utils";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useCompare, ComparedVehicle } from "@/lib/compare-context";

export interface VehicleCompareTrayProps {
  selectedVehicles?: ComparedVehicle[];
  onRemove?: (id: string) => void;
  onClear?: () => void;
  onEnquire?: (id: string, name: string) => void;
}

export function VehicleCompareTray({
  selectedVehicles: propsVehicles,
  onRemove: propsOnRemove,
  onClear: propsOnClear,
  onEnquire,
}: VehicleCompareTrayProps = {}) {
  const pathname = usePathname();
  const compareContext = useCompare();

  // If props are passed, use them; otherwise use global CompareContext
  const selectedVehicles = propsVehicles ?? compareContext.comparedVehicles;
  const handleRemove = propsOnRemove ?? compareContext.removeVehicle;
  const handleClear = propsOnClear ?? compareContext.clearVehicles;
  const limitAlert = compareContext.limitAlert;
  const dismissAlert = compareContext.dismissAlert;

  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = React.useState(false);

  // If we are already on the full comparison page (/compare), don't show the bottom floating tray to prevent visual overlap
  const isComparePage = pathname === "/compare";

  const compareUrl = `/compare?cars=${encodeURIComponent(
    selectedVehicles.map((v) => v.id).join(",")
  )}`;

  return (
    <>
      {/* Limit Feedback Alert Toast (Appears whenever user tries to exceed 3 vehicles) */}
      {limitAlert && (
        <div className="fixed top-20 inset-x-4 max-w-lg mx-auto z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-amber-950/95 border border-amber-600/80 text-amber-100 rounded-2xl p-4 shadow-elevated backdrop-blur-md flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-amber-400 text-base leading-none mt-0.5">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Comparison Limit
                </p>
                <p className="text-xs text-amber-100 font-medium mt-0.5">{limitAlert}</p>
              </div>
            </div>
            <button
              onClick={dismissAlert}
              className="text-amber-400 hover:text-white text-base leading-none p-1 rounded-lg hover:bg-amber-900/50"
              aria-label="Dismiss limit notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Comparison Bar (Hidden on /compare page) */}
      {!isComparePage && selectedVehicles.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-4xl mx-auto z-40 bg-slate-950/95 text-white backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-elevated border border-slate-800 animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Left side: selected vehicle chips */}
            <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 whitespace-nowrap">
                  Compare ({selectedVehicles.length}/3)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedVehicles.map((car) => (
                  <div
                    key={car.id}
                    className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 shrink-0 group hover:border-slate-700 transition-colors"
                  >
                    <img
                      src={car.imageUrl}
                      alt={car.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="text-left text-xs">
                      <p className="font-bold text-white leading-tight">{car.name}</p>
                      <p className="text-[10px] text-slate-400">{car.brandName}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(car.id)}
                      className="ml-1 text-slate-400 hover:text-white p-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                      title="Remove from comparison"
                      aria-label={`Remove ${car.name} from comparison`}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Empty slot indicators up to 3 */}
                {Array.from({ length: 3 - selectedVehicles.length }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="hidden md:flex items-center gap-1.5 border border-dashed border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-500 font-medium shrink-0"
                  >
                    <span>+</span>
                    <span>Slot {selectedVehicles.length + idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs px-2.5"
              >
                Clear All
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuickPreviewOpen(true)}
                className="text-slate-200 border-slate-700 hover:bg-slate-800 text-xs hidden lg:inline-flex"
              >
                Quick Peek
              </Button>

              <Link href={compareUrl} className="block">
                <Button
                  variant="default"
                  size="sm"
                  className="font-bold text-xs whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                >
                  Side-by-Side View ({selectedVehicles.length})
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Peek Modal Dialog */}
      <Dialog
        isOpen={isQuickPreviewOpen}
        onClose={() => setIsQuickPreviewOpen(false)}
        title="Quick Comparison Summary"
        description="Side-by-side technical snapshot before opening the full comparison engine"
        maxWidth="2xl"
      >
        <div className="overflow-x-auto space-y-4">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">
                  Feature
                </th>
                {selectedVehicles.map((car) => (
                  <th key={car.id} className="py-3 px-4 text-center w-1/3">
                    <img
                      src={car.imageUrl}
                      alt={car.name}
                      className="w-full aspect-[16/10] object-cover rounded-xl mb-2"
                    />
                    <Badge variant="secondary" size="sm" className="mb-1">
                      {car.brandName}
                    </Badge>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {car.name}
                    </h4>
                    <p className="text-xs font-mono font-bold text-blue-600 mt-1">
                      From {formatINR(car.startingPrice, { compact: true })}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600 uppercase">
                  Body Type
                </td>
                {selectedVehicles.map((car) => (
                  <td key={car.id} className="py-2.5 px-4 text-center font-medium text-slate-800">
                    {car.bodyType}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600 uppercase">
                  Engine Spec
                </td>
                {selectedVehicles.map((car) => (
                  <td key={car.id} className="py-2.5 px-4 text-center font-medium text-slate-800">
                    {car.engine || "1.5L DualJet / Smart Hybrid"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600 uppercase">
                  Fuel Economy
                </td>
                {selectedVehicles.map((car) => (
                  <td key={car.id} className="py-2.5 px-4 text-center font-bold text-emerald-700">
                    {car.mileage || "19.89 kmpl (ARAI)"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600 uppercase">
                  Safety NCAP
                </td>
                {selectedVehicles.map((car) => (
                  <td key={car.id} className="py-2.5 px-4 text-center font-medium text-slate-800">
                    {car.safety || "5 Stars Global NCAP Ready"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600 uppercase">
                  Boot Space
                </td>
                {selectedVehicles.map((car) => (
                  <td key={car.id} className="py-2.5 px-4 text-center font-medium text-slate-800">
                    {car.bootSpace || "328 Litres"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuickPreviewOpen(false)}
            >
              Close
            </Button>
            <Link href={compareUrl} onClick={() => setIsQuickPreviewOpen(false)}>
              <Button variant="default" size="sm" className="font-bold">
                Open Full Comparison Page →
              </Button>
            </Link>
          </div>
        </div>
      </Dialog>
    </>
  );
}
