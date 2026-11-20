"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Car,
  Tag,
  Building,
  RotateCcw,
  Eye,
  Edit,
  History,
  X,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  DollarSign,
  Calendar,
  Shield,
  Lock,
  UserPlus,
  ChevronRight,
  TrendingUp,
  FileText,
  User,
  ArrowRight,
  Share2,
} from "lucide-react";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  DealerLead,
  LeadStatus,
  PurchaseTimeline,
  FinancingPreference,
  LeadSource,
  LeadInternalNote,
  LeadActivityLog,
  DealerStaffMember,
  DealerBranch,
  CatalogueBrand,
  CatalogueModel,
  CatalogueVariant,
} from "@groupdrive/types";
import { formatINR, formatDate } from "@groupdrive/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { TableSkeleton } from "../../../components/feedback/loading-skeleton";
import { EmptyState } from "../../../components/feedback/empty-state";

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; badgeClass: string; borderClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  NEW_ENQUIRY: {
    label: "New Enquiry",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    borderClass: "border-indigo-400",
    icon: Clock,
  },
  CONTACTED: {
    label: "Contacted",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    borderClass: "border-blue-400",
    icon: Phone,
  },
  TEST_DRIVE_SCHEDULED: {
    label: "Test Drive Booked",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    borderClass: "border-amber-400",
    icon: Calendar,
  },
  TEST_DRIVE_COMPLETED: {
    label: "Test Drive Done",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    borderClass: "border-cyan-400",
    icon: CheckCircle2,
  },
  QUOTATION_SENT: {
    label: "Quotation Sent",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    borderClass: "border-purple-400",
    icon: FileText,
  },
  NEGOTIATION: {
    label: "In Negotiation",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    borderClass: "border-orange-400",
    icon: Tag,
  },
  WON_BOOKED: {
    label: "Won / Booked",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderClass: "border-emerald-400",
    icon: CheckCircle2,
  },
  LOST_CLOSED: {
    label: "Lost / Closed",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    borderClass: "border-rose-400",
    icon: XCircle,
  },
};

const TIMELINE_CONFIG: Record<PurchaseTimeline, { label: string; badgeClass: string }> = {
  IMMEDIATE: { label: "Immediate (0-7 days)", badgeClass: "bg-rose-100 text-rose-800 border-rose-200 font-semibold" },
  WITHIN_15_DAYS: { label: "Within 15 Days", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
  WITHIN_30_DAYS: { label: "Within 30 Days", badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
  EXPLORING_2_3_MONTHS: { label: "2-3 Months", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE_DIRECT: "Website Direct",
  BUYER_GROUP: "Buyer Group",
  SHOWROOM_WALK_IN: "Showroom Walk-in",
  PHONE_INQUIRY: "Phone Inquiry",
  REFERRAL: "Customer Referral",
};

export default function LeadsPage() {
  const { user, branches, currentBranch, capabilities } = useAuth();

  // State
  const [leads, setLeads] = useState<DealerLead[]>([]);
  const [staffList, setStaffList] = useState<DealerStaffMember[]>([]);
  const [brands, setBrands] = useState<CatalogueBrand[]>([]);
  const [models, setModels] = useState<CatalogueModel[]>([]);
  const [variants, setVariants] = useState<CatalogueVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [timelineFilter, setTimelineFilter] = useState("ALL");
  const [executiveFilter, setExecutiveFilter] = useState("ALL");

  // Modal controls
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<DealerLead | null>(null);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState<DealerLead | null>(null);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<DealerLead | null>(null);
  const [selectedLeadForNotes, setSelectedLeadForNotes] = useState<DealerLead | null>(null);
  const [selectedLeadForActivities, setSelectedLeadForActivities] = useState<DealerLead | null>(null);

  // Sub-data for modals
  const [currentLeadNotes, setCurrentLeadNotes] = useState<LeadInternalNote[]>([]);
  const [currentLeadActivities, setCurrentLeadActivities] = useState<LeadActivityLog[]>([]);
  const [isSubLoading, setIsSubLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    city: "Bengaluru",
    preferred_contact_method: "PHONE" as "PHONE" | "WHATSAPP" | "EMAIL",
    brand_name: "Maruti Suzuki",
    model_name: "",
    variant_name: "",
    fuel_type: "Petrol",
    transmission: "Manual",
    colour_preference: "",
    budget_min: "",
    budget_max: "",
    purchase_timeline: "WITHIN_15_DAYS" as PurchaseTimeline,
    financing_preference: "LOAN" as FinancingPreference,
    source: "SHOWROOM_WALK_IN" as LeadSource,
    branch_id: "",
    assigned_to_id: "",
    initial_note: "",
  });

  const [statusForm, setStatusForm] = useState<{
    status: LeadStatus;
    reason_or_notes: string;
    booked_voucher_code: string;
  }>({
    status: "CONTACTED",
    reason_or_notes: "",
    booked_voucher_code: "",
  });

  const [assignForm, setAssignForm] = useState({
    assigned_to_id: "",
    notes: "",
  });

  const [newNoteContent, setNewNoteContent] = useState("");

  // Role permissions
  const isDealerOwner = user?.staff_role === "DEALER_OWNER";
  const isBranchManager = user?.staff_role === "BRANCH_MANAGER";
  const isSalesManager = user?.staff_role === "SALES_MANAGER";
  const isSalesExecutive = user?.staff_role === "SALES_EXECUTIVE";
  const canReassignAny = isDealerOwner || isBranchManager || isSalesManager;

  // Initial Data Fetching
  const fetchLeads = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const effectiveBranchId = isDealerOwner
        ? branchFilter
        : (currentBranch?.id || user?.branch_id || "ALL");

      const [leadsRes, staffRes, brandsRes] = await Promise.all([
        dealerApi.getLeads({
          branchId: effectiveBranchId,
          status: statusFilter,
          timeline: timelineFilter,
          assignedToId: executiveFilter,
          search: searchQuery,
        }),
        dealerApi.getStaff({ branchId: effectiveBranchId !== "ALL" ? effectiveBranchId : undefined }),
        dealerApi.getCatalogueBrands(),
      ]);

      if (leadsRes.success) setLeads(leadsRes.data);
      if (staffRes.success) setStaffList(staffRes.data);
      if (brandsRes.success) setBrands(brandsRes.data);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to load enquiries and leads.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, branchFilter, timelineFilter, executiveFilter]);

  // Load models when brand changes in create form
  useEffect(() => {
    if (!createForm.brand_name) return;
    const selectedBrand = brands.find((b) => b.name.toLowerCase() === createForm.brand_name.toLowerCase());
    if (selectedBrand) {
      dealerApi.getCatalogueModels(selectedBrand.id).then((res) => {
        if (res.success) {
          setModels(res.data);
          if (res.data.length > 0 && !createForm.model_name) {
            setCreateForm((prev) => ({ ...prev, model_name: res.data[0].name }));
          }
        }
      });
    }
  }, [createForm.brand_name, brands]);

  // Load variants when model changes in create form
  useEffect(() => {
    if (!createForm.model_name) return;
    const selectedModel = models.find((m) => m.name.toLowerCase() === createForm.model_name.toLowerCase());
    if (selectedModel) {
      dealerApi.getCatalogueVariants({ modelId: selectedModel.id }).then((res) => {
        if (res.success) {
          setVariants(res.data);
          if (res.data.length > 0) {
            setCreateForm((prev) => ({
              ...prev,
              variant_name: res.data[0].name,
              fuel_type: res.data[0].fuel_type,
              transmission: res.data[0].transmission_type,
            }));
          }
        }
      });
    }
  }, [createForm.model_name, models]);

  // Search filter
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase().trim();
    return leads.filter(
      (l) =>
        l.customer_name.toLowerCase().includes(q) ||
        l.customer_phone.toLowerCase().includes(q) ||
        l.customer_email.toLowerCase().includes(q) ||
        l.model_name.toLowerCase().includes(q) ||
        (l.variant_name && l.variant_name.toLowerCase().includes(q)) ||
        l.id.toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  // KPI Summary Calculations
  const metrics = useMemo(() => {
    return {
      total: leads.length,
      new_enquiries: leads.filter((l) => l.status === "NEW_ENQUIRY").length,
      test_drives: leads.filter((l) => l.status === "TEST_DRIVE_SCHEDULED").length,
      negotiating: leads.filter((l) => l.status === "NEGOTIATION").length,
      won: leads.filter((l) => l.status === "WON_BOOKED").length,
      lost: leads.filter((l) => l.status === "LOST_CLOSED").length,
    };
  }, [leads]);

  // Handlers for Modals
  const openDetailModal = (lead: DealerLead) => {
    setSelectedLeadForDetail(lead);
  };

  const openStatusModal = (lead: DealerLead) => {
    setSelectedLeadForStatus(lead);
    setStatusForm({
      status: lead.status,
      reason_or_notes: "",
      booked_voucher_code: lead.booked_voucher_code || "",
    });
  };

  const openAssignModal = (lead: DealerLead) => {
    setSelectedLeadForAssign(lead);
    setAssignForm({
      assigned_to_id: lead.assigned_to_id || (isSalesExecutive ? (user?.id || "") : ""),
      notes: "",
    });
  };

  const openNotesModal = async (lead: DealerLead) => {
    setSelectedLeadForNotes(lead);
    setIsSubLoading(true);
    try {
      const res = await dealerApi.getLeadNotes(lead.id);
      if (res.success) {
        setCurrentLeadNotes(res.data);
      }
    } catch {
      // fallback
    } finally {
      setIsSubLoading(false);
    }
  };

  const openActivitiesModal = async (lead: DealerLead) => {
    setSelectedLeadForActivities(lead);
    setIsSubLoading(true);
    try {
      const res = await dealerApi.getLeadActivities(lead.id);
      if (res.success) {
        setCurrentLeadActivities(res.data);
      }
    } catch {
      // fallback
    } finally {
      setIsSubLoading(false);
    }
  };

  // Submit Handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetBranchId = createForm.branch_id || currentBranch?.id || branches[0]?.id;
    if (!targetBranchId) {
      setErrorMessage("Please select a showroom branch.");
      return;
    }

    try {
      const payload = {
        branch_id: targetBranchId,
        customer_name: createForm.customer_name,
        customer_phone: createForm.customer_phone,
        customer_email: createForm.customer_email,
        city: createForm.city,
        preferred_contact_method: createForm.preferred_contact_method,
        brand_name: createForm.brand_name,
        model_name: createForm.model_name,
        variant_name: createForm.variant_name || undefined,
        fuel_type: createForm.fuel_type || undefined,
        transmission: createForm.transmission || undefined,
        colour_preference: createForm.colour_preference || undefined,
        budget_min: createForm.budget_min ? parseInt(createForm.budget_min, 10) : undefined,
        budget_max: createForm.budget_max ? parseInt(createForm.budget_max, 10) : undefined,
        purchase_timeline: createForm.purchase_timeline,
        financing_preference: createForm.financing_preference,
        source: createForm.source,
        assigned_to_id: createForm.assigned_to_id || undefined,
        initial_note: createForm.initial_note || undefined,
      };

      const res = await dealerApi.createLead(payload);
      if (res.success) {
        setSuccessMessage(`Enquiry registered successfully for ${res.data.customer_name}.`);
        setIsCreateModalOpen(false);
        fetchLeads();
      }
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to create enquiry.";
      setErrorMessage(message);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForStatus) return;
    setErrorMessage(null);

    try {
      const res = await dealerApi.updateLeadStatus(selectedLeadForStatus.id, {
        status: statusForm.status,
        reason_or_notes: statusForm.reason_or_notes || undefined,
        booked_voucher_code: statusForm.booked_voucher_code || undefined,
      });

      if (res.success) {
        setSuccessMessage(`Lead status updated to ${STATUS_CONFIG[statusForm.status].label}.`);
        setSelectedLeadForStatus(null);
        fetchLeads();
      }
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to update lead status.";
      setErrorMessage(message);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForAssign) return;
    setErrorMessage(null);

    if (!assignForm.assigned_to_id) {
      setErrorMessage("Please select a sales staff member.");
      return;
    }

    try {
      const res = await dealerApi.assignLead(selectedLeadForAssign.id, {
        assigned_to_id: assignForm.assigned_to_id,
        notes: assignForm.notes || undefined,
      });

      if (res.success) {
        setSuccessMessage(`Lead assigned to ${res.data.assigned_to_name}.`);
        setSelectedLeadForAssign(null);
        fetchLeads();
      }
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to assign lead.";
      setErrorMessage(message);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForNotes || !newNoteContent.trim()) return;

    try {
      const res = await dealerApi.addLeadNote(selectedLeadForNotes.id, {
        content: newNoteContent.trim(),
      });

      if (res.success) {
        setCurrentLeadNotes((prev) => [...prev, res.data]);
        setNewNoteContent("");
        // update local lead count
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLeadForNotes.id ? { ...l, notes_count: (l.notes_count || 0) + 1 } : l))
        );
      }
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to add note.";
      setErrorMessage(message);
    }
  };

  const handleSelfClaim = async (lead: DealerLead) => {
    if (!user?.id) return;
    try {
      const res = await dealerApi.assignLead(lead.id, {
        assigned_to_id: user.id,
        notes: "Self-claimed from unassigned enquiries pool.",
      });
      if (res.success) {
        setSuccessMessage(`You have claimed lead for ${lead.customer_name}.`);
        fetchLeads();
      }
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Failed to claim lead.";
      setErrorMessage(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Enquiries & Customer Leads</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Live Showroom CRM
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track customer enquiries, test drives, purchase timelines, executive assignments, and vehicle conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setCreateForm({
                customer_name: "",
                customer_phone: "",
                customer_email: "",
                city: "Bengaluru",
                preferred_contact_method: "PHONE",
                brand_name: "Maruti Suzuki",
                model_name: "Brezza",
                variant_name: "ZXi Plus 1.5L AT",
                fuel_type: "Petrol",
                transmission: "Automatic",
                colour_preference: "Pearl Arctic White",
                budget_min: "1100000",
                budget_max: "1350000",
                purchase_timeline: "WITHIN_15_DAYS",
                financing_preference: "LOAN",
                source: "SHOWROOM_WALK_IN",
                branch_id: currentBranch?.id || branches[0]?.id || "",
                assigned_to_id: isSalesExecutive ? (user?.id || "") : "",
                initial_note: "",
              });
              setIsCreateModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Customer Enquiry</span>
          </Button>

          <Button variant="outline" onClick={fetchLeads} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Total Leads</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.total}</p>
            <span className="text-xs text-slate-400">All registered</span>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-indigo-700">New Enquiries</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{metrics.new_enquiries}</p>
            <span className="text-xs text-indigo-600 font-medium">Action pending</span>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-amber-700">Test Drives</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{metrics.test_drives}</p>
            <span className="text-xs text-amber-600">Active trials</span>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-orange-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-orange-700">In Negotiation</p>
            <p className="mt-1 text-2xl font-bold text-orange-900">{metrics.negotiating}</p>
            <span className="text-xs text-orange-600">High intent</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-emerald-700">Won / Booked</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{metrics.won}</p>
            <span className="text-xs text-emerald-600">Converted</span>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-rose-700">Lost / Closed</p>
            <p className="mt-1 text-2xl font-bold text-rose-900">{metrics.lost}</p>
            <span className="text-xs text-rose-600">Archived</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* Search Input */}
            <div className="relative md:col-span-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by customer, phone, email, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter by Lead Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW_ENQUIRY">New Enquiry</option>
                <option value="CONTACTED">Contacted</option>
                <option value="TEST_DRIVE_SCHEDULED">Test Drive Booked</option>
                <option value="TEST_DRIVE_COMPLETED">Test Drive Done</option>
                <option value="QUOTATION_SENT">Quotation Sent</option>
                <option value="NEGOTIATION">In Negotiation</option>
                <option value="WON_BOOKED">Won / Booked</option>
                <option value="LOST_CLOSED">Lost / Closed</option>
              </select>
            </div>

            {/* Branch Filter (for Dealer Owner) */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter by Showroom Branch"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                disabled={!isDealerOwner}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                {isDealerOwner ? (
                  <>
                    <option value="ALL">All Showrooms</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value={currentBranch?.id || ""}>{currentBranch?.branch_name || "My Branch"}</option>
                )}
              </select>
            </div>

            {/* Timeline Filter */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter by Purchase Timeline"
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Timelines</option>
                <option value="IMMEDIATE">Immediate (0-7 days)</option>
                <option value="WITHIN_15_DAYS">Within 15 Days</option>
                <option value="WITHIN_30_DAYS">Within 30 Days</option>
                <option value="EXPLORING_2_3_MONTHS">2-3 Months</option>
              </select>
            </div>

            {/* Executive Filter */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter by Assigned Executive"
                value={executiveFilter}
                onChange={(e) => setExecutiveFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Executives</option>
                <option value="unassigned">Unassigned Only</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.staff_role.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery || statusFilter !== "ALL" || branchFilter !== "ALL" || timelineFilter !== "ALL" || executiveFilter !== "ALL") && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
              <span>Filtered: showing {filteredLeads.length} of {leads.length} leads</span>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setBranchFilter("ALL");
                  setTimelineFilter("ALL");
                  setExecutiveFilter("ALL");
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main CRM Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={6} />
            </div>
          ) : filteredLeads.length === 0 ? (
            <EmptyState
              title="No enquiries or leads found"
              description="No customer records match your filter criteria or showroom scope."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setTimelineFilter("ALL");
                setExecutiveFilter("ALL");
              }}
            />
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Customer Details</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Vehicle & Variant</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Budget & Financing</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Timeline</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Branch</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Assigned Executive</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredLeads.map((lead) => {
                  const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW_ENQUIRY;
                  const StatusIcon = statusConf.icon;
                  const timelineConf = TIMELINE_CONFIG[lead.purchase_timeline] || TIMELINE_CONFIG.WITHIN_15_DAYS;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Customer Details */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{lead.customer_name}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <a
                            href={`tel:${lead.customer_phone}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{lead.customer_phone}</span>
                          </a>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">{lead.customer_email}</span>
                          <span className="text-xs uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {lead.preferred_contact_method || "PHONE"}
                          </span>
                        </div>
                      </td>

                      {/* Vehicle & Variant */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900">
                          {lead.brand_name} {lead.model_name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{lead.variant_name || "Variant Undecided"}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {lead.fuel_type && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                              {lead.fuel_type}
                            </span>
                          )}
                          {lead.transmission && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                              {lead.transmission}
                            </span>
                          )}
                          {lead.colour_preference && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                              {lead.colour_preference}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Budget & Financing */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {lead.budget_min && lead.budget_max
                            ? `${formatINR(lead.budget_min)} - ${formatINR(lead.budget_max)}`
                            : lead.budget_max
                            ? `Up to ${formatINR(lead.budget_max)}`
                            : "Flexible"}
                        </div>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 text-slate-700">
                            {lead.financing_preference}
                          </span>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${timelineConf.badgeClass}`}>
                          {timelineConf.label}
                        </span>
                        <div className="mt-1 text-xs text-slate-400">
                          Source: {SOURCE_LABELS[lead.source] || lead.source}
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                          <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{lead.branch_name || "Showroom"}</span>
                        </div>
                      </td>

                      {/* Assigned Executive */}
                      <td className="px-4 py-3.5">
                        {lead.assigned_to_id ? (
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{lead.assigned_to_name}</div>
                            <div className="text-xs text-slate-500">
                              {lead.assigned_to_role ? lead.assigned_to_role.replace("_", " ") : "Sales Executive"}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Unassigned
                            </span>
                            {isSalesExecutive && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelfClaim(lead)}
                                className="h-6 text-xs px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                Claim
                              </Button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConf.badgeClass}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConf.label}
                        </span>
                        {lead.booked_voucher_code && (
                          <div className="mt-1 text-xs font-mono text-emerald-700 font-semibold">
                            {lead.booked_voucher_code}
                          </div>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openDetailModal(lead)}
                            title="View Full Dossier"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openStatusModal(lead)}
                            title="Update Status"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </button>

                          {(canReassignAny || (isSalesExecutive && !lead.assigned_to_id)) && (
                            <button
                              onClick={() => openAssignModal(lead)}
                              title={lead.assigned_to_id ? "Reassign Executive" : "Assign Executive"}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => openNotesModal(lead)}
                            title={`Internal Notes (${lead.notes_count || 0})`}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded relative"
                          >
                            <MessageSquare className="h-4 w-4" />
                            {(lead.notes_count || 0) > 0 && (
                              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold">
                                {lead.notes_count}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => openActivitiesModal(lead)}
                            title="View Activity Audit Trail"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* MODAL 1: Create Enquiry */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Customer Enquiry</h3>
                <p className="text-xs text-slate-500">Capture genuine showroom walk-in, website, or group enquiry.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Section 1: Customer Contact */}
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Full Name *</label>
                    <Input
                      required
                      placeholder="e.g. Karthik Subramanian"
                      value={createForm.customer_name}
                      onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Phone Number *</label>
                    <Input
                      required
                      placeholder="e.g. +919845112233"
                      value={createForm.customer_phone}
                      onChange={(e) => setCreateForm({ ...createForm, customer_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Email Address *</label>
                    <Input
                      type="email"
                      required
                      placeholder="e.g. karthik@example.com"
                      value={createForm.customer_email}
                      onChange={(e) => setCreateForm({ ...createForm, customer_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Preferred Contact Method</label>
                    <select
                      aria-label="Preferred Contact Method"
                      value={createForm.preferred_contact_method}
                      onChange={(e) => setCreateForm({ ...createForm, preferred_contact_method: e.target.value as any })}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="PHONE">Phone Call</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">City</label>
                    <Input
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle & Preferences */}
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Vehicle of Interest</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Brand</label>
                    <select
                      aria-label="Vehicle Brand"
                      value={createForm.brand_name}
                      onChange={(e) => setCreateForm({ ...createForm, brand_name: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Model *</label>
                    <select
                      aria-label="Vehicle Model"
                      required
                      value={createForm.model_name}
                      onChange={(e) => setCreateForm({ ...createForm, model_name: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Variant / Trim</label>
                    <select
                      aria-label="Vehicle Variant"
                      value={createForm.variant_name}
                      onChange={(e) => {
                        const sel = variants.find((v) => v.name === e.target.value);
                        setCreateForm({
                          ...createForm,
                          variant_name: e.target.value,
                          fuel_type: sel?.fuel_type || createForm.fuel_type,
                          transmission: sel?.transmission_type || createForm.transmission,
                        });
                      }}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name} ({v.fuel_type} {v.transmission_type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Fuel Type</label>
                    <Input
                      value={createForm.fuel_type}
                      onChange={(e) => setCreateForm({ ...createForm, fuel_type: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Transmission</label>
                    <Input
                      value={createForm.transmission}
                      onChange={(e) => setCreateForm({ ...createForm, transmission: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Colour Preference</label>
                    <Input
                      placeholder="e.g. Pearl White"
                      value={createForm.colour_preference}
                      onChange={(e) => setCreateForm({ ...createForm, colour_preference: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Budget, Timeline & Financing */}
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Commercials & Purchase Plan</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Min Budget (INR)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 1100000"
                      value={createForm.budget_min}
                      onChange={(e) => setCreateForm({ ...createForm, budget_min: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Max Budget (INR)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 1350000"
                      value={createForm.budget_max}
                      onChange={(e) => setCreateForm({ ...createForm, budget_max: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Purchase Timeline</label>
                    <select
                      aria-label="Purchase Timeline"
                      value={createForm.purchase_timeline}
                      onChange={(e) => setCreateForm({ ...createForm, purchase_timeline: e.target.value as any })}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="IMMEDIATE">Immediate (0-7 days)</option>
                      <option value="WITHIN_15_DAYS">Within 15 Days</option>
                      <option value="WITHIN_30_DAYS">Within 30 Days</option>
                      <option value="EXPLORING_2_3_MONTHS">Exploring 2-3 Months</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Financing Plan</label>
                    <select
                      aria-label="Financing Preference"
                      value={createForm.financing_preference}
                      onChange={(e) => setCreateForm({ ...createForm, financing_preference: e.target.value as any })}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="LOAN">Auto Loan (Finance)</option>
                      <option value="CASH">Full Cash Down</option>
                      <option value="LEASE">Corporate Lease</option>
                      <option value="UNDECIDED">Undecided</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Showroom & Assignment */}
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Showroom & Lead Ownership</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Showroom Branch *</label>
                    <select
                      aria-label="Showroom Branch Selection"
                      value={createForm.branch_id || currentBranch?.id || branches[0]?.id || ""}
                      onChange={(e) => setCreateForm({ ...createForm, branch_id: e.target.value })}
                      disabled={!isDealerOwner}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm disabled:bg-slate-100"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Lead Source</label>
                    <select
                      aria-label="Lead Source Selection"
                      value={createForm.source}
                      onChange={(e) => setCreateForm({ ...createForm, source: e.target.value as any })}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="SHOWROOM_WALK_IN">Showroom Walk-in</option>
                      <option value="WEBSITE_DIRECT">Website Direct</option>
                      <option value="BUYER_GROUP">Buyer Group Enquiry</option>
                      <option value="PHONE_INQUIRY">Phone Inbound</option>
                      <option value="REFERRAL">Customer Referral</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Assign To Staff</label>
                    <select
                      aria-label="Assign Staff Member"
                      value={createForm.assigned_to_id}
                      onChange={(e) => setCreateForm({ ...createForm, assigned_to_id: e.target.value })}
                      disabled={isSalesExecutive}
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm disabled:bg-slate-100"
                    >
                      <option value="">Leave Unassigned</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} ({s.staff_role.replace("_", " ")})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-medium text-slate-700">Initial Sales Note</label>
                  <Input
                    placeholder="e.g. Customer interested in exchange bonus on old Dzire. Prefers Saturday test drive."
                    value={createForm.initial_note}
                    onChange={(e) => setCreateForm({ ...createForm, initial_note: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Register Enquiry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Lead Details & Dossier */}
      {selectedLeadForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedLeadForDetail.customer_name}</h3>
                  <Badge variant="outline" className={STATUS_CONFIG[selectedLeadForDetail.status].badgeClass}>
                    {STATUS_CONFIG[selectedLeadForDetail.status].label}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Lead Reference: {selectedLeadForDetail.id}</p>
              </div>
              <button onClick={() => setSelectedLeadForDetail(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer Contact Card */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100">
                <div>
                  <span className="text-xs font-medium text-slate-400">Phone</span>
                  <p className="text-sm font-semibold text-slate-800">{selectedLeadForDetail.customer_phone}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400">Email</span>
                  <p className="text-sm font-semibold text-slate-800">{selectedLeadForDetail.customer_email}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400">Preferred Channel</span>
                  <p className="text-sm font-medium text-slate-700">{selectedLeadForDetail.preferred_contact_method || "Phone"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400">City</span>
                  <p className="text-sm font-medium text-slate-700">{selectedLeadForDetail.city || "Bengaluru"}</p>
                </div>
              </div>

              {/* Vehicle Interest Dossier */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Vehicle Specification</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded border border-slate-200">
                    <span className="text-xs text-slate-400">Model</span>
                    <p className="text-sm font-bold text-slate-900">{selectedLeadForDetail.brand_name} {selectedLeadForDetail.model_name}</p>
                  </div>
                  <div className="p-3 rounded border border-slate-200">
                    <span className="text-xs text-slate-400">Variant</span>
                    <p className="text-sm font-bold text-slate-900">{selectedLeadForDetail.variant_name || "N/A"}</p>
                  </div>
                  <div className="p-3 rounded border border-slate-200">
                    <span className="text-xs text-slate-400">Colour</span>
                    <p className="text-sm font-bold text-slate-900">{selectedLeadForDetail.colour_preference || "Any Available"}</p>
                  </div>
                </div>
              </div>

              {/* Budget & Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Deal Economics</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded border border-slate-200">
                    <span className="text-xs text-slate-400">Budget Range</span>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedLeadForDetail.budget_min && selectedLeadForDetail.budget_max
                        ? `${formatINR(selectedLeadForDetail.budget_min)} - ${formatINR(selectedLeadForDetail.budget_max)}`
                        : "Open Budget"}
                    </p>
                  </div>
                  <div className="p-3 rounded border border-slate-200">
                    <span className="text-xs text-slate-400">Financing Method</span>
                    <p className="text-sm font-bold text-slate-900">{selectedLeadForDetail.financing_preference}</p>
                  </div>
                  <div className="p-3 rounded border border-slate-200">
                    <span className="text-xs text-slate-400">Purchase Timeline</span>
                    <p className="text-sm font-bold text-slate-900">{TIMELINE_CONFIG[selectedLeadForDetail.purchase_timeline]?.label || selectedLeadForDetail.purchase_timeline}</p>
                  </div>
                </div>
              </div>

              {/* Ownership & Origin Tracking */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Lead Ownership & Audit Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400">Origin Source:</span>{" "}
                    <span className="font-semibold text-slate-700">{SOURCE_LABELS[selectedLeadForDetail.source] || selectedLeadForDetail.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Assigned Executive:</span>{" "}
                    <span className="font-semibold text-slate-700">{selectedLeadForDetail.assigned_to_name || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Created By:</span>{" "}
                    <span className="font-semibold text-slate-700">{selectedLeadForDetail.created_by_name || "System"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Showroom Branch:</span>{" "}
                    <span className="font-semibold text-slate-700">{selectedLeadForDetail.branch_name}</span>
                  </div>
                  {selectedLeadForDetail.booked_voucher_code && (
                    <div className="col-span-2 text-emerald-800 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                      Converted with Group Voucher Code: {selectedLeadForDetail.booked_voucher_code}
                    </div>
                  )}
                  {selectedLeadForDetail.lost_reason && (
                    <div className="col-span-2 text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
                      Closure Reason: {selectedLeadForDetail.lost_reason}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const l = selectedLeadForDetail;
                    setSelectedLeadForDetail(null);
                    openNotesModal(l);
                  }}
                  className="gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Notes ({selectedLeadForDetail.notes_count || 0})</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const l = selectedLeadForDetail;
                    setSelectedLeadForDetail(null);
                    openActivitiesModal(l);
                  }}
                  className="gap-1.5"
                >
                  <History className="h-4 w-4" />
                  <span>Audit Trail</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const l = selectedLeadForDetail;
                    setSelectedLeadForDetail(null);
                    openStatusModal(l);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Update Lead Status */}
      {selectedLeadForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Update Lead Status</h3>
                <p className="text-xs text-slate-500">Advance {selectedLeadForStatus.customer_name} across the sales funnel.</p>
              </div>
              <button onClick={() => setSelectedLeadForStatus(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Target Lifecycle Stage *</label>
                <select
                  aria-label="Target Lifecycle Stage"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as LeadStatus })}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500"
                >
                  <option value="NEW_ENQUIRY">New Enquiry</option>
                  <option value="CONTACTED">Contacted (Customer Phone/Meeting)</option>
                  <option value="TEST_DRIVE_SCHEDULED">Test Drive Booked</option>
                  <option value="TEST_DRIVE_COMPLETED">Test Drive Completed</option>
                  <option value="QUOTATION_SENT">Quotation Issued</option>
                  <option value="NEGOTIATION">Price / Discount Negotiation</option>
                  <option value="WON_BOOKED">Won / Booking Finalized</option>
                  <option value="LOST_CLOSED">Lost / Closed</option>
                </select>
              </div>

              {statusForm.status === "WON_BOOKED" && (
                <div>
                  <label className="text-xs font-medium text-slate-700">Booking Voucher Code / Receipt #</label>
                  <Input
                    placeholder="e.g. VCHR-BRZ-7821 or RCT-9081"
                    value={statusForm.booked_voucher_code}
                    onChange={(e) => setStatusForm({ ...statusForm, booked_voucher_code: e.target.value })}
                  />
                  <span className="text-xs text-slate-400 mt-0.5">Links this vehicle sale with GroupDrive group purchase vouchers.</span>
                </div>
              )}

              {statusForm.status === "LOST_CLOSED" && (
                <div>
                  <label className="text-xs font-medium text-slate-700">Reason for Lost Sale *</label>
                  <Input
                    required
                    placeholder="e.g. Bought competitor model due to immediate delivery availability."
                    value={statusForm.reason_or_notes}
                    onChange={(e) => setStatusForm({ ...statusForm, reason_or_notes: e.target.value })}
                  />
                </div>
              )}

              {statusForm.status !== "LOST_CLOSED" && (
                <div>
                  <label className="text-xs font-medium text-slate-700">Status Update Notes</label>
                  <Input
                    placeholder="e.g. Test drive booked for Friday 3 PM at Hope Farm centre."
                    value={statusForm.reason_or_notes}
                    onChange={(e) => setStatusForm({ ...statusForm, reason_or_notes: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setSelectedLeadForStatus(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  Confirm Status Change
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Assign / Reassign Lead */}
      {selectedLeadForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedLeadForAssign.assigned_to_id ? "Reassign Executive" : "Assign Enquiry"}
                </h3>
                <p className="text-xs text-slate-500">Lead: {selectedLeadForAssign.customer_name} ({selectedLeadForAssign.model_name})</p>
              </div>
              <button onClick={() => setSelectedLeadForAssign(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {isSalesExecutive ? (
                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
                  As a Sales Executive, you are claiming this enquiry for yourself.
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-slate-700">Assign To Staff Member *</label>
                  <select
                    aria-label="Assign To Staff Member"
                    required
                    value={assignForm.assigned_to_id}
                    onChange={(e) => setAssignForm({ ...assignForm, assigned_to_id: e.target.value })}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500"
                  >
                    <option value="">Select Staff Member</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.staff_role.replace("_", " ")})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-700">Assignment Note</label>
                <Input
                  placeholder="e.g. Please follow up on financing quote today."
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setSelectedLeadForAssign(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Internal Notes Thread */}
      {selectedLeadForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Internal Sales Notes</h3>
                <p className="text-xs text-slate-500">Customer: {selectedLeadForNotes.customer_name} ({selectedLeadForNotes.model_name})</p>
              </div>
              <button onClick={() => setSelectedLeadForNotes(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              {isSubLoading ? (
                <div className="space-y-3">
                  <div className="h-14 bg-slate-100 animate-pulse rounded-lg" />
                  <div className="h-14 bg-slate-100 animate-pulse rounded-lg" />
                </div>
              ) : currentLeadNotes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No internal notes recorded yet. Add the first note below.
                </div>
              ) : (
                currentLeadNotes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{note.author_name} ({note.author_role.replace("_", " ")})</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNoteSubmit} className="border-t border-slate-100 p-4 bg-slate-50 flex gap-2">
              <Input
                required
                placeholder="Type internal sales note..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="bg-white"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                Add Note
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Activity History Audit Trail */}
      {selectedLeadForActivities && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Lead Audit History</h3>
                <p className="text-xs text-slate-500">Immutable lifecycle events for {selectedLeadForActivities.customer_name}</p>
              </div>
              <button onClick={() => setSelectedLeadForActivities(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {isSubLoading ? (
                <div className="space-y-3">
                  <div className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                  <div className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                </div>
              ) : currentLeadActivities.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No activity history logged.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                  {currentLeadActivities.map((act) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-white bg-blue-600" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{act.action.replace("_", " ")}</span>
                        <span className="text-slate-400">{formatDate(act.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{act.details}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        By {act.actor_name} ({act.actor_role.replace("_", " ")})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedLeadForActivities(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
