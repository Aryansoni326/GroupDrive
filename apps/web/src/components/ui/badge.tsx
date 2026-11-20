import * as React from "react";
import { cn } from "@groupdrive/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "danger"
    | "brand"
    | "info"
    | "rose";
  size?: "sm" | "default" | "lg";
  pulseDot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "default",
  pulseDot = false,
  children,
  ...props
}: BadgeProps) {
  const resolvedVariant = variant === "rose" ? "danger" : variant;

  const variants = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100 text-slate-800 border border-slate-200/80",
    outline: "border border-slate-300 text-slate-700 bg-white",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
    warning: "bg-amber-50 text-amber-800 border border-amber-200/80",
    danger: "bg-rose-50 text-rose-800 border border-rose-200/80",
    brand: "bg-blue-50 text-blue-800 border border-blue-200/80",
    info: "bg-cyan-50 text-cyan-800 border border-cyan-200/80",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] font-medium rounded-md gap-1",
    default: "px-2.5 py-1 text-xs font-semibold rounded-lg gap-1.5",
    lg: "px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg gap-2",
  };

  const dotColors = {
    default: "bg-white",
    secondary: "bg-slate-500",
    outline: "bg-slate-600",
    success: "bg-emerald-600",
    warning: "bg-amber-500",
    danger: "bg-rose-600",
    brand: "bg-blue-600",
    info: "bg-cyan-600",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium transition-colors select-none",
        variants[resolvedVariant],
        sizes[size],
        className
      )}
      {...props}
    >
      {pulseDot && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[resolvedVariant]
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              dotColors[resolvedVariant]
            )}
          />
        </span>
      )}
      {children}
    </div>
  );
}
