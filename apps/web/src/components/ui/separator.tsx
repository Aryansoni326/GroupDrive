import * as React from "react";
import { cn } from "@groupdrive/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

export function Separator({
  className,
  orientation = "horizontal",
  label,
  ...props
}: SeparatorProps) {
  if (label && orientation === "horizontal") {
    return (
      <div className={cn("relative flex items-center py-2", className)} {...props}>
        <div className="flex-grow border-t border-slate-200" />
        <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-grow border-t border-slate-200" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 bg-slate-200",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  );
}

