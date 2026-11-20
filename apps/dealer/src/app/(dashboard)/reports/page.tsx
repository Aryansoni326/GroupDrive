"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  RotateCw,
  Search,
  Building,
  Users,
  ShieldAlert,
  Info,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Radio,
  Tag,
} from "lucide-react";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  ReportType,
  ReportFilterParams,
  AnalyticsOverviewStats,
  ReportDataPayload,
  DealerBranch,
} from "@groupdrive/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

const REPORT_TABS: { id: ReportType; label: string; icon: React.ElementType }[] = [
  { id: "ENQUIRY", label: "Enquiries", icon: Users },
  { id: "LEAD_STATUS", label: "Lead Funnel", icon: TrendingUp },
  { id: "LEAD_ASSIGNMENT", label: "Assignment", icon: Users },
  { id: "FOLLOW_UP", label: "Follow-ups", icon: Clock },
  { id: "SALES_CONVERSION", label: "Conversion", icon: ArrowUpRight },
  { id: "INVENTORY", label: "Yard Inventory", icon: Car },
  { id: "BRANCH_PERFORMANCE", label: "Branches", icon: Building },
  { id: "STAFF_PERFORMANCE", label: "Staff Scorecard", icon: Users },
  { id: "QUOTATION", label: "Quotations", icon: FileSpreadsheet },
  { id: "GROUP_OPPORTUNITY", label: "Group Buying", icon: Radio },
  { id: "CAMPAIGN_PERFORMANCE", label: "Campaigns", icon: Tag },
];

const DATE_PRESETS = [
  { id: "ALL", label: "All Time" },
  { id: "TODAY", label: "Today" },
  { id: "LAST_7_DAYS", label: "Last 7 Days" },
  { id: "LAST_30_DAYS", label: "Last 30 Days" },
  { id: "THIS_MONTH", label: "This Month" },
  { id: "LAST_90_DAYS", label: "Last 90 Days" },
  { id: "CUSTOM", label: "Custom Range" },
];

function formatCurrencyINR(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "INR 0";
  return `INR ${Number(amount).toLocaleString("en-IN")}`;
}

export default function ReportsAnalyticsPage() {
  const { user } = useAuth();

  // State
  const [activeReport, setActiveReport] = useState<ReportType>("ENQUIRY");
  const [overviewStats, setOverviewStats] = useState<AnalyticsOverviewStats | null>(null);
  const [reportData, setReportData] = useState<ReportDataPayload<any> | null>(null);
  const [branches, setBranches] = useState<DealerBranch[]>([]);

  // Filters
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [modelFilter, setModelFilter] = useState<string>("ALL");
  const [tableSearch, setTableSearch] = useState<string>("");

  // Loading & Feedback
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [loadingReport, setLoadingReport] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Authorization check for CSV Export
  const canExport = useMemo(() => {
    if (!user) return false;
    const role = user.staff_role;
    return ["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"].includes(role);
  }, [user]);

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await dealerApi.getBranches();
        if (res.data) {
          setBranches(res.data);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    }
    loadBranches();
  }, []);

  // Filter params object
  const activeFilters = useMemo<ReportFilterParams>(() => {
    return {
      date_range: datePreset,
      start_date: datePreset === "CUSTOM" && startDate ? startDate : undefined,
      end_date: datePreset === "CUSTOM" && endDate ? endDate : undefined,
      branch_id: branchFilter !== "ALL" ? branchFilter : undefined,
      model_name: modelFilter !== "ALL" ? modelFilter : undefined,
    };
  }, [datePreset, startDate, endDate, branchFilter, modelFilter]);

  // Fetch Overview Stats
  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await dealerApi.getAnalyticsOverview(activeFilters);
      if (res.data) {
        setOverviewStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics overview:", err);
    } finally {
      setLoadingOverview(false);
    }
  }, [activeFilters]);

  // Fetch Active Report Data
  const fetchReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const res = await dealerApi.getReportData(activeReport, activeFilters);
      if (res.data) {
        setReportData(res.data);
      }
    } catch (err: any) {
      console.error(`Failed to fetch ${activeReport} report:`, err);
      setFeedback({
        type: "error",
        message: err.message || `Failed to generate ${activeReport} report data.`,
      });
    } finally {
      setLoadingReport(false);
    }
  }, [activeReport, activeFilters]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle Export CSV
  const handleExportCSV = async () => {
    if (!canExport) {
      setFeedback({
        type: "error",
        message: "Access Denied: Only Dealer Owners, Branch Managers, and Sales Managers are authorized to export analytics.",
      });
      return;
    }

    setExporting(true);
    setFeedback(null);
    try {
      const blob = await dealerApi.exportReportCSV(activeReport, activeFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${activeReport.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setFeedback({
        type: "success",
        message: `Successfully exported ${activeReport.replace(/_/g, " ").toLowerCase()} report to CSV.`,
      });
    } catch (err: any) {
      console.error("Export failed:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to download CSV export. Please try again.",
      });
    } finally {
      setExporting(false);
    }
  };

  // Filtered rows in report table based on search input
  const filteredDataRows = useMemo(() => {
    if (!reportData?.data_rows) return [];
    if (!tableSearch.trim()) return reportData.data_rows;

    const query = tableSearch.toLowerCase();
    return reportData.data_rows.filter((row: any) => {
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(query)
      );
    });
  }, [reportData, tableSearch]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
            <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50 text-xs">
              Live BI Engine
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time dealership metrics, pipeline valuation, inventory asset calculations, and executive BI reporting.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchOverview();
              fetchReport();
            }}
            disabled={loadingReport || loadingOverview}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loadingReport ? "animate-spin text-emerald-600" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting || !canExport}
            title={canExport ? "Download tabular dataset in CSV format" : "Export restricted to management roles"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={`h-3.5 w-3.5 ${exporting ? "animate-bounce" : ""}`} />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : feedback.type === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : feedback.type === "error" ? (
              <ShieldAlert className="h-4 w-4 text-red-600" />
            ) : (
              <Info className="h-4 w-4 text-blue-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:opacity-75 px-1 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Overview KPI Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Gross Conversion</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {loadingOverview ? "..." : `${overviewStats?.conversion_rate_pct ?? 0}%`}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Won deals over total inflow</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Pipeline</span>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 truncate">
              {loadingOverview ? "..." : formatCurrencyINR(overviewStats?.active_pipeline_value)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Open quote valuation</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Yard Stock Capital</span>
              <Car className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 truncate">
              {loadingOverview ? "..." : formatCurrencyINR(overviewStats?.inventory_asset_value)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {overviewStats?.inventory_units_in_stock ?? 0} physical units in yard
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Callback Discipline</span>
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {loadingOverview ? "..." : `${overviewStats?.followup_compliance_pct ?? 100}%`}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Follow-up compliance rate</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Quote Acceptance</span>
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {loadingOverview ? "..." : `${overviewStats?.quotation_acceptance_pct ?? 0}%`}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Accepted quote win rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Global Filter Toolbar */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Presets */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg">
                <Calendar className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium text-slate-700 py-1 pr-6 focus:ring-0 focus:outline-none cursor-pointer"
                >
                  {DATE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Date Inputs if CUSTOM selected */}
              {datePreset === "CUSTOM" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Branch Selector */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg">
                <Building className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium text-slate-700 py-1 pr-6 focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Showrooms</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Model Selector */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg">
                <Car className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
                <select
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium text-slate-700 py-1 pr-6 focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Models</option>
                  <option value="Brezza">Maruti Brezza</option>
                  <option value="Grand Vitara">Maruti Grand Vitara</option>
                  <option value="Fronx">Maruti Fronx</option>
                  <option value="Swift">Maruti Swift</option>
                  <option value="Baleno">Maruti Baleno</option>
                  <option value="Jimny">Maruti Jimny</option>
                </select>
              </div>
            </div>

            {/* Active Report Indicator */}
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span>Viewing:</span>
              <span className="font-semibold text-slate-800">
                {REPORT_TABS.find((t) => t.id === activeReport)?.label} Report
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 11 Reports Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveReport(tab.id);
                setTableSearch("");
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Report Body */}
      {loadingReport ? (
        <Card className="border-slate-200 bg-white p-12 text-center shadow-sm">
          <RotateCw className="h-6 w-6 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Calculating report analytics from database...</p>
          <p className="text-xs text-slate-400 mt-1">Applying tenant isolation, branch scoping, and date filters.</p>
        </Card>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Report Metadata & Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{reportData.report_title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{reportData.report_description}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Generated: {new Date(reportData.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            {/* Metric Explanations Callout Box */}
            {reportData.metric_explanations && reportData.metric_explanations.length > 0 && (
              <div className="mt-4 p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Metric Formulas & Computational Logic:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald-900">
                  {reportData.metric_explanations.map((exp, idx) => (
                    <div key={idx} className="bg-white/80 p-2 rounded border border-emerald-100/80">
                      <div className="font-semibold text-slate-800">{exp.metric_name}</div>
                      <div className="font-mono text-emerald-700 text-xs mt-0.5">{exp.formula}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{exp.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Report Summary Cards */}
          {reportData.summary_cards && reportData.summary_cards.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {reportData.summary_cards.map((card, idx) => (
                <Card key={idx} className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <span className="text-xs font-medium text-slate-500">{card.title}</span>
                    <div className="mt-1.5 text-xl font-bold text-slate-900">
                      {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                    </div>
                    {card.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{card.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Breakdown Charts Section */}
          {reportData.breakdown_charts && reportData.breakdown_charts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.breakdown_charts.map((chart, cIdx) => (
                <Card key={cIdx} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-800">{chart.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    {chart.items.map((item, iIdx) => {
                      const maxVal = Math.max(...chart.items.map((i) => i.value), 1);
                      const barWidth = Math.min(100, Math.round((item.value / maxVal) * 100));
                      return (
                        <div key={iIdx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate max-w-[200px]">{item.label}</span>
                            <div className="flex items-center gap-2">
                              {item.percentage !== undefined && (
                                <span className="text-slate-400 font-mono text-xs">{item.percentage}%</span>
                              )}
                              <span className="font-bold text-slate-900">{item.value.toLocaleString()}</span>
                            </div>
                          </div>
                          {/* Visual progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${barWidth}%`,
                                backgroundColor: item.color || "#3B82F6",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Data Table Section */}
          <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Operational Breakdown Dataset</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {filteredDataRows.length} of {reportData.total_rows} recorded entries
                </p>
              </div>

              {/* Table search filter */}
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter table rows..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {reportData.table_columns.map((col) => (
                      <th
                        key={col.key}
                        className={`p-3 whitespace-nowrap text-${col.align || "left"}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredDataRows.length === 0 ? (
                    <tr>
                      <td colSpan={reportData.table_columns.length} className="p-8 text-center text-slate-400">
                        <AlertCircle className="h-5 w-5 mx-auto mb-1 text-slate-300" />
                        No data rows match the specified criteria or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDataRows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                        {reportData.table_columns.map((col) => {
                          const val = row[col.key];
                          return (
                            <td
                              key={col.key}
                              className={`p-3 whitespace-nowrap text-${col.align || "left"} font-normal`}
                            >
                              {col.is_currency ? (
                                <span className="font-medium text-slate-900">{formatCurrencyINR(val)}</span>
                              ) : col.is_percentage ? (
                                <span className="font-medium text-slate-800">{val}%</span>
                              ) : col.key.includes("status") ? (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    String(val).toLowerCase().includes("won") || String(val).toLowerCase().includes("accept") || String(val).toLowerCase().includes("active")
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : String(val).toLowerCase().includes("lost") || String(val).toLowerCase().includes("reject")
                                      ? "border-red-300 bg-red-50 text-red-800"
                                      : "border-slate-300 bg-slate-50 text-slate-700"
                                  }`}
                                >
                                  {val}
                                </Badge>
                              ) : (
                                <span>{val ?? "-"}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Failed to render report dataset.</p>
          <p className="text-xs text-slate-400 mt-1">Please select an alternative report or clear your filters.</p>
        </Card>
      )}
    </div>
  );
}
