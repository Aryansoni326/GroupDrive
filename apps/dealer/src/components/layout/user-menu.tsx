"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { LogOut, ShieldCheck, ChevronDown, RefreshCw, Building } from "lucide-react";
import { DealerStaffRole } from "@groupdrive/types";

const ROLE_OPTIONS: Array<{ role: DealerStaffRole; label: string; desc: string }> = [
  { role: "DEALER_OWNER", label: "Dealer Owner", desc: "Cross-branch, full rights" },
  { role: "BRANCH_MANAGER", label: "Branch Manager", desc: "Whitefield, quote permissions" },
  { role: "SALES_MANAGER", label: "Sales Manager", desc: "Whitefield, quote permissions" },
  { role: "SALES_EXECUTIVE", label: "Sales Executive", desc: "Whitefield, read-only radar" },
  { role: "INVENTORY_MANAGER", label: "Inventory Manager", desc: "Hosur yard, stock ops" },
  { role: "FINANCE_EXECUTIVE", label: "Finance Executive", desc: "Bannerghatta, loan ops" },
];

export function UserMenu() {
  const { user, dealer, currentBranch, logout, switchRoleDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const initials = `${user.first_name?.[0] || "D"}${user.last_name?.[0] || "S"}`;

  const handleRoleSwitch = async (role: DealerStaffRole) => {
    setIsSwitching(true);
    await switchRoleDemo(role);
    setIsSwitching(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-slate-100 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <div className="hidden md:block text-left text-sm">
          <p className="font-semibold text-slate-900 leading-none">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-none">
            {user.designation || user.staff_role.replace(/_/g, " ")}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 rounded-xl border border-slate-200 bg-white shadow-xl py-2 z-50 text-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-base">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-slate-500 text-xs font-mono truncate mt-0.5">{user.email}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                {user.staff_role.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-slate-600 truncate">
                {dealer?.trade_name}
              </span>
            </div>
            <div className="mt-1.5 flex items-center text-xs text-slate-500">
              <Building className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <span>{currentBranch ? currentBranch.branch_name : "All Branches"}</span>
            </div>
          </div>

          {/* Quick Role Switcher for RBAC verification */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center">
                <RefreshCw className={`h-3 w-3 mr-1 ${isSwitching ? "animate-spin" : ""}`} />
                Switch Role (Demo RBAC)
              </span>
              <span className="text-xs text-slate-400">Real JWT</span>
            </p>
            <div className="space-y-1.5">
              {ROLE_OPTIONS.map((opt) => {
                const isCurrent = user.staff_role === opt.role;
                return (
                  <button
                    key={opt.role}
                    onClick={() => handleRoleSwitch(opt.role)}
                    disabled={isSwitching}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                      isCurrent
                        ? "bg-slate-900 text-white font-medium shadow-sm"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs leading-tight">{opt.label}</p>
                      <p className={`text-xs mt-0.5 ${isCurrent ? "text-slate-300" : "text-slate-500"}`}>
                        {opt.desc}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-semibold">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-700 flex items-center space-x-2 transition-colors font-medium text-sm"
            >
              <LogOut className="h-4 w-4 text-red-600" />
              <span>Sign Out of Dealership</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
