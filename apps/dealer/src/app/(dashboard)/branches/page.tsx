"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Power,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Lock,
  Building2,
  Warehouse,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { DealerBranch } from "@groupdrive/types";
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

const INITIAL_BRANCH_FORM = {
  branch_name: "",
  branch_type: "SHOWROOM_AND_SERVICE" as "SHOWROOM_AND_SERVICE" | "SHOWROOM_ONLY" | "STOCKYARD_ONLY",
  address_line1: "",
  address_line2: "",
  city: "Bengaluru",
  state: "Karnataka",
  pin_code: "",
  authorized_rto_codes: "KA-01, KA-03",
  phone_number: "",
  email: "",
  operating_hours: "09:30 AM - 07:30 PM (Mon - Sun)",
  manager_name: "",
  is_active: true,
};

export default function BranchesPage() {
  const { user, dealer, branches, refreshBranches } = useAuth();
  const [branchList, setBranchList] = useState<DealerBranch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_BRANCH_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Toggle Confirmation Modal
  const [confirmToggleBranch, setConfirmToggleBranch] = useState<DealerBranch | null>(null);

  // Feedback Alerts
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const role = user?.staff_role || "SALES_EXECUTIVE";
  const isOwner = role === "DEALER_OWNER";
  const isBranchManager = role === "BRANCH_MANAGER";
  const canManage = isOwner || isBranchManager;

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const res = await dealerApi.getBranches();
      if (res.success && res.data) {
        setBranchList(res.data);
      }
    } catch {
      setBranchList(branches);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branchList.filter((b) => {
      const matchesSearch =
        b.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pin_code.includes(searchQuery) ||
        b.authorized_rto_codes.some((code) =>
          code.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesType = typeFilter === "ALL" || b.branch_type === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && b.is_active) ||
        (statusFilter === "INACTIVE" && !b.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [branchList, searchQuery, typeFilter, statusFilter]);

  const handleOpenAdd = () => {
    setModalMode("ADD");
    setEditingBranchId(null);
    setFormData(INITIAL_BRANCH_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: DealerBranch) => {
    // Check permission: Owner can edit any; Branch Manager can only edit assigned branch
    if (!isOwner && branch.id !== user?.branch_id) {
      setErrorMessage("Branch Manager access restricted: You can only edit your assigned branch.");
      return;
    }

    setModalMode("EDIT");
    setEditingBranchId(branch.id);
    setFormData({
      branch_name: branch.branch_name,
      branch_type: branch.branch_type,
      address_line1: branch.address_line1,
      address_line2: branch.address_line2 || "",
      city: branch.city,
      state: branch.state,
      pin_code: branch.pin_code,
      authorized_rto_codes: branch.authorized_rto_codes.join(", "),
      phone_number: branch.phone_number,
      email: branch.email || "",
      operating_hours: branch.operating_hours || "09:30 AM - 07:30 PM (Mon - Sun)",
      manager_name: branch.manager_name || "",
      is_active: branch.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.branch_name.trim() || formData.branch_name.length < 3) {
      setFormError("Branch name must be at least 3 characters.");
      return;
    }
    if (!formData.address_line1.trim()) {
      setFormError("Primary address line is required.");
      return;
    }
    if (!formData.pin_code.trim() || formData.pin_code.length !== 6) {
      setFormError("Please enter a valid 6-digit postal pin code.");
      return;
    }
    if (!formData.phone_number.trim() || formData.phone_number.length < 10) {
      setFormError("Please enter a valid 10-digit branch contact phone number.");
      return;
    }

    const rtoCodesArray = formData.authorized_rto_codes
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (rtoCodesArray.length === 0) {
      setFormError("Please provide at least one authorized RTO code (e.g. KA-01, KA-03).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<DealerBranch> = {
        branch_name: formData.branch_name,
        branch_type: formData.branch_type,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        city: formData.city,
        state: formData.state,
        pin_code: formData.pin_code,
        authorized_rto_codes: rtoCodesArray,
        phone_number: formData.phone_number,
        email: formData.email || null,
        operating_hours: formData.operating_hours || null,
        manager_name: formData.manager_name || null,
        is_active: formData.is_active,
      };

      if (modalMode === "ADD") {
        const res = await dealerApi.createBranch(payload);
        if (res.success) {
          setSuccessMessage(`Branch '${res.data.branch_name}' created successfully.`);
          setIsModalOpen(false);
          await loadBranches();
          await refreshBranches();
        }
      } else if (modalMode === "EDIT" && editingBranchId) {
        const res = await dealerApi.updateBranch(editingBranchId, payload);
        if (res.success) {
          setSuccessMessage(`Branch '${res.data.branch_name}' updated successfully.`);
          setIsModalOpen(false);
          await loadBranches();
          await refreshBranches();
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save branch. Please check input values.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmToggleBranch) return;

    const targetBranch = confirmToggleBranch;
    setConfirmToggleBranch(null);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await dealerApi.toggleBranchStatus(targetBranch.id, !targetBranch.is_active);
      if (res.success) {
        const action = targetBranch.is_active ? "deactivated" : "activated";
        setSuccessMessage(`Branch '${targetBranch.branch_name}' has been ${action}.`);
        await loadBranches();
        await refreshBranches();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update branch status.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Building className="h-6 w-6 text-slate-700 mr-2" />
            Branch Network & Facilities
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage showroom locations, central stockyards, operating schedules, and authorized RTO delivery zones
          </p>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="text-xs self-start sm:self-auto"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add New Branch
          </Button>
        )}
      </div>

      {/* Role Notice */}
      {!isOwner && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span>
              Operating as {role.replace(/_/g, " ")}. You have {isBranchManager ? "edit access to your assigned branch only." : "read-only access to branch directories."}
            </span>
          </div>
          <span className="font-semibold text-xs text-blue-800">
            Assigned: {user?.branch_name || "Single Showroom"}
          </span>
        </div>
      )}

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search branch name, city, pin code, or RTO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Branch Types</option>
            <option value="SHOWROOM_AND_SERVICE">Showroom & Service</option>
            <option value="SHOWROOM_ONLY">Showroom Only</option>
            <option value="STOCKYARD_ONLY">Stockyard Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Branch Cards Grid */}
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : filteredBranches.length === 0 ? (
        <EmptyState
          title="No branches match your search"
          description="Try adjusting your search criteria or filter options."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => {
            const canEditThisBranch = isOwner || (isBranchManager && branch.id === user?.branch_id);

            return (
              <Card
                key={branch.id}
                className={`flex flex-col justify-between transition-all ${
                  !branch.is_active ? "border-slate-200 bg-slate-50/70 opacity-80" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        {branch.branch_type === "STOCKYARD_ONLY" ? (
                          <Warehouse className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        ) : (
                          <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                        <CardTitle className="text-sm font-bold text-slate-900 line-clamp-1">
                          {branch.branch_name}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs mt-1 font-medium">
                        {branch.branch_type.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <Badge
                      variant={branch.is_active ? "success" : "secondary"}
                      className="text-xs flex-shrink-0"
                    >
                      {branch.is_active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs text-slate-600">
                  {/* Address */}
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">
                      {branch.address_line1}
                      {branch.address_line2 ? `, ${branch.address_line2}` : ""},{" "}
                      {branch.city}, {branch.state} - {branch.pin_code}
                    </span>
                  </div>

                  {/* Contacts & Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{branch.phone_number}</span>
                    </div>
                    {branch.email && (
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{branch.email}</span>
                      </div>
                    )}
                  </div>

                  {branch.operating_hours && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span>{branch.operating_hours}</span>
                    </div>
                  )}

                  {branch.manager_name && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-medium">
                      <Users className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span>Branch Lead: {branch.manager_name}</span>
                    </div>
                  )}

                  {/* Authorized RTO Codes */}
                  <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Authorized RTO Delivery Codes
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {branch.authorized_rto_codes.map((code) => (
                        <span
                          key={code}
                          className="inline-block px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-white border border-slate-200 text-slate-800"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Branch Action Controls */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      ID: {branch.id}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {canEditThisBranch ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(branch)}
                          className="text-xs h-7 px-2.5"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </span>
                      )}

                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmToggleBranch(branch)}
                          className={`text-xs h-7 px-2 ${
                            branch.is_active
                              ? "text-slate-500 hover:text-red-700 hover:bg-red-50"
                              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={branch.is_active ? "Deactivate branch" : "Activate branch"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Branch Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === "ADD" ? "Add New Dealership Branch" : "Edit Branch Configuration"}
                </h3>
                <p className="text-xs text-slate-500">
                  {modalMode === "ADD"
                    ? "Register a new showroom, sales delivery centre, or vehicle stockyard"
                    : `Updating facility: ${formData.branch_name}`}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="m-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch Facility Name *
                  </label>
                  <Input
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    placeholder="e.g. Indiranagar Showroom & Delivery Centre"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Facility Type *
                  </label>
                  <select
                    value={formData.branch_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branch_type: e.target.value as any,
                      })
                    }
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="SHOWROOM_AND_SERVICE">Showroom & Service</option>
                    <option value="SHOWROOM_ONLY">Showroom Only</option>
                    <option value="STOCKYARD_ONLY">Stockyard Only</option>
                  </select>
                </div>
              </div>

              {/* Address Fields */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address Line 1 *
                </label>
                <Input
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="Plot number, street, landmark"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <Input
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  placeholder="Area, industrial estate, phase"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    State *
                  </label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pin Code *
                  </label>
                  <Input
                    value={formData.pin_code}
                    onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                    placeholder="560066"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              {/* Authorized RTO Codes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Authorized RTO Delivery Codes (Comma Separated) *
                </label>
                <Input
                  value={formData.authorized_rto_codes}
                  onChange={(e) => setFormData({ ...formData, authorized_rto_codes: e.target.value })}
                  placeholder="e.g. KA-01, KA-03, KA-05, KA-53"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Determines which regional buyer groups on the Demand Radar this branch is authorized to bid on.
                </p>
              </div>

              {/* Contacts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Facility Phone Number *
                  </label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+918028451122"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Facility Email (Optional)
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="branch@dealership.com"
                  />
                </div>
              </div>

              {/* Hours and Manager */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Operating Schedule
                  </label>
                  <Input
                    value={formData.operating_hours}
                    onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                    placeholder="09:30 AM - 07:30 PM (Mon - Sun)"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Branch Lead / Manager
                  </label>
                  <Input
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  {modalMode === "ADD" ? "Create Branch" : "Update Branch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Branch Status Toggle */}
      {confirmToggleBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmToggleBranch.is_active ? "Deactivate Branch Facility?" : "Activate Branch Facility?"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {confirmToggleBranch.is_active
                    ? `Deactivating '${confirmToggleBranch.branch_name}' will immediately suspend reverse quotation bidding and inventory intakes for this facility.`
                    : `Activating '${confirmToggleBranch.branch_name}' will re-enable staff logins and quotation delivery permissions.`}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmToggleBranch(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirmToggleBranch.is_active ? "destructive" : "primary"}
                size="sm"
                onClick={handleToggleStatus}
              >
                {confirmToggleBranch.is_active ? "Confirm Deactivation" : "Confirm Activation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
