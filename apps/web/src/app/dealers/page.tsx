"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  Compass,
  ExternalLink,
  Car,
  Tag,
  Search,
  RotateCcw,
  Building2,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { customerApi } from "@groupdrive/api-client";
import { PublicDealerSummary } from "@groupdrive/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnquiryModal } from "@/components/enquiry-modal";

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
];

export default function DealersPage() {
  const [dealers, setDealers] = React.useState<PublicDealerSummary[]>([]);
  const [selectedCity, setSelectedCity] = React.useState("ALL");
  const [selectedBrand, setSelectedBrand] = React.useState("ALL");
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
    setLocationStatus("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Approximate city detection for Indian metros based on coordinates
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
        setLocationStatus(`Location detected: ${detectedCity}. Showing nearby authorized dealerships.`);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("Location permission was denied. You can select your city manually below.");
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
    setSearchQuery("");
    setAreaQuery("");
    setLocationStatus(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Top Banner / Hero */}
      <section className="bg-slate-950 text-white border-b border-slate-900 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" size="sm" className="gap-1.5 py-1 px-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Authorized OEM Network
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                Direct Showroom Delivery • Official Billing • Zero Intermediaries
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              Authorized Dealership Network
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
              Connect directly with verified OEM-franchised dealerships across your city. All vehicle allocations, competitive group-buying reverse bids, paperwork, registration, and final handovers are executed transparently through authorized dealer showrooms.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>KYC Verified Dealerships</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Synchronized Real-Time Stock</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Direct Dealer Invoicing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Search & Filter Controls Card */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-card space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Search Input */}
            <div className="relative md:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by dealer trade name, brand, or locality..."
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
                placeholder="Filter by area / locality (e.g. Whitefield, Andheri)..."
                value={areaQuery}
                onChange={(e) => setAreaQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            {/* Near Me Geolocation Button */}
            <div className="md:col-span-3 flex gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleNearMe}
                disabled={isLocating}
                className="h-11 flex-1 gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? "animate-pulse" : ""}`} />
                {isLocating ? "Locating..." : "Dealers Near Me"}
              </Button>

              {(searchQuery || areaQuery || selectedCity !== "ALL" || selectedBrand !== "ALL") && (
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

          {/* City & Brand Filter Pills */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            {/* City Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Metro Region:
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
                Manufacturer:
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
            </div>
          </div>
        </div>

        {/* Results Count & Status */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-800">{dealers.length}</strong> authorized dealerships
            {selectedCity !== "ALL" ? ` in ${selectedCity}` : ""}
            {selectedBrand !== "ALL" ? ` for ${selectedBrand}` : ""}
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
        ) : dealers.length === 0 ? (
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
            {dealers.map((dealer) => (
              <div
                key={dealer.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between space-y-6 hover:border-slate-300 hover:shadow-elevated transition-all"
              >
                <div className="space-y-4">
                  {/* Top Bar: Brand & Verified Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="brand" size="sm">
                          {dealer.oem_brand_franchise}
                        </Badge>
                        {dealer.is_verified && (
                          <Badge variant="success" size="sm" className="gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            KYC Verified Partner
                          </Badge>
                        )}
                        <span className="text-[11px] font-semibold text-slate-500">
                          {dealer.city}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 pt-1">
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
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dealer.description}
                  </p>

                  {/* Registered Office & Contact Strip */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2 text-xs">
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
                            className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs flex items-start justify-between gap-3 shadow-xs"
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
                              {b.authorized_rto_codes && b.authorized_rto_codes.length > 0 && (
                                <p className="text-[10px] text-slate-400">
                                  RTO Circles: {b.authorized_rto_codes.join(", ")}
                                </p>
                              )}
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

                  {/* Stock and Offers Quick Metrics */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Car className="w-3.5 h-3.5 text-blue-600" />
                        {dealer.available_inventory_count > 0
                          ? `${dealer.available_inventory_count} Vehicles Available`
                          : "Central Yard Stock"}
                      </span>
                      {dealer.active_offers_count > 0 && (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          {dealer.active_offers_count} Published Offer{dealer.active_offers_count > 1 ? "s" : ""}
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
                    <Button variant="ghost" size="sm" className="w-full text-xs gap-1 text-slate-600 hover:text-slate-900 border border-slate-200">
                      <Navigation className="w-3 h-3 text-slate-500" />
                      Directions ↗
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DealerOS Operating Partner Box */}
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 border border-slate-800 shadow-elevated flex flex-col md:flex-row items-center justify-between gap-6 mt-12">
          <div className="space-y-2 max-w-xl">
            <Badge variant="brand" size="sm">
              Dealership Operating System (DealerOS)
            </Badge>
            <h3 className="text-2xl font-black text-white">
              Are You an Authorized Dealership?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Join the GROUPDRIVE dealer network to access consolidated retail buyer demand, submit competitive reverse quotations, manage real-time yard inventory, and streamline customer allocations seamlessly.
            </p>
          </div>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="default" size="lg" className="font-bold px-8 shadow-card">
              Launch DealerOS Portal →
            </Button>
          </a>
        </div>
      </div>

      {/* Customer Enquiry / Quote Modal */}
      {contactDealer && (
        <EnquiryModal
          isOpen={!!contactDealer}
          onClose={() => setContactDealer(null)}
          brandName={contactDealer.brand}
          modelName="Authorized Showroom Range"
          dealershipName={contactDealer.trade_name}
          initialEnquiryType={contactDealer.type}
        />
      )}
    </div>
  );
}
