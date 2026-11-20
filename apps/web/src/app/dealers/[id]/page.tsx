"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Car,
  Tag,
  Users,
  Navigation,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { customerApi } from "@groupdrive/api-client";
import { PublicDealerDetail } from "@groupdrive/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnquiryModal } from "@/components/enquiry-modal";

export default function DealerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const dealerId = (params?.id as string) || "";

  const [dealer, setDealer] = React.useState<PublicDealerDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"BRANCHES" | "INVENTORY" | "OFFERS" | "GROUPS">("BRANCHES");

  // Lead / Quote modal state
  const [enquiryModal, setEnquiryModal] = React.useState<{
    isOpen: boolean;
    type: "TEST_DRIVE" | "PRICE_QUOTE";
    modelName?: string;
    variantName?: string;
    branchId?: string;
    branchName?: string;
  }>({
    isOpen: false,
    type: "PRICE_QUOTE",
  });

  React.useEffect(() => {
    async function loadDealer() {
      if (!dealerId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await customerApi.dealers.getDealerDetails(dealerId);
        if (res.data) {
          setDealer(res.data);
        } else {
          setError("Dealership records could not be found.");
        }
      } catch (err: any) {
        console.error("Failed to load dealership profile:", err);
        setError(err.message || "Failed to load dealership profile.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDealer();
  }, [dealerId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading dealership profile...</p>
        </div>
      </div>
    );
  }

  if (error || !dealer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-card">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Dealership Not Found</h2>
            <p className="text-xs text-slate-500">
              The requested authorized dealership profile could not be located in our verified directory.
            </p>
          </div>
          <Link href="/dealers">
            <Button variant="default" size="sm" className="w-full">
              Back to Dealer Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Top Breadcrumb & Navigation */}
      <div className="bg-slate-900 text-slate-300 border-b border-slate-800 py-3.5">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between text-xs">
          <Link
            href="/dealers"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Authorized Dealerships</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">•</span>
            <span className="text-white font-medium truncate max-w-xs">{dealer.trade_name}</span>
          </div>
        </div>
      </div>

      {/* Hero / Dealership Showcase Header */}
      <section className="bg-slate-950 text-white border-b border-slate-900 py-10 md:py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="brand" size="default">
                  {dealer.oem_brand_franchise}
                </Badge>
                {dealer.is_verified && (
                  <Badge variant="success" size="default" className="gap-1.5 py-1 px-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    KYC Verified OEM Franchise
                  </Badge>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  {dealer.city} Metro
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {dealer.trade_name}
                </h1>
                <p className="text-sm text-slate-400">
                  {dealer.legal_entity_name}
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {dealer.description}
              </p>

              {/* Quick Contact & Details Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300">
                <a
                  href={`tel:${dealer.primary_contact_phone}`}
                  className="flex items-center gap-2 hover:text-blue-400 transition-colors font-mono"
                >
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{dealer.primary_contact_phone}</span>
                </a>

                <a
                  href={`mailto:${dealer.primary_contact_email}`}
                  className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{dealer.primary_contact_email}</span>
                </a>

                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{dealer.operating_hours}</span>
                </div>
              </div>
            </div>

            {/* Header Right Action Card */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-elevated">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Direct OEM Dealership Channel
                </span>
                <p className="text-sm text-slate-300">
                  All vehicle purchases are billed directly by this franchised dealer with official OEM warranty.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <Button
                  variant="default"
                  size="default"
                  className="w-full font-bold bg-blue-600 hover:bg-blue-700 shadow-md"
                  onClick={() =>
                    setEnquiryModal({
                      isOpen: true,
                      type: "PRICE_QUOTE",
                      modelName: "Authorized Dealership Portfolio",
                    })
                  }
                >
                  Request Official Quotation
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  className="w-full text-xs font-semibold text-white border-slate-700 hover:bg-slate-800"
                  onClick={() =>
                    setEnquiryModal({
                      isOpen: true,
                      type: "TEST_DRIVE",
                      modelName: "Showroom Test Drive Vehicle",
                    })
                  }
                >
                  Book Showroom Test Drive
                </Button>

                <a
                  href={dealer.directions_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400 hover:text-white gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    Get Directions to Main Office ↗
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Trust Guarantees Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">100% Direct Dealer Invoicing</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                No middleman or escrow accounts. Invoicing issued directly under authorized GSTIN.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Synchronized Yard Inventory</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time stock feeds powered by DealerOS for fast-track vehicle allocation.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Collective Group Bidding</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Participates in GROUPDRIVE collective reverse bidding for volume consumer savings.
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs Navigation */}
        <div className="border-b border-slate-200 flex items-center gap-6 overflow-x-auto text-sm font-semibold text-slate-500">
          <button
            onClick={() => setActiveTab("BRANCHES")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "BRANCHES"
                ? "border-blue-600 text-blue-600"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Showrooms & Delivery Centres ({dealer.branches_count})</span>
          </button>

          <button
            onClick={() => setActiveTab("INVENTORY")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "INVENTORY"
                ? "border-blue-600 text-blue-600"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Available Vehicles ({dealer.available_vehicles?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("OFFERS")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "OFFERS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Published Dealer Offers ({dealer.published_offers?.length || 0})</span>
          </button>

          {dealer.active_groups && dealer.active_groups.length > 0 && (
            <button
              onClick={() => setActiveTab("GROUPS")}
              className={`pb-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === "GROUPS"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Active Buyer Groups ({dealer.active_groups.length})</span>
            </button>
          )}
        </div>

        {/* Tab 1: Showroom & Service Branches */}
        {activeTab === "BRANCHES" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Authorized Showroom & Service Locations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visit any official branch for test drives, vehicle inspections, document verification, and showroom delivery.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dealer.branches.map((branch) => (
                <div
                  key={branch.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {branch.branch_type === "SHOWROOM_AND_SERVICE"
                              ? "Showroom & Service Facility"
                              : branch.branch_type === "SHOWROOM_ONLY"
                              ? "Retail Showroom"
                              : "Central Stockyard"}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5">
                          {branch.branch_name}
                        </h4>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {branch.address_line1}
                          {branch.address_line2 ? `, ${branch.address_line2}` : ""}, {branch.city}, {branch.state} - {branch.pin_code}
                        </span>
                      </div>

                      {branch.authorized_rto_codes && branch.authorized_rto_codes.length > 0 && (
                        <div className="flex items-center gap-2 text-slate-400 pl-5 text-[11px]">
                          <span>Authorized RTO Jurisdictions:</span>
                          <span className="font-mono text-slate-600 font-semibold">
                            {branch.authorized_rto_codes.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Operational Details */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{branch.operating_hours}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                        <a
                          href={`tel:${branch.phone_number}`}
                          className="flex items-center gap-1.5 text-slate-800 font-mono font-medium hover:text-blue-600"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{branch.phone_number}</span>
                        </a>
                        <a
                          href={`mailto:${branch.email}`}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          {branch.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Branch Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full text-xs font-semibold"
                      onClick={() =>
                        setEnquiryModal({
                          isOpen: true,
                          type: "TEST_DRIVE",
                          branchId: branch.id,
                          branchName: branch.branch_name,
                          modelName: "Showroom Range",
                        })
                      }
                    >
                      Book Visit / Test Drive
                    </Button>

                    <a
                      href={branch.directions_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        Directions ↗
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Available Vehicles Inventory */}
        {activeTab === "INVENTORY" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Available Vehicles in Showroom & Yard
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronized stock available for fast allocation and immediate delivery through {dealer.trade_name}.
                </p>
              </div>
            </div>

            {dealer.available_vehicles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Car className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  Central Yard Stock Currently Under Allocation
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  New carrier dispatches are arriving shortly. You can still request a custom price quote for any model in this dealer's franchise.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    setEnquiryModal({
                      isOpen: true,
                      type: "PRICE_QUOTE",
                      modelName: "OEM Portfolio",
                    })
                  }
                >
                  Request Portfolio Quote
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dealer.available_vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden flex flex-col justify-between hover:shadow-elevated transition-all"
                  >
                    <div>
                      {/* Vehicle Image */}
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={v.vehicle_image_url}
                          alt={v.model_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                            Ready for Delivery
                          </span>
                        </div>
                      </div>

                      {/* Vehicle Details */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            {v.model_name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {v.variant_name}
                          </p>
                        </div>

                        {/* Specs Strip */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {v.fuel_type}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {v.transmission_type}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {v.colour_name}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-xs text-slate-500">Ex-Showroom Price</span>
                          <span className="text-base font-black text-slate-900 font-mono">
                            ₹{v.ex_showroom_price.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400">
                          Allocated at: {v.branch_name}
                        </p>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-5 pt-0 grid grid-cols-2 gap-2 mt-auto">
                      <Link href={`/cars/${v.model_id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                          View Model
                        </Button>
                      </Link>

                      <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700"
                        onClick={() =>
                          setEnquiryModal({
                            isOpen: true,
                            type: "PRICE_QUOTE",
                            modelName: v.model_name,
                            variantName: v.variant_name,
                          })
                        }
                      >
                        Get Quote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Published Dealer Offers */}
        {activeTab === "OFFERS" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Published Showroom Campaigns & Offers
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official dealer promotions and incentive packages available for retail delivery through {dealer.trade_name}.
                </p>
              </div>
            </div>

            {dealer.published_offers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Tag className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  No Active Public Campaigns at this Moment
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Standard manufacturer benefits and competitive dealer discounts apply. Request an official quote to receive tailored commercial terms.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    setEnquiryModal({
                      isOpen: true,
                      type: "PRICE_QUOTE",
                      modelName: "Promotional Enquiries",
                    })
                  }
                >
                  Request Best Price Quote
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dealer.published_offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between space-y-4 hover:border-blue-200 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="brand" size="sm">
                          {offer.campaign_type.replace(/_/g, " ")}
                        </Badge>
                        {offer.valid_until && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Valid till: {new Date(offer.valid_until).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </div>

                      <h4 className="text-lg font-bold text-slate-900">
                        {offer.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {offer.description}
                      </p>

                      {/* Offer Highlights Grid */}
                      <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs space-y-2">
                        {offer.discount_amount > 0 && (
                          <div className="flex items-center justify-between text-blue-950 font-medium">
                            <span>Upfront Cash Benefit</span>
                            <span className="font-bold font-mono text-sm text-blue-700">
                              ₹{offer.discount_amount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}

                        {offer.free_accessories_description && (
                          <div className="text-[11px] text-slate-600 pt-1 border-t border-blue-100">
                            <strong>Complimentary Pack:</strong> {offer.free_accessories_description}
                          </div>
                        )}

                        {offer.exchange_bonus_amount && (
                          <div className="text-[11px] text-slate-600">
                            <strong>Exchange Bonus:</strong> Up to ₹{offer.exchange_bonus_amount.toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>

                      {offer.terms_and_conditions && (
                        <p className="text-[10px] text-slate-400 leading-tight">
                          * Terms: {offer.terms_and_conditions}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700"
                        onClick={() =>
                          setEnquiryModal({
                            isOpen: true,
                            type: "PRICE_QUOTE",
                            modelName: offer.eligible_models[0] || "Campaign Vehicle",
                          })
                        }
                      >
                        Claim This Dealership Offer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Active Regional Buyer Groups */}
        {activeTab === "GROUPS" && dealer.active_groups && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Participating Collective Buyer Groups
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Join active customer demand groups in your region to unlock reverse institutional bidding from {dealer.trade_name}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealer.active_groups.map((grp) => (
                <div
                  key={grp.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {grp.group_code}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {grp.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {grp.model_name}
                    </h4>

                    <p className="text-xs text-slate-500">
                      Eligible Purchasing City: <strong className="text-slate-800">{grp.city}</strong>
                    </p>

                    {/* Progress */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Participants Joined</span>
                        <span className="font-bold text-slate-800">{grp.current_members_count} / {grp.max_capacity}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, (grp.current_members_count / grp.max_capacity) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Link href={`/groups/${grp.id}`} className="w-full block pt-2">
                    <Button variant="default" size="sm" className="w-full text-xs font-bold">
                      View Group Opportunity →
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Enquiry / Quote Modal */}
      {enquiryModal.isOpen && (
        <EnquiryModal
          isOpen={enquiryModal.isOpen}
          onClose={() => setEnquiryModal({ isOpen: false, type: "PRICE_QUOTE" })}
          brandName={dealer.oem_brand_franchise}
          modelName={enquiryModal.modelName || "Showroom Portfolio"}
          variantName={enquiryModal.variantName}
          dealershipName={dealer.trade_name}
          branchId={enquiryModal.branchId}
          branchName={enquiryModal.branchName}
          initialEnquiryType={enquiryModal.type}
        />
      )}
    </div>
  );
}
