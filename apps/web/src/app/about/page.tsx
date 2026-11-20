"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  TrendingDown,
  Building2,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Car,
  BadgePercent,
  Receipt,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="bg-slate-50 text-slate-900 pb-8">
      {/* =========================================================================
          HERO SECTION (Light Blue Contrast Automotive Theme)
          ========================================================================= */}
      <section
        className="relative overflow-hidden py-14 md:py-18 border-b border-blue-200/80"
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)",
          boxShadow: "0 4px 20px -2px rgba(59, 130, 246, 0.08)",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Democratizing Automotive Buying Power
              </span>
              <span className="text-xs text-blue-900 font-semibold">
                Pioneering Collective Vehicle Commerce in India
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
              Never Negotiate Alone. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
                Drive Institutional Savings.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal max-w-3xl">
              GroupDrive is an automotive technology marketplace that unlocks institutional fleet-level discounts for retail car buyers through AI demand pooling and authorized dealership reverse bidding.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 py-10 space-y-12 max-w-5xl">
        {/* The Problem & Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-card space-y-3.5 hover:border-slate-300 transition-all">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 font-black flex items-center justify-center text-sm border border-rose-200">
              01
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              The Individual Buyer Dilemma
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When an individual retail consumer walks into a car dealership showroom alone, they have minimal leverage. Dealerships routinely charge high markups on insurance, dealer handling charges, and accessories. Corporate fleet buyers, however, purchase 10 to 50 vehicles at once and unlock institutional discounts of 5% to 12%.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-blue-200/90 shadow-card space-y-3.5 bg-gradient-to-br from-white to-blue-50/30 hover:border-blue-300 transition-all">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 font-black flex items-center justify-center text-sm border border-blue-200">
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

        {/* 4-Step Process Section */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Badge variant="brand" size="sm">
              How It Works
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Collective Buying in 4 Clear Steps
            </h2>
            <p className="text-xs text-slate-500">
              From group discovery to showroom handover, simple and transparent throughout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <span className="text-xs font-black text-blue-600 font-mono">STEP 01</span>
              <h4 className="text-sm font-bold text-slate-900">Select & Join Cluster</h4>
              <p className="text-xs text-slate-600">
                Browse verified buyer groups for your targeted car model in your metro city with zero advance fee.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <span className="text-xs font-black text-blue-600 font-mono">STEP 02</span>
              <h4 className="text-sm font-bold text-slate-900">Cluster Formation</h4>
              <p className="text-xs text-slate-600">
                Once the group reaches target capacity (e.g. 5 to 15 verified buyers), competitive reverse bidding opens.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <span className="text-xs font-black text-blue-600 font-mono">STEP 03</span>
              <h4 className="text-sm font-bold text-slate-900">Dealer Reverse Bidding</h4>
              <p className="text-xs text-slate-600">
                Authorized OEM dealerships submit itemized wholesale pricing and exclusive group discounts on DealerOS.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <span className="text-xs font-black text-emerald-600 font-mono">STEP 04</span>
              <h4 className="text-sm font-bold text-slate-900">Showroom Delivery</h4>
              <p className="text-xs text-slate-600">
                Review the winning quote, visit the authorized showroom, sign official OEM paperwork, and drive home.
              </p>
            </div>
          </div>
        </div>

        {/* Core Principles */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Badge variant="secondary" size="sm">
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
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-5">
          <div className="max-w-2xl space-y-1.5">
            <Badge variant="brand" size="sm">
              Nationwide Presence
            </Badge>
            <h3 className="text-2xl font-black text-slate-900">
              Live in 6 Major Automotive Metros
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Active buyer clusters and authorized dealer partners are currently live across India's top automotive hubs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"].map((city) => (
              <div
                key={city}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 font-semibold text-xs text-slate-800"
              >
                {city}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="text-center space-y-4 pt-2">
          <h3 className="text-2xl font-black text-slate-900">
            Ready to Experience Collective Car Buying?
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
            <Link href="/dealers">
              <Button variant="outline" size="lg" className="font-semibold px-8">
                View Authorized Dealers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
