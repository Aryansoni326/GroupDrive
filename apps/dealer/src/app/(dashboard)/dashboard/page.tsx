"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Car,
  Warehouse,
  CheckCircle2,
  PlusCircle,
  Tag,
  Radio,
  Trash2,
  Calendar,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  Edit,
  ExternalLink,
  DollarSign,
  UserCheck,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { dealerApi } from "../../../lib/api";
import { formatINR, formatDate } from "@groupdrive/utils";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

interface InventoryVehicle {
  id: string;
  model: string;
  variant: string;
  color: string;
  vin: string;
  price: number;
  status: "IN_STOCK" | "RESERVED" | "DELIVERED";
  branch: string;
}

interface DealOffer {
  id: string;
  title: string;
  model: string;
  discount: number;
  validUntil: string;
  status: "ACTIVE" | "EXPIRED";
}

interface StaffTask {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  priority: "HIGH" | "NORMAL";
  completed: boolean;
}

export default function SimpleSmartDealerDashboard() {
  const { user, dealer, currentBranch } = useAuth();

  // Date filter for analytics: "month" | "year" | "custom"
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"month" | "year" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState("2026-11-01");
  const [customEndDate, setCustomEndDate] = useState("2026-11-20");

  // Showroom Inventory State (which reflects on main website)
  const [inventory, setInventory] = useState<InventoryVehicle[]>([
    {
      id: "inv-001",
      model: "Maruti Suzuki Brezza",
      variant: "ZXi Plus 1.5L AT",
      color: "Magma Grey",
      vin: "MB12-98471-2026",
      price: 1398000,
      status: "IN_STOCK",
      branch: "Whitefield Showroom",
    },
    {
      id: "inv-002",
      model: "Maruti Suzuki Grand Vitara",
      variant: "Alpha Plus Strong Hybrid",
      color: "Arctic White",
      vin: "GV45-77291-2026",
      price: 1985000,
      status: "IN_STOCK",
      branch: "Bannerghatta Flagship",
    },
    {
      id: "inv-003",
      model: "Maruti Suzuki Fronx",
      variant: "Alpha 1.0L Turbo 6AT",
      color: "Splendid Silver",
      vin: "FX88-11203-2026",
      price: 1295000,
      status: "RESERVED",
      branch: "Whitefield Showroom",
    },
    {
      id: "inv-004",
      model: "Maruti Suzuki Swift",
      variant: "ZXi Plus Dual Tone",
      color: "Luster Blue",
      vin: "SW21-39912-2026",
      price: 945000,
      status: "IN_STOCK",
      branch: "Bannerghatta Flagship",
    },
  ]);

  // Deal Group Offers Management (Dealers can add or remove deals)
  const [offers, setOffers] = useState<DealOffer[]>([
    {
      id: "off-001",
      title: "Festive Group Fleet Discount",
      model: "Brezza ZXi Plus",
      discount: 65000,
      validUntil: "2026-11-30",
      status: "ACTIVE",
    },
    {
      id: "off-002",
      title: "Strong Hybrid Corporate Allocation",
      model: "Grand Vitara Alpha+",
      discount: 85000,
      validUntil: "2026-12-15",
      status: "ACTIVE",
    },
    {
      id: "off-003",
      title: "Pre-Launch Batch Incentive",
      model: "Fronx Turbo",
      discount: 40000,
      validUntil: "2026-11-25",
      status: "ACTIVE",
    },
  ]);

  // Today's Staff Tasks
  const [tasks, setTasks] = useState<StaffTask[]>([
    {
      id: "tsk-01",
      title: "Call Rahul Menon (Brezza Group lead) to confirm showroom delivery slot",
      assignedTo: "Arun Kumar (Sales)",
      dueDate: "Today, 02:00 PM",
      priority: "HIGH",
      completed: false,
    },
    {
      id: "tsk-02",
      title: "Submit reverse bid for Whitefield 8-Member Brezza Buyer Group",
      assignedTo: "Rajesh Rao (Branch Manager)",
      dueDate: "Today, 04:30 PM",
      priority: "HIGH",
      completed: false,
    },
    {
      id: "tsk-03",
      title: "Conduct PDI on Grand Vitara Strong Hybrid allotment #GV45",
      assignedTo: "Mahesh Gowda (Yard)",
      dueDate: "Today, 05:00 PM",
      priority: "NORMAL",
      completed: true,
    },
  ]);

  // Quick Add Vehicle Modal State
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [newCarModel, setNewCarModel] = useState("Maruti Suzuki Brezza");
  const [newCarVariant, setNewCarVariant] = useState("ZXi 1.5L MT");
  const [newCarColor, setNewCarColor] = useState("Pearl Arctic White");
  const [newCarPrice, setNewCarPrice] = useState("1150000");

  // Quick Add Task Modal State
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Arun Kumar (Sales)");
  const [newTaskDueDate, setNewTaskDueDate] = useState("Today, 05:00 PM");

  // Success Notice
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleRemoveDeal = (dealId: string) => {
    setOffers((prev) => prev.filter((d) => d.id !== dealId));
    setAlertNotice("Special Offer deal removed successfully.");
    setTimeout(() => setAlertNotice(null), 3500);
  };

  const handleRemoveCar = (carId: string) => {
    setInventory((prev) => prev.filter((c) => c.id !== carId));
    setAlertNotice("Vehicle removed from showroom stock. Main website updated.");
    setTimeout(() => setAlertNotice(null), 3500);
  };

  const handleAddCar = (e: React.FormEvent) => {
    e.preventDefault();
    const newVehicle: InventoryVehicle = {
      id: `inv-${Date.now()}`,
      model: newCarModel,
      variant: newCarVariant,
      color: newCarColor,
      vin: `MB-${Math.floor(10000 + Math.random() * 90000)}-2026`,
      price: parseFloat(newCarPrice) || 1200000,
      status: "IN_STOCK",
      branch: currentBranch?.branch_name || "Whitefield Showroom",
    };
    setInventory([newVehicle, ...inventory]);
    setIsAddCarModalOpen(false);
    setAlertNotice(`Added ${newCarModel} to showroom. Live on GroupDrive main site.`);
    setTimeout(() => setAlertNotice(null), 3500);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: StaffTask = {
      id: `tsk-${Date.now()}`,
      title: newTaskTitle,
      assignedTo: newTaskAssignee,
      dueDate: newTaskDueDate,
      priority: "HIGH",
      completed: false,
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setIsAddTaskModalOpen(false);
    setAlertNotice("New task assigned to staff member.");
    setTimeout(() => setAlertNotice(null), 3500);
  };

  // Particular Dealer Profile Data
  const dealerName = dealer?.trade_name || "Kalyani Motors Maruti Suzuki Nexa & Arena";
  const dealerFranchise = dealer?.oem_brand_franchise || "Maruti Suzuki India Limited";
  const dealerAddress = dealer?.registered_office_address || "No. 24, Outer Ring Road, Nayandahalli, Bengaluru";
  const dealerPhone = dealer?.primary_contact_phone || "+91 98450 12345";
  const dealerCity = currentBranch?.city || "Bengaluru";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Alert Notice Toast */}
      {alertNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{alertNotice}</span>
          </div>
          <button onClick={() => setAlertNotice(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          1. PARTICULAR DEALER PROFILE CARD & QUICK ACTIONS
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                {dealerFranchise}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                KYC Verified Dealer
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                📍 {dealerCity} Region
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              {dealerName}
            </h1>

            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {dealerAddress}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {dealerPhone}
              </span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">
                Active Branch: {currentBranch ? currentBranch.branch_name : "All Showrooms"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/settings">
              <Button
                variant="default"
                size="sm"
                className="font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-card flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Dealer Profile</span>
              </Button>
            </Link>

            <Link href="/branches">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Showroom Branches
              </Button>
            </Link>

            <Link href="/staff">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Staff & Roles
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. CORE METRICS STRIP (Active Customers, Follow-ups, Showroom Stock, Success Deals)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Customers */}
        <Link href="/leads" className="block group">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card hover:border-blue-400 hover:shadow-elevated transition-all flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Customers
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-black text-slate-900 font-mono">18</p>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">
                +4 new retail enquiries today
              </p>
            </div>
          </div>
        </Link>

        {/* KPI 2: Follow-up Leads */}
        <Link href="/follow-ups" className="block group">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card hover:border-indigo-400 hover:shadow-elevated transition-all flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Follow-Up Leads
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-black text-slate-900 font-mono">7</p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">
                3 test drives scheduled today
              </p>
            </div>
          </div>
        </Link>

        {/* KPI 3: Showroom Availability */}
        <Link href="/inventory" className="block group">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card hover:border-emerald-400 hover:shadow-elevated transition-all flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Showroom Vehicle Stock
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Warehouse className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-black text-slate-900 font-mono">{inventory.length}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                Live synced with main website
              </p>
            </div>
          </div>
        </Link>

        {/* KPI 4: Closed & Success Deals */}
        <Link href="/quotations" className="block group">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card hover:border-slate-400 hover:shadow-elevated transition-all flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Closed Deals Won
              </span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-black text-slate-900 font-mono">26</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                ₹1.82 Cr vehicle deliveries
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* =========================================================================
          3. VEHICLE DEMAND & SALES ANALYTICS (By Month, By Year, Custom Date)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="text-lg font-black text-slate-900">
                Vehicle Demand & Sales Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of customer group demand vs. showroom deliveries for your dealership
            </p>
          </div>

          {/* Period Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setAnalyticsPeriod("month")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  analyticsPeriod === "month"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                By Month
              </button>
              <button
                onClick={() => setAnalyticsPeriod("year")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  analyticsPeriod === "year"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                By Year
              </button>
              <button
                onClick={() => setAnalyticsPeriod("custom")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  analyticsPeriod === "custom"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Custom Date
              </button>
            </div>

            {analyticsPeriod === "custom" && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-300 text-xs text-slate-700"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-300 text-xs text-slate-700"
                />
              </div>
            )}
          </div>
        </div>

        {/* Analytics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                <th className="pb-3 font-bold">Vehicle Model</th>
                <th className="pb-3 font-bold">Buyer Demand Pools</th>
                <th className="pb-3 font-bold">Showroom Units Sold</th>
                <th className="pb-3 font-bold">Conversion Rate</th>
                <th className="pb-3 font-bold">Avg Group Discount</th>
                <th className="pb-3 font-bold">Marketplace Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3.5 font-bold text-slate-900">
                  Maruti Suzuki Brezza
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-blue-700 font-mono">
                    {analyticsPeriod === "year" ? "480 Buyers" : "42 Buyers"}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-emerald-700 font-mono">
                    {analyticsPeriod === "year" ? "194 Delivered" : "18 Delivered"}
                  </span>
                </td>
                <td className="py-3.5 font-semibold font-mono">42.8%</td>
                <td className="py-3.5 font-mono text-slate-600">{formatINR(55000)}</td>
                <td className="py-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    High Demand Fast Moving
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-slate-900">
                  Maruti Suzuki Grand Vitara
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-blue-700 font-mono">
                    {analyticsPeriod === "year" ? "390 Buyers" : "35 Buyers"}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-emerald-700 font-mono">
                    {analyticsPeriod === "year" ? "142 Delivered" : "12 Delivered"}
                  </span>
                </td>
                <td className="py-3.5 font-semibold font-mono">36.4%</td>
                <td className="py-3.5 font-mono text-slate-600">{formatINR(75000)}</td>
                <td className="py-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Strong Hybrid Focus
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-slate-900">
                  Maruti Suzuki Fronx
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-blue-700 font-mono">
                    {analyticsPeriod === "year" ? "310 Buyers" : "28 Buyers"}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-emerald-700 font-mono">
                    {analyticsPeriod === "year" ? "118 Delivered" : "10 Delivered"}
                  </span>
                </td>
                <td className="py-3.5 font-semibold font-mono">35.7%</td>
                <td className="py-3.5 font-mono text-slate-600">{formatINR(40000)}</td>
                <td className="py-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Steady Allocation
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-slate-900">
                  Maruti Suzuki Swift
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-blue-700 font-mono">
                    {analyticsPeriod === "year" ? "560 Buyers" : "50 Buyers"}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-emerald-700 font-mono">
                    {analyticsPeriod === "year" ? "248 Delivered" : "22 Delivered"}
                  </span>
                </td>
                <td className="py-3.5 font-semibold font-mono">44.2%</td>
                <td className="py-3.5 font-mono text-slate-600">{formatINR(30000)}</td>
                <td className="py-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Volume Leader
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          4. TWO-COLUMN: TODAY'S TASKS (WITH ASSIGNMENT) & DEAL GROUP MANAGEMENT
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Today's Tasks & Staff Assignment */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Today's Staff Tasks</h3>
              <p className="text-xs text-slate-500">Track and assign follow-ups to your sales executives</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddTaskModalOpen(true)}
              className="font-bold text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              + Assign Task
            </Button>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  task.completed
                    ? "bg-slate-50/70 border-slate-200 text-slate-400"
                    : "bg-white border-slate-200 hover:border-blue-300 text-slate-800 shadow-xs"
                }`}
              >
                <div className="mt-0.5 text-blue-600">
                  {task.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`font-semibold ${task.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">👤 {task.assignedTo}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {task.dueDate}
                    </span>
                    {task.priority === "HIGH" && !task.completed && (
                      <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                        Priority High
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/staff" className="text-blue-600 font-bold hover:underline">
              Manage All Staff Members →
            </Link>
            <Link href="/follow-ups" className="text-slate-500 hover:text-slate-800">
              View Follow-up Calendar
            </Link>
          </div>
        </div>

        {/* Right: Deal Group Management & Active Offers */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Special Offers & Deals</h3>
              <p className="text-xs text-slate-500">Published volume incentives visible to buyer groups</p>
            </div>
            <Link href="/campaigns">
              <Button variant="outline" size="sm" className="font-bold text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
                + New Offer
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{offer.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Save {formatINR(offer.discount)}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Applicable: {offer.model} • Valid until: {offer.validUntil}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveDeal(offer.id)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove this deal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/campaigns" className="text-blue-600 font-bold hover:underline">
              Manage All Deal Campaigns →
            </Link>
            <Link href="/demand" className="text-slate-500 hover:text-slate-800">
              Explore Live Demand Groups
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. SHOWROOM INVENTORY (Manage & Reflect on Main Website)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-black text-slate-900">
                Showroom Vehicle Inventory (Live on GroupDrive Main Website)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cars listed here are automatically searchable by retail customers on GroupDrive.
            </p>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddCarModalOpen(true)}
            className="font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-card flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Car to Showroom</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                <th className="pb-3 font-bold">Model & Variant</th>
                <th className="pb-3 font-bold">Colour & VIN</th>
                <th className="pb-3 font-bold">Ex-Showroom Price</th>
                <th className="pb-3 font-bold">Assigned Showroom</th>
                <th className="pb-3 font-bold">Availability</th>
                <th className="pb-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inventory.map((car) => (
                <tr key={car.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-bold text-slate-900">
                    <p>{car.model}</p>
                    <p className="text-[11px] text-slate-500 font-normal">{car.variant}</p>
                  </td>
                  <td className="py-3">
                    <p className="text-slate-800">{car.color}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{car.vin}</p>
                  </td>
                  <td className="py-3 font-bold text-slate-900 font-mono">
                    {formatINR(car.price)}
                  </td>
                  <td className="py-3 text-slate-600">{car.branch}</td>
                  <td className="py-3">
                    {car.status === "IN_STOCK" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ In Stock (Live on Web)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Reserved for Group
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleRemoveCar(car.id)}
                      className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold"
                      title="Remove from Showroom Inventory"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total Showroom Vehicles: <strong className="text-slate-800">{inventory.length}</strong>
          </span>
          <Link href="/inventory" className="text-blue-600 font-bold hover:underline">
            Open Advanced Inventory Console →
          </Link>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ADD CAR TO SHOWROOM INVENTORY
          ========================================================================= */}
      {isAddCarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Add Car to Showroom Inventory
              </h3>
              <button
                onClick={() => setIsAddCarModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCar} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Car Model</label>
                <select
                  value={newCarModel}
                  onChange={(e) => setNewCarModel(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 font-medium text-slate-800"
                >
                  <option value="Maruti Suzuki Brezza">Maruti Suzuki Brezza</option>
                  <option value="Maruti Suzuki Grand Vitara">Maruti Suzuki Grand Vitara</option>
                  <option value="Maruti Suzuki Fronx">Maruti Suzuki Fronx</option>
                  <option value="Maruti Suzuki Swift">Maruti Suzuki Swift</option>
                  <option value="Maruti Suzuki Baleno">Maruti Suzuki Baleno</option>
                  <option value="Maruti Suzuki Jimny">Maruti Suzuki Jimny</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Variant Name</label>
                <input
                  type="text"
                  value={newCarVariant}
                  onChange={(e) => setNewCarVariant(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-medium text-slate-800"
                  placeholder="e.g. ZXi Plus 1.5L AT"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exterior Colour</label>
                <input
                  type="text"
                  value={newCarColor}
                  onChange={(e) => setNewCarColor(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-medium text-slate-800"
                  placeholder="e.g. Magma Grey"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Ex-Showroom Price (₹)</label>
                <input
                  type="number"
                  value={newCarPrice}
                  onChange={(e) => setNewCarPrice(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-medium text-slate-800"
                  placeholder="1200000"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddCarModalOpen(false)}
                  className="w-1/2 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="w-1/2 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-card"
                >
                  Save & Publish to Web
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ASSIGN TASK TO STAFF
          ========================================================================= */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Assign Task to Showroom Staff
              </h3>
              <button
                onClick={() => setIsAddTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Description</label>
                <textarea
                  rows={2}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800"
                  placeholder="e.g. Follow up with buyer group member regarding insurance discount"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign to Staff Member</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 font-medium text-slate-800"
                >
                  <option value="Arun Kumar (Sales)">Arun Kumar (Sales)</option>
                  <option value="Rajesh Rao (Branch Manager)">Rajesh Rao (Branch Manager)</option>
                  <option value="Pooja Sharma (Sales Exec)">Pooja Sharma (Sales Exec)</option>
                  <option value="Mahesh Gowda (Yard)">Mahesh Gowda (Yard)</option>
                  <option value="Suresh Menon (Finance)">Suresh Menon (Finance)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Due By</label>
                <input
                  type="text"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-medium text-slate-800"
                  placeholder="Today, 05:00 PM"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="w-1/2 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="w-1/2 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-card"
                >
                  Assign Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
