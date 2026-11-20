import * as React from "react";
import { cn } from "@groupdrive/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 - 100
  threshold?: number; // e.g. 70% threshold indicator
  variant?: "brand" | "emerald" | "amber" | "rose";
  showLabel?: boolean;
}

export function Progress({
  value,
  threshold,
  variant = "brand",
  showLabel = false,
  className,
  ...props
}: ProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const variants = {
    brand: "bg-blue-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    rose: "bg-rose-600",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>Progress</span>
          <span className="tabular-nums font-mono">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            variants[variant]
          )}
          style={{ width: `${clampedValue}%` }}
        />
        {threshold !== undefined && threshold > 0 && threshold < 100 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
            style={{ left: `${threshold}%` }}
            title={`Threshold: ${threshold}%`}
          />
        )}
      </div>
    </div>
  );
}

