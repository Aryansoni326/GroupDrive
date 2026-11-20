"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Overview",
  demand: "Regional Demand Radar",
  inventory: "Yard Inventory",
  quotations: "Quotation Manager",
  campaigns: "Flash Campaigns",
  branches: "Branches and Staff",
  settings: "Dealership Profile",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] === "login") {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-slate-800 transition-colors"
      >
        <Home className="h-3.5 w-3.5 mr-1" />
        <span>DealerOS</span>
      </Link>

      {segments.map((seg, idx) => {
        const href = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const label = ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);

        return (
          <div key={href} className="flex items-center space-x-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            {isLast ? (
              <span className="text-slate-900 font-semibold">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-slate-800 transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

