"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Warehouse,
  FileSpreadsheet,
  Tag,
  Building,
  Users,
  Settings,
  Car,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  UserCheck,
  CalendarCheck,
  Bell,
  BarChart3,
} from "lucide-react";
import { cn } from "@groupdrive/utils";
import { useAuth } from "../../lib/auth-context";

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
  requiresOwnerOrBranchManager?: boolean;
}

interface NavGroup {
  groupTitle?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: "Dealership Operations",
    items: [
      {
        label: "Dashboard Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Active Customers & Leads",
        href: "/leads",
        icon: UserCheck,
        badge: "7 Active",
      },
      {
        label: "Follow-ups & Staff Tasks",
        href: "/follow-ups",
        icon: CalendarCheck,
        badge: "3 Due",
        badgeVariant: "warning",
      },
      {
        label: "Showroom Inventory",
        href: "/inventory",
        icon: Warehouse,
        badge: "Live Stock",
      },
      {
        label: "Deal Groups & Offers",
        href: "/campaigns",
        icon: Tag,
      },
      {
        label: "Demand & Sales Analytics",
        href: "/demand",
        icon: Radio,
      },
    ],
  },
  {
    groupTitle: "Dealer Management",
    items: [
      {
        label: "Showroom Branches",
        href: "/branches",
        icon: Building,
      },
      {
        label: "Staff & Task Assignment",
        href: "/staff",
        icon: Users,
      },
      {
        label: "Dealer Profile & Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { capabilities } = useAuth();

  const isManagement = capabilities.canManageStaff;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-white">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-sm">
              GD
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-black text-base tracking-tight text-white block leading-none">
                  GROUP<span className="text-blue-400">DRIVE</span>
                </span>
                <span className="text-[10px] font-bold text-blue-400 tracking-wider block mt-1 uppercase">
                  DealerOS
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-5">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.groupTitle && !isCollapsed && (
                <div className="px-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {group.groupTitle}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                const isRestricted = item.requiresOwnerOrBranchManager && !isManagement;

                if (isRestricted) {
                  return (
                    <div
                      key={item.href}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed opacity-50",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={`${item.label} (Management Only)`}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0 text-slate-500", !isCollapsed && "mr-3")} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          <Lock className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
                        </>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                      isActive
                        ? "bg-emerald-600 text-white font-semibold shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-white",
                        !isCollapsed && "mr-3"
                      )}
                    />

                    {!isCollapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          "ml-auto text-xs px-2 py-0.5 rounded-full font-semibold",
                          item.badgeVariant === "warning"
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                            : "bg-slate-800 text-slate-200"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Controls & Collapse Toggle */}
      <div className="border-t border-slate-800 p-3">
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center rounded-lg py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <div className="flex items-center space-x-2">
              <ChevronLeft className="h-5 w-5" />
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
          "hidden lg:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-200 ease-in-out border-r border-slate-800",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
