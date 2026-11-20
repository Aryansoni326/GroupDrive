"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Warehouse,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Square,
  Activity,
  Award,
  DollarSign,
  Car,
  Filter,
  Phone,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { dealerApi } from "../../../lib/api";
import {
  DealerDashboardData,
  DealerTask,
  DealerFollowUp,
} from "@groupdrive/types";
import { formatINR, formatDate } from "@groupdrive/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/feedback/empty-state";
import { ErrorCard } from "../../../components/feedback/error-card";

type DateFilterType = "all" | "today" | "this_week" | "this_month";

export default function DashboardPage() {
  const { user, dealer, currentBranch } = useAuth();
  const [dashboardData, setDashboardData] = useState<DealerDashboardData | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingTask, setIsUpdatingTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = user?.staff_role || "DEALER_OWNER";

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dealerApi.getDashboard(currentBranch?.id, dateFilter);
      setDashboardData(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard metrics";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentBranch, dateFilter, role]);

  const handleToggleTask = async (task: DealerTask) => {
    setIsUpdatingTask(task.id);
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      await dealerApi.updateTaskStatus(task.id, newStatus);
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          tasks: dashboardData.tasks.map((t) =>
            t.id === task.id ? { ...t, status: newStatus } : t
          ),
        });
      }
    } catch {
      // Keep UI state resilient
    } finally {
      setIsUpdatingTask(null);
    }
  };

  const handleCompleteFollowUp = async (followUp: DealerFollowUp) => {
    try {
      await dealerApi.updateFollowUpStatus(followUp.id, "COMPLETED");
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          upcoming_follow_ups: dashboardData.upcoming_follow_ups.map((f) =>
            f.id === followUp.id ? { ...f, status: "COMPLETED" } : f
          ),
        });
      }
    } catch {
      // Keep UI resilient
    }
  };

  const metrics = dashboardData?.metrics;
  const tasks = dashboardData?.tasks || [];
  const enquiries = dashboardData?.recent_enquiries || [];
  const followUps = dashboardData?.upcoming_follow_ups || [];
  const activities = dashboardData?.recent_activities || [];
  const inventorySummary = dashboardData?.inventory_summary;
  const groupOpportunities = dashboardData?.latest_group_opportunities || [];
  const quotations = dashboardData?.recent_quotations || [];
  const salesPerformance = dashboardData?.sales_performance || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcoming Showroom Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome back, {user?.first_name || "Dealership Team"}
              </h1>
              <Badge variant="success" className="text-xs px-2.5 py-0.5 font-semibold">
                Online
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {dealer?.trade_name || "GroupDrive Partner Dealership"}
              {" - "}
              <span className="font-medium text-slate-900">
                {currentBranch ? currentBranch.branch_name : "All Showroom Branches"}
              </span>
              {" | "}
              <span className="text-slate-500">
                Logged in as <strong className="text-slate-700 capitalize">{role.toLowerCase().replace(/_/g, " ")}</strong>
              </span>
            </p>
          </div>

          {/* Date Filter & Fast Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 text-sm">
              <Filter className="h-4 w-4 text-slate-500 ml-1.5 mr-1.5" />
              <button
                onClick={() => setDateFilter("all")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  dateFilter === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  dateFilter === "today"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter("this_week")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  dateFilter === "this_week"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setDateFilter("this_month")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  dateFilter === "this_month"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Month
              </button>
            </div>

            <Link href="/leads">
              <Button variant="primary" size="default" className="text-sm font-semibold shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Enquiry
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && <ErrorCard message={error} onRetry={loadDashboardData} />}

      {/* 2. Primary 4-Card KPI Overview Grid - Identical Height & Width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* KPI 1: Active Leads */}
        <Link href="/leads" className="h-full block group">
          <Card className="h-full flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all border-slate-200">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2 h-9">
                <CardDescription className="text-xs font-bold text-slate-600 uppercase tracking-wider truncate" title="Active Customer Leads">
                  Active Customer Leads
                </CardDescription>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
              <div className="text-3xl font-extrabold text-slate-900">
                {isLoading ? "..." : metrics?.total_enquiries ?? 0}
              </div>
              <div className="flex items-center text-xs font-medium text-emerald-700 mt-2 h-5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0" />
                <span className="truncate">{metrics?.new_leads ?? 0} new waiting for contact</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* KPI 2: Follow-ups Due */}
        <Link href="/follow-ups" className="h-full block group">
          <Card className="h-full flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all border-amber-200 bg-amber-50/20">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2 h-9">
                <CardDescription className="text-xs font-bold text-amber-800 uppercase tracking-wider truncate" title="Follow-ups Due Today">
                  Follow-ups Due Today
                </CardDescription>
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-200 transition-colors flex-shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
              <div className="text-3xl font-extrabold text-amber-900">
                {isLoading ? "..." : metrics?.follow_ups_due ?? 0}
              </div>
              <div className="flex items-center text-xs font-medium text-amber-800 mt-2 h-5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5 flex-shrink-0" />
                <span className="truncate">Scheduled customer calls & visits</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* KPI 3: Available Inventory */}
        <Link href="/inventory" className="h-full block group">
          <Card className="h-full flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all border-slate-200">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2 h-9">
                <CardDescription className="text-xs font-bold text-slate-600 uppercase tracking-wider truncate" title="Vehicles in Stockyard">
                  Vehicles in Stockyard
                </CardDescription>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                  <Warehouse className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
              <div className="text-3xl font-extrabold text-blue-800">
                {isLoading ? "..." : metrics?.available_inventory ?? 0}
              </div>
              <div className="flex items-center text-xs font-medium text-slate-600 mt-2 h-5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 flex-shrink-0" />
                <span className="truncate">{inventorySummary?.in_stock || 0} physical units ready on lot</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* KPI 4: Group Buyer Pools */}
        <Link href="/demand" className="h-full block group">
          <Card className="h-full flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all border-purple-200 bg-purple-50/20">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2 h-9">
                <CardDescription className="text-xs font-bold text-purple-800 uppercase tracking-wider truncate" title="Buyer Demand Pools">
                  Buyer Demand Pools
                </CardDescription>
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-200 transition-colors flex-shrink-0">
                  <Radio className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
              <div className="text-3xl font-extrabold text-purple-900">
                {isLoading ? "..." : metrics?.group_purchasing_opportunities ?? 0}
              </div>
              <div className="flex items-center text-xs font-medium text-purple-800 mt-2 h-5">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1.5 flex-shrink-0" />
                <span className="truncate">Active group buying pools</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 3. Non-Tech Friendly Quick Action Shortcuts - Equal Heights & Widths */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Daily Quick Shortcuts
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch">
          <Link
            href="/leads"
            className="h-full min-h-[72px] flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="p-2 rounded-md bg-emerald-50 text-emerald-600 mr-3 group-hover:scale-105 transition-transform flex-shrink-0">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">New Lead</p>
              <p className="text-xs text-slate-500 truncate">Record customer enquiry</p>
            </div>
          </Link>

          <Link
            href="/follow-ups"
            className="h-full min-h-[72px] flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="p-2 rounded-md bg-amber-50 text-amber-600 mr-3 group-hover:scale-105 transition-transform flex-shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Follow-ups</p>
              <p className="text-xs text-slate-500 truncate">Check calls & visits</p>
            </div>
          </Link>

          <Link
            href="/demand"
            className="h-full min-h-[72px] flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="p-2 rounded-md bg-purple-50 text-purple-600 mr-3 group-hover:scale-105 transition-transform flex-shrink-0">
              <Radio className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Demand Radar</p>
              <p className="text-xs text-slate-500 truncate">View group buyers</p>
            </div>
          </Link>

          <Link
            href="/inventory"
            className="h-full min-h-[72px] flex items-center p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="p-2 rounded-md bg-blue-50 text-blue-600 mr-3 group-hover:scale-105 transition-transform flex-shrink-0">
              <Warehouse className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Yard Inventory</p>
              <p className="text-xs text-slate-500 truncate">Check vehicle stock</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Main Two-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (65% width) - Daily Action Desk */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: Today's Action Checklist */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center">
                  <CheckSquare className="h-5 w-5 text-emerald-600 mr-2" />
                  Today's Action Checklist
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 mt-0.5">
                  Priority follow-ups and tasks assigned to showroom staff
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
                {tasks.filter((t) => t.status !== "DONE").length} Remaining
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5">
              {tasks.length === 0 ? (
                <EmptyState
                  title="No pending tasks today"
                  description="Great job! All scheduled dealership tasks have been completed."
                />
              ) : (
                tasks.map((task) => {
                  const isDone = task.status === "DONE";
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-lg border text-sm transition-all flex items-start justify-between gap-3 ${
                        isDone
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleToggleTask(task)}
                          disabled={isUpdatingTask === task.id}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                          aria-label={isDone ? "Mark incomplete" : "Mark completed"}
                        >
                          {isDone ? (
                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                        <div>
                          <p className={`font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {task.description}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>Due: <strong className="text-slate-700">{formatDate(task.due_date, true)}</strong></span>
                            {task.assigned_to_name && (
                              <span>Assigned to: <strong className="text-slate-700">{task.assigned_to_name}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <Badge
                          variant={
                            task.priority === "HIGH"
                              ? "destructive"
                              : task.priority === "MEDIUM"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-xs px-2 py-0.5"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* SECTION 2: Upcoming Customer Follow-ups */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center">
                  <Clock className="h-5 w-5 text-amber-600 mr-2" />
                  Scheduled Customer Follow-ups
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 mt-0.5">
                  Phone calls, test drive visits, and quote discussions
                </CardDescription>
              </div>
              <Link href="/follow-ups">
                <Button variant="ghost" size="sm" className="text-sm text-slate-700 hover:text-slate-900">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {followUps.length === 0 ? (
                <EmptyState
                  title="No follow-ups due"
                  description="There are no pending customer reminders scheduled for this period."
                />
              ) : (
                followUps.map((flw) => {
                  const isCompleted = flw.status === "COMPLETED";
                  return (
                    <div
                      key={flw.id}
                      className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-base">
                            {flw.customer_name}
                          </span>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {flw.follow_up_type.replace(/_/g, " ")}
                          </Badge>
                          {flw.priority === "HIGH" && (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5 font-bold">
                              URGENT
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center font-medium text-slate-800">
                            <Phone className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            {flw.customer_phone}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                            {formatDate(flw.scheduled_at, true)}
                          </span>
                          <span>Assigned: <strong className="text-slate-700">{flw.assigned_to_name}</strong></span>
                        </div>

                        {flw.notes && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                            "{flw.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-2 sm:pt-0">
                        {isCompleted ? (
                          <Badge variant="success" className="text-xs px-3 py-1 font-semibold">
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            Completed
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteFollowUp(flw)}
                            className="text-sm font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                            Mark Done
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* SECTION 3: Recent Enquiries */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  Recent Customer Enquiries
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 mt-0.5">
                  Walk-ins, group interest, and direct showroom leads
                </CardDescription>
              </div>
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="text-sm text-slate-700 hover:text-slate-900">
                  View All Leads <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4">
              {enquiries.length === 0 ? (
                <EmptyState
                  title="No enquiries recorded"
                  description="Incoming customer enquiries will appear here automatically."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {enquiries.map((enq) => (
                    <div
                      key={enq.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-base">
                            {enq.customer_name}
                          </span>
                          <Badge
                            variant={
                              enq.status === "NEW"
                                ? "destructive"
                                : enq.status === "CONVERTED"
                                ? "success"
                                : "outline"
                            }
                            className="text-xs px-2 py-0.5 font-semibold"
                          >
                            {enq.status}
                          </Badge>
                          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                            {enq.source.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">
                          Interested in: <strong className="text-slate-900">{enq.interested_model}</strong> ({enq.interested_variant})
                        </p>
                        <p className="text-xs text-slate-500">
                          {enq.customer_phone} | {enq.customer_email} | Branch: {enq.branch_name}
                        </p>
                      </div>

                      <div className="text-left sm:text-right text-xs text-slate-600">
                        <p>Sales Rep: <strong className="text-slate-800">{enq.assigned_to_name}</strong></p>
                        <p className="text-slate-400 mt-0.5">{formatDate(enq.created_at, true)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (35% width) - Showroom Operations Desk */}
        <div className="space-y-6">
          {/* SECTION 4: Active Group Purchasing Pools */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                    <Radio className="h-5 w-5 text-purple-600 mr-2" />
                    Active Buyer Pools
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Collective buyer groups ready for quotes
                  </CardDescription>
                </div>
                <Link href="/demand">
                  <Button variant="ghost" size="sm" className="text-xs text-purple-700 hover:text-purple-900">
                    Radar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {groupOpportunities.length === 0 ? (
                <EmptyState
                  title="No active buyer groups"
                  description="Forming buyer pools in your territory will appear here."
                />
              ) : (
                groupOpportunities.slice(0, 3).map((grp) => {
                  const isQuoting = grp.status === "OPEN_FOR_QUOTES";
                  return (
                    <div
                      key={grp.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {grp.model_name}
                        </span>
                        <Badge
                          variant={isQuoting ? "warning" : "secondary"}
                          className="text-xs font-medium"
                        >
                          {grp.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Group: <strong className="font-mono text-slate-800">{grp.group_code}</strong></span>
                        <span className="font-semibold text-purple-700">
                          {grp.current_members_count} of {grp.max_capacity} Buyers
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (grp.current_members_count / grp.max_capacity) * 100)}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-500">
                          Circle: {grp.rto_circle}
                        </span>
                        <Link href="/demand">
                          <Button size="sm" variant={isQuoting ? "primary" : "outline"} className="text-xs h-8">
                            {isQuoting ? "Submit Quote" : "Details"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* SECTION 5: Stockyard Inventory Summary */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                    <Warehouse className="h-5 w-5 text-blue-600 mr-2" />
                    Yard Stock Snapshot
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Physical units and aging inventory
                  </CardDescription>
                </div>
                <Link href="/inventory">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-700 hover:text-blue-900">
                    Yard Lot <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Inventory 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">In Stock Yard</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">
                    {inventorySummary?.in_stock || 0} Units
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-700 font-semibold uppercase">Allocated Groups</p>
                  <p className="text-xl font-bold text-purple-700 mt-0.5">
                    {inventorySummary?.allocated_to_groups || 0} Units
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">In Transit</p>
                  <p className="text-xl font-bold text-slate-700 mt-0.5">
                    {inventorySummary?.in_transit || 0} Units
                  </p>
                </div>
                <div>
                  <p className="text-xs text-rose-600 font-semibold uppercase">Aging (&gt; 45d)</p>
                  <p className="text-xl font-bold text-rose-700 mt-0.5">
                    {inventorySummary?.aging_units || 0} Units
                  </p>
                </div>
              </div>

              {/* Recent Vehicles */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recent Vehicles on Lot
                </p>
                {inventorySummary?.recent_stock.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors space-y-1 text-sm"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{item.model_name} {item.variant_name}</span>
                      <span className="text-xs font-medium text-slate-600">
                        {item.days_in_yard}d on lot
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                      <span>Location: {item.yard_location}</span>
                      <span className="font-bold text-slate-900">{formatINR(item.ex_showroom_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 6: Live Activity Stream */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Activity className="h-5 w-5 text-emerald-600 mr-2" />
                Recent Showroom Activity
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Real-time log of customer enquiries, quotes, and notes
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 text-xs">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="relative flex items-start space-x-3 pl-6">
                    <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-900 ring-2 ring-slate-100" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 text-xs">
                        {act.actor_name}{" "}
                        <span className="font-normal text-slate-500">
                          ({act.actor_role.replace(/_/g, " ")})
                        </span>
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {act.description}
                      </p>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {formatDate(act.created_at, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
