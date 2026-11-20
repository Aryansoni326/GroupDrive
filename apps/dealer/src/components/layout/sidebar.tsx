"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Warehouse,
  Tag,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@groupdrive/utils";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: "default" | "success" | "warning";
}

// Only the essential dealership operations required by dealer
const REQUIRED_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Customers & Leads",
    href: "/leads",
    icon: Users,
    badge: "7 Active",
    badgeVariant: "default",
  },
  {
    label: "Showroom Stock",
    href: "/inventory",
    icon: Warehouse,
    badge: "Live",
    badgeVariant: "success",
  },
  {
    label: "Deals & Offers",
    href: "/campaigns",
    icon: Tag,
  },
  {
    label: "Staff & Tasks",
    href: "/staff",
    icon: CheckSquare,
    badge: "3 Due",
    badgeVariant: "warning",
  },
  {
    label: "Dealer Profile",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white text-slate-900 border-r border-slate-200">
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-xs group-hover:bg-blue-700 transition-colors">
              GD
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-black text-base tracking-tight text-slate-950 block leading-none">
                  GROUP<span className="text-blue-600">DRIVE</span>
                </span>
                <span className="text-[10px] font-bold text-blue-600 tracking-wider block mt-1 uppercase">
                  DealerOS
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Dealership Portal
            </div>
          )}

          {REQUIRED_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all group",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 border border-transparent",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-700",
                    !isCollapsed && "mr-3"
                  )}
                />

                {!isCollapsed && (
                  <span className="flex-1 whitespace-nowrap text-xs font-medium">
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      "ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                      item.badgeVariant === "warning" &&
                        "bg-amber-50 text-amber-700 border border-amber-200",
                      item.badgeVariant === "success" &&
                        "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      item.badgeVariant === "default" &&
                        "bg-blue-50 text-blue-700 border border-blue-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls & Collapse Toggle */}
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center rounded-xl py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center space-x-2">
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-200 ease-in-out bg-white",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
