"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white border-b border-slate-900 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">
                About GroupDrive
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                Democratizing Automotive Buying Power
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Discover. Compare. Group. Negotiate. Drive.
            </h1>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
              GroupDrive is an automotive technology marketplace that unlocks institutional fleet-level discounts for retail car buyers through AI demand pooling and authorized dealership reverse bidding.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12 space-y-16 max-w-5xl">
        {/* The Problem & Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-card space-y-4">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center text-sm border border-rose-200">
              01
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              The Individual Buyer Dilemma
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When an individual retail consumer walks into a car dealership showroom alone, they have minimal leverage. Dealerships routinely charge high markups on insurance, dealer handling charges, and accessories. Corporate fleet buyers, however, purchase 10 to 50 vehicles at once and unlock institutional discounts of 5% to 12%.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-card space-y-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-200">
              02
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              The GroupDrive Collective Engine
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              GroupDrive bridges this gap by aggregating retail buyers into verified demand clusters based on vehicle model, variant, and metro territory. When a cluster reaches threshold, authorized OEM dealerships compete on DealerOS by submitting reverse bids, passing volume fleet pricing directly to retail buyers.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <Badge variant="secondary" size="sm" className="mb-2">
              Our Commitments
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Our Core Marketplace Principles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                ✓
              </div>
              <h4 className="text-base font-bold text-slate-900">100% Authorized OEM Network</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We never work with unauthorized brokers. Every car is invoiced and handed over directly at an authorized OEM dealership showroom with full manufacturer warranty and clear RTO paperwork.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                0
              </div>
              <h4 className="text-base font-bold text-slate-900">Zero Brokerage Fee</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Joining a buyer group is completely free. We do not charge buyers any upfront deposit, membership fee, or brokerage fee.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-bold">
                ₹
              </div>
              <h4 className="text-base font-bold text-slate-900">Itemized Transparency</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every quotation provides explicit breakdowns for Ex-Showroom price, RTO registration, mandatory insurance, optional accessories, and verified dealership discounts.
              </p>
            </div>
          </div>
        </div>

        {/* Operating Footprint */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-8 sm:p-12 space-y-6">
          <div className="max-w-2xl space-y-2">
            <Badge variant="brand" size="sm">
              Nationwide Expansion
            </Badge>
            <h3 className="text-2xl font-black text-slate-900">
              Operating in Top Automotive Metro Markets
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Active buyer clusters and authorized dealer partners are currently live across Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, and Chennai.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"].map((city) => (
              <div key={city} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 font-semibold text-xs text-slate-800">
                {city}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pt-6">
          <h3 className="text-2xl font-black text-slate-900">
            Ready to Experience Group Buying?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Discover vehicle specifications, compare models side by side, and join a verified cluster in your city today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/groups">
              <Button variant="default" size="lg" className="font-bold px-8 shadow-card">
                Explore Active Buyer Groups →
              </Button>
            </Link>
            <Link href="/cars">
              <Button variant="outline" size="lg" className="font-semibold px-8">
                View Vehicle Catalogue
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

