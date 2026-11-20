"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { customerApi } from "@groupdrive/api-client";
import { useCustomerAuth } from "@/lib/auth-context";
import { formatINR } from "@groupdrive/utils";
import { PublicBuyerGroupItem } from "@groupdrive/types";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: PublicBuyerGroupItem;
  onSuccess?: () => void;
}

export function JoinGroupModal({
  isOpen,
  onClose,
  group,
  onSuccess,
}: JoinGroupModalProps) {
  const { user } = useCustomerAuth();
  const [customerName, setCustomerName] = useState(
    user ? `${user.first_name} ${user.last_name}`.trim() : ""
  );
  const [customerPhone, setCustomerPhone] = useState(user?.phone_number || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [preferredVariant, setPreferredVariant] = useState(
    group.requirements?.preferred_variants?.[0] || "Top Variant"
  );
  const [preferredColour, setPreferredColour] = useState(
    group.requirements?.preferred_colours?.[0] || "Pearl Arctic White"
  );
  const [financing, setFinancing] = useState("LOAN");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync user info if auth state updates
  React.useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(`${user.first_name} ${user.last_name}`.trim());
      if (!customerPhone) setCustomerPhone(user.phone_number || "");
      if (!customerEmail) setCustomerEmail(user.email || "");
    }
  }, [user]);

  // Escape key listener to close modal
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await customerApi.groups.joinGroup(group.id, {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        city: group.city,
        preferred_variant: preferredVariant,
        preferred_colour: preferredColour,
        financing_preference: financing,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setSuccessData(res.data);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.message || "Could not complete group registration.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to join buyer group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setSuccessData(null);
    setErrorMessage("");
    onClose();
  }

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-group-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header (Clean Light Theme with OEM Blue accent) */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-slate-50 to-white flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm" className="bg-blue-600 text-white font-bold">
                👥 Group Buying Cluster
              </Badge>
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-subtle">
                {group.group_code}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                100% Free to Join
              </span>
            </div>
            <h3 id="join-group-modal-title" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Join {group.brand_name} {group.model_name} Cluster
            </h3>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
              <span>📍 {group.city} Metro</span>
              <span>•</span>
              <span>RTO Territory: {group.rto_circle || "Regional"}</span>
              <span>•</span>
              <span>Reverse Dealership Bidding</span>
            </p>
          </div>

          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors font-bold text-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {successData ? (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
                ✓
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Participation Confirmed!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  You are now Member #{group.current_members_count + 1} of {group.max_capacity} in the {group.city} cluster. Participating authorized dealerships are notified of your verified demand.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-left space-y-1.5 text-xs shadow-subtle">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-bold uppercase tracking-wider text-[11px]">
                    Target Collective Discount
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    Save {formatINR(group.estimated_savings_inr || 45000)}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Quoting window closes on {group.quoting_deadline ? new Date(group.quoting_deadline).toLocaleDateString("en-IN") : "schedule"}. Confirmed dealer offers and itemized quotes will be visible on your dashboard.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button onClick={handleClose} variant="default" className="w-full font-bold">
                  View Updated Group Status
                </Button>
                <Link href="/dashboard" onClick={handleClose}>
                  <Button variant="outline" className="w-full text-xs">
                    Go to My Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Savings Highlight Card */}
              <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-subtle">
                <div>
                  <span className="font-bold text-emerald-950 block text-xs">
                    Target Collective Volume Savings
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Bargaining power of {group.current_members_count} verified buyers in {group.city}
                  </span>
                </div>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono shrink-0">
                  Save {formatINR(group.estimated_savings_inr || 45000)}
                </span>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rahul Menon"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-10 sm:h-11 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-subtle"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="10-digit mobile"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-10 sm:h-11 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-subtle"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="name@domain.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="h-10 sm:h-11 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-subtle"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Preferred Variant
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ZXi Plus AT"
                      value={preferredVariant}
                      onChange={(e) => setPreferredVariant(e.target.value)}
                      className="h-10 sm:h-11 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-subtle"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Preferred Colour
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arctic White"
                      value={preferredColour}
                      onChange={(e) => setPreferredColour(e.target.value)}
                      className="h-10 sm:h-11 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-subtle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Financing / Payment Preference
                  </label>
                  <select
                    value={financing}
                    onChange={(e) => setFinancing(e.target.value)}
                    className="h-10 sm:h-11 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-subtle"
                  >
                    <option value="LOAN">Bank Auto Loan (Assistance Needed)</option>
                    <option value="CASH">Self-Funded / Direct Showroom Bank Transfer</option>
                    <option value="EXCHANGE">Vehicle Exchange + Auto Loan</option>
                    <option value="LEASE">Corporate Lease / Company Scheme</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Special Requirements or Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Need delivery before festival, looking for exchange"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-10 sm:h-11 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-subtle"
                  />
                </div>
              </div>

              {/* Zero Commitment Assurance Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>100% Free & Zero Commitment</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-500">
                  No advance payment or deposit required. You review competing dealership offers once quoting concludes and complete purchase exclusively at the authorized showroom.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-1">
                <Button
                  type="submit"
                  variant="default"
                  isLoading={isLoading}
                  className="w-full h-11 sm:h-12 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-card flex items-center justify-center gap-2"
                >
                  <span>Confirm & Join Group Buying Cluster</span>
                  <span>→</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
