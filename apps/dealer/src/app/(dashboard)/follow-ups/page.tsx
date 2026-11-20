"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarCheck,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Phone,
  Mail,
  Building,
  RotateCcw,
  Eye,
  Edit,
  X,
  User,
  UserPlus,
  Car,
  Bell,
  Check,
  Ban,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Tag,
  Briefcase,
} from "lucide-react";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  DealerFollowUp,
  DealerAppointment,
  FollowUpType,
  FollowUpPriority,
  FollowUpStatus,
  AppointmentType,
  AppointmentStatus,
  AppointmentVisitOutcome,
  FollowUpSummaryMetrics,
  DealerStaffMember,
  DealerBranch,
  DealerLead,
} from "@groupdrive/types";
import { formatDate } from "@groupdrive/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { TableSkeleton } from "../../../components/feedback/loading-skeleton";
import { EmptyState } from "../../../components/feedback/empty-state";

const FOLLOW_UP_TYPE_CONFIG: Record<
  FollowUpType,
  { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }
> = {
  CALL: { label: "Phone Call", icon: Phone, badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  TEST_DRIVE: { label: "Test Drive", icon: Car, badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  HOME_VISIT: { label: "Home Visit", icon: User, badgeClass: "bg-purple-50 text-purple-700 border-purple-200" },
  DOCUMENTATION: { label: "Documentation", icon: FileText, badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  PAYMENT: { label: "Payment Follow-up", icon: Tag, badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SHOWROOM_VISIT: { label: "Showroom Visit", icon: Building, badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

const PRIORITY_CONFIG: Record<FollowUpPriority, { label: string; badgeClass: string }> = {
  HIGH: { label: "High Priority", badgeClass: "bg-rose-100 text-rose-800 border-rose-200 font-semibold" },
  MEDIUM: { label: "Medium", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
  LOW: { label: "Low", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
};

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  SHOWROOM_VISIT: "Showroom Consultation",
  TEST_DRIVE: "Vehicle Test Drive",
  PRICE_NEGOTIATION: "Price Negotiation",
  VEHICLE_DELIVERY: "Vehicle Delivery",
  DOCUMENT_SIGNING: "Document Signing",
};

const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; badgeClass: string }
> = {
  SCHEDULED: { label: "Scheduled", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
  CONFIRMED: { label: "Confirmed", badgeClass: "bg-blue-100 text-blue-800 border-blue-200 font-medium" },
  COMPLETED: { label: "Completed", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold" },
  RESCHEDULED: { label: "Rescheduled", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
  CANCELLED: { label: "Cancelled", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" },
  NO_SHOW: { label: "No Show", badgeClass: "bg-zinc-200 text-zinc-800 border-zinc-300" },
};

const OUTCOME_LABELS: Record<AppointmentVisitOutcome, string> = {
  TEST_DRIVE_TAKEN: "Test Drive Taken",
  BOOKING_CONFIRMED: "Booking Confirmed",
  QUOTATION_ISSUED: "Quotation Issued",
  FOLLOW_UP_REQUIRED: "Follow-up Required",
  NOT_INTERESTED: "Customer Not Interested",
  NO_SHOW: "Customer Did Not Visit",
};

export default function FollowUpsPage() {
  const { user, branches, currentBranch } = useAuth();

  // Active Main Tab: "followups" | "appointments"
  const [activeTab, setActiveTab] = useState<"followups" | "appointments">("followups");

  // State
  const [followUps, setFollowUps] = useState<DealerFollowUp[]>([]);
  const [appointments, setAppointments] = useState<DealerAppointment[]>([]);
  const [leads, setLeads] = useState<DealerLead[]>([]);
  const [staffList, setStaffList] = useState<DealerStaffMember[]>([]);
  const [summary, setSummary] = useState<FollowUpSummaryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Follow-up Filters
  const [flwBucket, setFlwBucket] = useState("all");
  const [flwScope, setFlwScope] = useState<"my" | "team">("my");
  const [flwTypeFilter, setFlwTypeFilter] = useState("ALL");
  const [flwPriorityFilter, setFlwPriorityFilter] = useState("ALL");
  const [flwStatusFilter, setFlwStatusFilter] = useState("ALL");
  const [flwBranchFilter, setFlwBranchFilter] = useState("ALL");
  const [flwSearch, setFlwSearch] = useState("");

  // Appointment Filters
  const [appBucket, setAppBucket] = useState("all");
  const [appScope, setAppScope] = useState<"my" | "team">("my");
  const [appTypeFilter, setAppTypeFilter] = useState("ALL");
  const [appStatusFilter, setAppStatusFilter] = useState("ALL");
  const [appSearch, setAppSearch] = useState("");

  // Modals
  const [isCreateFollowUpOpen, setIsCreateFollowUpOpen] = useState(false);
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);
  const [selectedFollowUpForComplete, setSelectedFollowUpForComplete] = useState<DealerFollowUp | null>(null);
  const [selectedFollowUpForReschedule, setSelectedFollowUpForReschedule] = useState<DealerFollowUp | null>(null);
  const [selectedFollowUpForAssign, setSelectedFollowUpForAssign] = useState<DealerFollowUp | null>(null);
  const [selectedFollowUpForDetail, setSelectedFollowUpForDetail] = useState<DealerFollowUp | null>(null);

  const [selectedAppForComplete, setSelectedAppForComplete] = useState<DealerAppointment | null>(null);
  const [selectedAppForReschedule, setSelectedAppForReschedule] = useState<DealerAppointment | null>(null);
  const [selectedAppForCancel, setSelectedAppForCancel] = useState<DealerAppointment | null>(null);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<DealerAppointment | null>(null);

  // Forms
  const [createFlwForm, setCreateFlwForm] = useState({
    branch_id: "",
    lead_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    interested_model: "",
    scheduled_at: "",
    follow_up_type: "CALL" as FollowUpType,
    priority: "HIGH" as FollowUpPriority,
    assigned_to_id: "",
    notes: "",
    reminder_minutes_before: 15,
  });

  const [createAppForm, setCreateAppForm] = useState({
    branch_id: "",
    lead_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    interested_model: "",
    appointment_type: "SHOWROOM_VISIT" as AppointmentType,
    appointment_time: "",
    duration_minutes: 45,
    assigned_to_id: "",
    notes: "",
  });

  const [completeFlwNotes, setCompleteFlwNotes] = useState("");
  const [rescheduleFlwData, setRescheduleFlwData] = useState({ scheduled_at: "", notes: "" });
  const [assignFlwData, setAssignFlwData] = useState({ assigned_to_id: "", notes: "" });

  const [completeAppData, setCompleteAppData] = useState<{
    visit_outcome: AppointmentVisitOutcome;
    outcome_notes: string;
  }>({
    visit_outcome: "TEST_DRIVE_TAKEN",
    outcome_notes: "",
  });
  const [rescheduleAppData, setRescheduleAppData] = useState({ appointment_time: "", reschedule_reason: "" });
  const [cancelAppReason, setCancelAppReason] = useState("");

  // Role permissions
  const isDealerOwner = user?.staff_role === "DEALER_OWNER";
  const isBranchManager = user?.staff_role === "BRANCH_MANAGER";
  const isSalesManager = user?.staff_role === "SALES_MANAGER";
  const isSalesExecutive = user?.staff_role === "SALES_EXECUTIVE";
  const canManageTeam = isDealerOwner || isBranchManager || isSalesManager;

  // Initial Fetch
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const effectiveBranch = isDealerOwner ? flwBranchFilter : (currentBranch?.id || user?.branch_id || "ALL");

      const [flwRes, appRes, summaryRes, staffRes, leadsRes] = await Promise.all([
        dealerApi.getFollowUps({
          bucket: flwBucket !== "all" ? flwBucket : undefined,
          scope: flwScope,
          branchId: effectiveBranch,
          followUpType: flwTypeFilter,
          priority: flwPriorityFilter,
          status: flwStatusFilter,
          search: flwSearch,
        }),
        dealerApi.getAppointments({
          bucket: appBucket !== "all" ? appBucket : undefined,
          scope: appScope,
          branchId: effectiveBranch,
          appointmentType: appTypeFilter,
          status: appStatusFilter,
          search: appSearch,
        }),
        dealerApi.getFollowUpSummary(),
        dealerApi.getStaff({ branchId: effectiveBranch !== "ALL" ? effectiveBranch : undefined }),
        dealerApi.getLeads({ branchId: effectiveBranch }),
      ]);

      if (flwRes.success) setFollowUps(flwRes.data);
      if (appRes.success) setAppointments(appRes.data);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (staffRes.success) setStaffList(staffRes.data);
      if (leadsRes.success) setLeads(leadsRes.data);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to load follow-ups and appointments.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    flwBucket,
    flwScope,
    flwTypeFilter,
    flwPriorityFilter,
    flwStatusFilter,
    flwBranchFilter,
    appBucket,
    appScope,
    appTypeFilter,
    appStatusFilter,
  ]);

  // Lead selection autofill helper
  const handleLeadSelectForFollowUp = (leadId: string) => {
    const sel = leads.find((l) => l.id === leadId);
    if (sel) {
      setCreateFlwForm((prev) => ({
        ...prev,
        lead_id: sel.id,
        customer_name: sel.customer_name,
        customer_phone: sel.customer_phone,
        customer_email: sel.customer_email || "",
        interested_model: `${sel.brand_name} ${sel.model_name}`,
        branch_id: sel.branch_id,
        assigned_to_id: sel.assigned_to_id || prev.assigned_to_id,
      }));
    }
  };

  const handleLeadSelectForAppointment = (leadId: string) => {
    const sel = leads.find((l) => l.id === leadId);
    if (sel) {
      setCreateAppForm((prev) => ({
        ...prev,
        lead_id: sel.id,
        customer_name: sel.customer_name,
        customer_phone: sel.customer_phone,
        customer_email: sel.customer_email || "",
        interested_model: `${sel.brand_name} ${sel.model_name}`,
        branch_id: sel.branch_id,
        assigned_to_id: sel.assigned_to_id || prev.assigned_to_id,
      }));
    }
  };

  // Submit Handlers
  const handleCreateFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const targetBranch = createFlwForm.branch_id || currentBranch?.id || branches[0]?.id;
    if (!targetBranch) {
      setErrorMessage("Please select a showroom branch.");
      return;
    }

    try {
      const res = await dealerApi.createFollowUp({
        ...createFlwForm,
        branch_id: targetBranch,
        scheduled_at: new Date(createFlwForm.scheduled_at).toISOString(),
        assigned_to_id: createFlwForm.assigned_to_id || user?.id,
      });

      if (res.success) {
        setSuccessMessage(`Follow-up scheduled with ${res.data.customer_name}.`);
        setIsCreateFollowUpOpen(false);
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to create follow-up.";
      setErrorMessage(msg);
    }
  };

  const handleCreateAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const targetBranch = createAppForm.branch_id || currentBranch?.id || branches[0]?.id;
    if (!targetBranch) {
      setErrorMessage("Please select a showroom branch.");
      return;
    }

    try {
      const res = await dealerApi.createAppointment({
        ...createAppForm,
        branch_id: targetBranch,
        appointment_time: new Date(createAppForm.appointment_time).toISOString(),
        assigned_to_id: createAppForm.assigned_to_id || user?.id,
      });

      if (res.success) {
        setSuccessMessage(`Appointment confirmed for ${res.data.customer_name}.`);
        setIsCreateAppointmentOpen(false);
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to schedule appointment.";
      setErrorMessage(msg);
    }
  };

  const handleCompleteFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUpForComplete) return;

    try {
      const res = await dealerApi.completeFollowUp(selectedFollowUpForComplete.id, {
        completion_notes: completeFlwNotes,
      });

      if (res.success) {
        setSuccessMessage("Follow-up marked as completed.");
        setSelectedFollowUpForComplete(null);
        setCompleteFlwNotes("");
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to complete follow-up.";
      setErrorMessage(msg);
    }
  };

  const handleRescheduleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUpForReschedule) return;

    try {
      const res = await dealerApi.rescheduleFollowUp(selectedFollowUpForReschedule.id, {
        scheduled_at: new Date(rescheduleFlwData.scheduled_at).toISOString(),
        notes: rescheduleFlwData.notes || undefined,
      });

      if (res.success) {
        setSuccessMessage("Follow-up successfully rescheduled.");
        setSelectedFollowUpForReschedule(null);
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to reschedule follow-up.";
      setErrorMessage(msg);
    }
  };

  const handleAssignFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUpForAssign) return;

    try {
      const res = await dealerApi.assignFollowUp(selectedFollowUpForAssign.id, {
        assigned_to_id: assignFlwData.assigned_to_id,
        notes: assignFlwData.notes || undefined,
      });

      if (res.success) {
        setSuccessMessage(`Follow-up assigned to ${res.data.assigned_to_name}.`);
        setSelectedFollowUpForAssign(null);
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to assign follow-up.";
      setErrorMessage(msg);
    }
  };

  const handleCompleteAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForComplete) return;

    try {
      const res = await dealerApi.completeAppointment(selectedAppForComplete.id, {
        visit_outcome: completeAppData.visit_outcome,
        outcome_notes: completeAppData.outcome_notes,
      });

      if (res.success) {
        setSuccessMessage("Appointment completed and visit outcome recorded.");
        setSelectedAppForComplete(null);
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to complete appointment.";
      setErrorMessage(msg);
    }
  };

  const handleRescheduleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForReschedule) return;

    try {
      const res = await dealerApi.rescheduleAppointment(selectedAppForReschedule.id, {
        appointment_time: new Date(rescheduleAppData.appointment_time).toISOString(),
        reschedule_reason: rescheduleAppData.reschedule_reason,
      });

      if (res.success) {
        setSuccessMessage("Appointment rescheduled successfully.");
        setSelectedAppForReschedule(null);
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to reschedule appointment.";
      setErrorMessage(msg);
    }
  };

  const handleCancelAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForCancel) return;

    try {
      const res = await dealerApi.cancelAppointment(selectedAppForCancel.id, {
        cancel_reason: cancelAppReason,
      });

      if (res.success) {
        setSuccessMessage("Appointment cancelled.");
        setSelectedAppForCancel(null);
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to cancel appointment.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
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

      {/* Header and Action Buttons */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Follow-ups & Showroom Appointments</h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Sales Productivity
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Keep track of customer callback promises, showroom visit bookings, test drives, and document verifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setCreateFlwForm({
                branch_id: currentBranch?.id || branches[0]?.id || "",
                lead_id: "",
                customer_name: "",
                customer_phone: "",
                customer_email: "",
                interested_model: "",
                scheduled_at: "2026-11-07T16:00",
                follow_up_type: "CALL",
                priority: "HIGH",
                assigned_to_id: user?.id || "",
                notes: "",
                reminder_minutes_before: 15,
              });
              setIsCreateFollowUpOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm text-xs font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Follow-up</span>
          </Button>

          <Button
            onClick={() => {
              setCreateAppForm({
                branch_id: currentBranch?.id || branches[0]?.id || "",
                lead_id: "",
                customer_name: "",
                customer_phone: "",
                customer_email: "",
                interested_model: "",
                appointment_type: "SHOWROOM_VISIT",
                appointment_time: "2026-11-08T11:00",
                duration_minutes: 45,
                assigned_to_id: user?.id || "",
                notes: "",
              });
              setIsCreateAppointmentOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-sm text-xs font-medium"
          >
            <Calendar className="h-4 w-4" />
            <span>Book Appointment</span>
          </Button>

          <Button variant="outline" onClick={fetchData} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-blue-100 bg-blue-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-blue-700">Today Due</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{summary?.today_count ?? 0}</p>
            <span className="text-xs text-blue-600 font-medium">Calls & Visits</span>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/40 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-rose-700">Overdue Follow-ups</p>
            <p className="mt-1 text-2xl font-bold text-rose-900">{summary?.overdue_count ?? 0}</p>
            <span className="text-xs text-rose-600 font-medium">Needs urgent action</span>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-indigo-700">Upcoming Follow-ups</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{summary?.upcoming_count ?? 0}</p>
            <span className="text-xs text-indigo-600">Pipeline tasks</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-emerald-700">Completed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{summary?.completed_count ?? 0}</p>
            <span className="text-xs text-emerald-600">Archived with notes</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">My Open Tasks</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.my_tasks_count ?? 0}</p>
            <span className="text-xs text-slate-400">Assigned to me</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500">Team Workload</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.team_tasks_count ?? 0}</p>
            <span className="text-xs text-slate-400">Total Showroom</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("followups")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "followups"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Phone className="h-4 w-4" />
            <span>Follow-up Calls & Tasks</span>
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              {followUps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "appointments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Showroom Visits & Test Drives</span>
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              {appointments.length}
            </span>
          </button>
        </nav>

        {/* Scope Toggle: My Tasks vs Team Tasks */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => {
              if (activeTab === "followups") setFlwScope("my");
              else setAppScope("my");
            }}
            className={`text-xs px-3 py-1 font-medium rounded-md transition-colors ${
              (activeTab === "followups" ? flwScope : appScope) === "my"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => {
              if (activeTab === "followups") setFlwScope("team");
              else setAppScope("team");
            }}
            className={`text-xs px-3 py-1 font-medium rounded-md transition-colors ${
              (activeTab === "followups" ? flwScope : appScope) === "team"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Team Tasks
          </button>
        </div>
      </div>

      {/* TAB 1: Follow-ups Workspace */}
      {activeTab === "followups" && (
        <div className="space-y-4">
          {/* Quick Bucket Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Items" },
              { id: "today", label: "Today's Due" },
              { id: "overdue", label: "Overdue" },
              { id: "upcoming", label: "Upcoming" },
              { id: "completed", label: "Completed" },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setFlwBucket(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  flwBucket === b.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Filter Panel */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-5">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by customer, phone, notes..."
                    value={flwSearch}
                    onChange={(e) => setFlwSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                <div>
                  <select
                    aria-label="Filter by Follow-up Type"
                    value={flwTypeFilter}
                    onChange={(e) => setFlwTypeFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-sm"
                  >
                    <option value="ALL">All Follow-up Types</option>
                    <option value="CALL">Phone Call</option>
                    <option value="TEST_DRIVE">Test Drive</option>
                    <option value="HOME_VISIT">Home Visit</option>
                    <option value="DOCUMENTATION">Documentation</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="SHOWROOM_VISIT">Showroom Visit</option>
                  </select>
                </div>

                <div>
                  <select
                    aria-label="Filter by Priority"
                    value={flwPriorityFilter}
                    onChange={(e) => setFlwPriorityFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-sm"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                <div>
                  <select
                    aria-label="Filter by Status"
                    value={flwStatusFilter}
                    onChange={(e) => setFlwStatusFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-sm"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Action</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Follow-ups Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={6} />
                </div>
              ) : followUps.length === 0 ? (
                <EmptyState
                  title="No follow-ups match your criteria"
                  description="All scheduled callback and task commitments are clear for this selection."
                  actionLabel="Reset Filters"
                  onAction={() => {
                    setFlwBucket("all");
                    setFlwTypeFilter("ALL");
                    setFlwPriorityFilter("ALL");
                    setFlwStatusFilter("ALL");
                    setFlwSearch("");
                  }}
                />
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Customer & Lead</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Activity Type</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Due Date & Time</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Reminder</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Assigned Staff</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Status</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {followUps.map((flw) => {
                      const typeConf = FOLLOW_UP_TYPE_CONFIG[flw.follow_up_type] || FOLLOW_UP_TYPE_CONFIG.CALL;
                      const TypeIcon = typeConf.icon;
                      const priorityConf = PRIORITY_CONFIG[flw.priority] || PRIORITY_CONFIG.MEDIUM;

                      return (
                        <tr key={flw.id} className="hover:bg-slate-50/75 transition-colors">
                          {/* Customer & Lead */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900">{flw.customer_name}</div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                              <a href={`tel:${flw.customer_phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                                <Phone className="h-3 w-3" />
                                <span>{flw.customer_phone}</span>
                              </a>
                            </div>
                            {flw.interested_model && (
                              <div className="text-xs text-slate-400 mt-0.5 font-medium">
                                Interested: {flw.interested_model}
                              </div>
                            )}
                          </td>

                          {/* Activity Type & Priority */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConf.badgeClass}`}>
                              <TypeIcon className="h-3 w-3" />
                              <span>{typeConf.label}</span>
                            </span>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${priorityConf.badgeClass}`}>
                                {priorityConf.label}
                              </span>
                            </div>
                          </td>

                          {/* Scheduled Due Date & Time */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{formatDate(flw.scheduled_at)}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[200px]" title={flw.notes}>
                              {flw.notes}
                            </p>
                          </td>

                          {/* Reminder */}
                          <td className="px-4 py-3.5">
                            {flw.reminder_minutes_before ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                <Bell className="h-3 w-3 text-amber-600" />
                                <span>{flw.reminder_minutes_before}m before</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">None</span>
                            )}
                          </td>

                          {/* Assigned Staff */}
                          <td className="px-4 py-3.5">
                            <div className="text-xs font-semibold text-slate-800">{flw.assigned_to_name || "Unassigned"}</div>
                            <div className="text-xs text-slate-400">{flw.branch_name}</div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                flw.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                                  : flw.status === "CANCELLED"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {flw.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {flw.status !== "COMPLETED" && (
                                <button
                                  onClick={() => setSelectedFollowUpForComplete(flw)}
                                  title="Mark Completed"
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}

                              {flw.status !== "COMPLETED" && (
                                <button
                                  onClick={() => {
                                    setSelectedFollowUpForReschedule(flw);
                                    setRescheduleFlwData({
                                      scheduled_at: flw.scheduled_at ? flw.scheduled_at.slice(0, 16) : "",
                                      notes: "",
                                    });
                                  }}
                                  title="Reschedule Due Date"
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                                >
                                  <Calendar className="h-4 w-4" />
                                </button>
                              )}

                              {canManageTeam && (
                                <button
                                  onClick={() => {
                                    setSelectedFollowUpForAssign(flw);
                                    setAssignFlwData({
                                      assigned_to_id: flw.assigned_to_id || "",
                                      notes: "",
                                    });
                                  }}
                                  title="Reassign Staff"
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedFollowUpForDetail(flw)}
                                title="View Details"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Eye className="h-4 w-4" />
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
        </div>
      )}

      {/* TAB 2: Appointments Workspace */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          {/* Quick Bucket Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Appointments" },
              { id: "today", label: "Today's Schedule" },
              { id: "upcoming", label: "Upcoming Bookings" },
              { id: "past", label: "Past / Completed" },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setAppBucket(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  appBucket === b.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Filter Panel */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search appointments by customer or model..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                <div>
                  <select
                    aria-label="Filter by Appointment Type"
                    value={appTypeFilter}
                    onChange={(e) => setAppTypeFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-sm"
                  >
                    <option value="ALL">All Visit Purposes</option>
                    <option value="SHOWROOM_VISIT">Showroom Consultation</option>
                    <option value="TEST_DRIVE">Vehicle Test Drive</option>
                    <option value="PRICE_NEGOTIATION">Price Negotiation</option>
                    <option value="VEHICLE_DELIVERY">Vehicle Delivery</option>
                    <option value="DOCUMENT_SIGNING">Document Signing</option>
                  </select>
                </div>

                <div>
                  <select
                    aria-label="Filter by Appointment Status"
                    value={appStatusFilter}
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-sm"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NO_SHOW">No Show</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={6} />
                </div>
              ) : appointments.length === 0 ? (
                <EmptyState
                  title="No appointments match your filter"
                  description="No showroom visit or test drive slots found for this selection."
                  actionLabel="Reset Filters"
                  onAction={() => {
                    setAppBucket("all");
                    setAppTypeFilter("ALL");
                    setAppStatusFilter("ALL");
                    setAppSearch("");
                  }}
                />
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Customer Information</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Visit Purpose</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Slot Date & Time</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Showroom Branch</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Salesperson</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold">Status</th>
                      <th scope="col" className="px-4 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {appointments.map((app) => {
                      const statusConf = APPOINTMENT_STATUS_CONFIG[app.status] || APPOINTMENT_STATUS_CONFIG.SCHEDULED;

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/75 transition-colors">
                          {/* Customer Information */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900">{app.customer_name}</div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{app.customer_phone}</span>
                            </div>
                            {app.interested_model && (
                              <div className="text-xs text-slate-400 mt-0.5">Model: {app.interested_model}</div>
                            )}
                          </td>

                          {/* Visit Purpose */}
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-slate-900 text-xs block">
                              {APPOINTMENT_TYPE_LABELS[app.appointment_type] || app.appointment_type}
                            </span>
                            <span className="text-xs text-slate-400">{app.duration_minutes} minutes duration</span>
                          </td>

                          {/* Slot Date & Time */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                              <Calendar className="h-3.5 w-3.5 text-blue-600" />
                              <span>{formatDate(app.appointment_time)}</span>
                            </div>
                            {app.notes && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[200px]" title={app.notes}>
                                {app.notes}
                              </p>
                            )}
                          </td>

                          {/* Showroom Branch */}
                          <td className="px-4 py-3.5">
                            <div className="text-xs font-medium text-slate-800">{app.branch_name}</div>
                          </td>

                          {/* Salesperson */}
                          <td className="px-4 py-3.5">
                            <div className="text-xs font-semibold text-slate-800">{app.assigned_to_name}</div>
                            <div className="text-xs text-slate-400">{app.assigned_to_role ? app.assigned_to_role.replace("_", " ") : "Salesperson"}</div>
                          </td>

                          {/* Status & Outcome */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${statusConf.badgeClass}`}>
                              {statusConf.label}
                            </span>
                            {app.visit_outcome && (
                              <div className="mt-1 text-xs font-semibold text-emerald-700">
                                {OUTCOME_LABELS[app.visit_outcome] || app.visit_outcome}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {app.status !== "COMPLETED" && app.status !== "CANCELLED" && (
                                <button
                                  onClick={() => {
                                    setSelectedAppForComplete(app);
                                    setCompleteAppData({
                                      visit_outcome: "TEST_DRIVE_TAKEN",
                                      outcome_notes: "",
                                    });
                                  }}
                                  title="Record Visit Outcome"
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}

                              {app.status !== "COMPLETED" && app.status !== "CANCELLED" && (
                                <button
                                  onClick={() => {
                                    setSelectedAppForReschedule(app);
                                    setRescheduleAppData({
                                      appointment_time: app.appointment_time ? app.appointment_time.slice(0, 16) : "",
                                      reschedule_reason: "",
                                    });
                                  }}
                                  title="Reschedule Appointment"
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                                >
                                  <Calendar className="h-4 w-4" />
                                </button>
                              )}

                              {app.status !== "COMPLETED" && app.status !== "CANCELLED" && (
                                <button
                                  onClick={() => {
                                    setSelectedAppForCancel(app);
                                    setCancelAppReason("");
                                  }}
                                  title="Cancel Appointment"
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedAppForDetail(app)}
                                title="View Details"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Eye className="h-4 w-4" />
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
        </div>
      )}

      {/* MODAL 1: Schedule Follow-up */}
      {isCreateFollowUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Schedule Customer Follow-up</h3>
                <p className="text-xs text-slate-500">Add callback promise, test drive delivery, or documentation request.</p>
              </div>
              <button onClick={() => setIsCreateFollowUpOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUpSubmit} className="p-6 space-y-4">
              {/* Link to Lead dropdown */}
              <div>
                <label className="text-xs font-medium text-slate-700">Link to Customer Lead (Optional)</label>
                <select
                  aria-label="Link to Lead"
                  value={createFlwForm.lead_id}
                  onChange={(e) => handleLeadSelectForFollowUp(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm"
                >
                  <option value="">Select Existing Lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customer_name} ({l.model_name}) - {l.customer_phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Customer Name *</label>
                  <Input
                    required
                    placeholder="e.g. Karthik Subramanian"
                    value={createFlwForm.customer_name}
                    onChange={(e) => setCreateFlwForm({ ...createFlwForm, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Customer Phone *</label>
                  <Input
                    required
                    placeholder="e.g. +919845112233"
                    value={createFlwForm.customer_phone}
                    onChange={(e) => setCreateFlwForm({ ...createFlwForm, customer_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Scheduled Date & Time *</label>
                  <Input
                    type="datetime-local"
                    required
                    value={createFlwForm.scheduled_at}
                    onChange={(e) => setCreateFlwForm({ ...createFlwForm, scheduled_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Follow-up Type *</label>
                  <select
                    aria-label="Follow-up Type Selection"
                    value={createFlwForm.follow_up_type}
                    onChange={(e) => setCreateFlwForm({ ...createFlwForm, follow_up_type: e.target.value as FollowUpType })}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="TEST_DRIVE">Test Drive</option>
                    <option value="HOME_VISIT">Home Visit</option>
                    <option value="DOCUMENTATION">Documentation</option>
                    <option value="PAYMENT">Payment Follow-up</option>
                    <option value="SHOWROOM_VISIT">Showroom Visit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Priority</label>
                  <select
                    aria-label="Priority Selection"
                    value={createFlwForm.priority}
                    onChange={(e) => setCreateFlwForm({ ...createFlwForm, priority: e.target.value as FollowUpPriority })}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Set Reminder</label>
                  <select
                    aria-label="Reminder Interval"
                    value={createFlwForm.reminder_minutes_before}
                    onChange={(e) => setCreateFlwForm({ ...createFlwForm, reminder_minutes_before: parseInt(e.target.value, 10) })}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="15">15 minutes before</option>
                    <option value="30">30 minutes before</option>
                    <option value="60">1 hour before</option>
                    <option value="120">2 hours before</option>
                    <option value="1440">1 day before</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Showroom Branch *</label>
                  <select
                    aria-label="Branch Selection"
                    value={createFlwForm.branch_id || currentBranch?.id || branches[0]?.id || ""}
                    onChange={(e) => setCreateFlwForm({ ...createFlwForm, branch_id: e.target.value })}
                    disabled={!isDealerOwner}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm disabled:bg-slate-100"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Assign To Staff</label>
                  <select
                    aria-label="Assignee Selection"
                    value={createFlwForm.assigned_to_id}
                    onChange={(e) => setCreateFlwForm({ ...createFlwForm, assigned_to_id: e.target.value })}
                    disabled={isSalesExecutive}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm disabled:bg-slate-100"
                  >
                    <option value={user?.id || ""}>Assign to Me ({user?.first_name} {user?.last_name})</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.staff_role.replace("_", " ")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Notes / Objectives *</label>
                <Input
                  required
                  placeholder="e.g. Follow up on Brezza reverse quote discount and booking advance."
                  value={createFlwForm.notes}
                  onChange={(e) => setCreateFlwForm({ ...createFlwForm, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsCreateFollowUpOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Schedule Follow-up
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Book Showroom Appointment */}
      {isCreateAppointmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Book Showroom Appointment</h3>
                <p className="text-xs text-slate-500">Reserve a consultation, test drive slot, or vehicle delivery slot.</p>
              </div>
              <button onClick={() => setIsCreateAppointmentOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Link to Lead (Optional)</label>
                <select
                  aria-label="Link to Lead Selection"
                  value={createAppForm.lead_id}
                  onChange={(e) => handleLeadSelectForAppointment(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm"
                >
                  <option value="">Select Existing Lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customer_name} ({l.model_name}) - {l.customer_phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Customer Name *</label>
                  <Input
                    required
                    placeholder="e.g. Ananya Deshmukh"
                    value={createAppForm.customer_name}
                    onChange={(e) => setCreateAppForm({ ...createAppForm, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Customer Phone *</label>
                  <Input
                    required
                    placeholder="e.g. +919845223344"
                    value={createAppForm.customer_phone}
                    onChange={(e) => setCreateAppForm({ ...createAppForm, customer_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Appointment Type *</label>
                  <select
                    aria-label="Appointment Type"
                    value={createAppForm.appointment_type}
                    onChange={(e) => setCreateAppForm({ ...createAppForm, appointment_type: e.target.value as AppointmentType })}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="SHOWROOM_VISIT">Showroom Consultation</option>
                    <option value="TEST_DRIVE">Vehicle Test Drive</option>
                    <option value="PRICE_NEGOTIATION">Price Negotiation</option>
                    <option value="VEHICLE_DELIVERY">Vehicle Delivery</option>
                    <option value="DOCUMENT_SIGNING">Document Signing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Duration (Minutes)</label>
                  <select
                    aria-label="Appointment Duration"
                    value={createAppForm.duration_minutes}
                    onChange={(e) => setCreateAppForm({ ...createAppForm, duration_minutes: parseInt(e.target.value, 10) })}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="90">1.5 Hours</option>
                    <option value="120">2 Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Date & Time *</label>
                  <Input
                    type="datetime-local"
                    required
                    value={createAppForm.appointment_time}
                    onChange={(e) => setCreateAppForm({ ...createAppForm, appointment_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Interested Vehicle</label>
                  <Input
                    placeholder="e.g. Swift 2026 ZXi"
                    value={createAppForm.interested_model}
                    onChange={(e) => setCreateAppForm({ ...createAppForm, interested_model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Showroom Facility *</label>
                  <select
                    aria-label="Showroom Facility Selection"
                    value={createAppForm.branch_id || currentBranch?.id || branches[0]?.id || ""}
                    onChange={(e) => setCreateAppForm({ ...createAppForm, branch_id: e.target.value })}
                    disabled={!isDealerOwner}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm disabled:bg-slate-100"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Assigned Salesperson</label>
                  <select
                    aria-label="Salesperson Selection"
                    value={createAppForm.assigned_to_id}
                    onChange={(e) => setCreateAppForm({ ...createAppForm, assigned_to_id: e.target.value })}
                    disabled={isSalesExecutive}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm disabled:bg-slate-100"
                  >
                    <option value={user?.id || ""}>Assign to Me ({user?.first_name} {user?.last_name})</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.staff_role.replace("_", " ")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Special Requirements / Notes</label>
                <Input
                  placeholder="e.g. Keep automatic test drive vehicle charged and ready at Gate 2."
                  value={createAppForm.notes}
                  onChange={(e) => setCreateAppForm({ ...createAppForm, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsCreateAppointmentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
                  Confirm Appointment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Complete Follow-up */}
      {selectedFollowUpForComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Complete Follow-up</h3>
                <p className="text-xs text-slate-500">Customer: {selectedFollowUpForComplete.customer_name}</p>
              </div>
              <button onClick={() => setSelectedFollowUpForComplete(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteFollowUpSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Outcome & Conversation Notes *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record summary of call or visit e.g. Customer agreed to visit on Saturday morning for document verification."
                  value={completeFlwNotes}
                  onChange={(e) => setCompleteFlwNotes(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-3 text-xs shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedFollowUpForComplete(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Mark Completed
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Reschedule Follow-up */}
      {selectedFollowUpForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reschedule Follow-up</h3>
                <p className="text-xs text-slate-500">Lead: {selectedFollowUpForReschedule.customer_name}</p>
              </div>
              <button onClick={() => setSelectedFollowUpForReschedule(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleFollowUpSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">New Scheduled Date & Time *</label>
                <Input
                  type="datetime-local"
                  required
                  value={rescheduleFlwData.scheduled_at}
                  onChange={(e) => setRescheduleFlwData({ ...rescheduleFlwData, scheduled_at: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Reason / Update Notes</label>
                <Input
                  placeholder="e.g. Customer requested callback after 5 PM."
                  value={rescheduleFlwData.notes}
                  onChange={(e) => setRescheduleFlwData({ ...rescheduleFlwData, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedFollowUpForReschedule(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  Confirm Reschedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Complete Appointment & Record Outcome */}
      {selectedAppForComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Appointment Outcome</h3>
                <p className="text-xs text-slate-500">Visitor: {selectedAppForComplete.customer_name} ({selectedAppForComplete.interested_model})</p>
              </div>
              <button onClick={() => setSelectedAppForComplete(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteAppointmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Visit Outcome *</label>
                <select
                  aria-label="Visit Outcome Selection"
                  value={completeAppData.visit_outcome}
                  onChange={(e) => setCompleteAppData({ ...completeAppData, visit_outcome: e.target.value as AppointmentVisitOutcome })}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm"
                >
                  <option value="TEST_DRIVE_TAKEN">Test Drive Taken Successfully</option>
                  <option value="BOOKING_CONFIRMED">Booking Advance Confirmed</option>
                  <option value="QUOTATION_ISSUED">Formal Quotation Issued</option>
                  <option value="FOLLOW_UP_REQUIRED">Follow-up Required Next Week</option>
                  <option value="NOT_INTERESTED">Customer Not Interested</option>
                  <option value="NO_SHOW">Customer Did Not Attend (No Show)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Visit Outcome Notes *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record summary of visit outcome e.g. Customer tested Ertiga ZXi AT. Requested loan approval before paying booking advance."
                  value={completeAppData.outcome_notes}
                  onChange={(e) => setCompleteAppData({ ...completeAppData, outcome_notes: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-3 text-xs shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setSelectedAppForComplete(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Save Visit Outcome
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Reschedule Appointment */}
      {selectedAppForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reschedule Appointment</h3>
                <p className="text-xs text-slate-500">Customer: {selectedAppForReschedule.customer_name}</p>
              </div>
              <button onClick={() => setSelectedAppForReschedule(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleAppointmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">New Slot Date & Time *</label>
                <Input
                  type="datetime-local"
                  required
                  value={rescheduleAppData.appointment_time}
                  onChange={(e) => setRescheduleAppData({ ...rescheduleAppData, appointment_time: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Reschedule Reason *</label>
                <Input
                  required
                  placeholder="e.g. Customer out of town until Monday."
                  value={rescheduleAppData.reschedule_reason}
                  onChange={(e) => setRescheduleAppData({ ...rescheduleAppData, reschedule_reason: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedAppForReschedule(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  Confirm Reschedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: Cancel Appointment */}
      {selectedAppForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
                <p className="text-xs text-slate-500">Customer: {selectedAppForCancel.customer_name}</p>
              </div>
              <button onClick={() => setSelectedAppForCancel(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCancelAppointmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Reason for Cancellation *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Record why this appointment was cancelled e.g. Customer purchased vehicle from family friend."
                  value={cancelAppReason}
                  onChange={(e) => setCancelAppReason(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs shadow-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedAppForCancel(null)}>
                  Close
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                  Cancel Appointment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: View Details (Follow-up or Appointment) */}
      {selectedFollowUpForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedFollowUpForDetail.customer_name}</h3>
                <p className="text-xs text-slate-500 font-mono">Reference: {selectedFollowUpForDetail.id}</p>
              </div>
              <button onClick={() => setSelectedFollowUpForDetail(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <p className="font-semibold text-slate-800">{selectedFollowUpForDetail.customer_phone}</p>
                </div>
                <div>
                  <span className="text-slate-400">Activity Type:</span>
                  <p className="font-semibold text-slate-800">{selectedFollowUpForDetail.follow_up_type}</p>
                </div>
                <div>
                  <span className="text-slate-400">Due Date:</span>
                  <p className="font-semibold text-slate-800">{formatDate(selectedFollowUpForDetail.scheduled_at)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Priority:</span>
                  <p className="font-semibold text-slate-800">{selectedFollowUpForDetail.priority}</p>
                </div>
                <div>
                  <span className="text-slate-400">Assigned Staff:</span>
                  <p className="font-semibold text-slate-800">{selectedFollowUpForDetail.assigned_to_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="font-semibold text-slate-800">{selectedFollowUpForDetail.status}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Task Notes:</span>
                <p className="mt-1 p-3 rounded bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedFollowUpForDetail.notes}
                </p>
              </div>

              {selectedFollowUpForDetail.completion_notes && (
                <div>
                  <span className="text-emerald-700 font-semibold">Completion Outcome:</span>
                  <p className="mt-1 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed">
                    {selectedFollowUpForDetail.completion_notes}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedFollowUpForDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedAppForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedAppForDetail.customer_name}</h3>
                <p className="text-xs text-slate-500 font-mono">Reference: {selectedAppForDetail.id}</p>
              </div>
              <button onClick={() => setSelectedAppForDetail(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <p className="font-semibold text-slate-800">{selectedAppForDetail.customer_phone}</p>
                </div>
                <div>
                  <span className="text-slate-400">Visit Purpose:</span>
                  <p className="font-semibold text-slate-800">{APPOINTMENT_TYPE_LABELS[selectedAppForDetail.appointment_type] || selectedAppForDetail.appointment_type}</p>
                </div>
                <div>
                  <span className="text-slate-400">Appointment Slot:</span>
                  <p className="font-semibold text-slate-800">{formatDate(selectedAppForDetail.appointment_time)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Showroom Facility:</span>
                  <p className="font-semibold text-slate-800">{selectedAppForDetail.branch_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Salesperson:</span>
                  <p className="font-semibold text-slate-800">{selectedAppForDetail.assigned_to_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="font-semibold text-slate-800">{selectedAppForDetail.status}</p>
                </div>
              </div>

              {selectedAppForDetail.visit_outcome && (
                <div>
                  <span className="text-emerald-700 font-semibold">Visit Outcome: {OUTCOME_LABELS[selectedAppForDetail.visit_outcome] || selectedAppForDetail.visit_outcome}</span>
                  <p className="mt-1 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed">
                    {selectedAppForDetail.outcome_notes}
                  </p>
                </div>
              )}

              {selectedAppForDetail.reschedule_reason && (
                <div>
                  <span className="text-amber-700 font-semibold">Reschedule Reason:</span>
                  <p className="mt-1 p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 leading-relaxed">
                    {selectedAppForDetail.reschedule_reason}
                  </p>
                </div>
              )}

              {selectedAppForDetail.cancel_reason && (
                <div>
                  <span className="text-rose-700 font-semibold">Cancellation Reason:</span>
                  <p className="mt-1 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 leading-relaxed">
                    {selectedAppForDetail.cancel_reason}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedAppForDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

