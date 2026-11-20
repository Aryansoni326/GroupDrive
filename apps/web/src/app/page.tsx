"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCustomerAuth } from "@/lib/auth-context";
import CustomerDashboardPage from "./dashboard/page";

// Authentic OEM Car Brand Definitions
interface BrandItem {
  name: string;
  query: string;
  subtitle: string;
  country: string;
  svg: React.ReactNode;
}

const CAR_BRANDS: BrandItem[] = [
  {
    name: "Maruti Suzuki",
    query: "Maruti Suzuki",
    subtitle: "Brezza, Grand Vitara, Swift, Fronx",
    country: "India's No. 1",
    svg: (
      <svg viewBox="0 0 100 80" className="w-16 h-12 object-contain" fill="none">
        <path d="M78 8 L32 40 L70 40 L22 72 L68 40 L30 40 Z" fill="#E11D48" />
        <path d="M22 10 H78 L68 22 H12 Z" fill="#1E3A8A" opacity="0.9" />
        <path d="M12 70 H68 L78 58 H22 Z" fill="#1E3A8A" opacity="0.9" />
      </svg>
    ),
  },
  {
    name: "Hyundai",
    query: "Hyundai",
    subtitle: "Creta, Venue, Ioniq 5, Verna",
    country: "Smart Mobility",
    svg: (
      <svg viewBox="0 0 100 60" className="w-16 h-12 object-contain" fill="none">
        <ellipse cx="50" cy="30" rx="46" ry="26" stroke="#002C6C" strokeWidth="6" fill="none" />
        <path
          d="M34 16 C34 16 39 30 39 44 M66 16 C66 16 61 30 61 44 M37 30 L63 30"
          stroke="#002C6C"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Tata Motors",
    query: "Tata Motors",
    subtitle: "Nexon EV, Harrier, Safari, Punch",
    country: "Connecting Aspirations",
    svg: (
      <svg viewBox="0 0 100 60" className="w-16 h-12 object-contain" fill="none">
        <circle cx="50" cy="30" r="26" fill="#004D99" />
        <path
          d="M32 24 C40 24 45 28 47 38 C49 28 54 24 68 24 C57 26 52 33 50 42 C48 33 43 26 32 24 Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    name: "Mahindra",
    query: "Mahindra",
    subtitle: "XUV700, Scorpio-N, Thar ROXX",
    country: "Rise with Power",
    svg: (
      <svg viewBox="0 0 100 60" className="w-16 h-12 object-contain" fill="none">
        <path
          d="M24 42 L46 16 L50 24 L34 42 Z"
          fill="#DC2626"
        />
        <path
          d="M76 42 L54 16 L50 24 L66 42 Z"
          fill="#DC2626"
        />
        <path
          d="M38 42 L50 27 L62 42 L50 36 Z"
          fill="#1E293B"
        />
      </svg>
    ),
  },
  {
    name: "Kia",
    query: "Kia",
    subtitle: "Seltos, Sonet, Carens, EV6",
    country: "Movement that Inspires",
    svg: (
      <svg viewBox="0 0 100 50" className="w-16 h-10 object-contain" fill="none">
        <path
          d="M10 38 L24 12 M24 12 L38 38 M24 25 L14 38 M44 12 L44 38 M54 38 L54 12 L78 12 L78 38 L68 38 L68 24 L64 24 L64 38 Z"
          stroke="#05141F"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Toyota",
    query: "Toyota",
    subtitle: "Hyryder, Innova Hycross, Fortuner",
    country: "Reliability & Hybrid",
    svg: (
      <svg viewBox="0 0 100 60" className="w-16 h-12 object-contain" fill="none">
        <ellipse cx="50" cy="30" rx="46" ry="26" stroke="#EB0A1E" strokeWidth="5" fill="none" />
        <ellipse cx="50" cy="24" rx="28" ry="12" stroke="#EB0A1E" strokeWidth="5" fill="none" />
        <ellipse cx="50" cy="30" rx="14" ry="24" stroke="#EB0A1E" strokeWidth="5" fill="none" />
      </svg>
    ),
  },
  {
    name: "Honda",
    query: "Honda",
    subtitle: "Elevate, City, Amaze, Civic",
    country: "The Power of Dreams",
    svg: (
      <svg viewBox="0 0 100 70" className="w-16 h-12 object-contain" fill="none">
        <path
          d="M16 10 L84 10 L76 62 L24 62 Z"
          stroke="#CC0000"
          strokeWidth="5"
          rx="6"
          fill="none"
        />
        <path
          d="M32 20 L35 52 M68 20 L65 52 M34 36 L66 36"
          stroke="#CC0000"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Volkswagen",
    query: "Volkswagen",
    subtitle: "Taigun, Virtus, Tiguan",
    country: "German Engineering",
    svg: (
      <svg viewBox="0 0 100 80" className="w-16 h-12 object-contain" fill="none">
        <circle cx="50" cy="40" r="36" stroke="#001E50" strokeWidth="5" fill="none" />
        <path
          d="M26 24 L50 64 L74 24 M38 24 L50 44 L62 24 M32 50 L50 20 L68 50"
          stroke="#001E50"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    name: "Skoda",
    query: "Skoda",
    subtitle: "Kushaq, Slavia, Kodiaq",
    country: "Simply Clever",
    svg: (
      <svg viewBox="0 0 100 80" className="w-16 h-12 object-contain" fill="none">
        <circle cx="50" cy="40" r="34" stroke="#0E3A2F" strokeWidth="5" fill="none" />
        <circle cx="50" cy="40" r="28" fill="#4BA82E" />
        <path
          d="M44 26 L62 40 L44 54 L48 40 Z"
          fill="#FFFFFF"
        />
        <circle cx="42" cy="40" r="3" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    name: "MG Motor",
    query: "MG Motor",
    subtitle: "Hector, ZS EV, Windsor EV, Astor",
    country: "Since 1924",
    svg: (
      <svg viewBox="0 0 100 80" className="w-16 h-12 object-contain" fill="none">
        <polygon
          points="50,6 88,22 88,58 50,74 12,58 12,22"
          stroke="#990000"
          strokeWidth="6"
          fill="#7F1D1D"
        />
        <text
          x="50"
          y="48"
          textAnchor="middle"
          fontSize="26"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="system-ui, sans-serif"
          letterSpacing="1"
        >
          MG
        </text>
      </svg>
    ),
  },
];

// Marquee Ticker Highlights for the Automatic Mover Bar
const MARQUEE_ITEMS = [
  "🚗 100% Authorized OEM Dealership Network",
  "⚡ Competing Dealership Reverse Bidding",
  "💰 Save up to ₹85,000+ per Car via Collective Demand",
  "🛡️ Direct Showroom Billing & Factory Warranty",
  "🤝 Zero Brokerage, Zero Advance Fees & No Hidden Charges",
  "📍 Live Demand Clusters: Bengaluru • Mumbai • Delhi NCR • Hyderabad • Pune • Chennai",
  "📋 Itemized On-Road Price Transparency",
  "🔒 Private Buyer Identity Isolation",
];

export default function HomePage() {
  const { isAuthenticated, isLoading } = useCustomerAuth();

  if (!isLoading && isAuthenticated) {
    return <CustomerDashboardPage />;
  }

  return (
    <div className="bg-slate-50 text-slate-900 pb-8">
      {/* =========================================================================
          1. HERO SECTION (Light, Premium Automotive Theme with Product Tagline)
          ========================================================================= */}
      <section className="relative bg-gradient-to-b from-white via-slate-50/60 to-white text-slate-900 overflow-hidden border-b border-slate-200/80">
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Core Value Proposition & Tagline */}
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              {/* Product Slogan Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>DRIVE • CONNECT • GO FURTHER</span>
              </div>

              {/* Main Headline (Ideal Line Spacing Between Rows & Zero Descender Clipping) */}
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] xl:text-[44px] font-black tracking-tight text-slate-950 leading-snug">
                <span className="block">Never Negotiate Alone.</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 inline-block mt-2 sm:mt-2.5 pb-2 sm:pb-3 leading-normal">
                  Drive Institutional Savings.
                </span>
              </h1>

              {/* Perfect Tagline for the Product */}
              <div className="space-y-2 max-w-xl mx-auto lg:mx-0">
                <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                  India&apos;s 1st Collective Automotive Marketplace
                </p>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Unite with verified car buyers in your metro territory to command institutional fleet pricing directly from authorized OEM dealerships. Zero brokerage. Direct showroom billing.
                </p>
              </div>

              {/* Primary & Secondary Call to Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link href="/cars">
                  <Button variant="default" size="default" className="font-bold px-7 shadow-card">
                    Explore Vehicles & Prices →
                  </Button>
                </Link>
                <Link href="/cars?tab=groups">
                  <Button
                    variant="outline"
                    size="default"
                    className="font-bold px-6 bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:text-slate-950 shadow-xs"
                  >
                    Explore Group Buying
                  </Button>
                </Link>
              </div>

              {/* Trust Signals Strip */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-3 text-xs text-slate-600 border-t border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>100% Authorized OEM Showrooms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Zero Brokerage or Upfront Fee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Direct Showroom Handover</span>
                </div>
              </div>
            </div>

            {/* Right Column: Multi-Brand Passenger Fleet Image */}
            <div className="lg:col-span-6 flex items-center justify-center py-4 lg:py-0">
              <div className="relative w-full max-w-xl xl:max-w-2xl flex items-center justify-center">
                <img
                  src="/images/hero-fleet.png"
                  alt="Multi-Brand Passenger Vehicles Fleet - GROUPDRIVE"
                  width={680}
                  height={320}
                  style={{ maxHeight: "360px", maxWidth: "100%", height: "auto", objectFit: "contain" }}
                  className="w-full h-auto object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. HORIZONTAL AUTOMATIC MOVER BAR (Continuous Silky Marquee Ticker)
            ========================================================================= */}
        <div className="border-t border-slate-200/80 bg-white py-3.5 shadow-xs overflow-hidden">
          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee-scroll flex items-center gap-10 whitespace-nowrap">
              {/* First copy */}
              {MARQUEE_ITEMS.map((item, idx) => (
                <div key={`m1-${idx}`} className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
                    {item}
                  </span>
                  <span className="text-slate-300 font-bold">•</span>
                </div>
              ))}
              {/* Duplicate copy for seamless infinite loop */}
              {MARQUEE_ITEMS.map((item, idx) => (
                <div key={`m2-${idx}`} className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
                    {item}
                  </span>
                  <span className="text-slate-300 font-bold">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CAR BRAND LOGOS (Original Logos, Clickable, Links to /cars?brand=...)
          ========================================================================= */}
      <section className="container mx-auto px-4 sm:px-6 pt-6 pb-2 sm:pt-8 sm:pb-3">
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-5">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <Badge variant="secondary" size="sm">
              Authorized OEM Networks
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Real-Time Showroom Allocations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Explore Cars by Manufacturer
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
            Select an authorized car brand to explore models, manufacturer technical specifications, ex-showroom pricing, and active regional buyer groups.
          </p>
        </div>

        {/* 10 Clickable OEM Brand Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
          {CAR_BRANDS.map((brand) => (
            <Link
              key={brand.name}
              href={`/cars?brand=${encodeURIComponent(brand.query)}`}
              className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card hover:shadow-cardHover hover:border-blue-500 transition-all duration-300 flex flex-col items-center text-center justify-between hover:-translate-y-1"
            >
              {/* Country / Badge Pill */}
              <div className="w-full flex justify-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {brand.country}
                </span>
              </div>

              {/* Original Brand SVG Logo */}
              <div className="h-14 w-full flex items-center justify-center my-2 transition-transform duration-300 group-hover:scale-110">
                {brand.svg}
              </div>

              {/* Brand Name & Models */}
              <div className="w-full space-y-1 mt-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                  {brand.name}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {brand.subtitle}
                </p>
              </div>

              {/* Quick Action Pill */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 w-full flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>View Models</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          4. HOW GROUPDRIVE WORKS: THE FOUR-STAGE PARADIGM SHIFT
          ========================================================================= */}
      <section id="how-it-works" className="bg-slate-100/70 text-slate-900 py-6 sm:py-8 border-y border-slate-200/80">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-6">
            <Badge variant="brand" size="sm" className="mb-1.5">
              The Four-Stage Paradigm Shift
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Discover. Compare. Group. Negotiate. Drive.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Replacing stressful, opaque solo dealership haggling with collective institutional buying leverage and direct showroom handover.
            </p>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 relative">
            {/* Stage 1 */}
            <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 text-white font-mono font-black flex items-center justify-center text-sm shadow-card">
                    01
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Discovery
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-950">
                  Discover Vehicles
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browse verified OEM catalogues, authentic ARAI fuel economy, NCAP safety crash tests, and transparent on-road estimates without sales pressure.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Unbiased specs & genuine pricing</span>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-mono font-black flex items-center justify-center text-sm shadow-card">
                    02
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Evaluation
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-950">
                  Compare Options
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pit powertrains, feature equipment, boot dimensions, and itemized on-road cost breakdowns side-by-side to make confident, data-driven decisions.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Multi-vehicle comparison matrix</span>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-mono font-black flex items-center justify-center text-sm shadow-card">
                    03
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    Collective Power
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-950">
                  Join a Buyer Group
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Select your vehicle and variant. Join fellow verified car buyers in your metro city. 100% free to join with zero lock-in fee or advance deposit.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Zero brokerage fee policy</span>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 text-white font-mono font-black flex items-center justify-center text-sm shadow-card">
                    04
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Fleet Delivery
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-950">
                  Dealers Bid & Drive
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When group capacity is reached, authorized OEM dealerships compete on DealerOS to submit reverse quotations. Accept the winning offer and take delivery at the showroom.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Direct authorized showroom billing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. THE GROUPDRIVE ADVANTAGE (Institutional Leverage vs Traditional Haggling)
          ========================================================================= */}
      <section className="bg-white py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
            <Badge variant="brand" size="sm" className="mb-1.5">
              The GROUPDRIVE Advantage
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Why Choose GroupDrive Over Traditional Buying?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              We built GroupDrive to permanently remove the asymmetry, hidden markups, and exhausting haggling of the traditional car purchasing journey.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Collective Purchasing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Individual buyers lack negotiation power. By pooling verified retail demand, dealerships compete for bulk volume allocations.
              </p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                100% Authorized OEM
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct vehicle delivery, invoicing, and warranty registration from official manufacturer authorized dealerships only.
              </p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Zero Brokerage Fees
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No buyer commissions, no advance deposits, and no hidden charges. 100% transparent on-road price estimates from day one.
              </p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Unbiased Comparison
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compare multi-vehicle specs, fuel efficiency figures, NCAP safety scores, and real variant differences side-by-side.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FINAL CALL TO ACTION (The Uploaded Image Section)
          ========================================================================= */}
      <section className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-white text-slate-900 p-8 sm:p-12 border border-blue-200/80 shadow-cardHover relative overflow-hidden text-center sm:text-left">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-700 border border-blue-200">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Discover • Compare • Group • Negotiate • Drive</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
              Ready to Experience the Future of Car Buying?
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Join thousands of verified buyers commanding institutional discounts. 100% Free • No Brokerage • Direct OEM Showroom Billing
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Link href="/cars">
                <Button variant="default" size="lg" className="font-bold px-8 shadow-card">
                  Explore Vehicles & Groups →
                </Button>
              </Link>
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="font-bold px-7 bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:text-slate-950 shadow-xs"
                >
                  For Authorized Dealerships
                </Button>
              </a>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-5 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold">✓</span> 100% Free to Explore</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold">✓</span> No Advance Commitment</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold">✓</span> Direct Authorized Showroom Handover</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
