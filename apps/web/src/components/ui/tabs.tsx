"use client";

import * as React from "react";
import { cn } from "@groupdrive/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline" | "cards";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "pills",
  className,
}: TabsProps) {
  if (variant === "pills") {
    return (
      <div
        className={cn(
          "inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 max-w-full overflow-x-auto",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div className={cn("border-b border-slate-200 flex space-x-8 overflow-x-auto", className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 py-3.5 px-1 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}

