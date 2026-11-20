"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Tag,
  Plus,
  Search,
  Filter,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lock,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  Users,
  Car,
  Package,
  ShieldCheck,
  Percent,
  Flame,
  ArrowRight,
  Eye,
  Edit3,
  Power,
  History,
  X,
  ChevronRight,
  Check,
  Copy,
  Info,
  Layers,
  FileText,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  DealerCampaign,
  CampaignType,
  CampaignStatus,
  CampaignOrigin,
  CampaignSummaryStats,
  CampaignHistoryLog,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  DealerBranch,
  CatalogueModel,
} from "@groupdrive/types";
import { formatINR, formatDate } from "@groupdrive/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, { label: string; icon: React.ElementType; color: string }> = {
  CASH_DISCOUNT: { label: "Cash Discount", icon: Tag, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  ACCESSORY_BUNDLE: { label: "Accessory Bundle", icon: Package, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  EXTENDED_WARRANTY: { label: "Extended Warranty", icon: ShieldCheck, color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  EXCHANGE_BONUS: { label: "Exchange Bonus", icon: RotateCw, color: "text-rose-700 bg-rose-50 border-rose-200" },
  LOW_INTEREST_FINANCE: { label: "Low Interest Finance", icon: Percent, color: "text-purple-700 bg-purple-50 border-purple-200" },
  VOLUME_TIER_DISCOUNT: { label: "Volume Tier Discount", icon: Users, color: "text-blue-700 bg-blue-50 border-blue-200" },
  AGING_STOCK_CLEARANCE: { label: "Stock Clearance", icon: Flame, color: "text-amber-700 bg-amber-50 border-amber-200" },
  ACCESSORY_BUNDLE_OFFER: { label: "Accessory Offer", icon: Package, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
};

export default function CampaignsPage() {
  const { user, branches: contextBranches } = useAuth();

  // Data states
  const [campaigns, setCampaigns] = useState<DealerCampaign[]>([]);
  const [summary, setSummary] = useState<CampaignSummaryStats | null>(null);
  const [branches, setBranches] = useState<DealerBranch[]>([]);
  const [catalogueModels, setCatalogueModels] = useState<CatalogueModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [originFilter, setOriginFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals & drawers
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<DealerCampaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<DealerCampaign | null>(null);
  const [historyModalCampaign, setHistoryModalCampaign] = useState<DealerCampaign | null>(null);
  const [historyLogs, setHistoryLogs] = useState<CampaignHistoryLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Form states
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formBranchId, setFormBranchId] = useState<string>("all");
  const [formCampaignType, setFormCampaignType] = useState<CampaignType>("CASH_DISCOUNT");
  const [formEligibleModels, setFormEligibleModels] = useState<string[]>([]);
  const [formEligibleVariants, setFormEligibleVariants] = useState<string>("");
  const [formDiscountAmount, setFormDiscountAmount] = useState<string>("");
  const [formFreeAccessories, setFormFreeAccessories] = useState<string>("");
  const [formWarrantyYears, setFormWarrantyYears] = useState<string>("");
  const [formExchangeBonus, setFormExchangeBonus] = useState<string>("");
  const [formInterestRate, setFormInterestRate] = useState<string>("");
  const [formMinGroupSize, setFormMinGroupSize] = useState<string>("");
  const [formTerms, setFormTerms] = useState<string>("");
  const [formValidFrom, setFormValidFrom] = useState<string>("");
  const [formValidUntil, setFormValidUntil] = useState<string>("");
  const [formIsSponsored, setFormIsSponsored] = useState<boolean>(false);
  const [formSponsoredLabel, setFormSponsoredLabel] = useState<string>("Showroom Spotlight");
  const [formRevisionNotes, setFormRevisionNotes] = useState<string>("");
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Clipboard copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Role permissions
  const canManage = useMemo(() => {
    if (!user) return false;
    const role = user.staff_role;
    return role === "DEALER_OWNER" || role === "BRANCH_MANAGER" || role === "SALES_MANAGER";
  }, [user]);

  // Load initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [cRes, sRes, bRes, mRes] = await Promise.all([
        dealerApi.getCampaigns({
          branch_id: branchFilter !== "ALL" ? branchFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          campaign_type: typeFilter !== "ALL" ? typeFilter : undefined,
          origin: originFilter !== "ALL" ? originFilter : undefined,
          search: searchQuery.trim() || undefined,
        }),
        dealerApi.getCampaignSummary(branchFilter !== "ALL" ? branchFilter : undefined),
        dealerApi.getBranches(),
        dealerApi.getCatalogueModels(),
      ]);

      if (cRes.success && cRes.data) {
        setCampaigns(cRes.data);
      }
      if (sRes.success && sRes.data) {
        setSummary(sRes.data);
      }
      if (bRes.success && bRes.data) {
        setBranches(bRes.data);
      } else if (contextBranches && contextBranches.length > 0) {
        setBranches(contextBranches);
      }
      if (mRes.success && mRes.data) {
        setCatalogueModels(mRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load campaign data:", err);
      setError(err?.message || "Failed to synchronize campaign data. Showing cached offline data.");
    } finally {
      setLoading(false);
    }
  }, [branchFilter, statusFilter, typeFilter, originFilter, searchQuery, contextBranches]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setFormTitle("");
    setFormDescription("");
    setFormBranchId(user?.staff_role === "BRANCH_MANAGER" && user.branch_id ? user.branch_id : "all");
    setFormCampaignType("CASH_DISCOUNT");
    setFormEligibleModels(catalogueModels.length > 0 ? [catalogueModels[0].name] : ["Brezza"]);
    setFormEligibleVariants("");
    setFormDiscountAmount("35000");
    setFormFreeAccessories("");
    setFormWarrantyYears("3");
    setFormExchangeBonus("15000");
    setFormInterestRate("");
    setFormMinGroupSize("");
    setFormTerms("Valid for retail vehicle deliveries completed within the active campaign period. Standard documentation guidelines apply.");

    // Default dates: today until 30 days ahead
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);
    setFormValidFrom(now.toISOString().slice(0, 10));
    setFormValidUntil(future.toISOString().slice(0, 10));

    setFormIsSponsored(false);
    setFormSponsoredLabel("Showroom Spotlight");
    setFormRevisionNotes("");
    setFormError(null);
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (campaign: DealerCampaign) => {
    if (campaign.origin === "GROUPDRIVE_ADMIN") {
      alert("Platform and OEM campaigns are centrally controlled and cannot be edited by dealerships.");
      return;
    }
    setEditingCampaign(campaign);
    setFormTitle(campaign.title);
    setFormDescription(campaign.description);
    setFormBranchId(campaign.branch_id || "all");
    setFormCampaignType(campaign.campaign_type);
    setFormEligibleModels(campaign.eligible_models || []);
    setFormEligibleVariants((campaign.eligible_variants || []).join(", "));
    setFormDiscountAmount(campaign.offer_details?.discount_amount ? String(campaign.offer_details.discount_amount) : "");
    setFormFreeAccessories(campaign.offer_details?.free_accessories_description || "");
    setFormWarrantyYears(campaign.offer_details?.warranty_years ? String(campaign.offer_details.warranty_years) : "");
    setFormExchangeBonus(campaign.offer_details?.exchange_bonus_amount ? String(campaign.offer_details.exchange_bonus_amount) : "");
    setFormInterestRate(campaign.offer_details?.interest_rate_pct ? String(campaign.offer_details.interest_rate_pct) : "");
    setFormMinGroupSize(campaign.offer_details?.min_group_size ? String(campaign.offer_details.min_group_size) : "");
    setFormTerms(campaign.offer_details?.terms_and_conditions || "");
    setFormValidFrom(campaign.valid_from ? campaign.valid_from.slice(0, 10) : "");
    setFormValidUntil(campaign.valid_until ? campaign.valid_until.slice(0, 10) : "");
    setFormIsSponsored(campaign.is_sponsored || false);
    setFormSponsoredLabel(campaign.sponsored_label || "Showroom Spotlight");
    setFormRevisionNotes("");
    setFormError(null);
    setShowCreateModal(true);
  };

  // Toggle Model Selection in Form
  const handleToggleModel = (modelName: string) => {
    if (formEligibleModels.includes(modelName)) {
      if (formEligibleModels.length === 1) return; // Keep at least one
      setFormEligibleModels(formEligibleModels.filter((m) => m !== modelName));
    } else {
      setFormEligibleModels([...formEligibleModels, modelName]);
    }
  };

  // Handle Form Submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formTitle.trim().length < 3) {
      setFormError("Campaign title must be at least 3 characters.");
      return;
    }
    if (formDescription.trim().length < 10) {
      setFormError("Campaign description must be at least 10 characters.");
      return;
    }
    if (formEligibleModels.length === 0) {
      setFormError("Please select at least one eligible vehicle model.");
      return;
    }
    if (!formValidFrom || !formValidUntil) {
      setFormError("Both start date and end date are required.");
      return;
    }
    if (new Date(formValidUntil) < new Date(formValidFrom)) {
      setFormError("End date must be equal to or later than the start date.");
      return;
    }

    try {
      setFormSubmitting(true);

      const variants = formEligibleVariants
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const offerDetails: any = {
        terms_and_conditions: formTerms.trim(),
      };
      if (formDiscountAmount && Number(formDiscountAmount) > 0) {
        offerDetails.discount_amount = Number(formDiscountAmount);
      }
      if (formFreeAccessories.trim()) {
        offerDetails.free_accessories_description = formFreeAccessories.trim();
      }
      if (formWarrantyYears && Number(formWarrantyYears) > 0) {
        offerDetails.warranty_years = Number(formWarrantyYears);
      }
      if (formExchangeBonus && Number(formExchangeBonus) > 0) {
        offerDetails.exchange_bonus_amount = Number(formExchangeBonus);
      }
      if (formInterestRate && Number(formInterestRate) > 0) {
        offerDetails.interest_rate_pct = Number(formInterestRate);
      }
      if (formMinGroupSize && Number(formMinGroupSize) > 0) {
        offerDetails.min_group_size = Number(formMinGroupSize);
      }

      const branchVal = formBranchId === "all" ? null : formBranchId;
      const validFromIso = new Date(formValidFrom + "T00:00:00Z").toISOString();
      const validUntilIso = new Date(formValidUntil + "T23:59:59Z").toISOString();

      if (editingCampaign) {
        const payload: UpdateCampaignPayload = {
          title: formTitle.trim(),
          description: formDescription.trim(),
          branch_id: branchVal,
          campaign_type: formCampaignType,
          eligible_models: formEligibleModels,
          eligible_variants: variants,
          offer_details: offerDetails,
          valid_from: validFromIso,
          valid_until: validUntilIso,
          is_sponsored: formIsSponsored,
          sponsored_label: formIsSponsored ? formSponsoredLabel : undefined,
          revision_notes: formRevisionNotes.trim() || undefined,
        };

        const res = await dealerApi.updateCampaign(editingCampaign.id, payload);
        if (res.success && res.data) {
          setSuccessMessage(`Campaign '${res.data.campaign_code}' updated successfully.`);
          setShowCreateModal(false);
          await fetchData();
        } else {
          setFormError(res.message || "Failed to update campaign.");
        }
      } else {
        const payload: CreateCampaignPayload = {
          title: formTitle.trim(),
          description: formDescription.trim(),
          branch_id: branchVal,
          campaign_type: formCampaignType,
          eligible_models: formEligibleModels,
          eligible_variants: variants,
          offer_details: offerDetails,
          valid_from: validFromIso,
          valid_until: validUntilIso,
          is_sponsored: formIsSponsored,
          sponsored_label: formIsSponsored ? formSponsoredLabel : undefined,
          status: "ACTIVE",
        };

        const res = await dealerApi.createCampaign(payload);
        if (res.success && res.data) {
          setSuccessMessage(`Campaign '${res.data.campaign_code}' created and published successfully.`);
          setShowCreateModal(false);
          await fetchData();
        } else {
          setFormError(res.message || "Failed to create campaign.");
        }
      }
    } catch (err: any) {
      console.error("Form submit error:", err);
      setFormError(err?.message || "An error occurred while saving the campaign.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Active/Paused Status
  const handleToggleActiveState = async (campaign: DealerCampaign, e: React.MouseEvent) => {
    e.stopPropagation();
    if (campaign.origin === "GROUPDRIVE_ADMIN") {
      alert("Platform and OEM campaigns are centrally controlled and cannot be paused by dealerships.");
      return;
    }

    if (campaign.status === "EXPIRED" && !campaign.is_active) {
      alert("Cannot activate an expired campaign. Please edit the campaign and extend its validity end date first.");
      return;
    }

    const nextState = !campaign.is_active;
    const confirmText = nextState
      ? `Reactivate campaign '${campaign.campaign_code} - ${campaign.title}'? It will immediately become visible to eligible buyers.`
      : `Pause campaign '${campaign.campaign_code} - ${campaign.title}'? Active offers will be temporarily halted.`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await dealerApi.toggleCampaignStatus(campaign.id, nextState);
      if (res.success && res.data) {
        setSuccessMessage(`Campaign ${res.data.campaign_code} was ${nextState ? "activated" : "paused"} successfully.`);
        await fetchData();
      } else {
        alert(res.message || "Failed to toggle campaign status.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update campaign state.");
    }
  };

  // Open History Modal
  const handleOpenHistory = async (campaign: DealerCampaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHistoryModalCampaign(campaign);
    setHistoryLoading(true);
    setHistoryLogs([]);

    try {
      const res = await dealerApi.getCampaignHistory(campaign.id);
      if (res.success && res.data) {
        setHistoryLogs(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && c.campaign_type !== typeFilter) return false;
      if (originFilter !== "ALL" && c.origin !== originFilter) return false;
      if (branchFilter !== "ALL") {
        if (c.branch_id && c.branch_id !== branchFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (c.title || "").toLowerCase().includes(q);
        const inCode = (c.campaign_code || "").toLowerCase().includes(q);
        const inDesc = (c.description || "").toLowerCase().includes(q);
        const inModels = (c.eligible_models || []).some((m) => m.toLowerCase().includes(q));
        if (!inTitle && !inCode && !inDesc && !inModels) return false;
      }
      return true;
    });
  }, [campaigns, statusFilter, typeFilter, originFilter, branchFilter, searchQuery]);

  // Helper for Status Badge
  const renderStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVE
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold flex items-center gap-1">
            <Clock className="h-3 w-3" />
            SCHEDULED
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-300 text-xs font-semibold flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-slate-400" />
            EXPIRED
          </Badge>
        );
      case "PAUSED":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold flex items-center gap-1">
            <Power className="h-3 w-3 text-amber-500" />
            PAUSED
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold">
            DRAFT
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Helper for Validity Display
  const getValidityDisplay = (campaign: DealerCampaign) => {
    const now = new Date();
    const until = new Date(campaign.valid_until);
    const from = new Date(campaign.valid_from);

    if (campaign.status === "EXPIRED" || now > until) {
      return (
        <span className="text-slate-500 font-medium">
          Expired on {formatDate(campaign.valid_until)}
        </span>
      );
    }

    if (campaign.status === "SCHEDULED" || now < from) {
      const diffDays = Math.ceil((from.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <span className="text-blue-700 font-medium">
          Starts in {diffDays} {diffDays === 1 ? "day" : "days"} ({formatDate(campaign.valid_from)})
        </span>
      );
    }

    const diffDays = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return (
      <span className="text-emerald-700 font-medium">
        {diffDays} {diffDays === 1 ? "day" : "days"} remaining (Valid until {formatDate(campaign.valid_until)})
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center">
              <Tag className="h-6 w-6 text-rose-600 mr-2" />
              Campaign and Offer Management
            </h1>
            <Badge variant="outline" className="text-xs text-slate-600 border-slate-300">
              DealerOS Promotions
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Design, publish, monitor, and track localized promotions, volume deals, and vehicle incentives across your showroom network
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="text-xs border-slate-300"
          >
            <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canManage ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenCreate}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Campaign
            </Button>
          ) : (
            <div className="flex items-center text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
              <Lock className="h-3 w-3 mr-1.5 text-slate-400" />
              Read-Only Discovery Mode
            </div>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData} className="h-6 text-xs text-rose-700">
            Retry
          </Button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Campaigns</span>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900">{summary?.total_campaigns ?? campaigns.length}</span>
              <span className="text-xs text-slate-400">All registered</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Active Offers</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-emerald-700">
                {summary?.active_count ?? campaigns.filter((c) => c.status === "ACTIVE").length}
              </span>
              <span className="text-xs text-emerald-600 font-medium">Live now</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Scheduled</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-blue-700">
                {summary?.scheduled_count ?? campaigns.filter((c) => c.status === "SCHEDULED").length}
              </span>
              <span className="text-xs text-blue-600">Upcoming</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-slate-400">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Expired</span>
              <AlertCircle className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-600">
                {summary?.expired_count ?? campaigns.filter((c) => c.status === "EXPIRED").length}
              </span>
              <span className="text-xs text-slate-400">Past dates</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-indigo-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Enquiries Generated</span>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-indigo-700">
                {summary?.total_enquiries_generated ??
                  campaigns.reduce((acc, c) => acc + (c.performance?.enquiries_generated || 0), 0)}
              </span>
              <span className="text-xs text-indigo-600">Leads captured</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-rose-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Bookings Converted</span>
              <CheckCircle2 className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-rose-700">
                {summary?.total_bookings_converted ??
                  campaigns.reduce((acc, c) => acc + (c.performance?.bookings_converted || 0), 0)}
              </span>
              <span className="text-xs text-rose-600">Closed sales</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-3 md:p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Box */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by title, code, vehicle model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Offers</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="EXPIRED">Expired</option>
                <option value="PAUSED">Paused</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            {/* Campaign Type Filter */}
            <div className="md:col-span-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="ALL">All Offer Types</option>
                <option value="CASH_DISCOUNT">Cash Discount</option>
                <option value="ACCESSORY_BUNDLE">Accessory Bundle</option>
                <option value="EXTENDED_WARRANTY">Extended Warranty</option>
                <option value="EXCHANGE_BONUS">Exchange Bonus</option>
                <option value="LOW_INTEREST_FINANCE">Low Interest Finance</option>
                <option value="VOLUME_TIER_DISCOUNT">Volume Tier</option>
                <option value="AGING_STOCK_CLEARANCE">Stock Clearance</option>
              </select>
            </div>

            {/* Branch Scope Filter */}
            <div className="md:col-span-2">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="ALL">All Dealership Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Origin & View Toggle */}
            <div className="md:col-span-2 flex items-center justify-between gap-2">
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="flex-1 h-9 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="ALL">All Origins</option>
                <option value="DEALER">Dealership Only</option>
                <option value="GROUPDRIVE_ADMIN">Platform / OEM</option>
              </select>

              <div className="flex border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid Card View"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Table View"
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(statusFilter !== "ALL" || typeFilter !== "ALL" || branchFilter !== "ALL" || originFilter !== "ALL" || searchQuery) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Active filters:</span>
              {statusFilter !== "ALL" && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-1">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("ALL")} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {typeFilter !== "ALL" && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-1">
                  Type: {typeFilter}
                  <button onClick={() => setTypeFilter("ALL")} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {branchFilter !== "ALL" && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-1">
                  Branch: {branches.find((b) => b.id === branchFilter)?.branch_name || branchFilter}
                  <button onClick={() => setBranchFilter("ALL")} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {originFilter !== "ALL" && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-1">
                  Origin: {originFilter === "DEALER" ? "Dealership" : "Platform Admin"}
                  <button onClick={() => setOriginFilter("ALL")} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                  setBranchFilter("ALL");
                  setOriginFilter("ALL");
                  setSearchQuery("");
                }}
                className="text-rose-600 hover:text-rose-800 underline font-medium ml-1"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Campaign List Content */}
      {loading && campaigns.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3">
          <RotateCw className="h-6 w-6 animate-spin mx-auto text-rose-600" />
          <p className="text-xs">Synchronizing active dealership campaigns and performance telemetry...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No campaigns found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              No promotional campaigns match your current filters. Adjust your search criteria or create a new campaign.
            </p>
          </div>
          {canManage && (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenCreate}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create New Campaign
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCampaigns.map((c) => {
            const typeConfig = CAMPAIGN_TYPE_LABELS[c.campaign_type] || {
              label: c.campaign_type,
              icon: Tag,
              color: "text-slate-700 bg-slate-50 border-slate-200",
            };
            const TypeIcon = typeConfig.icon;
            const isAdmin = c.origin === "GROUPDRIVE_ADMIN";

            return (
              <Card
                key={c.id}
                className={`border-slate-200 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                  c.status === "EXPIRED" ? "bg-slate-50/70 opacity-90" : "bg-white"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            onClick={() => handleCopyCode(c.campaign_code)}
                            className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded cursor-pointer hover:bg-slate-200 flex items-center gap-1"
                            title="Click to copy campaign code"
                          >
                            {c.campaign_code}
                            {copiedCode === c.campaign_code ? (
                              <Check className="h-2.5 w-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-2.5 w-2.5 text-slate-400" />
                            )}
                          </span>

                          {renderStatusBadge(c.status)}

                          {c.is_sponsored && (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-500" />
                              {c.sponsored_label || "Spotlight"}
                            </Badge>
                          )}

                          {isAdmin && (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5 text-blue-500" />
                              Central OEM Scheme
                            </Badge>
                          )}
                        </div>

                        <CardTitle className="text-base font-bold text-slate-900 leading-snug pt-1">
                          {c.title}
                        </CardTitle>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded border flex items-center gap-1 ${typeConfig.color}`}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {typeConfig.label}
                      </span>
                    </div>

                    <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {c.description}
                    </CardDescription>
                  </CardHeader>

                  {/* Card Body */}
                  <CardContent className="pt-3 pb-3 space-y-3 text-xs">
                    {/* Eligible Vehicles */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Car className="h-3 w-3" /> Models:
                      </span>
                      {c.eligible_models.map((m) => (
                        <span
                          key={m}
                          className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold border border-slate-200"
                        >
                          {m}
                        </span>
                      ))}

                      {c.eligible_variants && c.eligible_variants.length > 0 && (
                        <span className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          Variants: {c.eligible_variants.join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Offer Highlight Box */}
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Primary Offer:</span>
                        <span className="font-bold text-rose-600 text-sm">
                          {c.offer_details?.discount_amount
                            ? `${formatINR(c.offer_details.discount_amount)} Off`
                            : typeConfig.label}
                        </span>
                      </div>

                      {c.offer_details?.free_accessories_description && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Free Accessories:</span>
                          <span className="font-semibold text-slate-800 text-right truncate max-w-[220px]">
                            {c.offer_details.free_accessories_description}
                          </span>
                        </div>
                      )}

                      {c.offer_details?.warranty_years && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Extended Warranty:</span>
                          <span className="font-semibold text-slate-800">
                            {c.offer_details.warranty_years} Years Complimentary
                          </span>
                        </div>
                      )}

                      {c.offer_details?.exchange_bonus_amount && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Exchange Bonus:</span>
                          <span className="font-semibold text-slate-800">
                            {formatINR(c.offer_details.exchange_bonus_amount)}
                          </span>
                        </div>
                      )}

                      {c.offer_details?.interest_rate_pct && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Special Interest Rate:</span>
                          <span className="font-bold text-indigo-700">
                            {c.offer_details.interest_rate_pct}% p.a.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Scope and Dates */}
                    <div className="space-y-1 pt-1 text-xs border-t border-slate-100">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Building2 className="h-3 w-3" /> Branch Scope:
                        </span>
                        <span className="font-medium text-slate-800 truncate max-w-[200px]">
                          {c.branch_name || "All Dealership Branches"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3 w-3" /> Validity:
                        </span>
                        {getValidityDisplay(c)}
                      </div>
                    </div>

                    {/* Performance Mini Bar (if telemetry exists) */}
                    {c.performance && (
                      <div className="p-2 bg-indigo-50/50 rounded border border-indigo-100 grid grid-cols-4 gap-1 text-center text-xs">
                        <div>
                          <div className="text-slate-400 font-medium">Views</div>
                          <div className="font-bold text-slate-800">{c.performance.impressions}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Leads</div>
                          <div className="font-bold text-indigo-700">{c.performance.enquiries_generated}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Bookings</div>
                          <div className="font-bold text-emerald-700">{c.performance.bookings_converted}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Conv. %</div>
                          <div className="font-bold text-rose-700">{c.performance.conversion_rate_pct}%</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCampaign(c)}
                      className="h-7 text-xs px-2.5 bg-white border-slate-200 hover:bg-slate-100"
                    >
                      <Eye className="h-3 w-3 mr-1 text-slate-500" />
                      Details
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenHistory(c, e)}
                      className="h-7 text-xs px-2 text-slate-600 hover:text-slate-900"
                      title="View Audit History"
                    >
                      <History className="h-3 w-3 mr-1" />
                      Audit
                    </Button>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      {!isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          className="h-7 text-xs px-2 text-slate-700 hover:text-slate-900"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}

                      {!isAdmin && (
                        <Button
                          variant={c.is_active ? "outline" : "default"}
                          size="sm"
                          onClick={(e) => handleToggleActiveState(c, e)}
                          disabled={c.status === "EXPIRED" && !c.is_active}
                          className={`h-7 text-xs px-2.5 ${
                            c.is_active
                              ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          <Power className="h-3 w-3 mr-1" />
                          {c.is_active ? "Pause" : "Activate"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-700">Code & Title</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Offer Type</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Target Vehicles</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Branch Scope</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700">Validity Window</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Performance</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredCampaigns.map((c) => {
                const typeConfig = CAMPAIGN_TYPE_LABELS[c.campaign_type] || {
                  label: c.campaign_type,
                  icon: Tag,
                  color: "text-slate-700 bg-slate-50 border-slate-200",
                };
                const TypeIcon = typeConfig.icon;
                const isAdmin = c.origin === "GROUPDRIVE_ADMIN";

                return (
                  <TableRow key={c.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-medium">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {c.campaign_code}
                          </span>
                          {c.is_sponsored && (
                            <span title="Sponsored Spotlight">
                              <Sparkles className="h-3 w-3 text-amber-500" />
                            </span>
                          )}
                          {isAdmin && (
                            <span title="Central OEM Scheme">
                              <Lock className="h-3 w-3 text-blue-500" />
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900">{c.title}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${typeConfig.color}`}>
                        <TypeIcon className="h-3 w-3" />
                        {typeConfig.label}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">{c.eligible_models.join(", ")}</div>
                        {c.eligible_variants && c.eligible_variants.length > 0 && (
                          <div className="text-xs text-slate-400">
                            {c.eligible_variants.join(", ")}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-slate-700">{c.branch_name || "All Branches"}</span>
                    </TableCell>

                    <TableCell>{renderStatusBadge(c.status)}</TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div>{getValidityDisplay(c)}</div>
                        <div className="text-xs text-slate-400">
                          {formatDate(c.valid_from)} - {formatDate(c.valid_until)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {c.performance ? (
                        <div className="text-right">
                          <div className="font-bold text-slate-800">
                            {c.performance.enquiries_generated} leads ({c.performance.bookings_converted} won)
                          </div>
                          <div className="text-xs text-emerald-600 font-semibold">
                            {c.performance.conversion_rate_pct}% conv.
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No telemetry</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCampaign(c)}
                          className="h-7 w-7 p-0"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-600" />
                        </Button>

                        {canManage && !isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                            className="h-7 w-7 p-0"
                            title="Edit Campaign"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                          </Button>
                        )}

                        {canManage && !isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleToggleActiveState(c, e)}
                            disabled={c.status === "EXPIRED" && !c.is_active}
                            className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700"
                            title={c.is_active ? "Pause Campaign" : "Activate Campaign"}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-rose-600" />
                  {editingCampaign ? `Edit Campaign - ${editingCampaign.campaign_code}` : "Create New Promotional Campaign"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish targeted vehicle discounts and consumer incentives across permitted branches
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Campaign Title *</label>
                  <Input
                    placeholder="e.g. Festive Season Brezza Flash Offer"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Offer Category *</label>
                  <select
                    value={formCampaignType}
                    onChange={(e) => setFormCampaignType(e.target.value as CampaignType)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="CASH_DISCOUNT">Cash Discount</option>
                    <option value="ACCESSORY_BUNDLE">Accessory Bundle</option>
                    <option value="EXTENDED_WARRANTY">Extended Warranty</option>
                    <option value="EXCHANGE_BONUS">Exchange Bonus</option>
                    <option value="LOW_INTEREST_FINANCE">Low Interest Finance</option>
                    <option value="VOLUME_TIER_DISCOUNT">Volume Tier Discount</option>
                    <option value="AGING_STOCK_CLEARANCE">Stock Clearance</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Campaign Description *</label>
                <textarea
                  rows={2}
                  placeholder="Detail the consumer value proposition, eligibility criteria, and delivery timelines..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Branch Scope */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Dealership Branch Scope</label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  disabled={user?.staff_role === "BRANCH_MANAGER"}
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="all">All Dealership Branches (Network Wide)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name} ({b.city})
                    </option>
                  ))}
                </select>
                {user?.staff_role === "BRANCH_MANAGER" && (
                  <p className="text-xs text-slate-400">
                    Branch Managers are scoped strictly to their assigned branch.
                  </p>
                )}
              </div>

              {/* Vehicle Eligibility */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                <label className="font-semibold text-slate-800 block">
                  Eligible Vehicle Models * (Select all applicable)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(catalogueModels.length > 0 ? catalogueModels : [{ id: "m1", name: "Brezza" }, { id: "m2", name: "Swift 2026" }, { id: "m3", name: "Grand Vitara" }, { id: "m4", name: "Fronx" }]).map((m) => {
                    const selected = formEligibleModels.includes(m.name);
                    return (
                      <button
                        type="button"
                        key={m.id || m.name}
                        onClick={() => handleToggleModel(m.name)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          selected
                            ? "bg-rose-50 border-rose-300 text-rose-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {selected && <Check className="h-3 w-3 text-rose-600" />}
                        {m.name}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="font-medium text-slate-600 block text-xs">
                    Specific Variants (Optional - comma-separated, leave blank for all variants)
                  </label>
                  <Input
                    placeholder="e.g. ZXi, ZXi Plus, Alpha Hybrid"
                    value={formEligibleVariants}
                    onChange={(e) => setFormEligibleVariants(e.target.value)}
                    className="h-7 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Offer Details Breakdown */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-3">
                <span className="font-semibold text-slate-800 block">Incentive Specifications</span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Flat Cash Discount (INR)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 45000"
                      value={formDiscountAmount}
                      onChange={(e) => setFormDiscountAmount(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Exchange Bonus (INR)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 15000"
                      value={formExchangeBonus}
                      onChange={(e) => setFormExchangeBonus(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Extended Warranty (Years)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 3"
                      value={formWarrantyYears}
                      onChange={(e) => setFormWarrantyYears(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Special Finance Rate (% p.a.)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 6.99"
                      value={formInterestRate}
                      onChange={(e) => setFormInterestRate(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Min. Group Size (For Volume Tiers)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 5"
                      value={formMinGroupSize}
                      onChange={(e) => setFormMinGroupSize(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Complimentary Accessories Description</label>
                  <Input
                    placeholder="e.g. 7-piece chrome styling kit + 3M underbody coating"
                    value={formFreeAccessories}
                    onChange={(e) => setFormFreeAccessories(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Terms and Conditions</label>
                  <textarea
                    rows={2}
                    placeholder="Special disclaimers or delivery window rules..."
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Dates & Promotional Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Campaign Start Date *</label>
                  <Input
                    type="date"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    required
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Campaign End Date *</label>
                  <Input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    required
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Sponsored Placement */}
              <div className="p-3 bg-amber-50/60 rounded-md border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      Sponsored Spotlight Placement
                    </span>
                    <p className="text-xs text-amber-700">
                      Highlight this campaign with a Spotlight badge in GroupDrive customer car comparison searches
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={formIsSponsored}
                    onChange={(e) => setFormIsSponsored(e.target.checked)}
                    className="h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                </div>

                {formIsSponsored && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <label className="text-xs font-medium text-amber-900 block">Custom Spotlight Label</label>
                    <Input
                      placeholder="e.g. Showroom Spotlight, Diwali Highlight"
                      value={formSponsoredLabel}
                      onChange={(e) => setFormSponsoredLabel(e.target.value)}
                      className="h-7 text-xs bg-white mt-1 border-amber-200"
                    />
                  </div>
                )}
              </div>

              {/* Revision Notes if editing */}
              {editingCampaign && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Revision Notes (Audit Trail)</label>
                  <Input
                    placeholder="Reason for modifying this campaign..."
                    value={formRevisionNotes}
                    onChange={(e) => setFormRevisionNotes(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={formSubmitting}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {formSubmitting ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : editingCampaign ? (
                    "Save Campaign Changes"
                  ) : (
                    "Publish Campaign"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAMPAIGN DETAILS & PERFORMANCE MODAL */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                    {selectedCampaign.campaign_code}
                  </span>
                  {renderStatusBadge(selectedCampaign.status)}
                  {selectedCampaign.is_sponsored && (
                    <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs">
                      {selectedCampaign.sponsored_label || "Spotlight"}
                    </Badge>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedCampaign.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Origin Banner */}
              {selectedCampaign.origin === "GROUPDRIVE_ADMIN" ? (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block">Centrally Administered Platform / OEM Scheme</span>
                    <span className="text-xs text-blue-700">
                      Subsidized centrally by GroupDrive / Maruti Suzuki. Dealers cannot modify scheme parameters.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    Dealership Managed Promotion
                  </span>
                  <span className="text-xs text-slate-500">
                    Created by {selectedCampaign.created_by_name || "Dealership Staff"}
                  </span>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 block">Offer Description</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                  {selectedCampaign.description}
                </p>
              </div>

              {/* Vehicle & Branch Scope */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium block text-xs">Target Vehicles</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedCampaign.eligible_models.join(", ")}
                  </span>
                  {selectedCampaign.eligible_variants && selectedCampaign.eligible_variants.length > 0 && (
                    <span className="text-xs text-slate-500">
                      Variants: {selectedCampaign.eligible_variants.join(", ")}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-medium block text-xs">Showroom Scope</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedCampaign.branch_name || "All Dealership Branches"}
                  </span>
                </div>
              </div>

              {/* Offer Specifications */}
              <div className="p-3 bg-rose-50/50 rounded border border-rose-100 space-y-2">
                <span className="font-bold text-rose-900 block">Incentives & Discount Details</span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedCampaign.offer_details?.discount_amount && (
                    <div>
                      <span className="text-slate-500">Upfront Price Discount:</span>{" "}
                      <span className="font-bold text-rose-600">
                        {formatINR(selectedCampaign.offer_details.discount_amount)}
                      </span>
                    </div>
                  )}

                  {selectedCampaign.offer_details?.exchange_bonus_amount && (
                    <div>
                      <span className="text-slate-500">Exchange Bonus:</span>{" "}
                      <span className="font-semibold text-slate-800">
                        {formatINR(selectedCampaign.offer_details.exchange_bonus_amount)}
                      </span>
                    </div>
                  )}

                  {selectedCampaign.offer_details?.warranty_years && (
                    <div>
                      <span className="text-slate-500">Complimentary Warranty:</span>{" "}
                      <span className="font-semibold text-slate-800">
                        {selectedCampaign.offer_details.warranty_years} Years
                      </span>
                    </div>
                  )}

                  {selectedCampaign.offer_details?.interest_rate_pct && (
                    <div>
                      <span className="text-slate-500">Finance Rate:</span>{" "}
                      <span className="font-bold text-indigo-700">
                        {selectedCampaign.offer_details.interest_rate_pct}% p.a.
                      </span>
                    </div>
                  )}
                </div>

                {selectedCampaign.offer_details?.free_accessories_description && (
                  <div className="text-xs pt-1 border-t border-rose-100">
                    <span className="text-slate-500">Free Accessories:</span>{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedCampaign.offer_details.free_accessories_description}
                    </span>
                  </div>
                )}

                {selectedCampaign.offer_details?.terms_and_conditions && (
                  <div className="text-xs text-slate-500 pt-1 border-t border-rose-100">
                    <span className="font-semibold text-slate-600">Terms:</span>{" "}
                    {selectedCampaign.offer_details.terms_and_conditions}
                  </div>
                )}
              </div>

              {/* Marketing Performance Telemetry */}
              {selectedCampaign.performance ? (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-indigo-600" />
                      Marketing Performance & Conversion Funnel
                    </span>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                      Telemetry Live
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-xs text-slate-400">Impressions</div>
                      <div className="text-sm font-bold text-slate-900">
                        {selectedCampaign.performance.impressions}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-xs text-slate-400">Clicks</div>
                      <div className="text-sm font-bold text-slate-900">
                        {selectedCampaign.performance.clicks}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-xs text-slate-400">Enquiries</div>
                      <div className="text-sm font-bold text-indigo-700">
                        {selectedCampaign.performance.enquiries_generated}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-xs text-slate-400">Bookings</div>
                      <div className="text-sm font-bold text-emerald-700">
                        {selectedCampaign.performance.bookings_converted}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Overall Conversion Efficiency:</span>
                    <span className="font-bold text-rose-700">
                      {selectedCampaign.performance.conversion_rate_pct}% conversion rate
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-slate-400 border border-dashed rounded text-xs">
                  No performance telemetry recorded yet for this campaign.
                </div>
              )}

              {/* Validity info */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100 text-xs">
                <span className="text-slate-500">Validity Schedule:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(selectedCampaign.valid_from)} to {formatDate(selectedCampaign.valid_until)}
                </span>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenHistory(selectedCampaign)}
                className="text-xs"
              >
                <History className="h-3.5 w-3.5 mr-1 text-slate-500" />
                View Audit Trail
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCampaign(null)}
                  className="text-xs"
                >
                  Close
                </Button>

                {canManage && selectedCampaign.origin !== "GROUPDRIVE_ADMIN" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const c = selectedCampaign;
                      setSelectedCampaign(null);
                      handleOpenEdit(c);
                    }}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Edit Campaign
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN AUDIT HISTORY MODAL */}
      {historyModalCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full max-h-[85vh] flex flex-col my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-rose-600" />
                  Audit Trail - {historyModalCampaign.campaign_code}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{historyModalCampaign.title}</p>
              </div>
              <button
                onClick={() => setHistoryModalCampaign(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {historyLoading ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <RotateCw className="h-5 w-5 animate-spin mx-auto text-rose-600" />
                  <p className="text-xs">Loading audit history...</p>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded">
                  No audit history records found for this campaign.
                </div>
              ) : (
                <div className="space-y-2">
                  {historyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-xs text-slate-400">{formatDate(log.timestamp)}</span>
                      </div>
                      <p className="text-slate-700">{log.details}</p>
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                        <span>By: {log.actor_name}</span>
                        <span className="text-slate-300">•</span>
                        <span>Role: {log.actor_role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryModalCampaign(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
