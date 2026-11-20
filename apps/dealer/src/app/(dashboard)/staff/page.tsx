"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Ban,
  Eye,
  Edit,
  History,
  Lock,
  X,
  Check,
  ChevronRight,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { dealerApi, ApiClientError } from "../../../lib/api";
import {
  DealerStaffMember,
  DealerStaffRole,
  StaffActivityLog,
  StaffInvitationStatus,
  DealerBranch,
} from "@groupdrive/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { EmptyState } from "../../../components/feedback/empty-state";
import { TableSkeleton } from "../../../components/feedback/loading-skeleton";

const ROLE_LABELS: Record<DealerStaffRole, string> = {
  DEALER_OWNER: "Dealer Owner",
  BRANCH_MANAGER: "Branch Manager",
  SALES_MANAGER: "Sales Manager",
  SALES_EXECUTIVE: "Sales Executive",
  INVENTORY_MANAGER: "Inventory Manager",
  FINANCE_EXECUTIVE: "Finance Executive",
};

const ROLE_BADGE_CLASSES: Record<DealerStaffRole, string> = {
  DEALER_OWNER: "bg-rose-50 text-rose-700 border-rose-200",
  BRANCH_MANAGER: "bg-purple-50 text-purple-700 border-purple-200",
  SALES_MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
  SALES_EXECUTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INVENTORY_MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  FINANCE_EXECUTIVE: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const ROLE_AVATAR_CLASSES: Record<DealerStaffRole, string> = {
  DEALER_OWNER: "bg-rose-600 text-white",
  BRANCH_MANAGER: "bg-purple-600 text-white",
  SALES_MANAGER: "bg-blue-600 text-white",
  SALES_EXECUTIVE: "bg-emerald-600 text-white",
  INVENTORY_MANAGER: "bg-amber-600 text-white",
  FINANCE_EXECUTIVE: "bg-cyan-600 text-white",
};

const INITIAL_INVITE_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  staff_role: "SALES_EXECUTIVE" as DealerStaffRole,
  branch_id: "",
  designation: "",
};

export default function StaffManagementPage() {
  const { user, dealer, branches, capabilities } = useAuth();
  const [staffList, setStaffList] = useState<DealerStaffMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<StaffActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Feedback Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);

  // Selected Records for Actions
  const [selectedStaff, setSelectedStaff] = useState<DealerStaffMember | null>(null);
  const [targetStatusChange, setTargetStatusChange] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [inviteForm, setInviteForm] = useState(INITIAL_INVITE_FORM);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    designation: "",
    staff_role: "SALES_EXECUTIVE" as DealerStaffRole,
    branch_id: "",
  });

  const currentUserRole = user?.staff_role || "SALES_EXECUTIVE";
  const isOwner = currentUserRole === "DEALER_OWNER";
  const isBranchManager = currentUserRole === "BRANCH_MANAGER";
  const canManageAny = isOwner || isBranchManager;
  const callerBranchId = user?.branch_id;

  // Load staff list
  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const res = await dealerApi.getStaff();
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to fetch dealership staff directory.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load activity logs
  const loadActivities = async (staffId?: string) => {
    setIsLoadingActivities(true);
    try {
      const res = await dealerApi.getStaffActivities(staffId);
      if (res.success && res.data) {
        setActivityLogs(res.data);
      }
    } catch {
      // Gracefully handle activity log fetch
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadStaff();
    loadActivities();
  }, []);

  // Check if current user has permission to manage a specific staff member
  const canManageTargetStaff = (target: DealerStaffMember): boolean => {
    if (isOwner) return true;
    if (isBranchManager) {
      // Branch Managers can only manage staff in their assigned branch
      if (target.branch_id !== callerBranchId) return false;
      // Cannot manage Dealer Owner or other Branch Managers
      if (target.staff_role === "DEALER_OWNER" || target.staff_role === "BRANCH_MANAGER") {
        return false;
      }
      return true;
    }
    return false;
  };

  // Filtered staff records
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
        const email = staff.email.toLowerCase();
        const phone = staff.phone_number.toLowerCase();
        const designation = staff.designation.toLowerCase();
        const roleLabel = (ROLE_LABELS[staff.staff_role] || "").toLowerCase();
        const branchName = (staff.branch_name || "").toLowerCase();

        const matches =
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          designation.includes(query) ||
          roleLabel.includes(query) ||
          branchName.includes(query);

        if (!matches) return false;
      }

      // Role filter
      if (roleFilter !== "ALL" && staff.staff_role !== roleFilter) {
        return false;
      }

      // Branch filter
      if (branchFilter !== "ALL") {
        if (branchFilter === "NONE" && staff.branch_id !== null) return false;
        if (branchFilter !== "NONE" && staff.branch_id !== branchFilter) return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && (!staff.is_active || staff.invitation_status !== "ACTIVE")) {
          return false;
        }
        if (statusFilter === "INACTIVE" && staff.is_active) {
          return false;
        }
        if (statusFilter === "INVITED" && staff.invitation_status !== "INVITED" && staff.invitation_status !== "PENDING_ACCEPTANCE") {
          return false;
        }
      }

      return true;
    });
  }, [staffList, searchQuery, roleFilter, branchFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.is_active && s.invitation_status === "ACTIVE").length;
    const pendingInvites = staffList.filter((s) => s.invitation_status === "INVITED" || s.invitation_status === "PENDING_ACCEPTANCE").length;
    const inactive = staffList.filter((s) => !s.is_active).length;
    return { total, active, pendingInvites, inactive };
  }, [staffList]);

  // Open Invite Modal with pre-fills
  const handleOpenInvite = () => {
    setInviteForm({
      ...INITIAL_INVITE_FORM,
      branch_id: isBranchManager && callerBranchId ? callerBranchId : (branches[0]?.id || ""),
      staff_role: "SALES_EXECUTIVE",
    });
    setErrorMessage(null);
    setIsInviteModalOpen(true);
  };

  // Submit Invite Staff
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Validation
    if (!inviteForm.first_name.trim() || !inviteForm.last_name.trim()) {
      setErrorMessage("First name and last name are required.");
      setIsSubmitting(false);
      return;
    }
    if (!inviteForm.email.includes("@")) {
      setErrorMessage("Please enter a valid corporate email address.");
      setIsSubmitting(false);
      return;
    }
    if (inviteForm.phone_number.replace(/\D/g, "").length < 10) {
      setErrorMessage("Phone number must contain at least 10 digits.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await dealerApi.inviteStaff({
        first_name: inviteForm.first_name.trim(),
        last_name: inviteForm.last_name.trim(),
        email: inviteForm.email.toLowerCase().trim(),
        phone_number: inviteForm.phone_number.trim(),
        staff_role: inviteForm.staff_role,
        branch_id: inviteForm.branch_id || null,
        designation: inviteForm.designation.trim() || ROLE_LABELS[inviteForm.staff_role],
      });

      if (res.success) {
        setSuccessMessage(`Invitation successfully dispatched to ${inviteForm.email}.`);
        setIsInviteModalOpen(false);
        loadStaff();
        loadActivities();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to send staff invitation.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (staff: DealerStaffMember) => {
    setSelectedStaff(staff);
    setEditForm({
      first_name: staff.first_name,
      last_name: staff.last_name,
      phone_number: staff.phone_number,
      designation: staff.designation,
      staff_role: staff.staff_role,
      branch_id: staff.branch_id || "",
    });
    setErrorMessage(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Staff
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await dealerApi.updateStaff(selectedStaff.id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone_number: editForm.phone_number.trim(),
        designation: editForm.designation.trim(),
        staff_role: isOwner ? editForm.staff_role : undefined, // Branch Manager cannot escalate role
        branch_id: isOwner ? (editForm.branch_id || null) : undefined, // Branch Manager cannot reassign branch
      });

      if (res.success) {
        setSuccessMessage(`Staff profile updated successfully for ${editForm.first_name} ${editForm.last_name}.`);
        setIsEditModalOpen(false);
        loadStaff();
        loadActivities();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update staff profile.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Status Toggle (Activate / Deactivate)
  const handlePromptStatusToggle = (staff: DealerStaffMember, newActiveState: boolean) => {
    setSelectedStaff(staff);
    setTargetStatusChange(newActiveState);
    setIsStatusConfirmOpen(true);
  };

  // Execute Status Toggle
  const handleExecuteStatusToggle = async () => {
    if (!selectedStaff || targetStatusChange === null) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await dealerApi.toggleStaffStatus(selectedStaff.id, targetStatusChange);
      if (res.success) {
        const actionLabel = targetStatusChange ? "activated" : "deactivated";
        setSuccessMessage(`Account for ${selectedStaff.first_name} ${selectedStaff.last_name} has been ${actionLabel}.`);
        setIsStatusConfirmOpen(false);
        loadStaff();
        loadActivities();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to alter staff account status.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Invite
  const handleResendInvite = async (staff: DealerStaffMember) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await dealerApi.resendStaffInvite(staff.id);
      if (res.success) {
        setSuccessMessage(`Invitation link resent to ${staff.email}.`);
        loadStaff();
        loadActivities();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to resend staff invitation.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke Invite Prompt
  const handlePromptRevokeInvite = (staff: DealerStaffMember) => {
    setSelectedStaff(staff);
    setIsRevokeConfirmOpen(true);
  };

  // Execute Revoke Invite
  const handleExecuteRevokeInvite = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await dealerApi.revokeStaffInvite(selectedStaff.id);
      if (res.success) {
        setSuccessMessage(`Invitation for ${selectedStaff.email} has been revoked.`);
        setIsRevokeConfirmOpen(false);
        loadStaff();
        loadActivities();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to revoke staff invitation.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Staff Profile Detail
  const handleViewProfile = (staff: DealerStaffMember) => {
    setSelectedStaff(staff);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
            <Badge variant="outline" className="bg-slate-100 text-slate-700 text-xs">
              {stats.total} Team Members
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage showroom sales consultants, branch managers, inventory supervisors, and corporate permissions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadActivities();
              setIsActivityDrawerOpen(true);
            }}
            className="text-xs h-9"
          >
            <History className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            <span>Activity Log</span>
          </Button>

          {canManageAny && (
            <Button
              size="sm"
              onClick={handleOpenInvite}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              <span>Invite Staff</span>
            </Button>
          )}
        </div>
      </div>

      {/* Role Notice Banner for Branch Managers and Non-Management */}
      {isBranchManager && (
        <div className="rounded-lg bg-purple-50/80 border border-purple-200 p-3.5 flex items-start space-x-3">
          <Shield className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-purple-900">
            <span className="font-semibold">Branch Manager Jurisdiction:</span> You have authorization to manage, invite, and reassign permitted showroom staff within your assigned branch. You cannot modify executive leadership or staff assigned to other facilities.
          </div>
        </div>
      )}

      {!canManageAny && (
        <div className="rounded-lg bg-slate-100 border border-slate-200 p-3.5 flex items-start space-x-3">
          <Lock className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <span className="font-semibold">Read-Only Directory:</span> You are viewing the authorized dealership staff directory. Account invitations and role modifications require Dealer Owner or Branch Manager authority.
          </div>
        </div>
      )}

      {/* Alerts */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Staff</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            <p className="text-xs text-slate-400 mt-0.5">Across all authorized facilities</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Employees</span>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.active}</div>
            <p className="text-xs text-slate-400 mt-0.5">Verified with active credentials</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Invites</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingInvites}</div>
            <p className="text-xs text-slate-400 mt-0.5">Awaiting candidate acceptance</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inactive Accounts</span>
              <Ban className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-600 mt-1">{stats.inactive}</div>
            <p className="text-xs text-slate-400 mt-0.5">Deactivated access permissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search staff by name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-slate-50/50"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">All Roles ({stats.total})</option>
                <option value="DEALER_OWNER">Dealer Owner</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="SALES_EXECUTIVE">Sales Executive</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="FINANCE_EXECUTIVE">Finance Executive</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">All Dealership Facilities</option>
                <option value="NONE">Unassigned / All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">All Account Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INVITED">Pending Invitations</option>
                <option value="INACTIVE">Deactivated Accounts</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">Authorized Personnel</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Showing {filteredStaff.length} of {staffList.length} total team records
            </CardDescription>
          </div>
          {(searchQuery || roleFilter !== "ALL" || branchFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setBranchFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs text-slate-500 hover:text-slate-900 h-8"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Filters
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={6} />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No staff members match the selected filters"
                description="Try clearing search keywords or switching role and branch filters to locate team members."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchQuery("");
                  setRoleFilter("ALL");
                  setBranchFilter("ALL");
                  setStatusFilter("ALL");
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Assigned Facility</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStaff.map((staff) => {
                    const initials = `${staff.first_name[0] || ""}${staff.last_name[0] || ""}`.toUpperCase();
                    const isPending = staff.invitation_status === "INVITED" || staff.invitation_status === "PENDING_ACCEPTANCE";
                    const isRevoked = staff.invitation_status === "INVITATION_REVOKED";
                    const isPermittedToManage = canManageTargetStaff(staff);
                    const isCurrentAuthUser = staff.id === user?.id;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Employee Name & Initials */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                ROLE_AVATAR_CLASSES[staff.staff_role] || "bg-slate-700 text-white"
                              }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                                <span>{staff.first_name} {staff.last_name}</span>
                                {isCurrentAuthUser && (
                                  <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0 border-slate-200">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-normal">
                                {staff.designation}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium border ${
                              ROLE_BADGE_CLASSES[staff.staff_role] || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {ROLE_LABELS[staff.staff_role]}
                          </Badge>
                        </td>

                        {/* Assigned Facility */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <Building className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {staff.branch_name || "All Branches"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {isRevoked ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="h-3 w-3 mr-1" />
                              Revoked
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Invited
                            </span>
                          ) : staff.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 text-slate-600 text-xs">
                              <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{staff.email}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-slate-500 text-xs">
                              <Phone className="h-3 w-3 text-slate-400 flex-shrink-0" />
                              <span>{staff.phone_number}</span>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* View Profile */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProfile(staff)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                              title="View Staff Profile"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Edit Profile */}
                            {isPermittedToManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(staff)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                                title="Edit Staff Details"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {/* Resend / Revoke Invite */}
                            {isPermittedToManage && isPending && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendInvite(staff)}
                                  className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50"
                                  title="Resend invitation email"
                                >
                                  Resend
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePromptRevokeInvite(staff)}
                                  className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                  title="Revoke Invitation"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}

                            {/* Activate / Deactivate Toggle */}
                            {isPermittedToManage && !isPending && !isCurrentAuthUser && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePromptStatusToggle(staff, !staff.is_active)}
                                className={`h-7 px-2 text-xs font-medium ${
                                  staff.is_active
                                    ? "text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                                    : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                                }`}
                              >
                                {staff.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            )}

                            {!isPermittedToManage && (
                              <span className="text-xs text-slate-400 italic px-1">
                                View Only
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Invite Staff Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Invite New Staff Member</h3>
                  <p className="text-xs text-slate-500">An invitation link will be sent to the corporate email.</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                  <Input
                    placeholder="e.g. Rahul"
                    value={inviteForm.first_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })}
                    className="text-xs h-9"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                  <Input
                    placeholder="e.g. Verma"
                    value={inviteForm.last_name}
                    onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })}
                    className="text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Corporate Email Address *</label>
                <Input
                  type="email"
                  placeholder="e.g. rahul.verma@kalyanimotors.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                  <Input
                    placeholder="+91 98450 12345"
                    value={inviteForm.phone_number}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone_number: e.target.value })}
                    className="text-xs h-9"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Official Designation</label>
                  <Input
                    placeholder="e.g. Senior Sales Consultant"
                    value={inviteForm.designation}
                    onChange={(e) => setInviteForm({ ...inviteForm, designation: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={inviteForm.staff_role}
                    onChange={(e) => setInviteForm({ ...inviteForm, staff_role: e.target.value as DealerStaffRole })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    {isOwner && <option value="BRANCH_MANAGER">Branch Manager</option>}
                    <option value="SALES_MANAGER">Sales Manager</option>
                    <option value="SALES_EXECUTIVE">Sales Executive</option>
                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                    <option value="FINANCE_EXECUTIVE">Finance Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Branch *</label>
                  {isBranchManager ? (
                    <div className="h-9 px-3 rounded-md border border-slate-200 bg-slate-100 flex items-center text-xs text-slate-600 truncate">
                      {branches.find((b) => b.id === callerBranchId)?.branch_name || "Assigned Branch"}
                    </div>
                  ) : (
                    <select
                      value={inviteForm.branch_id}
                      onChange={(e) => setInviteForm({ ...inviteForm, branch_id: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">All Branches / Central Office</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Security Verification:</span> An automated invite email with a secure single-use login token will be transmitted to the candidate. They will be required to configure their permanent credentials.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9"
                >
                  {isSubmitting ? "Dispatching..." : "Send Staff Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Staff Modal */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Edit Staff: {selectedStaff.first_name} {selectedStaff.last_name}
                  </h3>
                  <p className="text-xs text-slate-500">Update designations, phone numbers, or organizational assignments.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                  <Input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="text-xs h-9"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                  <Input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <Input
                  value={selectedStaff.email}
                  disabled
                  className="text-xs h-9 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Email addresses cannot be modified once provisioned.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                  <Input
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Official Designation</label>
                  <Input
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {isOwner ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Role Assignment</label>
                    <select
                      value={editForm.staff_role}
                      onChange={(e) => setEditForm({ ...editForm, staff_role: e.target.value as DealerStaffRole })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="DEALER_OWNER">Dealer Owner</option>
                      <option value="BRANCH_MANAGER">Branch Manager</option>
                      <option value="SALES_MANAGER">Sales Manager</option>
                      <option value="SALES_EXECUTIVE">Sales Executive</option>
                      <option value="INVENTORY_MANAGER">Inventory Manager</option>
                      <option value="FINANCE_EXECUTIVE">Finance Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Facility</label>
                    <select
                      value={editForm.branch_id}
                      onChange={(e) => setEditForm({ ...editForm, branch_id: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">All Branches</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">RBAC Notice:</span> Role escalation and cross-branch reassignment can only be authorized by the Dealer Owner.
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
                >
                  {isSubmitting ? "Saving..." : "Save Profile Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Staff Profile Details */}
      {isProfileModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900">Personnel Dossier</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-100">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm ${
                    ROLE_AVATAR_CLASSES[selectedStaff.staff_role] || "bg-slate-700 text-white"
                  }`}
                >
                  {`${selectedStaff.first_name[0] || ""}${selectedStaff.last_name[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base leading-tight">
                    {selectedStaff.first_name} {selectedStaff.last_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{selectedStaff.designation}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium border ${
                        ROLE_BADGE_CLASSES[selectedStaff.staff_role]
                      }`}
                    >
                      {ROLE_LABELS[selectedStaff.staff_role]}
                    </Badge>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {selectedStaff.is_active ? "Active" : "Deactivated"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Email
                  </span>
                  <span className="font-medium text-slate-800">{selectedStaff.email}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center">
                    <Phone className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Phone
                  </span>
                  <span className="font-medium text-slate-800">{selectedStaff.phone_number}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center">
                    <Building className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Facility Assignment
                  </span>
                  <span className="font-medium text-slate-800">{selectedStaff.branch_name || "All Branches"}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Dealership
                  </span>
                  <span className="font-medium text-slate-800">{dealer?.trade_name || "Authorized Dealer"}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Account Enrolled
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedStaff.created_at ? new Date(selectedStaff.created_at).toLocaleDateString() : "Active Record"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Last Active
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedStaff.last_active_at ? new Date(selectedStaff.last_active_at).toLocaleString() : "Never"}
                  </span>
                </div>
              </div>

              {/* Role Permission Preview */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Active System Capabilities
                </span>
                <ul className="text-xs text-slate-600 space-y-1">
                  {selectedStaff.staff_role === "DEALER_OWNER" && (
                    <>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Full administrative control across all dealership branches
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Quotation submission and group purchasing negotiation
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Staff invitation, role management, and branch creation
                      </li>
                    </>
                  )}
                  {selectedStaff.staff_role === "BRANCH_MANAGER" && (
                    <>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Branch operations management and staff invitation
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Quotation submission for assigned branch leads
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Yard stock management for assigned facility
                      </li>
                    </>
                  )}
                  {selectedStaff.staff_role === "SALES_MANAGER" && (
                    <>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Quotation approval and submission to buyer groups
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Team lead allocation and pipeline tracking
                      </li>
                    </>
                  )}
                  {selectedStaff.staff_role === "SALES_EXECUTIVE" && (
                    <>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Lead follow-up and customer quotation drafting
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Buyer group enquiry monitoring
                      </li>
                    </>
                  )}
                  {selectedStaff.staff_role === "INVENTORY_MANAGER" && (
                    <>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Stockyard vehicle tracking and allocation
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Vehicle status updates and aging surveillance
                      </li>
                    </>
                  )}
                  {selectedStaff.staff_role === "FINANCE_EXECUTIVE" && (
                    <>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Quotation financial verification and bank tie-ups
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <Check className="h-3 w-3 text-emerald-600 mr-1.5" /> Down payment and loan processing monitoring
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-full text-xs h-9"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirmation Dialog for Deactivation / Activation */}
      {isStatusConfirmOpen && selectedStaff && targetStatusChange !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-full ${targetStatusChange ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                {targetStatusChange ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {targetStatusChange ? "Reactivate Staff Account" : "Deactivate Staff Account"}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedStaff.first_name} {selectedStaff.last_name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {targetStatusChange
                ? "This will restore active login access to DealerOS for this staff member under their existing role and branch assignment."
                : "Deactivating this employee account will immediately terminate active sessions and block login access. Existing quotations, leads, and audit histories will remain preserved."}
            </p>

            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStatusConfirmOpen(false)}
                disabled={isSubmitting}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteStatusToggle}
                disabled={isSubmitting}
                className={`text-xs h-9 text-white ${
                  targetStatusChange
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmitting
                  ? "Processing..."
                  : targetStatusChange
                  ? "Confirm Reactivation"
                  : "Confirm Deactivation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Revoke Invitation Confirmation */}
      {isRevokeConfirmOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-full bg-rose-100 text-rose-600">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Revoke Staff Invitation</h3>
                <p className="text-xs text-slate-500">{selectedStaff.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to revoke this pending invitation? The candidate will no longer be able to use the transmitted link to create credentials.
            </p>

            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRevokeConfirmOpen(false)}
                disabled={isSubmitting}
                className="text-xs h-9"
              >
                Keep Active
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteRevokeInvite}
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9"
              >
                {isSubmitting ? "Revoking..." : "Revoke Invitation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: Staff Activity Log (Audit Trail) */}
      {isActivityDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Staff Management Activity Log</h3>
                  <p className="text-xs text-slate-500">Immutable audit trail of invitations and permission adjustments</p>
                </div>
              </div>
              <button
                onClick={() => setIsActivityDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingActivities ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading audit events...</div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-500">
                  No administrative events recorded yet.
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{log.target_name}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Badge variant="outline" className="text-xs bg-white border-slate-200 font-medium">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-slate-500 truncate">
                        By {log.actor_name} ({ROLE_LABELS[log.actor_role] || log.actor_role})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 pt-1 leading-snug">
                      {log.details}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsActivityDrawerOpen(false)}
                className="w-full text-xs h-9"
              >
                Close Activity Trail
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
