"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { customerApi } from "@groupdrive/api-client";
import {
  PublicBuyerGroupDetail,
  PublicDealerOffer,
  GroupActivityEvent,
} from "@groupdrive/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatINR, formatDate } from "@groupdrive/utils";
import { JoinGroupModal } from "@/components/join-group-modal";
import { EnquiryModal } from "@/components/enquiry-modal";
import { useCustomerAuth } from "@/lib/auth-context";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { user, isAuthenticated } = useCustomerAuth();

  const [group, setGroup] = React.useState<PublicBuyerGroupDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isJoinOpen, setIsJoinOpen] = React.useState(false);
  const [isWithdrawing, setIsWithdrawing] = React.useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = React.useState(false);

  // Enquiry modal state
  const [enquiryDealer, setEnquiryDealer] = React.useState<{
    brand: string;
    model: string;
    dealerName?: string;
  } | null>(null);

  const loadGroup = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerApi.groups.getGroupDetails(groupId);
      if (res.data) setGroup(res.data);
    } catch (err) {
      console.error("Failed to load group details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  React.useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  // Handle customer withdrawal from group
  const handleWithdraw = async () => {
    if (!window.confirm("Are you sure you want to withdraw from this buyer group? You can rejoin anytime.")) {
      return;
    }
    setIsWithdrawing(true);
    try {
      const res = await customerApi.groups.leaveGroup(groupId);
      if (res.success) {
        setWithdrawSuccess(true);
        loadGroup();
        setTimeout(() => setWithdrawSuccess(false), 3500);
      }
    } catch (err: any) {
      alert(err.message || "Could not withdraw from group.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-28 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-800">
          Loading Group Buying Opportunity...
        </p>
        <p className="text-xs text-slate-400">
          Connecting to authorized dealership network
        </p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-2xl mx-auto font-bold">
          404
        </div>
        <h2 className="text-xl font-bold text-slate-900">Buyer Group Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested collective opportunity does not exist or has concluded.
        </p>
        <Link href="/groups">
          <Button variant="default" size="sm" className="font-bold">
            Back to All Buyer Groups
          </Button>
        </Link>
      </div>
    );
  }

  const maxCap = group.max_capacity || 10;
  const minThresh = group.min_members_threshold || 5;
  const currentCount = group.current_members_count || 0;
  const remainingSlots = Math.max(0, maxCap - currentCount);
  const percentFilled = Math.min(100, Math.round((currentCount / maxCap) * 100));
  const isThresholdMet = currentCount >= minThresh;
  const groupTitle = `${group.brand_name} ${group.model_name} ${group.city} Cluster`;
  const savings = group.estimated_savings_inr || 45000;
  const imageUrl =
    group.model_image_url ||
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80";

  // Check if current customer has joined
  const userParticipation = group.user_participation;
  const hasJoined = Boolean(userParticipation?.has_joined);

  // Dealer offers & activity timeline
  const dealerOffers: PublicDealerOffer[] = group.dealer_offers || [];
  const activityTimeline: GroupActivityEvent[] = group.activity_timeline || [];

  // Determine active stage index (0 to 4)
  let activeStageIndex = 0;
  if (group.status === "COMPLETED") activeStageIndex = 4;
  else if (group.status === "LOCKED") activeStageIndex = 3;
  else if (group.status === "QUOTATION_REVIEW") activeStageIndex = 2;
  else if (group.status === "OPEN_FOR_QUOTES" || isThresholdMet) activeStageIndex = 1;
  else activeStageIndex = 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* =========================================================================
          TOP BREADCRUMB & VERIFIED NETWORK HEADER
          ========================================================================= */}
      <div className="bg-white border-b border-slate-200/80 py-3">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/groups" className="hover:text-slate-900 transition-colors">
              Buyer Groups
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">{group.group_code}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success" size="sm" pulseDot>
              100% Authorized OEM Network
            </Badge>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">
              Fulfillment Exclusively via Factory Showrooms
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8 max-w-5xl">
        {/* =========================================================================
          HERO STAGE: VEHICLE IMAGERY, CITY CLUSTER & STATUS BADGES
          ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-slate-950 overflow-hidden">
            <img
              src={imageUrl}
              alt={groupTitle}
              className="w-full h-full object-cover opacity-80"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Top Bar on Hero */}
            <div className="absolute top-4 inset-x-4 sm:inset-x-6 flex items-center justify-between z-10">
              <Badge
                variant="secondary"
                size="sm"
                className="bg-slate-950/80 text-white backdrop-blur-md border-slate-700"
              >
                {group.city} Metro Cluster • {group.rto_circle}
              </Badge>
              {group.status === "OPEN_FOR_QUOTES" ? (
                <Badge variant="brand" size="sm" pulseDot>
                  Authorized Dealers Bidding Now
                </Badge>
              ) : group.status === "QUOTATION_REVIEW" ? (
                <Badge variant="success" size="sm">
                  Dealers Submitted Proposals
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" pulseDot>
                  Forming Cluster ({remainingSlots} spots left)
                </Badge>
              )}
            </div>

            {/* Title & Model Info */}
            <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 text-white space-y-1 z-10">
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">
                  {group.brand_name}
                </Badge>
                <Link
                  href={`/cars/${group.model_id}`}
                  className="text-xs text-blue-300 hover:text-white underline font-semibold"
                >
                  View Vehicle Catalogue Specs →
                </Link>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                {groupTitle}
              </h1>
              <p className="text-xs text-slate-300">
                Group Code: <span className="font-mono font-bold text-white">{group.group_code}</span>
              </p>
            </div>
          </div>

          {/* Group Metrics Grid */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Savings */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Target Group Savings
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                  Save {formatINR(savings)}
                </p>
                <span className="text-[10px] text-emerald-600 block">
                  Deducted directly on showroom invoice
                </span>
              </div>

              {/* Membership Capacity */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Cluster Quota
                </span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {currentCount} / {maxCap} Buyers
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Min {minThresh} required to trigger bidding
                </span>
              </div>

              {/* Regional Jurisdiction */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Purchasing Jurisdiction
                </span>
                <p className="text-base font-black text-slate-900 line-clamp-1">
                  {group.city}
                </p>
                <span className="text-[10px] text-slate-500 block truncate">
                  RTO: {group.rto_circle}
                </span>
              </div>

              {/* Bidding Deadline */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Dealer Bidding Window
                </span>
                <p className="text-base font-black text-slate-900">
                  {group.quoting_deadline
                    ? formatDate(group.quoting_deadline)
                    : "Open Window"}
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Target Handover: ~{group.target_delivery_window_days} Days
                </span>
              </div>
            </div>

            {/* Progress Bar & Quota Status */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  <span>Cluster Demand Progress ({currentCount} of {maxCap} Buyers)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {percentFilled}% Filled ({remainingSlots} Spots Remaining)
                </span>
              </div>
              <Progress
                value={percentFilled}
                threshold={Math.round((minThresh / maxCap) * 100)}
                variant={isThresholdMet ? "emerald" : "brand"}
              />
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>
                  {isThresholdMet
                    ? "✓ Minimum quota achieved! Reverse dealer auction is live."
                    : `${minThresh - currentCount} more buyers needed to trigger dealer reverse auction.`}
                </span>
                <span>Maximum Capacity: {maxCap} Buyers</span>
              </div>
            </div>

            {/* ===================================================================
                CUSTOMER PARTICIPATION STATUS CARD OR JOIN ACTION
                =================================================================== */}
            <div className="pt-4 border-t border-slate-100">
              {withdrawSuccess && (
                <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
                  You have successfully withdrawn from this group. You can rejoin anytime.
                </div>
              )}

              {hasJoined ? (
                /* Customer has already joined this group */
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                        Active Membership Confirmed
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      You are participating in this {group.city} buyer cluster
                    </p>
                    <p className="text-xs text-slate-600">
                      Preferred Variant:{" "}
                      <span className="font-semibold text-slate-800">
                        {userParticipation?.preferred_variant || "Selected in consultation"}
                      </span>
                      {userParticipation?.preferred_colour && (
                        <span> • Colour: {userParticipation.preferred_colour}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link href="/my-groups">
                      <Button variant="default" size="sm" className="font-bold">
                        My Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWithdraw}
                      isLoading={isWithdrawing}
                      className="text-xs text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              ) : (
                /* Customer has not joined yet */
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-600 space-y-0.5 text-center sm:text-left">
                    <p className="font-bold text-slate-900">
                      100% Free & Risk-Free Collective Participation
                    </p>
                    <p className="text-slate-500">
                      Zero advance payment required. Review competitive dealer bids before deciding to proceed.
                    </p>
                  </div>

                  <Button
                    variant="success"
                    size="lg"
                    className="w-full sm:w-auto font-black px-8 shadow-card text-xs uppercase tracking-wider"
                    onClick={() => setIsJoinOpen(true)}
                  >
                    Join This Group (Save {formatINR(savings)})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            5-STAGE INTERACTIVE PROGRESS ROADMAP
            ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <Badge variant="brand" size="sm">
              Collective Lifecycle
            </Badge>
            <h3 className="text-lg font-black text-slate-900">
              Group Buying Roadmap & Progress Visualization
            </h3>
            <p className="text-xs text-slate-500">
              Track the exact progression from demand clustering to dealer bidding, quote lock-in, and showroom delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            {/* Step 1: Cluster Formation */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStageIndex === 0
                  ? "border-blue-500 bg-blue-50/70 shadow-sm"
                  : activeStageIndex > 0
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black font-mono text-xs text-slate-700">Stage 1</span>
                <Badge
                  variant={activeStageIndex > 0 ? "success" : activeStageIndex === 0 ? "brand" : "secondary"}
                  size="sm"
                >
                  {activeStageIndex > 0 ? "Achieved" : "Active"}
                </Badge>
              </div>
              <h4 className="font-bold text-slate-900">Cluster Formation</h4>
              <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">
                Interested local buyers cluster together. Reaching {minThresh} members triggers dealer reverse bidding.
              </p>
            </div>

            {/* Step 2: Reverse Auction */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStageIndex === 1
                  ? "border-blue-500 bg-blue-50/70 shadow-sm"
                  : activeStageIndex > 1
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black font-mono text-xs text-slate-700">Stage 2</span>
                <Badge
                  variant={activeStageIndex > 1 ? "success" : activeStageIndex === 1 ? "brand" : "secondary"}
                  size="sm"
                >
                  {activeStageIndex > 1 ? "Completed" : activeStageIndex === 1 ? "Bidding Live" : "Pending"}
                </Badge>
              </div>
              <h4 className="font-bold text-slate-900">Reverse Auction</h4>
              <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">
                Authorized OEM dealers in {group.city} submit competitive pricing bids and delivery allotments via DealerOS.
              </p>
            </div>

            {/* Step 3: Quotation Review */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStageIndex === 2
                  ? "border-blue-500 bg-blue-50/70 shadow-sm"
                  : activeStageIndex > 2
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black font-mono text-xs text-slate-700">Stage 3</span>
                <Badge
                  variant={activeStageIndex > 2 ? "success" : activeStageIndex === 2 ? "brand" : "secondary"}
                  size="sm"
                >
                  {activeStageIndex > 2 ? "Completed" : activeStageIndex === 2 ? "Reviewing" : "Upcoming"}
                </Badge>
              </div>
              <h4 className="font-bold text-slate-900">Quotation Review</h4>
              <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">
                Group buyers review itemized dealer discounts, delivery schedules, and accessory bundles.
              </p>
            </div>

            {/* Step 4: Allocation Lock */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStageIndex === 3
                  ? "border-blue-500 bg-blue-50/70 shadow-sm"
                  : activeStageIndex > 3
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black font-mono text-xs text-slate-700">Stage 4</span>
                <Badge
                  variant={activeStageIndex > 3 ? "success" : activeStageIndex === 3 ? "brand" : "secondary"}
                  size="sm"
                >
                  {activeStageIndex > 3 ? "Completed" : activeStageIndex === 3 ? "Locking" : "Upcoming"}
                </Badge>
              </div>
              <h4 className="font-bold text-slate-900">Allocation Lock</h4>
              <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">
                Winning dealership is awarded the batch. Ready stockyard inventory or factory slots are committed.
              </p>
            </div>

            {/* Step 5: Showroom Delivery */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStageIndex === 4
                  ? "border-emerald-500 bg-emerald-50/80 shadow-sm"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black font-mono text-xs text-slate-700">Stage 5</span>
                <Badge variant={activeStageIndex === 4 ? "success" : "secondary"} size="sm">
                  {activeStageIndex === 4 ? "Fulfilled" : "Final Step"}
                </Badge>
              </div>
              <h4 className="font-bold text-slate-900">Showroom Delivery</h4>
              <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">
                Members complete registration and take direct vehicle delivery at the franchised dealership showroom.
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DEALER OFFER INFORMATION & REVERSE BIDDING STATUS
            ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">
                  DealerOS Marketplace Bids
                </Badge>
                <span className="text-xs text-slate-500 font-semibold">
                  {dealerOffers.length > 0
                    ? `${dealerOffers.length} Dealership Proposals Received`
                    : "Awaiting Threshold Trigger"}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Authorized Participating Dealership Offers
              </h3>
              <p className="text-xs text-slate-500">
                Real competitive proposals submitted by franchised OEM showrooms for this verified buyer cluster.
              </p>
            </div>
          </div>

          {dealerOffers.length === 0 ? (
            /* No offers submitted yet */
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-xl text-slate-400 mx-auto font-bold">
                ⏳
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Dealer Bidding Activates Once Minimum Threshold is Met
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Currently {currentCount} of {minThresh} required buyers have clustered in {group.city}. Once {minThresh - currentCount} more buyers join, authorized regional dealerships receive priority alerts to submit binding group quotations.
              </p>
              {!hasJoined && (
                <Button
                  variant="default"
                  size="sm"
                  className="font-bold"
                  onClick={() => setIsJoinOpen(true)}
                >
                  Join to Help Reach Quota
                </Button>
              )}
            </div>
          ) : (
            /* Active dealer proposals */
            <div className="space-y-4">
              {dealerOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="sm" pulseDot>
                          {offer.offer_type === "BINDING_QUOTATION"
                            ? "Confirmed Binding Quotation"
                            : "Dealership Commercial Interest"}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          Timeline: {offer.delivery_timeline_days || offer.estimated_delivery_days || 14} Days Handover
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900">
                        {offer.dealer_name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Showroom Branch: {offer.branch_name}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-right sm:text-right shrink-0">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Offered Group Discount
                      </span>
                      <span className="text-lg font-black text-emerald-700 font-mono">
                        {formatINR(offer.total_discounts_inr || savings)}
                      </span>
                    </div>
                  </div>

                  {/* Proposed Benefits & Terms */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                      Dealership Committed Package & Benefits
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {offer.proposed_benefits}
                    </p>
                    {offer.terms_and_conditions && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        Terms: {offer.terms_and_conditions}
                      </p>
                    )}
                  </div>

                  {/* Dealership Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-slate-400">
                      Showroom Handover: Official OEM Invoicing & Direct Handover
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold"
                        onClick={() =>
                          setEnquiryDealer({
                            brand: group.brand_name,
                            model: group.model_name,
                            dealerName: offer.dealer_name,
                          })
                        }
                      >
                        Book Test Drive at Showroom
                      </Button>
                      {!hasJoined && (
                        <Button
                          variant="success"
                          size="sm"
                          className="font-bold text-xs"
                          onClick={() => setIsJoinOpen(true)}
                        >
                          Join Group for this Offer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            GROUP ACTIVITY TIMELINE & STATUS UPDATES
            ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <Badge variant="brand" size="sm">
              Live Audit Trail
            </Badge>
            <h3 className="text-lg font-black text-slate-900">
              Group Activity & Status Updates
            </h3>
            <p className="text-xs text-slate-500">
              Verifiable event timeline tracking group milestones and authorized dealer interactions.
            </p>
          </div>

          <div className="space-y-4">
            {activityTimeline.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-3.5 text-xs">
                <div className="mt-0.5 flex flex-col items-center">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      item.type === "DEALER_OFFER"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.type === "MILESTONE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.type === "DEALER_OFFER" ? "₹" : item.type === "MILESTONE" ? "★" : "•"}
                  </span>
                  {idx < activityTimeline.length - 1 && (
                    <div className="w-0.5 h-10 bg-slate-200 my-1" />
                  )}
                </div>

                <div className="flex-1 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            COLLECTIVE REQUIREMENTS & PREFERENCES
            ========================================================================= */}
        {group.requirements && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <Badge variant="brand" size="sm">
                Aggregated Parameters
              </Badge>
              <h3 className="text-lg font-black text-slate-900">
                Collective Buyer Preferences & Specifications
              </h3>
              <p className="text-xs text-slate-500">
                Summary of collective configurations submitted by cluster members to participating dealerships.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Preferred Variants
                </span>
                <p className="font-bold text-slate-900">
                  {group.requirements.preferred_variants?.join(", ") || "All Variants"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Preferred Colours
                </span>
                <p className="font-bold text-slate-900">
                  {group.requirements.preferred_colours?.join(", ") || "Flexible Colours"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Delivery Timeline
                </span>
                <p className="font-bold text-slate-900">
                  {group.requirements.delivery_timeline_preference || "Within 30 Days"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Fuel & Transmission
                </span>
                <p className="font-bold text-slate-900">
                  {group.requirements.fuel_types?.join(", ")} •{" "}
                  {group.requirements.transmissions?.join(", ")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Financing Preference
                </span>
                <p className="font-bold text-slate-900">
                  {group.requirements.financing_mix || "Bank Auto Loan"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Delivery Showrooms
                </span>
                <p className="font-bold text-slate-900">
                  {group.requirements.delivery_location || `${group.city} Authorized Network`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Regulatory Protection Disclaimer */}
        <div className="p-5 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">
            Automotive Marketplace Disclaimer
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Joining a GROUPDRIVE buyer group is completely free and creates zero advance financial obligation. Estimated savings represent targeted collective negotiation goals. Final quotes, vehicle chassis allocation, and formal purchase agreements are executed exclusively with the authorized franchised dealer following quote review.
          </p>
        </div>
      </div>

      {/* Join Group Modal */}
      {isJoinOpen && (
        <JoinGroupModal
          isOpen={isJoinOpen}
          onClose={() => setIsJoinOpen(false)}
          group={group}
          onSuccess={() => {
            loadGroup();
          }}
        />
      )}

      {/* Showroom Test Drive / Enquiry Modal */}
      {enquiryDealer && (
        <EnquiryModal
          isOpen={!!enquiryDealer}
          onClose={() => setEnquiryDealer(null)}
          brandName={enquiryDealer.brand}
          modelName={enquiryDealer.model}
          initialEnquiryType="TEST_DRIVE"
        />
      )}
    </div>
  );
}
