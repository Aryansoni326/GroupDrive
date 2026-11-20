"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  RotateCw,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Sparkles,
  Send,
  Eye,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  X,
  ChevronRight,
  Car,
  SlidersHorizontal,
  History,
  FileText,
  Check,
  Lock,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Tag,
  Fuel,
  CreditCard,
  Package,
} from "lucide-react";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  GroupOpportunity,
  DealerInterestSubmission,
  OpportunityHistoryLog,
  OpportunitySummaryStats,
  GroupStatus,
  DealerOfferStatus,
  SubmitDealerInterestPayload,
  UpdateNegotiationPayload,
} from "@groupdrive/types";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { TableSkeleton } from "../../../components/feedback/loading-skeleton";
import { EmptyState } from "../../../components/feedback/empty-state";
import { ErrorCard } from "../../../components/feedback/error-card";

export default function GroupPurchasingOpportunitiesPage() {
  const { currentBranch, dealer, branches, capabilities, user } = useAuth();

  // Data states
  const [opportunities, setOpportunities] = useState<GroupOpportunity[]>([]);
  const [summary, setSummary] = useState<OpportunitySummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("ALL");
  const [selectedVariant, setSelectedVariant] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedGroupStatus, setSelectedGroupStatus] = useState("ALL");
  const [selectedOfferStatus, setSelectedOfferStatus] = useState("ALL");

  // Modals state
  const [dossierOpportunity, setDossierOpportunity] = useState<GroupOpportunity | null>(null);
  const [interestModalOpportunity, setInterestModalOpportunity] = useState<GroupOpportunity | null>(null);
  const [negotiationOpportunity, setNegotiationOpportunity] = useState<GroupOpportunity | null>(null);
  const [historyOpportunity, setHistoryOpportunity] = useState<GroupOpportunity | null>(null);
  const [historyLogs, setHistoryLogs] = useState<OpportunityHistoryLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Interest Form state
  const [formBranchId, setFormBranchId] = useState("");
  const [formDeliveryDays, setFormDeliveryDays] = useState("14");
  const [formStockCommitment, setFormStockCommitment] = useState("5");
  const [formProposedBenefits, setFormProposedBenefits] = useState("");
  const [formTerms, setFormTerms] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Negotiation Form state
  const [negoStatus, setNegoStatus] = useState<DealerOfferStatus>("UNDER_NEGOTIATION");
  const [negoDeliveryDays, setNegoDeliveryDays] = useState("14");
  const [negoStockCommitment, setNegoStockCommitment] = useState("5");
  const [negoProposedBenefits, setNegoProposedBenefits] = useState("");
  const [negoTerms, setNegoTerms] = useState("");
  const [negoNotes, setNegoNotes] = useState("");
  const [isUpdatingNegotiation, setIsUpdatingNegotiation] = useState(false);
  const [negoError, setNegoError] = useState<string | null>(null);
  const [negoSuccess, setNegoSuccess] = useState<string | null>(null);

  // Authorization flags
  const isAuthorizedToNegotiate =
    capabilities.canSubmitQuotes ||
    user?.staff_role === "DEALER_OWNER" ||
    user?.staff_role === "BRANCH_MANAGER" ||
    user?.staff_role === "SALES_MANAGER";

  // Fetch opportunities and summary
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [oppsRes, summaryRes] = await Promise.all([
        dealerApi.getOpportunities({
          search: searchQuery || undefined,
          vehicle: selectedVehicle !== "ALL" ? selectedVehicle : undefined,
          variant: selectedVariant !== "ALL" ? selectedVariant : undefined,
          city: selectedCity !== "ALL" ? selectedCity : undefined,
          status: selectedGroupStatus !== "ALL" ? selectedGroupStatus : undefined,
          offer_status: selectedOfferStatus !== "ALL" ? selectedOfferStatus : undefined,
        }),
        dealerApi.getOpportunitySummary(),
      ]);

      setOpportunities(oppsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load group opportunities.";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    searchQuery,
    selectedVehicle,
    selectedVariant,
    selectedCity,
    selectedGroupStatus,
    selectedOfferStatus,
  ]);

  // Derived filter options
  const uniqueVehicles = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => set.add(o.model_name));
    return Array.from(set);
  }, [opportunities]);

  const uniqueVariants = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      o.requirements?.preferred_variants?.forEach((v) => set.add(v));
    });
    return Array.from(set);
  }, [opportunities]);

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => set.add(o.city));
    return Array.from(set);
  }, [opportunities]);

  // Open Submit Interest Modal
  const handleOpenInterestModal = (opp: GroupOpportunity) => {
    setInterestModalOpportunity(opp);
    setFormBranchId(currentBranch?.id || branches[0]?.id || "");
    setFormDeliveryDays(String(opp.target_delivery_window_days || 14));
    setFormStockCommitment(String(Math.min(5, opp.current_members_count || 1)));
    setFormProposedBenefits(
      "Priority allocation from dealership stockyard. Complimentary 3M Underbody treatment & OEM floor mat package."
    );
    setFormTerms("Deliveries scheduled within committed timeframe upon customer voucher issuance.");
    setFormNotes(`Allocated via showroom branch inventory.`);
    setFormError(null);
    setFormSuccess(null);
  };

  // Submit Interest Handler
  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestModalOpportunity) return;

    if (!isAuthorizedToNegotiate) {
      setFormError("Access Denied: Your staff role lacks authorization to submit dealer interest or negotiate.");
      return;
    }

    if (!formBranchId) {
      setFormError("Please select a target showroom branch.");
      return;
    }

    setIsSubmittingInterest(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload: SubmitDealerInterestPayload = {
        branch_id: formBranchId,
        estimated_delivery_days: parseInt(formDeliveryDays, 10) || 14,
        stock_allocation_commitment: parseInt(formStockCommitment, 10) || 1,
        proposed_benefits: formProposedBenefits.trim(),
        terms_and_conditions: formTerms.trim() || undefined,
        initial_response_notes: formNotes.trim() || undefined,
      };

      await dealerApi.submitDealerInterest(interestModalOpportunity.id, payload);
      setFormSuccess("Dealership interest recorded successfully. Cluster demand assigned.");
      await loadData(true);
      setTimeout(() => {
        setInterestModalOpportunity(null);
        setFormSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit dealer interest.";
      setFormError(msg);
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  // Open Negotiation Modal
  const handleOpenNegotiationModal = (opp: GroupOpportunity) => {
    setNegotiationOpportunity(opp);
    const existing = opp.my_interest;
    setNegoStatus(existing?.status || "UNDER_NEGOTIATION");
    setNegoDeliveryDays(String(existing?.estimated_delivery_days || opp.target_delivery_window_days || 14));
    setNegoStockCommitment(String(existing?.stock_allocation_commitment || 5));
    setNegoProposedBenefits(existing?.proposed_benefits || "");
    setNegoTerms(existing?.terms_and_conditions || "");
    setNegoNotes("");
    setNegoError(null);
    setNegoSuccess(null);
  };

  // Update Negotiation Handler
  const handleUpdateNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiationOpportunity) return;

    if (!isAuthorizedToNegotiate) {
      setNegoError("Access Denied: Your staff role lacks authorization to manage negotiations.");
      return;
    }

    setIsUpdatingNegotiation(true);
    setNegoError(null);
    setNegoSuccess(null);

    try {
      const payload: UpdateNegotiationPayload = {
        status: negoStatus,
        estimated_delivery_days: parseInt(negoDeliveryDays, 10) || 14,
        stock_allocation_commitment: parseInt(negoStockCommitment, 10) || 1,
        proposed_benefits: negoProposedBenefits.trim() || undefined,
        terms_and_conditions: negoTerms.trim() || undefined,
        negotiation_notes: negoNotes.trim() || undefined,
      };

      await dealerApi.updateOpportunityNegotiation(negotiationOpportunity.id, payload);
      setNegoSuccess("Negotiation terms updated and recorded in audit log.");
      await loadData(true);
      setTimeout(() => {
        setNegotiationOpportunity(null);
        setNegoSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update negotiation terms.";
      setNegoError(msg);
    } finally {
      setIsUpdatingNegotiation(false);
    }
  };

  // Withdraw Interest Handler
  const handleWithdrawInterest = async () => {
    if (!negotiationOpportunity) return;
    const confirmWithdraw = window.confirm(
      "Are you sure you want to withdraw your dealership's offer for this group opportunity? This action is recorded in the audit trail."
    );
    if (!confirmWithdraw) return;

    setIsUpdatingNegotiation(true);
    setNegoError(null);
    try {
      await dealerApi.withdrawDealerInterest(negotiationOpportunity.id, {
        reason: negoNotes.trim() || "Dealership capacity reallocated.",
      });
      setNegoSuccess("Dealership offer withdrawn successfully.");
      await loadData(true);
      setTimeout(() => {
        setNegotiationOpportunity(null);
        setNegoSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to withdraw offer.";
      setNegoError(msg);
    } finally {
      setIsUpdatingNegotiation(false);
    }
  };

  // Open History Drawer
  const handleOpenHistoryDrawer = async (opp: GroupOpportunity) => {
    setHistoryOpportunity(opp);
    setIsLoadingHistory(true);
    setHistoryLogs([]);
    try {
      const res = await dealerApi.getOpportunityHistory(opp.id);
      setHistoryLogs(res.data || []);
    } catch (err: unknown) {
      console.error("Failed to load history logs", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper for Group Status Badges
  const renderGroupStatusBadge = (status: GroupStatus) => {
    switch (status) {
      case "FORMING":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Forming Pool</Badge>;
      case "OPEN_FOR_QUOTES":
        return <Badge variant="default" className="bg-blue-600 text-white">Open for Offers</Badge>;
      case "QUOTATION_REVIEW":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Reviewing Offers</Badge>;
      case "LOCKED":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">Group Locked</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper for Dealership Offer Status Badges
  const renderOfferStatusBadge = (offerStatus?: DealerOfferStatus | null) => {
    switch (offerStatus) {
      case "INTEREST_EXPRESSED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-blue-500" />
            Interest Expressed
          </span>
        );
      case "PROPOSAL_SUBMITTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Send className="w-3 h-3 mr-1 text-purple-500" />
            Proposal Submitted
          </span>
        );
      case "UNDER_NEGOTIATION":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
            Under Negotiation
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3 mr-1 text-emerald-600" />
            Offer Accepted
          </span>
        );
      case "WITHDRAWN":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
            No Offer Submitted
          </span>
        );
    }
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedVehicle !== "ALL" ||
    selectedVariant !== "ALL" ||
    selectedCity !== "ALL" ||
    selectedGroupStatus !== "ALL" ||
    selectedOfferStatus !== "ALL";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedVehicle("ALL");
    setSelectedVariant("ALL");
    setSelectedCity("ALL");
    setSelectedGroupStatus("ALL");
    setSelectedOfferStatus("ALL");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Group Purchasing Opportunities</span>
            <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700 bg-blue-50">
              Collective Demand
            </Badge>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover pooled customer purchasing demand clusters and submit authorized dealership allocations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            {isAuthorizedToNegotiate ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Authorized to Submit & Negotiate</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Read-Only Discovery ({user?.staff_role || "Staff"})</span>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Demand</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {summary ? summary.total_opportunities : opportunities.length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Pooled car groups</p>
        </Card>

        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Open for Response</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {summary
              ? summary.open_for_response
              : opportunities.filter((o) => o.status === "OPEN_FOR_QUOTES" || o.status === "FORMING").length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Accepting quotes</p>
        </Card>

        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Threshold Met</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {summary
              ? summary.target_threshold_reached
              : opportunities.filter((o) => o.current_members_count >= o.min_members_threshold).length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Min buyers unlocked</p>
        </Card>

        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">My Responses</span>
            <Send className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-700">
            {summary
              ? summary.my_active_responses
              : opportunities.filter((o) => o.my_interest && o.my_interest.status !== "WITHDRAWN").length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Active dealer offers</p>
        </Card>

        <Card className="p-3 bg-white border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Negotiating</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700">
            {summary
              ? summary.proposals_under_negotiation
              : opportunities.filter(
                  (o) =>
                    o.my_interest &&
                    (o.my_interest.status === "UNDER_NEGOTIATION" ||
                      o.my_interest.status === "PROPOSAL_SUBMITTED")
                ).length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Active terms review</p>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-4">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search model, group code, city, RTO circle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Vehicle Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Models</option>
                {uniqueVehicles.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Variants</option>
                {uniqueVariants.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Locations</option>
                {uniqueCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Group Status Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedGroupStatus}
                onChange={(e) => setSelectedGroupStatus(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Group Statuses</option>
                <option value="FORMING">Forming</option>
                <option value="OPEN_FOR_QUOTES">Open for Quotes</option>
                <option value="QUOTATION_REVIEW">Quotation Review</option>
                <option value="LOCKED">Locked</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">My Offer Status:</span>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "NO_OFFER", "INTEREST_EXPRESSED", "UNDER_NEGOTIATION", "ACCEPTED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedOfferStatus(status)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedOfferStatus === status
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status === "ALL"
                      ? "All"
                      : status === "NO_OFFER"
                      ? "No Offer"
                      : status === "INTEREST_EXPRESSED"
                      ? "Expressed Interest"
                      : status === "UNDER_NEGOTIATION"
                      ? "Negotiating"
                      : "Accepted"}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                Clear all filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Card */}
      {error && <ErrorCard title="Error Loading Opportunities" message={error} onRetry={() => loadData()} />}

      {/* Opportunities List */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No Group Opportunities Found"
          description="There are currently no customer purchasing groups matching your search or filter criteria in this operational territory."
          actionLabel="Reset Filters"
          onAction={clearAllFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {opportunities.map((opp) => {
            const hasMyOffer = !!opp.my_interest && opp.my_interest.status !== "WITHDRAWN";
            const percentFilled = Math.min(100, Math.round((opp.current_members_count / opp.max_capacity) * 100));
            const isThresholdReached = opp.current_members_count >= opp.min_members_threshold;
            const remainingSlots = opp.remaining_slots ?? Math.max(0, opp.max_capacity - opp.current_members_count);

            return (
              <Card
                key={opp.id}
                className="overflow-hidden border-slate-200 hover:border-slate-300 transition-shadow hover:shadow-md bg-white"
              >
                <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  {/* Left Column: Vehicle & Location Details */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 flex items-center justify-center">
                      {opp.model_image_url ? (
                        <img
                          src={opp.model_image_url}
                          alt={opp.model_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-8 h-8 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {opp.group_code}
                        </span>
                        {renderGroupStatusBadge(opp.status)}
                        {renderOfferStatusBadge(opp.my_interest?.status)}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 truncate">
                        {opp.model_name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {opp.city}, {opp.rto_circle}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          Variants: {opp.requirements?.preferred_variants?.slice(0, 3).join(", ") || "Standard"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          Delivery Window:{" "}
                          <strong className="text-slate-900">
                            Within {opp.target_delivery_window_days} days
                          </strong>
                        </span>
                        {opp.quoting_deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            Quoting Deadline:{" "}
                            <strong className="text-slate-900">
                              {new Date(opp.quoting_deadline).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Participant Metrics & Progress */}
                  <div className="w-full lg:w-64 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2 flex-shrink-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        Verified Buyers:
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {opp.current_members_count} / {opp.max_capacity}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isThresholdReached ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Target: <strong>{opp.min_members_threshold}</strong> min
                      </span>
                      <span className={remainingSlots <= 2 ? "text-amber-700 font-semibold" : "text-slate-600"}>
                        {remainingSlots === 0 ? "Capacity Full" : `${remainingSlots} slots open`}
                      </span>
                    </div>

                    {isThresholdReached && (
                      <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Bulk volume threshold unlocked</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Interactive Actions */}
                  <div className="flex flex-row lg:flex-col items-center justify-end gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDossierOpportunity(opp)}
                      className="w-full text-xs flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Dossier</span>
                    </Button>

                    {hasMyOffer ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenNegotiationModal(opp)}
                        className="w-full text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Manage Offer</span>
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenInterestModal(opp)}
                        disabled={
                          !isAuthorizedToNegotiate ||
                          (opp.status !== "FORMING" && opp.status !== "OPEN_FOR_QUOTES")
                        }
                        className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5"
                      >
                        {isAuthorizedToNegotiate ? (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Interest</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Staff View Only</span>
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenHistoryDrawer(opp)}
                      className="w-full text-xs text-slate-500 hover:text-slate-800 h-7 flex items-center justify-center gap-1"
                    >
                      <History className="w-3 h-3" />
                      <span>Audit Trail</span>
                    </Button>
                  </div>
                </div>

                {/* Sub-bar showing my active response summary if present */}
                {hasMyOffer && opp.my_interest && (
                  <div className="bg-blue-50/60 border-t border-blue-100/80 px-5 py-2.5 flex flex-wrap items-center justify-between text-xs text-blue-900">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        Committed Stock: <strong>{opp.my_interest.stock_allocation_commitment} units</strong>
                      </span>
                      <span>
                        Delivery Promise: <strong>{opp.my_interest.estimated_delivery_days} days</strong>
                      </span>
                      <span>
                        Branch: <strong>{opp.my_interest.branch_name}</strong>
                      </span>
                    </div>
                    <span className="text-xs text-blue-700 truncate max-w-md">
                      Benefit: {opp.my_interest.proposed_benefits}
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Opportunity Dossier Modal */}
      {dossierOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {dossierOpportunity.group_code}
                  </span>
                  {renderGroupStatusBadge(dossierOpportunity.status)}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {dossierOpportunity.model_name}
                </h2>
              </div>
              <button
                onClick={() => setDossierOpportunity(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              {/* Top Summary Banner */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Cluster Location</p>
                  <p className="font-semibold text-slate-800 text-base">
                    {dossierOpportunity.city}, {dossierOpportunity.rto_circle}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Target Delivery SLA</p>
                  <p className="font-semibold text-slate-800 text-base">
                    Within {dossierOpportunity.target_delivery_window_days} days
                  </p>
                </div>
              </div>

              {/* Participant Statistics Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Verified Participant Demand
                </h4>
                <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <div>
                    <span className="text-xs text-slate-500">Live Members</span>
                    <p className="text-xl font-bold text-slate-900">
                      {dossierOpportunity.current_members_count}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Threshold Min</span>
                    <p className="text-xl font-bold text-blue-600">
                      {dossierOpportunity.min_members_threshold}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Remaining Slots</span>
                    <p className="text-xl font-bold text-emerald-600">
                      {dossierOpportunity.remaining_slots ??
                        Math.max(0, dossierOpportunity.max_capacity - dossierOpportunity.current_members_count)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comprehensive Group Requirements Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer Group Specifications & Requirements
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Delivery Timeline Preference
                    </span>
                    <p className="mt-1 font-semibold text-slate-800">
                      {dossierOpportunity.requirements?.delivery_timeline_preference || "Standard"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      Financing Preference Mix
                    </span>
                    <p className="mt-1 font-semibold text-slate-800">
                      {dossierOpportunity.requirements?.financing_mix || "Standard Loan"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                      Preferred Variants
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dossierOpportunity.requirements?.preferred_variants?.map((v) => (
                        <span key={v} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-600" />
                      Fuel & Transmissions
                    </span>
                    <p className="mt-1 font-semibold text-slate-800">
                      Fuel: {dossierOpportunity.requirements?.fuel_types?.join(", ")} | Transmissions:{" "}
                      {dossierOpportunity.requirements?.transmissions?.join(", ")}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 md:col-span-2">
                    <span className="font-medium text-slate-500 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-600" />
                      Desired Accessories & Protection
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {dossierOpportunity.requirements?.accessory_preferences?.map((acc) => (
                        <span key={acc} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-xs text-blue-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Privacy Protection Enforced:</span> Individual customer identities
                  and contact credentials are intentionally shielded. Verified customer vouchers with allocation
                  identifiers will be released upon group lock and allocation acceptance.
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <Button variant="outline" size="sm" onClick={() => setDossierOpportunity(null)}>
                Close
              </Button>
              {dossierOpportunity.my_interest ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const opp = dossierOpportunity;
                    setDossierOpportunity(null);
                    handleOpenNegotiationModal(opp);
                  }}
                  className="bg-slate-900 text-white"
                >
                  Manage Negotiation
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const opp = dossierOpportunity;
                    setDossierOpportunity(null);
                    handleOpenInterestModal(opp);
                  }}
                  disabled={!isAuthorizedToNegotiate}
                  className="bg-blue-600 text-white"
                >
                  Submit Dealership Interest
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Submit Dealer Interest Modal */}
      {interestModalOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Express Dealership Interest</h3>
                <p className="text-xs text-slate-500">
                  {interestModalOpportunity.group_code} - {interestModalOpportunity.model_name}
                </p>
              </div>
              <button
                onClick={() => setInterestModalOpportunity(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInterest} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Branch Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Allocating Showroom Branch *</label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Days & Stock Allocation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Estimated Delivery SLA (Days) *</label>
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={formDeliveryDays}
                    onChange={(e) => setFormDeliveryDays(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-400">Target: {interestModalOpportunity.target_delivery_window_days} days</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Committed Stock Units *</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formStockCommitment}
                    onChange={(e) => setFormStockCommitment(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-400">Group Members: {interestModalOpportunity.current_members_count}</p>
                </div>
              </div>

              {/* Proposed Dealership Benefits */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Proposed Dealership Benefits & Value Add *</label>
                <textarea
                  rows={3}
                  value={formProposedBenefits}
                  onChange={(e) => setFormProposedBenefits(e.target.value)}
                  placeholder="e.g. Priority dispatch from regional depot, complimentary 3M anti-rust underbody treatment, 3rd year extended warranty..."
                  className="w-full text-sm border border-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>

              {/* Commercial Terms & Conditions */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Dealership Commercial Terms</label>
                <textarea
                  rows={2}
                  value={formTerms}
                  onChange={(e) => setFormTerms(e.target.value)}
                  placeholder="e.g. Registration subject to RTO document clearance. Vehicle dispatch within 14 calendar days."
                  className="w-full text-sm border border-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Internal Response Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Internal Notes (Dealership Audit Only)</label>
                <Input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Stockyard reservation notes or internal team memo"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInterestModalOpportunity(null)}
                  disabled={isSubmittingInterest}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingInterest}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Confirm & Submit Interest
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Manage Negotiation Activity Modal */}
      {negotiationOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manage Negotiation Activity</h3>
                <p className="text-xs text-slate-500">
                  {negotiationOpportunity.group_code} - {negotiationOpportunity.model_name}
                </p>
              </div>
              <button
                onClick={() => setNegotiationOpportunity(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNegotiation} className="p-5 space-y-4">
              {negoError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{negoError}</span>
                </div>
              )}

              {negoSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{negoSuccess}</span>
                </div>
              )}

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Offer Status *</label>
                <select
                  value={negoStatus}
                  onChange={(e) => setNegoStatus(e.target.value as DealerOfferStatus)}
                  className="w-full text-sm border border-slate-200 rounded-md py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="INTEREST_EXPRESSED">Interest Expressed</option>
                  <option value="UNDER_NEGOTIATION">Under Negotiation</option>
                  <option value="PROPOSAL_SUBMITTED">Proposal Submitted</option>
                  <option value="ACCEPTED">Offer Accepted</option>
                </select>
              </div>

              {/* Delivery SLA & Stock Commitment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Revised Delivery SLA (Days)</label>
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={negoDeliveryDays}
                    onChange={(e) => setNegoDeliveryDays(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Committed Units</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={negoStockCommitment}
                    onChange={(e) => setNegoStockCommitment(e.target.value)}
                  />
                </div>
              </div>

              {/* Proposed Benefits */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Revised Proposed Benefits</label>
                <textarea
                  rows={3}
                  value={negoProposedBenefits}
                  onChange={(e) => setNegoProposedBenefits(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Commercial Terms */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Revised Commercial Terms</label>
                <textarea
                  rows={2}
                  value={negoTerms}
                  onChange={(e) => setNegoTerms(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Negotiation Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Negotiation Audit Remarks</label>
                <Input
                  type="text"
                  value={negoNotes}
                  onChange={(e) => setNegoNotes(e.target.value)}
                  placeholder="e.g. Revised turnaround to 12 days per cluster demand"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleWithdrawInterest}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Withdraw Offer
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNegotiationOpportunity(null)}
                    disabled={isUpdatingNegotiation}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isUpdatingNegotiation}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL 4: Opportunity Audit History */}
      {historyOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">Opportunity Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  {historyOpportunity.group_code} - {historyOpportunity.model_name}
                </p>
              </div>
              <button
                onClick={() => setHistoryOpportunity(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Dealership Scoped Trail:</strong> Only internal submissions and negotiation records from
                  your dealership are logged here. Competitor offers are strictly isolated.
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading audit log...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No previous audit actions recorded for this group.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{log.action}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{log.details}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span>Actor: {log.actor_name}</span>
                        <span>•</span>
                        <span className="font-mono">{log.actor_role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <Button variant="outline" size="sm" onClick={() => setHistoryOpportunity(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
