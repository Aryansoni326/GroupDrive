"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { Building2, ChevronDown, Check, Lock, ShieldAlert } from "lucide-react";

export function BranchSwitcher() {
  const { branches, currentBranch, setCurrentBranch, capabilities, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLockedNotice, setShowLockedNotice] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowLockedNotice(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOwner = capabilities.canViewAllBranches;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!isOwner) {
            setShowLockedNotice(!showLockedNotice);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-md border transition-colors ${
          isOwner
            ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer"
        }`}
        title={
          isOwner
            ? "Switch showroom branch or yard"
            : "Branch fixed by dealership assignment"
        }
      >
        {isOwner ? (
          <Building2 className="h-3.5 w-3.5 text-slate-500" />
        ) : (
          <Lock className="h-3 w-3 text-amber-600" />
        )}
        <span className="font-medium max-w-[170px] truncate">
          {currentBranch ? currentBranch.branch_name : "All Branches"}
        </span>
        {isOwner ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium">
            Locked
          </span>
        )}
      </button>

      {/* Non-owner lock notice popover */}
      {showLockedNotice && !isOwner && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-lg z-50 text-xs">
          <div className="flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Branch Access Restricted</p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                As a {user?.staff_role?.replace(/_/g, " ")}, your workspace is strictly assigned to{" "}
                <span className="font-semibold">{currentBranch?.branch_name || "your designated showroom"}</span>.
                Cross-branch switching is reserved for Dealer Owners.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dealer Owner Full Branch Switcher */}
      {isOpen && isOwner && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-50 text-xs">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Select Active Branch (Principal View)
          </div>

          <button
            onClick={() => {
              setCurrentBranch(null);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800 transition-colors"
          >
            <div>
              <p className="font-semibold text-slate-900">All Dealership Branches</p>
              <p className="text-xs text-slate-500">Aggregated inventory and demand across all sites</p>
            </div>
            {!currentBranch && <Check className="h-4 w-4 text-emerald-600" />}
          </button>

          <div className="border-t border-slate-100 my-1" />

          {branches.map((branch) => {
            const isSelected = currentBranch?.id === branch.id;
            return (
              <button
                key={branch.id}
                onClick={() => {
                  setCurrentBranch(branch);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800 transition-colors"
              >
                <div className="pr-2">
                  <p className="font-medium text-slate-900">{branch.branch_name}</p>
                  <p className="text-xs text-slate-500">
                    {branch.city} - {branch.authorized_rto_codes.join(", ")}
                  </p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
