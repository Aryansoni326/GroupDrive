"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  RotateCw,
  Plus,
  Eye,
  Edit3,
  Send,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Lock,
  Building2,
  Car,
  Tag,
  Calendar,
  CreditCard,
  Package,
  History,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  User,
  Users,
  MapPin,
  Shield,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  DealerQuotation,
  QuotationStatus,
  QuotationPricingBreakdown,
  QuotationHistoryEntry,
  QuotationSummaryStats,
  CreateQuotationPayload,
  UpdateQuotationPayload,
  CatalogueModel,
  CatalogueVariant,
  DealerLead,
  BuyerGroup,
  GroupOpportunity,
} from "@groupdrive/types";
import { formatINR, formatDate } from "@groupdrive/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/table";
import { TableSkeleton } from "../../../components/feedback/loading-skeleton";
import { EmptyState } from "../../../components/feedback/empty-state";
import { ErrorCard } from "../../../components/feedback/error-card";

export default function QuotationsPage() {
  const { currentBranch, dealer, branches, capabilities, user } = useAuth();

  // Quotation List and Stats
  const [quotations, setQuotations] = useState<DealerQuotation[]>([]);
  const [summary, setSummary] = useState<QuotationSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranch?.id || "ALL");
  const [selectedLinkageType, setSelectedLinkageType] = useState<"ALL" | "LEAD" | "GROUP" | "DIRECT">("ALL");

  // Catalogue and Linkage Options
  const [models, setModels] = useState<CatalogueModel[]>([]);
  const [variants, setVariants] = useState<CatalogueVariant[]>([]);
  const [leads, setLeads] = useState<DealerLead[]>([]);
  const [groups, setGroups] = useState<GroupOpportunity[]>([]);

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<DealerQuotation | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<DealerQuotation | null>(null);
  const [historyQuotation, setHistoryQuotation] = useState<DealerQuotation | null>(null);
  const [historyLogs, setHistoryLogs] = useState<QuotationHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Cancellation Modal state
  const [cancelModalQuote, setCancelModalQuote] = useState<DealerQuotation | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Builder Form State
  const [formBranchId, setFormBranchId] = useState("");
  const [formLinkType, setFormLinkType] = useState<"DIRECT" | "LEAD" | "GROUP">("DIRECT");
  const [formSelectedLeadId, setFormSelectedLeadId] = useState("");
  const [formSelectedGroupId, setFormSelectedGroupId] = useState("");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formCustomerEmail, setFormCustomerEmail] = useState("");
  const [formCustomerCity, setFormCustomerCity] = useState("Bengaluru");

  const [formModelId, setFormModelId] = useState("");
  const [formVariantId, setFormVariantId] = useState("");
  const [formColour, setFormColour] = useState("");

  // Pricing inputs
  const [formExShowroom, setFormExShowroom] = useState("829000");
  const [formRtoTax, setFormRtoTax] = useState("116060");
  const [formInsurance, setFormInsurance] = useState("32500");
  const [formFastag, setFormFastag] = useState("500");
  const [formTcs, setFormTcs] = useState("0");
  const [formAccessories, setFormAccessories] = useState("10000");
  const [formWarranty, setFormWarranty] = useState("12000");
  const [formOtherCharges, setFormOtherCharges] = useState("0");

  const [formDealerDiscount, setFormDealerDiscount] = useState("15000");
  const [formManufacturerOffer, setFormManufacturerOffer] = useState("10000");
  const [formExchangeBonus, setFormExchangeBonus] = useState("0");

  const [formDeliveryDays, setFormDeliveryDays] = useState("14");
  const [formValidDays, setFormValidDays] = useState("14");
  const [formTerms, setFormTerms] = useState(
    "Standard showroom commercial quotation. Valid for delivery upon vehicle allocation and RTO registration clearance."
  );
  const [formRevisionNotes, setFormRevisionNotes] = useState("");

  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAuthorizedToSubmit =
    capabilities.canSubmitQuotes ||
    user?.staff_role === "DEALER_OWNER" ||
    user?.staff_role === "BRANCH_MANAGER" ||
    user?.staff_role === "SALES_MANAGER";

  // Load Quotations and Summary
  const fetchQuotationsData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [quotesRes, summaryRes] = await Promise.all([
        dealerApi.getQuotations({
          branch_id: selectedBranchId !== "ALL" ? selectedBranchId : undefined,
          status: selectedStatus !== "ALL" ? selectedStatus : undefined,
          search: searchQuery || undefined,
        }),
        dealerApi.getQuotationsSummary(selectedBranchId !== "ALL" ? selectedBranchId : undefined),
      ]);

      setQuotations(quotesRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load quotations";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load Catalogue and Linkage Options once
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [modelsRes, variantsRes, leadsRes, oppsRes] = await Promise.all([
          dealerApi.getCatalogueModels(),
          dealerApi.getCatalogueVariants(),
          dealerApi.getLeads(),
          dealerApi.getOpportunities(),
        ]);
        setModels(modelsRes.data || []);
        setVariants(variantsRes.data || []);
        setLeads(leadsRes.data || []);
        setGroups(oppsRes.data || []);
      } catch (err) {
        console.warn("Failed to load prerequisite catalogue/linkage options", err);
      }
    };
    loadPrerequisites();
  }, []);

  useEffect(() => {
    fetchQuotationsData();
  }, [selectedBranchId, selectedStatus, searchQuery]);

  // Available variants for selected model in builder
  const availableVariants = useMemo(() => {
    if (!formModelId) return variants;
    return variants.filter((v) => v.model_id === formModelId);
  }, [variants, formModelId]);

  // Selected variant object
  const currentVariant = useMemo(() => {
    return variants.find((v) => v.id === formVariantId);
  }, [variants, formVariantId]);

  // Live Pricing Calculation
  const calculatedPricing = useMemo(() => {
    const ex = parseInt(formExShowroom, 10) || 0;
    const rto = parseInt(formRtoTax, 10) || 0;
    const ins = parseInt(formInsurance, 10) || 0;
    const fastag = parseInt(formFastag, 10) || 0;
    const tcs = parseInt(formTcs, 10) || 0;
    const acc = parseInt(formAccessories, 10) || 0;
    const warr = parseInt(formWarranty, 10) || 0;
    const other = parseInt(formOtherCharges, 10) || 0;

    const dDisc = parseInt(formDealerDiscount, 10) || 0;
    const mOffer = parseInt(formManufacturerOffer, 10) || 0;
    const exch = parseInt(formExchangeBonus, 10) || 0;

    const gross = ex + rto + ins + fastag + tcs + acc + warr + other;
    const totalDiscounts = dDisc + mOffer + exch;
    const netOnRoad = Math.max(0, gross - totalDiscounts);

    return {
      gross,
      totalDiscounts,
      netOnRoad,
      isExcessiveDiscount: totalDiscounts > ex && ex > 0,
    };
  }, [
    formExShowroom,
    formRtoTax,
    formInsurance,
    formFastag,
    formTcs,
    formAccessories,
    formWarranty,
    formOtherCharges,
    formDealerDiscount,
    formManufacturerOffer,
    formExchangeBonus,
  ]);

  // Open Builder for New Quotation
  const handleOpenNewBuilder = () => {
    setEditingQuotation(null);
    setFormBranchId(currentBranch?.id || branches[0]?.id || "");
    setFormLinkType("DIRECT");
    setFormSelectedLeadId("");
    setFormSelectedGroupId("");
    setFormCustomerName("");
    setFormCustomerPhone("");
    setFormCustomerEmail("");
    setFormCustomerCity("Bengaluru");

    // Select first model and variant
    const firstModel = models[0] || null;
    const firstVariant = variants[0] || null;

    setFormModelId(firstModel?.id || "mod-swift-01");
    setFormVariantId(firstVariant?.id || "var-swf-zxi-mt");
    setFormColour("Pearl Arctic White");

    const basePrice = firstVariant?.official_ex_showroom_price || 829000;
    setFormExShowroom(String(basePrice));
    setFormRtoTax(String(Math.round(basePrice * 0.14)));
    setFormInsurance(String(Math.round(basePrice * 0.035 + 12000)));
    setFormFastag("500");
    setFormTcs(basePrice > 1000000 ? String(Math.round(basePrice * 0.01)) : "0");
    setFormAccessories("10000");
    setFormWarranty("12000");
    setFormOtherCharges("0");

    setFormDealerDiscount("15000");
    setFormManufacturerOffer("10000");
    setFormExchangeBonus("0");

    setFormDeliveryDays("14");
    setFormValidDays("14");
    setFormTerms(
      "Standard showroom commercial quotation. Valid for delivery upon vehicle allocation and RTO registration clearance."
    );
    setFormRevisionNotes("");
    setFormError(null);
    setIsBuilderOpen(true);
  };

  // Open Builder for Editing / Revising Quotation
  const handleOpenEditBuilder = (quote: DealerQuotation) => {
    if (["ACCEPTED", "EXPIRED", "CANCELLED_BY_DEALER"].includes(quote.quotation_status)) {
      alert(`Cannot modify quotation because it is currently ${quote.quotation_status}.`);
      return;
    }

    setEditingQuotation(quote);
    setFormBranchId(quote.branch_id);
    if (quote.lead_id) {
      setFormLinkType("LEAD");
      setFormSelectedLeadId(quote.lead_id);
    } else if (quote.group_id) {
      setFormLinkType("GROUP");
      setFormSelectedGroupId(quote.group_id);
    } else {
      setFormLinkType("DIRECT");
    }

    setFormCustomerName(quote.customer_name || "");
    setFormCustomerPhone(quote.customer_phone || "");
    setFormCustomerEmail(quote.customer_email || "");
    setFormCustomerCity(quote.customer_city || quote.city || "Bengaluru");

    setFormModelId(quote.model_id || "mod-swift-01");
    setFormVariantId(quote.variant_id || "var-swf-zxi-mt");
    setFormColour(quote.colour || "Standard");

    const p = quote.pricing || {
      ex_showroom_price: 829000,
      rto_road_tax: 116060,
      insurance_amount: 32500,
      fastag_charges: 500,
      tcs_amount: 0,
      accessories_amount: 10000,
      extended_warranty_amount: 12000,
      other_charges: 0,
      dealer_discount: quote.total_group_discount || 15000,
      manufacturer_offer: 10000,
      exchange_bonus: 0,
    };

    setFormExShowroom(String(p.ex_showroom_price));
    setFormRtoTax(String(p.rto_road_tax));
    setFormInsurance(String(p.insurance_amount));
    setFormFastag(String(p.fastag_charges));
    setFormTcs(String(p.tcs_amount));
    setFormAccessories(String(p.accessories_amount));
    setFormWarranty(String(p.extended_warranty_amount));
    setFormOtherCharges(String(p.other_charges));

    setFormDealerDiscount(String(p.dealer_discount));
    setFormManufacturerOffer(String(p.manufacturer_offer));
    setFormExchangeBonus(String(p.exchange_bonus));

    setFormDeliveryDays(String(quote.delivery_timeline_days || 14));
    setFormValidDays("14");
    setFormTerms(quote.dealership_terms || "Standard commercial quotation.");
    setFormRevisionNotes(`Revised Version ${(quote.version || 1) + 1} terms updated.`);
    setFormError(null);
    setIsBuilderOpen(true);
  };

  // When model changes in builder, update variant and auto-calculate defaults
  const handleModelChange = (modelId: string) => {
    setFormModelId(modelId);
    const modelVars = variants.filter((v) => v.model_id === modelId);
    if (modelVars.length > 0) {
      handleVariantChange(modelVars[0].id);
    }
  };

  // When variant changes, auto-fill base price and standard taxes
  const handleVariantChange = (variantId: string) => {
    setFormVariantId(variantId);
    const v = variants.find((item) => item.id === variantId);
    if (v) {
      const base = v.official_ex_showroom_price || 800000;
      setFormExShowroom(String(base));
      setFormRtoTax(String(Math.round(base * 0.14)));
      setFormInsurance(String(Math.round(base * 0.035 + 12000)));
      setFormTcs(base > 1000000 ? String(Math.round(base * 0.01)) : "0");
      if (v.colours && v.colours.length > 0) {
        setFormColour(v.colours[0].name);
      }
    }
  };

  // When lead is selected, auto-populate customer details
  const handleLeadSelect = (leadId: string) => {
    setFormSelectedLeadId(leadId);
    const selected = leads.find((l) => l.id === leadId);
    if (selected) {
      setFormCustomerName(selected.customer_name || "");
      setFormCustomerPhone(selected.customer_phone || "");
      setFormCustomerEmail(selected.customer_email || "");
      setFormCustomerCity(selected.city || "Bengaluru");
      if (selected.branch_id) {
        setFormBranchId(selected.branch_id);
      }
    }
  };

  // When group opportunity is selected, auto-populate group details
  const handleGroupSelect = (groupId: string) => {
    setFormSelectedGroupId(groupId);
    const selected = groups.find((g) => g.id === groupId);
    if (selected) {
      setFormCustomerName(`Collective Demand Pool (${selected.group_code})`);
      setFormCustomerCity(selected.city);
      setFormDeliveryDays(String(selected.target_delivery_window_days || 14));
      // Auto-set model if matches
      const matchedModel = models.find((m) => m.name.toLowerCase() === selected.model_name.toLowerCase());
      if (matchedModel) {
        handleModelChange(matchedModel.id);
      }
    }
  };

  // Save / Submit Quotation Handler
  const handleSaveQuotation = async (statusToSet: "DRAFT" | "SUBMITTED") => {
    setFormError(null);

    if (!formBranchId) {
      setFormError("Please select a target showroom branch.");
      return;
    }

    if (!formModelId || !formVariantId) {
      setFormError("Please select a vehicle model and variant.");
      return;
    }

    if (calculatedPricing.isExcessiveDiscount) {
      setFormError("Total discounts cannot exceed the vehicle's ex-showroom price.");
      return;
    }

    if (statusToSet === "SUBMITTED" && !isAuthorizedToSubmit) {
      setFormError("Access Denied: Your staff role lacks authority to submit binding offers. You can save as DRAFT.");
      return;
    }

    setIsSavingQuote(true);

    try {
      const selectedModelObj = models.find((m) => m.id === formModelId);
      const selectedVariantObj = variants.find((v) => v.id === formVariantId);
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + (parseInt(formValidDays, 10) || 14));

      if (editingQuotation) {
        // Update existing quotation
        const updatePayload: UpdateQuotationPayload = {
          branch_id: formBranchId,
          ex_showroom_price: parseInt(formExShowroom, 10) || 0,
          rto_road_tax: parseInt(formRtoTax, 10) || 0,
          insurance_amount: parseInt(formInsurance, 10) || 0,
          fastag_charges: parseInt(formFastag, 10) || 0,
          tcs_amount: parseInt(formTcs, 10) || 0,
          accessories_amount: parseInt(formAccessories, 10) || 0,
          extended_warranty_amount: parseInt(formWarranty, 10) || 0,
          other_charges: parseInt(formOtherCharges, 10) || 0,
          dealer_discount: parseInt(formDealerDiscount, 10) || 0,
          manufacturer_offer: parseInt(formManufacturerOffer, 10) || 0,
          exchange_bonus: parseInt(formExchangeBonus, 10) || 0,
          delivery_timeline_days: parseInt(formDeliveryDays, 10) || 14,
          valid_until: validUntilDate.toISOString(),
          dealership_terms: formTerms.trim(),
          colour: formColour,
          revision_notes: formRevisionNotes.trim() || undefined,
        };

        await dealerApi.updateQuotation(editingQuotation.id, updatePayload);
      } else {
        // Create new quotation
        const selectedGroupObj = groups.find((g) => g.id === formSelectedGroupId);
        const createPayload: CreateQuotationPayload = {
          branch_id: formBranchId,
          lead_id: formLinkType === "LEAD" ? formSelectedLeadId || null : null,
          group_id: formLinkType === "GROUP" ? formSelectedGroupId || null : null,
          group_code: formLinkType === "GROUP" ? selectedGroupObj?.group_code || null : null,
          customer_name: formCustomerName.trim() || undefined,
          customer_phone: formCustomerPhone.trim() || undefined,
          customer_email: formCustomerEmail.trim() || undefined,
          customer_city: formCustomerCity.trim() || "Bengaluru",
          model_id: formModelId,
          model_name: selectedModelObj?.name || "Vehicle Model",
          variant_id: formVariantId,
          variant_name: selectedVariantObj?.name || "Standard Variant",
          fuel_type: selectedVariantObj?.fuel_type || "Petrol",
          transmission: selectedVariantObj?.transmission_type || "Manual",
          colour: formColour,
          ex_showroom_price: parseInt(formExShowroom, 10) || 0,
          rto_road_tax: parseInt(formRtoTax, 10) || 0,
          insurance_amount: parseInt(formInsurance, 10) || 0,
          fastag_charges: parseInt(formFastag, 10) || 0,
          tcs_amount: parseInt(formTcs, 10) || 0,
          accessories_amount: parseInt(formAccessories, 10) || 0,
          extended_warranty_amount: parseInt(formWarranty, 10) || 0,
          other_charges: parseInt(formOtherCharges, 10) || 0,
          dealer_discount: parseInt(formDealerDiscount, 10) || 0,
          manufacturer_offer: parseInt(formManufacturerOffer, 10) || 0,
          exchange_bonus: parseInt(formExchangeBonus, 10) || 0,
          delivery_timeline_days: parseInt(formDeliveryDays, 10) || 14,
          valid_until: validUntilDate.toISOString(),
          dealership_terms: formTerms.trim(),
          status: statusToSet,
        };

        await dealerApi.createQuotation(createPayload);
      }

      setIsBuilderOpen(false);
      await fetchQuotationsData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save quotation.";
      setFormError(msg);
    } finally {
      setIsSavingQuote(false);
    }
  };

  // Submit Draft Quotation
  const handleSubmitDraft = async (quote: DealerQuotation) => {
    if (!isAuthorizedToSubmit) {
      alert("Access Denied: Only Dealer Owners, Branch Managers, or Sales Managers can submit binding offers.");
      return;
    }
    const confirmSubmit = window.confirm(
      `Submit quotation ${quote.quotation_number || quote.id} as an active binding offer?`
    );
    if (!confirmSubmit) return;

    try {
      await dealerApi.submitDraftQuotation(quote.id);
      await fetchQuotationsData(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit quotation.");
    }
  };

  // Accept Quotation
  const handleAcceptQuotation = async (quote: DealerQuotation) => {
    const confirmAccept = window.confirm(
      `Mark quotation ${quote.quotation_number || quote.id} as accepted for vehicle fulfillment?`
    );
    if (!confirmAccept) return;

    try {
      await dealerApi.acceptQuotation(quote.id);
      await fetchQuotationsData(true);
      if (previewQuotation?.id === quote.id) {
        setPreviewQuotation(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept quotation.");
    }
  };

  // Open Cancel Modal
  const handleOpenCancelModal = (quote: DealerQuotation) => {
    if (quote.quotation_status === "ACCEPTED") {
      alert("Cannot cancel a quotation that has already been accepted.");
      return;
    }
    setCancelModalQuote(quote);
    setCancelReason("");
    setCancelError(null);
  };

  // Confirm Cancellation
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalQuote) return;
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancelling this quotation.");
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      await dealerApi.cancelQuotation(cancelModalQuote.id, { reason: cancelReason.trim() });
      setCancelModalQuote(null);
      await fetchQuotationsData(true);
      if (previewQuotation?.id === cancelModalQuote.id) {
        setPreviewQuotation(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel quotation.";
      setCancelError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  // Open History Drawer
  const handleOpenHistoryDrawer = async (quote: DealerQuotation) => {
    setHistoryQuotation(quote);
    setIsLoadingHistory(true);
    setHistoryLogs([]);
    try {
      const res = await dealerApi.getQuotationHistory(quote.id);
      setHistoryLogs(res.data || quote.history || []);
    } catch (err) {
      setHistoryLogs(quote.history || []);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper for Status Badges
  const renderStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300">Draft</Badge>;
      case "SUBMITTED":
        return <Badge variant="default" className="bg-blue-600 text-white">Active Offer</Badge>;
      case "REVISED":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">Revised</Badge>;
      case "ACCEPTED":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">Accepted</Badge>;
      case "REJECTED":
        return <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-300">Rejected</Badge>;
      case "EXPIRED":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-300">Expired</Badge>;
      case "CANCELLED_BY_DEALER":
        return <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtered quotations list
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (selectedLinkageType === "LEAD" && !q.lead_id) return false;
      if (selectedLinkageType === "GROUP" && !q.group_id) return false;
      if (selectedLinkageType === "DIRECT" && (q.lead_id || q.group_id)) return false;
      return true;
    });
  }, [quotations, selectedLinkageType]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedStatus !== "ALL" ||
    selectedBranchId !== "ALL" ||
    selectedLinkageType !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedBranchId("ALL");
    setSelectedLinkageType("ALL");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600 mr-2" />
            Quotation & Commercial Offer Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Build itemized on-road price quotations, calculate mandatory taxes, manage validity, and track binding offers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchQuotationsData(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNewBuilder}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Quotes</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {summary ? summary.total_quotations : quotations.length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Across dealership</p>
        </Card>

        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Drafts</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {summary
              ? summary.draft_count
              : quotations.filter((q) => q.quotation_status === "DRAFT").length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Under preparation</p>
        </Card>

        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Offers</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700">
            {summary
              ? summary.submitted_count
              : quotations.filter((q) => ["SUBMITTED", "REVISED"].includes(q.quotation_status)).length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Binding & valid</p>
        </Card>

        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Accepted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {summary
              ? summary.accepted_count
              : quotations.filter((q) => q.quotation_status === "ACCEPTED").length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Confirmed bookings</p>
        </Card>

        <Card className="p-3 bg-white border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pipeline Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-indigo-700 truncate">
            {summary
              ? formatINR(summary.total_pipeline_value)
              : formatINR(
                  quotations
                    .filter((q) => ["SUBMITTED", "REVISED", "ACCEPTED"].includes(q.quotation_status))
                    .reduce((sum, q) => sum + (q.pricing?.final_on_road_price || q.net_on_road_price || 0), 0)
                )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Net on-road volume</p>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="relative md:col-span-5">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search reference #, model, variant, customer, group code..."
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

            {/* Branch Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Showroom Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-md py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Active Offer</option>
                <option value="REVISED">Revised</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="CANCELLED_BY_DEALER">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            {/* Linkage Type */}
            <div className="md:col-span-2">
              <select
                value={selectedLinkageType}
                onChange={(e) => setSelectedLinkageType(e.target.value as any)}
                className="w-full text-sm border border-slate-200 rounded-md py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Quotation Types</option>
                <option value="LEAD">Linked to Enquiries</option>
                <option value="GROUP">Linked to Buyer Pools</option>
                <option value="DIRECT">Direct / Standalone</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Filtered view: Showing {filteredQuotations.length} of {quotations.length} quotations
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                Reset filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Card */}
      {error && <ErrorCard title="Error Loading Quotations" message={error} onRetry={() => fetchQuotationsData()} />}

      {/* Quotations Listing */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filteredQuotations.length === 0 ? (
        <EmptyState
          title="No Quotations Found"
          description="No quotations match your current search and filter criteria. Create a new quotation to get started."
          actionLabel="Create Quotation"
          onAction={handleOpenNewBuilder}
        />
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Reference & Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Target / Linkage</TableHead>
                <TableHead className="font-semibold text-slate-700">Vehicle & Trim</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Pricing Breakdown</TableHead>
                <TableHead className="font-semibold text-slate-700">Delivery & Validity</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quote) => {
                const p = quote.pricing;
                const finalOnRoad = p?.final_on_road_price || quote.net_on_road_price || 0;
                const totalSavings = p?.total_discounts || quote.total_group_discount || 0;
                const exShowroom = p?.ex_showroom_price || 0;

                const isLocked = ["ACCEPTED", "EXPIRED", "CANCELLED_BY_DEALER"].includes(quote.quotation_status);

                return (
                  <TableRow key={quote.id} className="hover:bg-slate-50/50">
                    {/* Reference & Status */}
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {quote.quotation_number || quote.id}
                          </span>
                          <span className="text-xs px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            v{quote.version || 1}
                          </span>
                        </div>
                        <div>{renderStatusBadge(quote.quotation_status)}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(quote.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </TableCell>

                    {/* Target / Linkage */}
                    <TableCell className="align-top">
                      <div className="space-y-1 text-xs">
                        {quote.lead_id ? (
                          <div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <User className="w-2.5 h-2.5 mr-1" />
                              Customer Enquiry
                            </span>
                            <div className="font-medium text-slate-900 mt-0.5">
                              {quote.customer_name || "Customer"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {quote.customer_city || quote.city}
                            </div>
                          </div>
                        ) : quote.group_id ? (
                          <div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <Users className="w-2.5 h-2.5 mr-1" />
                              Buyer Pool {quote.group_code || ""}
                            </span>
                            <div className="font-medium text-slate-900 mt-0.5">
                              {quote.customer_name || "Pooled Demand"}
                            </div>
                            <div className="text-xs text-slate-500">{quote.city}</div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                              Direct Showroom
                            </span>
                            <div className="font-medium text-slate-900 mt-0.5">
                              {quote.customer_name || "Retail Buyer"}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-slate-400">{quote.branch_name}</div>
                      </div>
                    </TableCell>

                    {/* Vehicle & Trim */}
                    <TableCell className="align-top">
                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-slate-900">{quote.model_name}</div>
                        <div className="text-slate-600 font-medium">
                          {quote.variant_name || "Standard Variant"}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5">
                          {quote.fuel_type && <span>{quote.fuel_type}</span>}
                          {quote.transmission && <span>• {quote.transmission}</span>}
                          {quote.colour && <span>• {quote.colour}</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Pricing Breakdown Snapshot */}
                    <TableCell className="align-top text-right">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-slate-900">
                          {formatINR(finalOnRoad)}
                        </div>
                        {exShowroom > 0 && (
                          <div className="text-xs text-slate-400">
                            Ex-Showroom: {formatINR(exShowroom)}
                          </div>
                        )}
                        {totalSavings > 0 && (
                          <div className="text-xs font-semibold text-emerald-700">
                            Total Savings: {formatINR(totalSavings)}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Delivery & Validity */}
                    <TableCell className="align-top">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Delivery: {quote.delivery_timeline_days} days</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            Valid till:{" "}
                            {new Date(quote.valid_until).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewQuotation(quote)}
                          title="View / Print Quotation Preview"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {!isLocked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditBuilder(quote)}
                            title="Edit / Revise Quotation"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}

                        {quote.quotation_status === "DRAFT" && isAuthorizedToSubmit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmitDraft(quote)}
                            title="Submit as Active Offer"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}

                        {["SUBMITTED", "REVISED"].includes(quote.quotation_status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAcceptQuotation(quote)}
                            title="Mark Accepted"
                            className="h-8 w-8 p-0 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}

                        {!isLocked && isAuthorizedToSubmit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCancelModal(quote)}
                            title="Cancel Quotation"
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenHistoryDrawer(quote)}
                          title="Audit History"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* MODAL 1: Professional Quotation Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>{editingQuotation ? "Revise Existing Quotation" : "Create New Vehicle Quotation"}</span>
                  {editingQuotation && (
                    <Badge variant="outline" className="text-xs">
                      v{(editingQuotation.version || 1) + 1}
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Itemized on-road pricing engine with mandatory taxes and dealership commercial terms.
                </p>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Showroom Branch & Vehicle Selection */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>1. Showroom Branch & Vehicle Selection</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Fulfilling Branch *</label>
                    <select
                      value={formBranchId}
                      onChange={(e) => setFormBranchId(e.target.value)}
                      className="mt-1 w-full text-sm border border-slate-200 rounded-md py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Vehicle Model *</label>
                    <select
                      value={formModelId}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="mt-1 w-full text-sm border border-slate-200 rounded-md py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.brand_name} - {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Variant & Trim *</label>
                    <select
                      value={formVariantId}
                      onChange={(e) => handleVariantChange(e.target.value)}
                      className="mt-1 w-full text-sm border border-slate-200 rounded-md py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {availableVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.fuel_type} {v.transmission_type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Exterior Body Colour</label>
                    {currentVariant?.colours && currentVariant.colours.length > 0 ? (
                      <select
                        value={formColour}
                        onChange={(e) => setFormColour(e.target.value)}
                        className="mt-1 w-full text-sm border border-slate-200 rounded-md py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {currentVariant.colours.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type="text"
                        value={formColour}
                        onChange={(e) => setFormColour(e.target.value)}
                        placeholder="e.g. Pearl Arctic White"
                        className="mt-1"
                      />
                    )}
                  </div>

                  <div className="flex items-center text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/80">
                    {currentVariant ? (
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">
                          {currentVariant.engine_description || "Standard Engine"}
                        </span>
                        <div>
                          Power: {currentVariant.power_ps || "103 PS"} | Mileage: {currentVariant.arai_mileage || "20 kmpl"}
                        </div>
                      </div>
                    ) : (
                      <span>Select variant to see official catalogue specifications.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Linkage to Customer Lead or Collective Group */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>2. Linkage to Customer Enquiry or Buyer Pool</span>
                </h3>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormLinkType("DIRECT")}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      formLinkType === "DIRECT"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Direct Retail Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLinkType("LEAD")}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      formLinkType === "LEAD"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Link to Active Lead (CRM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLinkType("GROUP")}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      formLinkType === "GROUP"
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Link to Buyer Pool (Demand)
                  </button>
                </div>

                {formLinkType === "LEAD" && (
                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 space-y-1">
                    <label className="text-xs font-semibold text-blue-900">Select Customer Enquiry</label>
                    <select
                      value={formSelectedLeadId}
                      onChange={(e) => handleLeadSelect(e.target.value)}
                      className="w-full text-sm border border-blue-200 rounded-md py-2 px-3 bg-white text-slate-800"
                    >
                      <option value="">Choose Enquiry</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.customer_name} ({l.customer_phone}) - Interested in {l.model_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formLinkType === "GROUP" && (
                  <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100 space-y-1">
                    <label className="text-xs font-semibold text-purple-900">Select Buyer Pool</label>
                    <select
                      value={formSelectedGroupId}
                      onChange={(e) => handleGroupSelect(e.target.value)}
                      className="w-full text-sm border border-purple-200 rounded-md py-2 px-3 bg-white text-slate-800"
                    >
                      <option value="">Choose Buyer Group</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.group_code} - {g.model_name} ({g.current_members_count} verified buyers, {g.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Customer / Entity Name</label>
                    <Input
                      type="text"
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      placeholder="e.g. Amit Sharma"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Contact Phone</label>
                    <Input
                      type="text"
                      value={formCustomerPhone}
                      onChange={(e) => setFormCustomerPhone(e.target.value)}
                      placeholder="+91 98450..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Contact Email</label>
                    <Input
                      type="email"
                      value={formCustomerEmail}
                      onChange={(e) => setFormCustomerEmail(e.target.value)}
                      placeholder="customer@domain.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">City / District</label>
                    <Input
                      type="text"
                      value={formCustomerCity}
                      onChange={(e) => setFormCustomerCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Itemized Pricing Components (The Pricing Engine) */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>3. Itemized Pricing Breakdown (INR)</span>
                  </span>
                  <span className="text-xs text-slate-500 font-normal">
                    TCS 1% applies automatically on ex-showroom &gt; ₹10,00,000
                  </span>
                </h3>

                {/* Pricing Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* Base Charges */}
                  <div>
                    <label className="font-semibold text-slate-700">Ex-Showroom Price *</label>
                    <Input
                      type="number"
                      value={formExShowroom}
                      onChange={(e) => setFormExShowroom(e.target.value)}
                      className="mt-1 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">RTO & Road Tax *</label>
                    <Input
                      type="number"
                      value={formRtoTax}
                      onChange={(e) => setFormRtoTax(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Motor Insurance *</label>
                    <Input
                      type="number"
                      value={formInsurance}
                      onChange={(e) => setFormInsurance(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">FASTag & RFID</label>
                    <Input
                      type="number"
                      value={formFastag}
                      onChange={(e) => setFormFastag(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Add-on Charges */}
                  <div>
                    <label className="font-semibold text-slate-700">TCS (1% if &gt; 10L)</label>
                    <Input
                      type="number"
                      value={formTcs}
                      onChange={(e) => setFormTcs(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Official Accessories</label>
                    <Input
                      type="number"
                      value={formAccessories}
                      onChange={(e) => setFormAccessories(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Extended Warranty</label>
                    <Input
                      type="number"
                      value={formWarranty}
                      onChange={(e) => setFormWarranty(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Other / Logistics</label>
                    <Input
                      type="number"
                      value={formOtherCharges}
                      onChange={(e) => setFormOtherCharges(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Deductions & Discounts */}
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                    Approved Benefits & Promotional Deductions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700">Dealer Discount / Group Benefit</label>
                      <Input
                        type="number"
                        value={formDealerDiscount}
                        onChange={(e) => setFormDealerDiscount(e.target.value)}
                        className="mt-1 text-emerald-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Manufacturer OEM Consumer Scheme</label>
                      <Input
                        type="number"
                        value={formManufacturerOffer}
                        onChange={(e) => setFormManufacturerOffer(e.target.value)}
                        className="mt-1 text-emerald-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Exchange Bonus</label>
                      <Input
                        type="number"
                        value={formExchangeBonus}
                        onChange={(e) => setFormExchangeBonus(e.target.value)}
                        className="mt-1 text-emerald-700 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Automatic Live Calculation Bar */}
                <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
                  <div className="space-y-0.5">
                    <span className="text-xs uppercase tracking-wider text-slate-400">
                      Calculated Final On-Road Net Price
                    </span>
                    <div className="text-3xl font-extrabold text-white">
                      {formatINR(calculatedPricing.netOnRoad)}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-300">
                    <div>
                      <div className="text-slate-400 text-xs">Gross On-Road:</div>
                      <div className="font-semibold text-white">{formatINR(calculatedPricing.gross)}</div>
                    </div>
                    <div className="text-emerald-400">
                      <div className="text-xs text-emerald-300">Total Deductions:</div>
                      <div className="font-bold">-{formatINR(calculatedPricing.totalDiscounts)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Delivery, Validity, and Terms */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>4. Delivery Commitment & Commercial Terms</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700">Estimated Delivery SLA (Calendar Days) *</label>
                    <Input
                      type="number"
                      min="1"
                      max="180"
                      value={formDeliveryDays}
                      onChange={(e) => setFormDeliveryDays(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Quotation Validity Period (Days) *</label>
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={formValidDays}
                      onChange={(e) => setFormValidDays(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-700">Dealership Commercial Terms & Conditions</label>
                  <textarea
                    rows={2}
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                {editingQuotation && (
                  <div className="space-y-1 text-xs pt-1">
                    <label className="font-semibold text-slate-700">Revision Notes (Audit History Entry)</label>
                    <Input
                      type="text"
                      value={formRevisionNotes}
                      onChange={(e) => setFormRevisionNotes(e.target.value)}
                      placeholder="e.g. Adjusted dealer discount by INR 15,000 to match regional offer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white z-20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBuilderOpen(false)}
                disabled={isSavingQuote}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveQuotation("DRAFT")}
                  disabled={isSavingQuote}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Save as Draft
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveQuotation("SUBMITTED")}
                  isLoading={isSavingQuote}
                  disabled={!isAuthorizedToSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isAuthorizedToSubmit ? (
                    editingQuotation ? "Save & Publish Revision" : "Submit Binding Offer"
                  ) : (
                    "Save Draft (Staff Mode)"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Official Quotation Preview / Print Sheet */}
      {previewQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10 print:hidden">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-800">Quotation Preview</span>
                <span className="text-slate-400">•</span>
                <span>{previewQuotation.quotation_number || previewQuotation.id}</span>
                {renderStatusBadge(previewQuotation.quotation_status)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8 text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </Button>
                <button
                  onClick={() => setPreviewQuotation(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Sheet Document */}
            <div className="p-8 space-y-6 text-slate-900 bg-white">
              {/* Dealership Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-6 border-b border-slate-200 gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {dealer?.trade_name || "Kalyani Motors Maruti Suzuki"}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md">
                    {previewQuotation.branch_name || "Authorized Dealership Showroom & Delivery Centre"}
                  </p>
                  <p className="text-xs text-slate-500">
                    GSTIN: {dealer?.gstin || "29AABCK1234F1Z5"} | CIN: U50100KA2005PTC035123
                  </p>
                </div>
                <div className="text-left sm:text-right space-y-1">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded font-mono text-xs font-bold">
                    {previewQuotation.quotation_number || previewQuotation.id}
                  </span>
                  <p className="text-xs text-slate-500">Version: {previewQuotation.version || 1}</p>
                  <p className="text-xs text-slate-500">
                    Date: {new Date(previewQuotation.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Customer and Vehicle Snapshot */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    Customer / Collective Group
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {previewQuotation.customer_name || "Retail Customer"}
                  </div>
                  {previewQuotation.customer_phone && <div>Phone: {previewQuotation.customer_phone}</div>}
                  {previewQuotation.customer_email && <div>Email: {previewQuotation.customer_email}</div>}
                  <div>Location: {previewQuotation.customer_city || previewQuotation.city || "Bengaluru"}</div>
                </div>

                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    Vehicle Specifications
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {previewQuotation.model_name}
                  </div>
                  <div className="font-semibold text-slate-700">
                    {previewQuotation.variant_name || "Standard Trim"}
                  </div>
                  <div>
                    Fuel: {previewQuotation.fuel_type || "Petrol"} | Trans: {previewQuotation.transmission || "Manual"}
                  </div>
                  <div>Colour: {previewQuotation.colour || "Standard"}</div>
                </div>
              </div>

              {/* Itemized Pricing Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Itemized On-Road Price Breakdown
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-100/75 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700">Component</th>
                        <th className="py-2.5 px-3 text-left font-semibold text-slate-700">Category</th>
                        <th className="py-2.5 px-3 text-right font-semibold text-slate-700">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-3 font-medium">Ex-Showroom Price</td>
                        <td className="py-2 px-3 text-slate-500">Official Base Price</td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {formatINR(previewQuotation.pricing?.ex_showroom_price || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">RTO Road Tax & Registration</td>
                        <td className="py-2 px-3 text-slate-500">Statutory Tax</td>
                        <td className="py-2 px-3 text-right">
                          {formatINR(previewQuotation.pricing?.rto_road_tax || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">Motor Comprehensive Insurance (1+3 Yr)</td>
                        <td className="py-2 px-3 text-slate-500">Mandatory Insurance</td>
                        <td className="py-2 px-3 text-right">
                          {formatINR(previewQuotation.pricing?.insurance_amount || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">FASTag RFID Tag</td>
                        <td className="py-2 px-3 text-slate-500">Mandatory Toll Pass</td>
                        <td className="py-2 px-3 text-right">
                          {formatINR(previewQuotation.pricing?.fastag_charges || 500)}
                        </td>
                      </tr>
                      {(previewQuotation.pricing?.tcs_amount || 0) > 0 && (
                        <tr>
                          <td className="py-2 px-3">TCS (Tax Collected at Source - 1%)</td>
                          <td className="py-2 px-3 text-slate-500">Statutory IT Tax</td>
                          <td className="py-2 px-3 text-right">
                            {formatINR(previewQuotation.pricing?.tcs_amount || 0)}
                          </td>
                        </tr>
                      )}
                      {(previewQuotation.pricing?.accessories_amount || 0) > 0 && (
                        <tr>
                          <td className="py-2 px-3">Official OEM Accessories Package</td>
                          <td className="py-2 px-3 text-slate-500">Add-on Equipment</td>
                          <td className="py-2 px-3 text-right">
                            {formatINR(previewQuotation.pricing?.accessories_amount || 0)}
                          </td>
                        </tr>
                      )}
                      {(previewQuotation.pricing?.extended_warranty_amount || 0) > 0 && (
                        <tr>
                          <td className="py-2 px-3">Extended Warranty Protection</td>
                          <td className="py-2 px-3 text-slate-500">Add-on Coverage</td>
                          <td className="py-2 px-3 text-right">
                            {formatINR(previewQuotation.pricing?.extended_warranty_amount || 0)}
                          </td>
                        </tr>
                      )}
                      {(previewQuotation.pricing?.other_charges || 0) > 0 && (
                        <tr>
                          <td className="py-2 px-3">Incidental & Logistics Charges</td>
                          <td className="py-2 px-3 text-slate-500">Documentation</td>
                          <td className="py-2 px-3 text-right">
                            {formatINR(previewQuotation.pricing?.other_charges || 0)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-50 font-bold border-t border-slate-200">
                        <td className="py-2.5 px-3" colSpan={2}>Gross On-Road Total</td>
                        <td className="py-2.5 px-3 text-right text-slate-900">
                          {formatINR(previewQuotation.pricing?.gross_on_road_price || 0)}
                        </td>
                      </tr>
                      {(previewQuotation.pricing?.dealer_discount || previewQuotation.total_group_discount || 0) > 0 && (
                        <tr className="text-emerald-700">
                          <td className="py-2 px-3">Less: Dealership Exclusive Group Benefit</td>
                          <td className="py-2 px-3">Dealership Discount</td>
                          <td className="py-2 px-3 text-right font-semibold">
                            -{formatINR(previewQuotation.pricing?.dealer_discount || previewQuotation.total_group_discount || 0)}
                          </td>
                        </tr>
                      )}
                      {(previewQuotation.pricing?.manufacturer_offer || 0) > 0 && (
                        <tr className="text-emerald-700">
                          <td className="py-2 px-3">Less: Manufacturer OEM Consumer Scheme</td>
                          <td className="py-2 px-3">OEM Scheme</td>
                          <td className="py-2 px-3 text-right font-semibold">
                            -{formatINR(previewQuotation.pricing?.manufacturer_offer || 0)}
                          </td>
                        </tr>
                      )}
                      {(previewQuotation.pricing?.exchange_bonus || 0) > 0 && (
                        <tr className="text-emerald-700">
                          <td className="py-2 px-3">Less: Vehicle Exchange Bonus</td>
                          <td className="py-2 px-3">Trade-in Benefit</td>
                          <td className="py-2 px-3 text-right font-semibold">
                            -{formatINR(previewQuotation.pricing?.exchange_bonus || 0)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-900 text-white font-extrabold text-sm border-t-2 border-slate-900">
                        <td className="py-3 px-3 uppercase tracking-wide" colSpan={2}>
                          NET PAYABLE ON-ROAD PRICE
                        </td>
                        <td className="py-3 px-3 text-right text-base text-emerald-400">
                          {formatINR(
                            previewQuotation.pricing?.final_on_road_price || previewQuotation.net_on_road_price || 0
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery and Validity SLA */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 text-xs border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-700">Delivery SLA Commitment:</span>
                  <p className="text-slate-600 mt-0.5">
                    Within {previewQuotation.delivery_timeline_days} calendar days from completion of RTO documentation.
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Quotation Validity:</span>
                  <p className="text-slate-600 mt-0.5">
                    Offer valid until{" "}
                    <strong>
                      {new Date(previewQuotation.valid_until).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* Terms and Signatures */}
              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                <p>
                  <strong>Terms & Conditions:</strong> {previewQuotation.dealership_terms}
                </p>
                <div className="pt-8 flex justify-between items-end text-xs text-slate-700">
                  <div>
                    <p className="font-semibold">Prepared by: {previewQuotation.created_by_name || "Sales Executive"}</p>
                    <p className="text-xs text-slate-400">Authorized Sales Representative</p>
                  </div>
                  <div className="text-right">
                    <p className="border-t border-slate-300 pt-1 font-semibold">Authorized Dealership Signatory</p>
                    <p className="text-xs text-slate-400">{dealer?.legal_entity_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
              <Button variant="outline" size="sm" onClick={() => setPreviewQuotation(null)}>
                Close Preview
              </Button>

              <div className="flex items-center gap-2">
                {!["ACCEPTED", "EXPIRED", "CANCELLED_BY_DEALER"].includes(previewQuotation.quotation_status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const q = previewQuotation;
                      setPreviewQuotation(null);
                      handleOpenEditBuilder(q);
                    }}
                    className="border-slate-300"
                  >
                    Edit / Revise
                  </Button>
                )}

                {["SUBMITTED", "REVISED"].includes(previewQuotation.quotation_status) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAcceptQuotation(previewQuotation)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Confirm & Accept
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Cancellation Confirmation Modal */}
      {cancelModalQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Vehicle Quotation</h3>
                <p className="text-xs text-slate-500">
                  {cancelModalQuote.quotation_number || cancelModalQuote.id} - {cancelModalQuote.model_name}
                </p>
              </div>
              <button
                onClick={() => setCancelModalQuote(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Reason for Cancellation *</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer selected alternate trim or purchased competitor vehicle."
                  className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalQuote(null)}
                  disabled={isCancelling}
                >
                  Keep Active
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isCancelling}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL 4: Quotation Audit History */}
      {historyQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">Quotation Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  {historyQuotation.quotation_number || historyQuotation.id} - {historyQuotation.model_name}
                </p>
              </div>
              <button
                onClick={() => setHistoryQuotation(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Immutable Audit Log:</strong> All revisions, price updates, submissions, and status changes
                  are chronologically preserved.
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading audit log...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No previous audit actions recorded for this quotation.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{log.action}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.details}</p>
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
              <Button variant="outline" size="sm" onClick={() => setHistoryQuotation(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
