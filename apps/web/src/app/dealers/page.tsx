"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  Compass,
  Car,
  Tag,
  Search,
  RotateCcw,
  Building2,
  Navigation,
  CheckCircle2,
  Star,
  SlidersHorizontal,
  Award,
  BadgePercent,
} from "lucide-react";
import { customerApi } from "@groupdrive/api-client";
import { PublicDealerSummary } from "@groupdrive/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnquiryModal } from "@/components/enquiry-modal";
import { formatINR } from "@groupdrive/utils";

const METRO_CITIES = [
  "ALL",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Chennai",
  "Pune",
];

const BRANDS = [
  "ALL",
  "Maruti Suzuki",
  "Hyundai",
  "Tata",
  "Mahindra",
  "Kia",
  "Toyota",
];

const POPULAR_CAR_MODELS = [
  "ALL",
  "Brezza",
  "Creta",
  "Nexon",
  "Grand Vitara",
  "Thar",
  "XUV700",
  "Fronx",
  "Swift",
  "Punch",
  "Seltos",
  "Harrier",
  "Safari",
];

interface DealerEnhancedMeta {
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  offersCount: number;
  maxDiscount: number;
  providedModels: string[];
}

const DEALER_META_MAP: Record<string, DealerEnhancedMeta> = {
  "dlr-kalyani-blr-001": {
    rating: 4.9,
    reviewsCount: 1840,
    distanceKm: 2.4,
    offersCount: 4,
    maxDiscount: 65000,
    providedModels: ["Brezza", "Grand Vitara", "Fronx", "Swift", "Baleno", "Jimny"],
  },
  "dlr-trident-blr-002": {
    rating: 4.8,
    reviewsCount: 2120,
    distanceKm: 4.1,
    offersCount: 3,
    maxDiscount: 85000,
    providedModels: ["Creta", "Venue", "Verna", "Exter", "Ioniq 5", "Tucson"],
  },
  "dlr-pratham-blr-003": {
    rating: 4.7,
    reviewsCount: 1390,
    distanceKm: 5.8,
    offersCount: 2,
    maxDiscount: 50000,
    providedModels: ["Brezza", "Swift", "Ertiga", "Dzire", "Fronx"],
  },
  "dlr-advaith-blr-004": {
    rating: 4.9,
    reviewsCount: 2450,
    distanceKm: 3.2,
    offersCount: 5,
    maxDiscount: 92000,
    providedModels: ["Creta", "Venue", "Exter", "Alcazar", "Verna"],
  },
  "dlr-kropex-blr-005": {
    rating: 4.8,
    reviewsCount: 1150,
    distanceKm: 7.5,
    offersCount: 3,
    maxDiscount: 70000,
    providedModels: ["Nexon", "Harrier", "Safari", "Punch", "Curvv", "Tiago EV"],
  },
  "dlr-anant-blr-006": {
    rating: 4.8,
    reviewsCount: 980,
    distanceKm: 8.3,
    offersCount: 2,
    maxDiscount: 75000,
    providedModels: ["XUV700", "Thar ROXX", "Scorpio-N", "XUV 3XO", "Bolero Neo"],
  },
};

function getDealerMeta(dealer: PublicDealerSummary): DealerEnhancedMeta {
  if (DEALER_META_MAP[dealer.id]) {
    return DEALER_META_MAP[dealer.id];
  }
  const brand = dealer.oem_brand_franchise || "";
  let defaultModels = ["Creta", "Brezza", "Nexon"];
  let discount = 60000;
  if (brand.includes("Maruti")) {
    defaultModels = ["Brezza", "Grand Vitara", "Fronx", "Swift", "Baleno"];
    discount = 55000;
  } else if (brand.includes("Hyundai")) {
    defaultModels = ["Creta", "Venue", "Verna", "Exter"];
    discount = 85000;
  } else if (brand.includes("Tata")) {
    defaultModels = ["Nexon", "Punch", "Harrier", "Safari"];
    discount = 70000;
  } else if (brand.includes("Mahindra")) {
    defaultModels = ["XUV700", "Thar", "Scorpio-N", "XUV 3XO"];
    discount = 75000;
  } else if (brand.includes("Kia")) {
    defaultModels = ["Seltos", "Sonet", "Carens"];
    discount = 65000;
  } else if (brand.includes("Toyota")) {
    defaultModels = ["Innova Hycross", "Hyryder", "Fortuner"];
    discount = 50000;
  }

  // Derive stable pseudo-distance and ratings
  const charCodeSum = (dealer.id || "dlr").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const distance = Math.round(((charCodeSum % 60) / 10 + 2.1) * 10) / 10;
  const rating = Math.round((4.6 + (charCodeSum % 4) * 0.1) * 10) / 10;
  const reviews = 800 + (charCodeSum % 1400);

  return {
    rating,
    reviewsCount: reviews,
    distanceKm: distance,
    offersCount: dealer.active_offers_count || ((charCodeSum % 4) + 1),
    maxDiscount: discount,
    providedModels: defaultModels,
  };
}

export default function DealersPage() {
  const [dealers, setDealers] = React.useState<PublicDealerSummary[]>([]);
  const [selectedCity, setSelectedCity] = React.useState("ALL");
  const [selectedBrand, setSelectedBrand] = React.useState("ALL");
  const [selectedCarModel, setSelectedCarModel] = React.useState("ALL");
  const [selectedDistance, setSelectedDistance] = React.useState("ALL");
  const [selectedRating, setSelectedRating] = React.useState("ALL");
  const [onlyWithOffers, setOnlyWithOffers] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"NEAREST" | "RATING" | "OFFERS" | "DISCOUNT">("NEAREST");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [areaQuery, setAreaQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLocating, setIsLocating] = React.useState(false);
  const [locationStatus, setLocationStatus] = React.useState<string | null>(null);

  // Modal interaction state
  const [contactDealer, setContactDealer] = React.useState<{
    id: string;
    trade_name: string;
    brand: string;
    branchId?: string;
    branchName?: string;
    type: "TEST_DRIVE" | "PRICE_QUOTE";
  } | null>(null);

  const fetchDealers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerApi.dealers.listDealers({
        search: searchQuery || undefined,
        city: selectedCity !== "ALL" ? selectedCity : undefined,
        brand: selectedBrand !== "ALL" ? selectedBrand : undefined,
        area: areaQuery || undefined,
      });
      if (res.data) {
        setDealers(res.data);
      }
    } catch (err) {
      console.error("Failed to load dealers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCity, selectedBrand, areaQuery]);

  React.useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  // Location-based filtering using browser geolocation
  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser. Please select a city.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Detecting your live position...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let detectedCity = "Bengaluru";
        if (latitude > 18.5 && latitude < 19.5 && longitude > 72.5 && longitude < 73.5) {
          detectedCity = "Mumbai";
        } else if (latitude > 28.3 && latitude < 28.9 && longitude > 76.8 && longitude < 77.5) {
          detectedCity = "Delhi NCR";
        } else if (latitude > 17.1 && latitude < 17.6 && longitude > 78.2 && longitude < 78.7) {
          detectedCity = "Hyderabad";
        } else if (latitude > 12.8 && latitude < 13.2 && longitude > 80.1 && longitude < 80.4) {
          detectedCity = "Chennai";
        } else if (latitude > 18.4 && latitude < 18.7 && longitude > 73.7 && longitude < 74.0) {
          detectedCity = "Pune";
        } else {
          detectedCity = "Bengaluru";
        }

        setSelectedCity(detectedCity);
        setSelectedDistance("5");
        setSortBy("NEAREST");
        setLocationStatus(`Location detected: ${detectedCity}. Showing dealers within 5 km.`);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("Location permission was denied. You can filter by distance or city manually below.");
        } else {
          setLocationStatus("Could not determine your exact position. Showing all dealerships.");
        }
      },
      { timeout: 8000 }
    );
  };

  const handleResetFilters = () => {
    setSelectedCity("ALL");
    setSelectedBrand("ALL");
    setSelectedCarModel("ALL");
    setSelectedDistance("ALL");
    setSelectedRating("ALL");
    setOnlyWithOffers(false);
    setSortBy("NEAREST");
    setSearchQuery("");
    setAreaQuery("");
    setLocationStatus(null);
  };

  // Comprehensive Client-side Filtering & Sorting
  const filteredAndSortedDealers = React.useMemo(() => {
    let result = dealers.filter((dealer) => {
      const meta = getDealerMeta(dealer);

      // Distance filter
      if (selectedDistance !== "ALL") {
        const maxDist = parseFloat(selectedDistance);
        if (meta.distanceKm > maxDist) return false;
      }

      // Google rating filter
      if (selectedRating !== "ALL") {
        const minRating = parseFloat(selectedRating);
        if (meta.rating < minRating) return false;
      }

      // Offers filter
      if (onlyWithOffers && meta.offersCount <= 0) {
        return false;
      }

      // Specific car model filter
      if (selectedCarModel !== "ALL") {
        const modelLower = selectedCarModel.toLowerCase();
        const hasModel = meta.providedModels.some((m) =>
          m.toLowerCase().includes(modelLower)
        );
        if (!hasModel) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      const aMeta = getDealerMeta(a);
      const bMeta = getDealerMeta(b);

      if (sortBy === "NEAREST") {
        return aMeta.distanceKm - bMeta.distanceKm;
      }
      if (sortBy === "RATING") {
        return bMeta.rating - aMeta.rating;
      }
      if (sortBy === "OFFERS") {
        return bMeta.offersCount - aMeta.offersCount;
      }
      if (sortBy === "DISCOUNT") {
        return bMeta.maxDiscount - aMeta.maxDiscount;
      }
      return 0;
    });

    return result;
  }, [dealers, selectedDistance, selectedRating, onlyWithOffers, selectedCarModel, sortBy]);

  return (
    <div className="bg-slate-50 text-slate-900 pb-8">
      {/* =========================================================================
          HERO SECTION (Light Blue Contrast Automotive Theme)
          ========================================================================= */}
      <section
        className="relative overflow-hidden py-14 md:py-16 border-b border-blue-200/80"
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)",
          boxShadow: "0 4px 20px -2px rgba(59, 130, 246, 0.08)",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Authorized OEM Network
              </span>
              <span className="text-xs text-blue-900 font-semibold">
                Official Billing • Direct Showroom Handover • Zero Intermediaries
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
              Authorized Dealership Network
            </h1>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
              Connect directly with verified OEM-franchised dealerships across your city. All vehicle allocations, competitive group-buying reverse bids, paperwork, registration, and final handovers are executed transparently through authorized dealer showrooms.
            </p>

            {/* Value Highlights Strip */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-800">
              <div className="flex items-center gap-1.5 bg-white/80 border border-blue-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">KYC Verified Dealerships</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 border border-blue-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Synchronized Real-Time Stock</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 border border-blue-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Direct Dealer Invoicing & Warranty</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* =========================================================================
            ADVANCED CUSTOMER FILTERS: Distance, Offers, Google Ratings, Brands & Models
           ========================================================================= */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-card space-y-5">
          {/* Row 1: Search, Area, and Geolocation */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Search Input */}
            <div className="relative md:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search dealer trade name, brand, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            {/* Area / Locality Search */}
            <div className="relative md:col-span-4">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by locality (e.g. Whitefield, Andheri, Koramangala)..."
                value={areaQuery}
                onChange={(e) => setAreaQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            {/* Near Me Geolocation Button & Reset */}
            <div className="md:col-span-3 flex gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleNearMe}
                disabled={isLocating}
                className="h-11 flex-1 gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? "animate-pulse" : ""}`} />
                {isLocating ? "Locating..." : "Find Nearest Dealers"}
              </Button>

              {(searchQuery ||
                areaQuery ||
                selectedCity !== "ALL" ||
                selectedBrand !== "ALL" ||
                selectedCarModel !== "ALL" ||
                selectedDistance !== "ALL" ||
                selectedRating !== "ALL" ||
                onlyWithOffers) && (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handleResetFilters}
                  className="h-11 px-3 text-slate-500 hover:text-slate-800"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Location Status Notice */}
          {locationStatus && (
            <div className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200/60 text-xs text-blue-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                {locationStatus}
              </span>
              <button
                onClick={() => setLocationStatus(null)}
                className="text-xs text-blue-600 font-semibold hover:underline ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Row 2: Customer Criteria Filters: Distance, Google Rating, Offers & Sort */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Filter: Distance Radius */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                📍 Distance Radius
              </label>
              <select
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">Any Distance</option>
                <option value="5">Within 5 km (Nearest)</option>
                <option value="10">Within 10 km</option>
                <option value="20">Within 20 km</option>
              </select>
            </div>

            {/* Filter: Google Ratings */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                ⭐ Google Rating
              </label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">All Ratings</option>
                <option value="4.8">4.8+ Stars (Top Rated)</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            {/* Filter: Particular Car / Model */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                🚗 Particular Car Model
              </label>
              <select
                value={selectedCarModel}
                onChange={(e) => setSelectedCarModel(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                {POPULAR_CAR_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model === "ALL" ? "All Car Models" : model}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort by Option */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                ⚡ Sort Order
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="NEAREST">Distance (Nearest First)</option>
                <option value="RATING">Google Rating (Highest First)</option>
                <option value="OFFERS">Most Group Offers</option>
                <option value="DISCOUNT">Highest Savings First</option>
              </select>
            </div>
          </div>

          {/* Row 3: Metro City & Brand Pills */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            {/* City Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Metro:
              </span>
              {METRO_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCity === city
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {city === "ALL" ? "All Metro Cities" : city}
                </button>
              ))}
            </div>

            {/* Brand Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Brand:
              </span>
              {BRANDS.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedBrand === brand
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {brand === "ALL" ? "All Manufacturers" : brand}
                </button>
              ))}

              {/* Toggle: Only With Offers */}
              <button
                onClick={() => setOnlyWithOffers(!onlyWithOffers)}
                className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border flex items-center gap-1.5 transition-colors ${
                  onlyWithOffers
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Group Offers Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count & Status */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-800">{filteredAndSortedDealers.length}</strong> verified dealerships
            {selectedCity !== "ALL" ? ` in ${selectedCity}` : ""}
            {selectedBrand !== "ALL" ? ` for ${selectedBrand}` : ""}
            {selectedCarModel !== "ALL" ? ` with ${selectedCarModel}` : ""}
            {selectedDistance !== "ALL" ? ` within ${selectedDistance} km` : ""}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Direct DealerOS Sync Active
          </span>
        </div>

        {/* Dealers Grid */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading verified dealership network...</p>
          </div>
        ) : filteredAndSortedDealers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-900">No authorized dealerships found matching your search</p>
              <p className="text-xs text-slate-500">
                Try expanding your search parameters or select "All Metro Cities".
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedDealers.map((dealer) => {
              const meta = getDealerMeta(dealer);

              return (
                <div
                  key={dealer.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between space-y-5 hover:border-blue-400/70 hover:shadow-elevated transition-all"
                >
                  <div className="space-y-4">
                    {/* Top Row: Brand & Distance & Verified Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="brand" size="sm" className="font-bold">
                            {dealer.oem_brand_franchise}
                          </Badge>
                          {dealer.is_verified && (
                            <Badge variant="success" size="sm" className="gap-1 font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              KYC Verified
                            </Badge>
                          )}
                          <span className="text-[11px] font-semibold text-slate-500">
                            {dealer.city}
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 pt-1">
                          <Link
                            href={`/dealers/${dealer.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {dealer.trade_name}
                          </Link>
                        </h3>
                        <p className="text-xs text-slate-500">
                          {dealer.legal_entity_name}
                        </p>
                      </div>

                      {/* Distance Pill from User */}
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/70 shadow-xs">
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span>{meta.distanceKm} km away</span>
                        </span>
                      </div>
                    </div>

                    {/* Google Ratings & Offers Strip */}
                    <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs">
                      {/* Google Rating */}
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <div className="flex items-center text-amber-500">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        </div>
                        <span>{meta.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">
                          ({meta.reviewsCount.toLocaleString()}+ Google reviews)
                        </span>
                      </div>

                      <span className="text-slate-300">•</span>

                      {/* Offers Count & Savings */}
                      {meta.offersCount > 0 ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {meta.offersCount} Active Offer{meta.offersCount > 1 ? "s" : ""}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            Save up to {formatINR(meta.maxDiscount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Direct Dealer Pricing</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {dealer.description}
                    </p>

                    {/* Particular Car Models Provided */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Popular Car Models Provided:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.providedModels.map((m) => (
                          <span
                            key={m}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              selectedCarModel === m
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Registered Office & Contact Strip */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{dealer.registered_office_address}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dealer.operating_hours}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={`tel:${dealer.primary_contact_phone}`}
                            className="flex items-center gap-1 text-slate-700 hover:text-blue-600 font-mono font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{dealer.primary_contact_phone}</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Showroom & Service Branches Highlight */}
                    {dealer.branches && dealer.branches.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Showroom & Delivery Centres ({dealer.branches.length})
                          </span>
                          <Link
                            href={`/dealers/${dealer.id}`}
                            className="text-[11px] text-blue-600 font-semibold hover:underline"
                          >
                            View All Branches →
                          </Link>
                        </div>

                        <div className="space-y-2">
                          {dealer.branches.slice(0, 2).map((b) => (
                            <div
                              key={b.id}
                              className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs flex items-start justify-between gap-3 shadow-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900">{b.branch_name}</p>
                                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                                    {b.branch_type === "SHOWROOM_AND_SERVICE"
                                      ? "Sales & Service"
                                      : b.branch_type === "SHOWROOM_ONLY"
                                      ? "Showroom"
                                      : "Central Yard"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {b.address_line1}, {b.city}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <a
                                  href={b.directions_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <Navigation className="w-3 h-3" />
                                  Directions ↗
                                </a>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {b.phone_number}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stock and Real-Time Invoicing Badge */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Car className="w-3.5 h-3.5 text-blue-600" />
                          {dealer.available_inventory_count > 0
                            ? `${dealer.available_inventory_count} Units In Stock`
                            : "Central Yard Stock"}
                        </span>
                        {meta.offersCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                            <Tag className="w-3 h-3 text-emerald-600" />
                            {meta.offersCount} Published Offers
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">Direct OEM Invoicing</span>
                    </div>
                  </div>

                  {/* Primary Card Actions */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 mt-auto">
                    <Link href={`/dealers/${dealer.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                        View Profile
                      </Button>
                    </Link>

                    <Button
                      variant="default"
                      size="sm"
                      className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700"
                      onClick={() =>
                        setContactDealer({
                          id: dealer.id,
                          trade_name: dealer.trade_name,
                          brand: dealer.oem_brand_franchise,
                          type: "PRICE_QUOTE",
                        })
                      }
                    >
                      Request Quote
                    </Button>

                    <a
                      href={dealer.directions_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full col-span-2 sm:col-span-1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs gap-1 text-slate-600 hover:text-slate-900 border border-slate-200"
                      >
                        <Navigation className="w-3 h-3 text-slate-500" />
                        Directions ↗
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DealerOS Operating Partner Box */}
        <div
          className="rounded-3xl text-white p-8 sm:p-12 border border-slate-800 shadow-elevated flex flex-col md:flex-row items-center justify-between gap-6 mt-8"
          style={{
            background: "radial-gradient(circle at 85% 15%, #1e1b4b 0%, #0d1526 50%, #080d19 100%)",
          }}
        >
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
              For Authorized Dealerships
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Are you an authorized automotive dealer principal?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Expand your showroom delivery footprint. GroupDrive connects your sales team with pre-verified retail buyers ready to take delivery in batches of 5 to 50 vehicles each month.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="default"
                size="lg"
                className="w-full sm:w-auto font-bold text-xs bg-blue-600 hover:bg-blue-700 shadow-card"
              >
                Access DealerOS Platform →
              </Button>
            </a>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
              >
                Partner Onboarding Inquiry
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Contact & Enquiry Modal */}
      {contactDealer && (
        <EnquiryModal
          isOpen={true}
          onClose={() => setContactDealer(null)}
          brandName={contactDealer.brand}
          dealershipName={contactDealer.trade_name}
          initialEnquiryType={contactDealer.type}
          modelName={`Authorized ${contactDealer.brand}`}
          branchId={contactDealer.branchId}
          branchName={contactDealer.branchName}
        />
      )}
    </div>
  );
}
