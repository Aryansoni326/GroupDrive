"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Warehouse,
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
  Zap,
  Clock,
  Layers,
  Fuel,
  Settings2,
  DollarSign,
  FileText,
  Shield,
  Lock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  InventoryItem,
  InventoryStatus,
  InventoryDashboardMetrics,
  InventoryHistoryLog,
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
  InventoryStatus,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  IN_STOCK: {
    label: "In Stock",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  IN_TRANSIT: {
    label: "In Transit",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
  },
  ALLOCATED_TO_GROUP: {
    label: "Allocated to Group",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Tag,
  },
  SOLD: {
    label: "Sold",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: CheckCircle2,
  },
  DELIVERED: {
    label: "Delivered",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: CheckCircle2,
  },
};

const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Strong Hybrid", "Electric"];
const TRANSMISSIONS = ["Manual", "Automatic", "IVT", "e-CVT"];

export default function InventoryPage() {
  const { user, branches, currentBranch } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<InventoryDashboardMetrics | null>(null);
  const [brands, setBrands] = useState<CatalogueBrand[]>([]);
  const [models, setModels] = useState<CatalogueModel[]>([]);
  const [variants, setVariants] = useState<CatalogueVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [modelFilter, setModelFilter] = useState("ALL");
  const [fuelFilter, setFuelFilter] = useState("ALL");
  const [transFilter, setTransFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Feedback Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Selected Item for Actions
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemDetailWithSpecs, setItemDetailWithSpecs] = useState<any>(null);
  const [itemHistory, setItemHistory] = useState<InventoryHistoryLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Form State
  const [addFormBrandId, setAddFormBrandId] = useState("");
  const [addFormModelId, setAddFormModelId] = useState("");
  const [addFormVariantId, setAddFormVariantId] = useState("");
  const [addFormColourId, setAddFormColourId] = useState("");
  const [addFormBranchId, setAddFormBranchId] = useState("");
  const [addFormVin, setAddFormVin] = useState("");
  const [addFormStockTag, setAddFormStockTag] = useState("");
  const [addFormMfgDate, setAddFormMfgDate] = useState("11-2026");
  const [addFormStatus, setAddFormStatus] = useState<InventoryStatus>("IN_STOCK");
  const [addFormQuantity, setAddFormQuantity] = useState(1);
  const [addFormYardLocation, setAddFormYardLocation] = useState("Yard Bay 1");
  const [addFormPrice, setAddFormPrice] = useState<number>(0);
  const [addFormFlashSale, setAddFormFlashSale] = useState(false);
  const [addFormGroupBuy, setAddFormGroupBuy] = useState(true);
  const [addFormNotes, setAddFormNotes] = useState("");

  // Edit Form State
  const [editBranchId, setEditBranchId] = useState("");
  const [editYardLocation, setEditYardLocation] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<InventoryStatus>("IN_STOCK");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editFlashSale, setEditFlashSale] = useState(false);
  const [editGroupBuy, setEditGroupBuy] = useState(true);
  const [editVin, setEditVin] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Permissions
  const userRole = user?.staff_role || "SALES_EXECUTIVE";
  const isOwner = userRole === "DEALER_OWNER";
  const isBranchManager = userRole === "BRANCH_MANAGER";
  const isInventoryManager = userRole === "INVENTORY_MANAGER";
  const canManage = isOwner || isBranchManager || isInventoryManager;
  const callerBranchId = user?.branch_id;

  // Load Inventory and Metrics
  const loadInventoryData = async () => {
    setIsLoading(true);
    try {
      const [invRes, metricsRes, brandsRes, modelsRes, variantsRes] = await Promise.all([
        dealerApi.getInventory(),
        dealerApi.getInventoryDashboard(),
        dealerApi.getCatalogueBrands(),
        dealerApi.getCatalogueModels(),
        dealerApi.getCatalogueVariants(),
      ]);

      if (invRes.success && invRes.data) {
        setItems(invRes.data);
      }
      if (metricsRes.success && metricsRes.data) {
        setDashboardMetrics(metricsRes.data);
      }
      if (brandsRes.success && brandsRes.data) {
        setBrands(brandsRes.data);
      }
      if (modelsRes.success && modelsRes.data) {
        setModels(modelsRes.data);
      }
      if (variantsRes.success && variantsRes.data) {
        setVariants(variantsRes.data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to fetch yard inventory records.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Filtered inventory list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.model_name.toLowerCase().includes(q) ||
          item.variant_name.toLowerCase().includes(q) ||
          (item.vin && item.vin.toLowerCase().includes(q)) ||
          (item.stock_serial_number && item.stock_serial_number.toLowerCase().includes(q)) ||
          item.colour_name.toLowerCase().includes(q) ||
          (item.branch_name && item.branch_name.toLowerCase().includes(q)) ||
          (item.yard_location && item.yard_location.toLowerCase().includes(q));

        if (!matches) return false;
      }

      // Brand filter
      if (brandFilter !== "ALL" && item.brand_name?.toLowerCase() !== brandFilter.toLowerCase()) {
        return false;
      }

      // Model filter
      if (modelFilter !== "ALL" && item.model_name.toLowerCase() !== modelFilter.toLowerCase()) {
        return false;
      }

      // Fuel filter
      if (fuelFilter !== "ALL" && item.fuel_type.toLowerCase() !== fuelFilter.toLowerCase()) {
        return false;
      }

      // Transmission filter
      if (transFilter !== "ALL" && item.transmission_type.toLowerCase() !== transFilter.toLowerCase()) {
        return false;
      }

      // Branch filter
      if (branchFilter !== "ALL" && item.branch_id !== branchFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, brandFilter, modelFilter, fuelFilter, transFilter, branchFilter, statusFilter]);

  // Derived filtered models for dropdown based on brand
  const availableModelsForFilter = useMemo(() => {
    if (brandFilter === "ALL") return models;
    const selectedBrand = brands.find((b) => b.name.toLowerCase() === brandFilter.toLowerCase());
    if (!selectedBrand) return models;
    return models.filter((m) => m.brand_id === selectedBrand.id);
  }, [models, brandFilter, brands]);

  // Selected variant in Add Modal to preview official catalogue specs
  const selectedAddVariant = useMemo(() => {
    return variants.find((v) => v.id === addFormVariantId);
  }, [variants, addFormVariantId]);

  // Available models in Add Modal
  const availableAddModels = useMemo(() => {
    if (!addFormBrandId) return models;
    return models.filter((m) => m.brand_id === addFormBrandId);
  }, [models, addFormBrandId]);

  // Available variants in Add Modal
  const availableAddVariants = useMemo(() => {
    if (!addFormModelId) return variants;
    return variants.filter((v) => v.model_id === addFormModelId);
  }, [variants, addFormModelId]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultBrand = brands[0]?.id || "brd-maruti";
    const defaultModels = models.filter((m) => m.brand_id === defaultBrand);
    const defaultModel = defaultModels[0]?.id || "mod-brezza-01";
    const defaultVariants = variants.filter((v) => v.model_id === defaultModel);
    const defaultVar = defaultVariants[0];

    setAddFormBrandId(defaultBrand);
    setAddFormModelId(defaultModel);
    setAddFormVariantId(defaultVar?.id || "var-brz-zxi-plus");
    setAddFormColourId(defaultVar?.colours[0]?.id || "col-red-blk");
    setAddFormBranchId(isOwner ? (branches[0]?.id || "") : (callerBranchId || ""));
    setAddFormVin("");
    setAddFormStockTag("");
    setAddFormMfgDate("11-2026");
    setAddFormStatus("IN_STOCK");
    setAddFormQuantity(1);
    setAddFormYardLocation("Bay 1 - Main Yard");
    setAddFormPrice(defaultVar?.official_ex_showroom_price || 1398000);
    setAddFormFlashSale(false);
    setAddFormGroupBuy(true);
    setAddFormNotes("");
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  // Submit Add Vehicle
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!addFormVariantId) {
      setErrorMessage("Please select a valid vehicle variant from the catalogue.");
      setIsSubmitting(false);
      return;
    }
    if (!addFormBranchId) {
      setErrorMessage("Please select a target branch facility.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await dealerApi.addInventory({
        variant_id: addFormVariantId,
        branch_id: addFormBranchId,
        colour_id: addFormColourId,
        vin: addFormVin.trim() || undefined,
        stock_serial_number: addFormStockTag.trim() || undefined,
        manufacturing_month_year: addFormMfgDate,
        status: addFormStatus,
        stock_quantity: addFormQuantity,
        yard_location: addFormYardLocation.trim(),
        ex_showroom_price: addFormPrice,
        is_available_for_flash_sale: addFormFlashSale,
        is_available_for_group_buy: addFormGroupBuy,
        notes: addFormNotes.trim() || undefined,
      });

      if (res.success) {
        setSuccessMessage(`Vehicle added to yard inventory successfully.`);
        setIsAddModalOpen(false);
        loadInventoryData();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to add vehicle to yard inventory.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditBranchId(item.branch_id);
    setEditYardLocation(item.yard_location || "");
    setEditPrice(item.ex_showroom_price);
    setEditStatus(item.status);
    setEditQuantity(item.stock_quantity || 1);
    setEditFlashSale(item.is_available_for_flash_sale);
    setEditGroupBuy(item.is_available_for_group_buy ?? true);
    setEditVin(item.vin || "");
    setEditNotes(item.notes || "");
    setErrorMessage(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Inventory
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await dealerApi.updateInventory(selectedItem.id, {
        branch_id: isOwner ? editBranchId : undefined,
        yard_location: editYardLocation.trim(),
        ex_showroom_price: editPrice,
        status: editStatus,
        stock_quantity: editQuantity,
        is_available_for_flash_sale: editFlashSale,
        is_available_for_group_buy: editGroupBuy,
        vin: editVin.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });

      if (res.success) {
        setSuccessMessage(`Inventory details updated for ${selectedItem.model_name} ${selectedItem.variant_name}.`);
        setIsEditModalOpen(false);
        loadInventoryData();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update inventory details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Detail Modal
  const handleViewDetail = async (item: InventoryItem) => {
    setSelectedItem(item);
    try {
      const res = await dealerApi.getInventoryDetail(item.id);
      if (res.success && res.data) {
        setItemDetailWithSpecs(res.data);
      } else {
        setItemDetailWithSpecs(item);
      }
    } catch {
      setItemDetailWithSpecs(item);
    }
    setIsDetailModalOpen(true);
  };

  // Open Availability Modal
  const handleOpenAvailability = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditStatus(item.status);
    setEditQuantity(item.stock_quantity || 1);
    setEditFlashSale(item.is_available_for_flash_sale);
    setEditGroupBuy(item.is_available_for_group_buy ?? true);
    setIsAvailabilityModalOpen(true);
  };

  // Submit Availability Update
  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await dealerApi.updateInventoryAvailability(selectedItem.id, {
        status: editStatus,
        stock_quantity: editQuantity,
        is_available_for_flash_sale: editFlashSale,
        is_available_for_group_buy: editGroupBuy,
      });

      if (res.success) {
        setSuccessMessage(`Availability updated for ${selectedItem.model_name} ${selectedItem.variant_name}.`);
        setIsAvailabilityModalOpen(false);
        loadInventoryData();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update availability.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open History Drawer
  const handleOpenHistory = async (item: InventoryItem) => {
    setSelectedItem(item);
    setIsHistoryDrawerOpen(true);
    setIsLoadingHistory(true);
    try {
      const res = await dealerApi.getInventoryHistory(item.id);
      if (res.success && res.data) {
        setItemHistory(res.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Warehouse className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Vehicle Inventory Management
            </h1>
            <Badge variant="outline" className="bg-slate-100 text-slate-700 text-xs font-mono">
              {dashboardMetrics?.total_units ?? items.length} Units On Lot
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time physical stockyard surveillance, catalogue variant mapping, and availability controls.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 shadow-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Vehicle from Catalogue
          </Button>
        )}
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
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
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-center justify-between text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Dashboard Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Units</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {dashboardMetrics?.total_units ?? items.length}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Physical & In-Transit</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">In Stock</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {dashboardMetrics?.in_stock ?? items.filter((i) => i.status === "IN_STOCK").length}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Available for Pitching</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">In Transit</span>
            <div className="text-xl font-bold text-blue-600 mt-1">
              {dashboardMetrics?.in_transit ?? items.filter((i) => i.status === "IN_TRANSIT").length}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Dispatched from OEM</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Allocated</span>
            <div className="text-xl font-bold text-amber-600 mt-1">
              {dashboardMetrics?.allocated_to_group ?? items.filter((i) => i.status === "ALLOCATED_TO_GROUP").length}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Locked to Buyer Groups</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aging ({">"}45d)</span>
              {(dashboardMetrics?.aging_units ?? 0) > 0 && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <div className={`text-xl font-bold mt-1 ${(dashboardMetrics?.aging_units ?? 0) > 0 ? "text-amber-600" : "text-slate-700"}`}>
              {dashboardMetrics?.aging_units ?? items.filter((i) => i.days_in_yard >= 45).length}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Holding Cost Warning</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Yard Valuation</span>
            <div className="text-base font-bold text-slate-900 mt-1 truncate">
              {formatINR(dashboardMetrics?.total_valuation_inr ?? 8500000)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Ex-Showroom Basis</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Advanced Filters */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by VIN, Model, Trim, Tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-slate-50/50"
              />
            </div>

            {/* Brand Filter */}
            <div>
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setModelFilter("ALL");
                }}
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Filter */}
            <div>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Models</option>
                {availableModelsForFilter.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.body_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Fuel Type Filter */}
            <div>
              <select
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Fuel Types</option>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
            {/* Transmission Filter */}
            <div>
              <select
                value={transFilter}
                onChange={(e) => setTransFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Transmissions</option>
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Dealership Facilities</option>
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
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Inventory Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="ALLOCATED_TO_GROUP">Allocated to Group</option>
                <option value="SOLD">Sold</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">Yard & Showroom Stock</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Showing {filteredItems.length} of {items.length} units matching active filters
            </CardDescription>
          </div>

          {(searchQuery || brandFilter !== "ALL" || modelFilter !== "ALL" || fuelFilter !== "ALL" || transFilter !== "ALL" || branchFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setBrandFilter("ALL");
                setModelFilter("ALL");
                setFuelFilter("ALL");
                setTransFilter("ALL");
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
          ) : filteredItems.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Warehouse}
                title="No inventory units located"
                description="No vehicles match the selected search or filter criteria in your dealership stockyards."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchQuery("");
                  setBrandFilter("ALL");
                  setModelFilter("ALL");
                  setFuelFilter("ALL");
                  setTransFilter("ALL");
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
                    <th className="px-4 py-3">Vehicle / Model</th>
                    <th className="px-4 py-3">Powertrain & Colour</th>
                    <th className="px-4 py-3">VIN / Stock Tag</th>
                    <th className="px-4 py-3">Yard Facility & Bay</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Lot Age</th>
                    <th className="px-4 py-3 text-right">Ex-Showroom Price</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map((item) => {
                    const isAging = item.days_in_yard >= 45 && item.status === "IN_STOCK";
                    const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.IN_STOCK;
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Vehicle / Model */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.vehicle_image_url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80"}
                              alt={item.model_name}
                              className="h-9 w-12 rounded object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 leading-tight">
                                {item.model_name}
                              </div>
                              <div className="text-xs text-slate-500 truncate max-w-[170px]">
                                {item.variant_name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Powertrain & Colour */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0 border-slate-200">
                                {item.fuel_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0 border-slate-200">
                                {item.transmission_type}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-600 truncate max-w-[150px]">
                              {item.colour_name}
                            </div>
                          </div>
                        </td>

                        {/* VIN / Stock Tag */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs text-slate-800 font-medium">
                              {item.vin || "VIN Pending"}
                            </div>
                            <div className="text-xs text-slate-400">
                              Tag: {item.stock_serial_number || "Unassigned"}
                            </div>
                          </div>
                        </td>

                        {/* Yard Facility & Bay */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 text-slate-700 text-xs">
                              <Building className="h-3 w-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[160px]">{item.branch_name || "Central Yard"}</span>
                            </div>
                            <div className="text-xs text-slate-400 truncate max-w-[160px]">
                              {item.yard_location || "In Transit"}
                            </div>
                          </div>
                        </td>

                        {/* Availability */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <Badge variant="outline" className={`text-xs font-medium border ${statusInfo.badgeClass}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            {item.is_available_for_flash_sale && (
                              <div className="flex items-center space-x-1 text-xs font-semibold text-rose-600">
                                <Zap className="h-2.5 w-2.5" />
                                <span>Flash Sale Active</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Lot Age */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-1.5">
                            <span className={`font-semibold text-xs ${isAging ? "text-amber-600 font-bold" : "text-slate-700"}`}>
                              {item.days_in_yard} Days
                            </span>
                            {isAging && (
                              <span title="Holding penalty threshold exceeded (45+ Days)">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            Mfg: {item.manufacturing_month_year}
                          </span>
                        </td>

                        {/* Ex-Showroom Price */}
                        <td className="px-4 py-3.5 text-right font-semibold text-xs text-slate-900">
                          {formatINR(item.ex_showroom_price)}
                          {item.stock_quantity && item.stock_quantity > 1 && (
                            <div className="text-xs font-normal text-slate-400">
                              Batch: {item.stock_quantity} units
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* View Vehicle Details */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(item)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                              title="View Vehicle Specifications & Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Edit Commercial Info */}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                                title="Edit Commercial Inventory Details"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {/* Quick Availability Update */}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenAvailability(item)}
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="Quick Update Availability & Status"
                              >
                                <Settings2 className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {/* Inventory History */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenHistory(item)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                              title="View Inventory History"
                            >
                              <History className="h-3.5 w-3.5" />
                            </Button>
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

      {/* MODAL 1: Add Vehicle from Catalogue */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-xs">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Add Vehicle from Official Catalogue</h3>
                  <p className="text-xs text-slate-500">
                    Official specifications are maintained by GROUPDRIVE Admin. Configure dealer-specific yard details.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {/* Step 1: Catalogue Variant Selection */}
              <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-3">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                  Step 1: Select Catalogue Model & Trim
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Brand *</label>
                    <select
                      value={addFormBrandId}
                      onChange={(e) => {
                        const newBrand = e.target.value;
                        setAddFormBrandId(newBrand);
                        const newModels = models.filter((m) => m.brand_id === newBrand);
                        const firstM = newModels[0]?.id || "";
                        setAddFormModelId(firstM);
                        const newVars = variants.filter((v) => v.model_id === firstM);
                        setAddFormVariantId(newVars[0]?.id || "");
                        if (newVars[0]) {
                          setAddFormPrice(newVars[0].official_ex_showroom_price);
                          setAddFormColourId(newVars[0].colours[0]?.id || "");
                        }
                      }}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Model *</label>
                    <select
                      value={addFormModelId}
                      onChange={(e) => {
                        const newM = e.target.value;
                        setAddFormModelId(newM);
                        const newVars = variants.filter((v) => v.model_id === newM);
                        setAddFormVariantId(newVars[0]?.id || "");
                        if (newVars[0]) {
                          setAddFormPrice(newVars[0].official_ex_showroom_price);
                          setAddFormColourId(newVars[0].colours[0]?.id || "");
                        }
                      }}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {availableAddModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Official Variant *</label>
                    <select
                      value={addFormVariantId}
                      onChange={(e) => {
                        const vId = e.target.value;
                        setAddFormVariantId(vId);
                        const match = variants.find((v) => v.id === vId);
                        if (match) {
                          setAddFormPrice(match.official_ex_showroom_price);
                          setAddFormColourId(match.colours[0]?.id || "");
                        }
                      }}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {availableAddVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.fuel_type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Official Specifications Read-Only Banner */}
                {selectedAddVariant && (
                  <div className="p-3 bg-white rounded-md border border-blue-200 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-xs text-slate-400 block">Fuel & Transmission</span>
                      <span className="font-semibold">{selectedAddVariant.fuel_type} • {selectedAddVariant.transmission_type}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Engine & Power</span>
                      <span className="font-semibold">{selectedAddVariant.power_ps}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Certified Mileage</span>
                      <span className="font-semibold">{selectedAddVariant.arai_mileage}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Catalogue Reference Price</span>
                      <span className="font-semibold text-blue-700">{formatINR(selectedAddVariant.official_ex_showroom_price)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: OEM Colour Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Official OEM Paint Colour *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedAddVariant?.colours.map((c) => {
                    const isSelected = addFormColourId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setAddFormColourId(c.id)}
                        className={`p-2 rounded-md border cursor-pointer flex items-center space-x-2 transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className="h-4 w-4 rounded-full border border-slate-300 flex-shrink-0"
                          style={{ backgroundColor: c.hex_code }}
                        />
                        <span className="text-xs text-slate-800 truncate">{c.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Dealer Commercial Configuration */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Step 2: Dealer Yard & Commercial Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Facility / Branch *</label>
                    {isOwner ? (
                      <select
                        value={addFormBranchId}
                        onChange={(e) => setAddFormBranchId(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branch_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="h-9 px-3 rounded-md border border-slate-200 bg-slate-100 flex items-center text-xs text-slate-700">
                        {branches.find((b) => b.id === callerBranchId)?.branch_name || "Assigned Facility"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Yard Location / Bay *</label>
                    <Input
                      placeholder="e.g. Bay 4B - Whitefield Yard"
                      value={addFormYardLocation}
                      onChange={(e) => setAddFormYardLocation(e.target.value)}
                      className="text-xs h-9"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">VIN (17 Characters)</label>
                    <Input
                      placeholder="e.g. MA3EYD21SNG104821"
                      value={addFormVin}
                      onChange={(e) => setAddFormVin(e.target.value.toUpperCase())}
                      className="text-xs h-9 font-mono"
                      maxLength={17}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Stock Tag / Serial</label>
                    <Input
                      placeholder="e.g. KY-2026-9050"
                      value={addFormStockTag}
                      onChange={(e) => setAddFormStockTag(e.target.value)}
                      className="text-xs h-9 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Manufacturing Date</label>
                    <Input
                      placeholder="MM-YYYY (e.g. 11-2026)"
                      value={addFormMfgDate}
                      onChange={(e) => setAddFormMfgDate(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Initial Status</label>
                    <select
                      value={addFormStatus}
                      onChange={(e) => setAddFormStatus(e.target.value as InventoryStatus)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="IN_STOCK">In Stock</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="ALLOCATED_TO_GROUP">Allocated to Group</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Stock Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      value={addFormQuantity}
                      onChange={(e) => setAddFormQuantity(parseInt(e.target.value) || 1)}
                      className="text-xs h-9"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Dealer Ex-Showroom (INR) *</label>
                    <Input
                      type="number"
                      min={100000}
                      step={1000}
                      value={addFormPrice}
                      onChange={(e) => setAddFormPrice(parseInt(e.target.value) || 0)}
                      className="text-xs h-9 font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addFormFlashSale}
                      onChange={(e) => setAddFormFlashSale(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Eligible for Flash Sale Campaigns</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addFormGroupBuy}
                      onChange={(e) => setAddFormGroupBuy(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Available for Group Buying Quotations</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Inspection & Yard Notes</label>
                  <Input
                    placeholder="e.g. Pre-delivery inspection passed. Ready for immediate customer delivery."
                    value={addFormNotes}
                    onChange={(e) => setAddFormNotes(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
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
                  {isSubmitting ? "Adding Vehicle..." : "Save Vehicle to Yard"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Commercial Inventory Information */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Edit Inventory: {selectedItem.model_name} {selectedItem.variant_name}
                  </h3>
                  <p className="text-xs text-slate-500">Official specs are read-only. Adjust dealer commercial info.</p>
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
              {/* Immutable Specs Notice */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>
                  Official Catalogue Specs: <strong>{selectedItem.fuel_type}</strong>, <strong>{selectedItem.transmission_type}</strong>, Colour: <strong>{selectedItem.colour_name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Facility / Branch</label>
                  {isOwner ? (
                    <select
                      value={editBranchId}
                      onChange={(e) => setEditBranchId(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={selectedItem.branch_name}
                      disabled
                      className="text-xs h-9 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Yard Location / Bay *</label>
                  <Input
                    value={editYardLocation}
                    onChange={(e) => setEditYardLocation(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Inventory Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as InventoryStatus)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="ALLOCATED_TO_GROUP">Allocated to Group</option>
                    <option value="SOLD">Sold</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Stock Quantity</label>
                  <Input
                    type="number"
                    min={0}
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                    className="text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Dealer Ex-Showroom (INR)</label>
                  <Input
                    type="number"
                    min={100000}
                    step={1000}
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                    className="text-xs h-9 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">VIN (17 Characters)</label>
                  <Input
                    value={editVin}
                    onChange={(e) => setEditVin(e.target.value.toUpperCase())}
                    className="text-xs h-9 font-mono"
                    maxLength={17}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFlashSale}
                    onChange={(e) => setEditFlashSale(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Eligible for Flash Sale</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editGroupBuy}
                    onChange={(e) => setEditGroupBuy(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Available for Group Buying</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

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
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Vehicle Details & Specifications */}
      {isDetailModalOpen && (selectedItem || itemDetailWithSpecs) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-xs">
              <h3 className="text-sm font-semibold text-slate-900">Vehicle Specification Dossier</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Hero Image & Title */}
              <div className="space-y-2">
                <img
                  src={selectedItem?.vehicle_image_url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
                  alt={selectedItem?.model_name}
                  className="w-full h-44 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{selectedItem?.model_name}</h4>
                    <p className="text-xs text-slate-500">{selectedItem?.variant_name}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[selectedItem?.status || "IN_STOCK"].badgeClass}`}>
                    {STATUS_CONFIG[selectedItem?.status || "IN_STOCK"].label}
                  </Badge>
                </div>
              </div>

              {/* Official Catalogue Powertrain Specs */}
              <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-100 space-y-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                  Official OEM Specifications (Immutable)
                </span>
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700">
                  <div>
                    <span className="text-xs text-slate-400 block">Powertrain Engine</span>
                    <span className="font-semibold">{itemDetailWithSpecs?.official_specifications?.engine_description || "Certified OEM Engine"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Peak Output</span>
                    <span className="font-semibold">{itemDetailWithSpecs?.official_specifications?.power_ps || "OEM Certified Power"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">ARAI Certified Mileage</span>
                    <span className="font-semibold text-emerald-700">{itemDetailWithSpecs?.official_specifications?.arai_mileage || "Standard Mileage"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Transmission & Fuel</span>
                    <span className="font-semibold">{selectedItem?.transmission_type} • {selectedItem?.fuel_type}</span>
                  </div>
                </div>
              </div>

              {/* Dealer Commercial & Stockyard Location */}
              <div className="space-y-2 text-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Dealer Physical Inventory Record
                </span>
                <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-2.5">
                  <div>
                    <span className="text-slate-500">VIN</span>
                    <p className="font-mono font-medium text-slate-900">{selectedItem?.vin || "In-Transit Tag"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Yard Stock Tag</span>
                    <p className="font-mono font-medium text-slate-900">{selectedItem?.stock_serial_number || "Unassigned"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Facility / Stockyard</span>
                    <p className="font-medium text-slate-900">{selectedItem?.branch_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Yard Bay Position</span>
                    <p className="font-medium text-slate-900">{selectedItem?.yard_location}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Lot Age</span>
                    <p className="font-semibold text-slate-900">{selectedItem?.days_in_yard} Days</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Manufacturing Month</span>
                    <p className="font-medium text-slate-900">{selectedItem?.manufacturing_month_year}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Dealer Commercial Price</span>
                    <p className="font-bold text-blue-700 text-sm">{formatINR(selectedItem?.ex_showroom_price || 0)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Stock Units</span>
                    <p className="font-semibold text-slate-900">{selectedItem?.stock_quantity ?? 1} Units</p>
                  </div>
                </div>
              </div>

              {selectedItem?.notes && (
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Yard Inspection Notes:</span> {selectedItem.notes}
                </div>
              )}

              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full text-xs h-9"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Quick Availability Update Dialog */}
      {isAvailabilityModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Update Availability</h3>
                <p className="text-xs text-slate-500">{selectedItem.model_name} {selectedItem.variant_name}</p>
              </div>
            </div>

            <form onSubmit={handleAvailabilitySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as InventoryStatus)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IN_STOCK">In Stock (Available)</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="ALLOCATED_TO_GROUP">Allocated to Group</option>
                  <option value="SOLD">Sold</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Stock Quantity</label>
                <Input
                  type="number"
                  min={0}
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFlashSale}
                    onChange={(e) => setEditFlashSale(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Active for Flash Sale Campaign</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editGroupBuy}
                    onChange={(e) => setEditGroupBuy(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Available for Group Buying</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAvailabilityModalOpen(false)}
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
                  {isSubmitting ? "Updating..." : "Update Availability"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: Inventory Lifecycle History */}
      {isHistoryDrawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Inventory Lifecycle Trail</h3>
                  <p className="text-xs text-slate-500">{selectedItem.model_name} {selectedItem.variant_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingHistory ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading audit events...</div>
              ) : itemHistory.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-500">
                  No previous audit events recorded for this vehicle.
                </div>
              ) : (
                itemHistory.map((hist) => (
                  <div key={hist.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs bg-white border-slate-200 font-medium">
                        {hist.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(hist.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {new Date(hist.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium pt-0.5">
                      {hist.details}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-200/50">
                      <span>Logged by {hist.actor_name}</span>
                      <span className="font-mono">{hist.actor_role}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="w-full text-xs h-9"
              >
                Close Audit Trail
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
