"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  UserCheck,
  FileSpreadsheet,
  Tag,
  Users,
  Shield,
  Search,
  Filter,
  RotateCw,
  Check,
  X,
  Trash2,
  Settings2,
  Send,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Mail,
  MessageSquare,
  Smartphone,
  Layers,
  HelpCircle,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  DealerNotification,
  NotificationEventType,
  NotificationPriority,
  NotificationChannel,
  NotificationSummaryStats,
  NotificationPreferences,
  CreateNotificationPayload,
  UpdateNotificationPreferencesPayload,
} from "@groupdrive/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const EVENT_CONFIG: Record<
  NotificationEventType,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  NEW_ENQUIRY: {
    label: "New Customer Enquiry",
    icon: UserCheck,
    color: "text-emerald-700 border-emerald-200 bg-emerald-50",
    bgColor: "bg-emerald-100 text-emerald-800",
  },
  LEAD_ASSIGNED: {
    label: "Lead Assignment",
    icon: UserCheck,
    color: "text-blue-700 border-blue-200 bg-blue-50",
    bgColor: "bg-blue-100 text-blue-800",
  },
  FOLLOW_UP_REMINDER: {
    label: "Follow-up Reminder",
    icon: Clock,
    color: "text-indigo-700 border-indigo-200 bg-indigo-50",
    bgColor: "bg-indigo-100 text-indigo-800",
  },
  OVERDUE_TASK: {
    label: "Overdue Task",
    icon: AlertCircle,
    color: "text-rose-700 border-rose-200 bg-rose-50",
    bgColor: "bg-rose-100 text-rose-800",
  },
  NEW_GROUP_OPPORTUNITY: {
    label: "Group Opportunity",
    icon: Radio,
    color: "text-amber-700 border-amber-200 bg-amber-50",
    bgColor: "bg-amber-100 text-amber-800",
  },
  NEGOTIATION_UPDATE: {
    label: "Negotiation Update",
    icon: Radio,
    color: "text-purple-700 border-purple-200 bg-purple-50",
    bgColor: "bg-purple-100 text-purple-800",
  },
  QUOTATION_UPDATE: {
    label: "Quotation Update",
    icon: FileSpreadsheet,
    color: "text-cyan-700 border-cyan-200 bg-cyan-50",
    bgColor: "bg-cyan-100 text-cyan-800",
  },
  CAMPAIGN_UPDATE: {
    label: "Campaign Milestone",
    icon: Tag,
    color: "text-teal-700 border-teal-200 bg-teal-50",
    bgColor: "bg-teal-100 text-teal-800",
  },
  STAFF_INVITATION: {
    label: "Staff Invitation",
    icon: Users,
    color: "text-violet-700 border-violet-200 bg-violet-50",
    bgColor: "bg-violet-100 text-violet-800",
  },
  ACCOUNT_ACTIVITY: {
    label: "Account Activity",
    icon: Shield,
    color: "text-slate-700 border-slate-200 bg-slate-50",
    bgColor: "bg-slate-100 text-slate-800",
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Data states
  const [notifications, setNotifications] = useState<DealerNotification[]>([]);
  const [summary, setSummary] = useState<NotificationSummaryStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & search
  const [tabFilter, setTabFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [eventFilter, setEventFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  // Test form state
  const [testEventType, setTestEventType] = useState<NotificationEventType>("NEW_ENQUIRY");
  const [testTitle, setTestTitle] = useState<string>("Test Customer Enquiry: Brezza ZXi");
  const [testMessage, setTestMessage] = useState<string>("New buyer enquiry received from Whitefield tech corridor.");
  const [testPriority, setTestPriority] = useState<NotificationPriority>("HIGH");
  const [testChannel, setTestChannel] = useState<NotificationChannel>("IN_APP");
  const [testDedupKey, setTestDedupKey] = useState<string>("");
  const [testSubmitting, setTestSubmitting] = useState<boolean>(false);

  // Load initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [nRes, sRes, pRes] = await Promise.all([
        dealerApi.getNotifications({
          is_read: tabFilter === "UNREAD" ? false : tabFilter === "READ" ? true : undefined,
          event_type: eventFilter !== "ALL" ? eventFilter : undefined,
          priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
          search: searchQuery.trim() || undefined,
        }),
        dealerApi.getNotificationSummary(),
        dealerApi.getNotificationPreferences(),
      ]);

      if (nRes.success && nRes.data) {
        setNotifications(nRes.data);
      }
      if (sRes.success && sRes.data) {
        setSummary(sRes.data);
      }
      if (pRes.success && pRes.data) {
        setPreferences(pRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(err?.message || "Failed to load notifications. Displaying local data.");
    } finally {
      setLoading(false);
    }
  }, [tabFilter, eventFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Success message auto-dismiss
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Mark single notification read/unread
  const handleToggleRead = async (notif: DealerNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRead = !notif.is_read;
    try {
      const res = await dealerApi.markNotificationRead(notif.id, nextRead);
      if (res.success && res.data) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: nextRead, read_at: res.data.read_at } : n))
        );
        if (summary) {
          setSummary({
            ...summary,
            unread_count: nextRead ? Math.max(0, summary.unread_count - 1) : summary.unread_count + 1,
            urgent_unread_count:
              notif.priority === "URGENT"
                ? nextRead
                  ? Math.max(0, summary.urgent_unread_count - 1)
                  : summary.urgent_unread_count + 1
                : summary.urgent_unread_count,
          });
        }
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update notification status.");
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const res = await dealerApi.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
        if (summary) {
          setSummary({ ...summary, unread_count: 0, urgent_unread_count: 0 });
        }
        setSuccessMessage("All notifications marked as read.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to mark all notifications read.");
    }
  };

  // Delete / Dismiss notification
  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await dealerApi.deleteNotification(notificationId);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (summary) {
          setSummary({ ...summary, total_notifications: Math.max(0, summary.total_notifications - 1) });
        }
      }
    } catch (err: any) {
      alert(err?.message || "Failed to dismiss notification.");
    }
  };

  // Clear read notifications
  const handleClearRead = async () => {
    if (!window.confirm("Clear all read notifications from your activity feed?")) return;
    try {
      const res = await dealerApi.clearReadNotifications();
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => !n.is_read));
        setSuccessMessage("Cleared read notifications from your feed.");
        await fetchData();
      }
    } catch (err: any) {
      alert(err?.message || "Failed to clear read notifications.");
    }
  };

  // Handle click on card: navigate to related entity
  const handleCardClick = async (notif: DealerNotification) => {
    if (!notif.is_read) {
      try {
        await dealerApi.markNotificationRead(notif.id, true);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Mark read on click error:", err);
      }
    }

    if (notif.related_entity?.link_url) {
      router.push(notif.related_entity.link_url);
    }
  };

  // Test notification submission
  const handleTriggerTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTestSubmitting(true);
      const payload: CreateNotificationPayload = {
        event_type: testEventType,
        title: testTitle.trim(),
        message: testMessage.trim(),
        priority: testPriority,
        delivery_channel: testChannel,
        deduplication_key: testDedupKey.trim() || undefined,
        related_entity: {
          entity_type: "LEAD",
          entity_id: "test-id",
          link_url: "/dashboard",
        },
      };

      const res = await dealerApi.triggerTestNotification(payload);
      if (res.success && res.data) {
        setSuccessMessage(`Notification event emitted: '${res.data.title}'`);
        setShowTestModal(false);
        await fetchData();
      }
    } catch (err: any) {
      alert(err?.message || "Failed to trigger test notification.");
    } finally {
      setTestSubmitting(false);
    }
  };

  // Group notifications into Today, Yesterday, and Earlier
  const groupedNotifications = useMemo(() => {
    const today: DealerNotification[] = [];
    const yesterday: DealerNotification[] = [];
    const earlier: DealerNotification[] = [];

    const now = new Date();
    const todayDateStr = now.toISOString().slice(0, 10);

    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yesterdayDateStr = yDate.toISOString().slice(0, 10);

    notifications.forEach((n) => {
      const dStr = n.created_at ? n.created_at.slice(0, 10) : "";
      if (dStr === todayDateStr) {
        today.push(n);
      } else if (dStr === yesterdayDateStr) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { today, yesterday, earlier };
  }, [notifications]);

  // Render Priority Badge
  const renderPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case "URGENT":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
            URGENT
          </Badge>
        );
      case "HIGH":
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold">
            HIGH
          </Badge>
        );
      case "NORMAL":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
            NORMAL
          </Badge>
        );
      case "LOW":
        return (
          <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-xs">
            LOW
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center">
              <Bell className="h-6 w-6 text-rose-600 mr-2" />
              DealerOS Notification Center
            </h1>
            <Badge variant="outline" className="text-xs text-slate-600 border-slate-300">
              Live Activity Feed
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time activity alerts, actionable customer reminders, and event stream across your showroom network
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreferencesModal(true)}
            className="text-xs border-slate-300 text-slate-700"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Preferences
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTestModal(true)}
            className="text-xs border-slate-300 text-indigo-700 hover:bg-indigo-50"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
            Simulate Event
          </Button>

          {summary && summary.unread_count > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Mark All Read
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearRead}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear Read
          </Button>
        </div>
      </div>

      {/* Success and Error Feedback Banners */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between">
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

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Activity Alerts</span>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900">{summary?.total_notifications ?? notifications.length}</span>
              <span className="text-xs text-slate-400">Recorded</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-rose-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Unread Notifications</span>
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-rose-700">
                {summary?.unread_count ?? notifications.filter((n) => !n.is_read).length}
              </span>
              <span className="text-xs text-rose-600 font-medium">Action required</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Urgent Priority</span>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-amber-700">
                {summary?.urgent_unread_count ??
                  notifications.filter((n) => !n.is_read && n.priority === "URGENT").length}
              </span>
              <span className="text-xs text-amber-600">Immediate attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white border-l-4 border-l-indigo-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Today's Activity</span>
              <Clock className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold text-indigo-700">{summary?.today_count ?? 3}</span>
              <span className="text-xs text-indigo-600">Live feed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-3 md:p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Read Status Tabs */}
            <div className="flex border border-slate-200 rounded-md overflow-hidden bg-slate-50 text-xs">
              <button
                onClick={() => setTabFilter("ALL")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  tabFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Activity ({summary?.total_notifications ?? notifications.length})
              </button>
              <button
                onClick={() => setTabFilter("UNREAD")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  tabFilter === "UNREAD" ? "bg-white text-rose-700 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Unread Only ({summary?.unread_count ?? notifications.filter((n) => !n.is_read).length})
              </button>
              <button
                onClick={() => setTabFilter("READ")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  tabFilter === "READ" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Read
              </button>
            </div>

            {/* Event Category & Priority Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="ALL">All Event Types</option>
                <option value="NEW_ENQUIRY">New Enquiries</option>
                <option value="LEAD_ASSIGNED">Lead Assignments</option>
                <option value="FOLLOW_UP_REMINDER">Follow-up Reminders</option>
                <option value="OVERDUE_TASK">Overdue Tasks</option>
                <option value="NEW_GROUP_OPPORTUNITY">Group Opportunities</option>
                <option value="NEGOTIATION_UPDATE">Negotiation Updates</option>
                <option value="QUOTATION_UPDATE">Quotation Revisions</option>
                <option value="CAMPAIGN_UPDATE">Campaign Updates</option>
                <option value="STAFF_INVITATION">Staff Invitations</option>
                <option value="ACCOUNT_ACTIVITY">Account Security</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>

              {/* Search text */}
              <div className="relative w-44 md:w-56">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search notification text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs border-slate-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Notifications Feed */}
      {loading && notifications.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3">
          <RotateCw className="h-6 w-6 animate-spin mx-auto text-rose-600" />
          <p className="text-xs">Synchronizing real-time notification feed...</p>
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No notifications found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You are all caught up! No notifications match your selected filter criteria.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Today Group */}
          {groupedNotifications.today.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Today</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <div className="space-y-2">
                {groupedNotifications.today.map((n) => renderNotificationCard(n))}
              </div>
            </div>
          )}

          {/* Yesterday Group */}
          {groupedNotifications.yesterday.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Yesterday</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <div className="space-y-2">
                {groupedNotifications.yesterday.map((n) => renderNotificationCard(n))}
              </div>
            </div>
          )}

          {/* Earlier Group */}
          {groupedNotifications.earlier.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Earlier Activity</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <div className="space-y-2">
                {groupedNotifications.earlier.map((n) => renderNotificationCard(n))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATION PREFERENCES MODAL */}
      {showPreferencesModal && preferences && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-rose-600" />
                  Notification Preferences & Channel Readiness
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure real-time in-app alerts and external communication channels
                </p>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Channel Readiness Status Cards */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-800 block">External Channel Integration Status</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-emerald-600" />
                        In-App Alerts
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        ACTIVE
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {preferences.channel_readiness.in_app.detail}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                        Email Gateway
                      </span>
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                        {preferences.channel_readiness.email.ready ? "ACTIVE" : "STANDBY"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {preferences.channel_readiness.email.detail}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-purple-600" />
                        SMS Gateway
                      </span>
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                        {preferences.channel_readiness.sms.ready ? "ACTIVE" : "STANDBY"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {preferences.channel_readiness.sms.detail}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        WhatsApp Business
                      </span>
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                        {preferences.channel_readiness.whatsapp.ready ? "ACTIVE" : "STANDBY"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {preferences.channel_readiness.whatsapp.detail}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>
                    Email, SMS, and WhatsApp dispatch channels are only activated when required credentials and templates are configured in Dealership Settings.
                  </span>
                </div>
              </div>

              {/* Event Subscription Matrix */}
              <div className="space-y-2 pt-2">
                <span className="font-semibold text-slate-800 block">Event Notification Subscriptions</span>

                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-100 px-3 py-2 font-bold text-slate-700 text-xs">
                    <div className="col-span-6">Notification Event</div>
                    <div className="col-span-2 text-center">In-App</div>
                    <div className="col-span-2 text-center">Email</div>
                    <div className="col-span-2 text-center">SMS/WA</div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {Object.entries(EVENT_CONFIG).map(([evtKey, cfg]) => {
                      const subs = preferences.event_subscriptions[evtKey as NotificationEventType] || {
                        in_app: true,
                        email: false,
                        sms: false,
                        whatsapp: false,
                      };
                      return (
                        <div key={evtKey} className="grid grid-cols-12 px-3 py-2 items-center hover:bg-slate-50">
                          <div className="col-span-6 flex items-center gap-2">
                            <span className={`p-1 rounded ${cfg.bgColor}`}>
                              <cfg.icon className="h-3 w-3" />
                            </span>
                            <span className="font-medium text-slate-800">{cfg.label}</span>
                          </div>

                          <div className="col-span-2 text-center">
                            <input
                              type="checkbox"
                              checked={subs.in_app}
                              onChange={(e) => {
                                const updated = {
                                  ...preferences,
                                  event_subscriptions: {
                                    ...preferences.event_subscriptions,
                                    [evtKey]: { ...subs, in_app: e.target.checked },
                                  },
                                };
                                setPreferences(updated);
                              }}
                              className="h-3.5 w-3.5 text-rose-600 rounded border-slate-300"
                            />
                          </div>

                          <div className="col-span-2 text-center">
                            <input
                              type="checkbox"
                              checked={subs.email}
                              disabled={!preferences.channel_readiness.email.ready}
                              onChange={(e) => {
                                const updated = {
                                  ...preferences,
                                  event_subscriptions: {
                                    ...preferences.event_subscriptions,
                                    [evtKey]: { ...subs, email: e.target.checked },
                                  },
                                };
                                setPreferences(updated);
                              }}
                              className="h-3.5 w-3.5 text-rose-600 rounded border-slate-300 disabled:opacity-30"
                            />
                          </div>

                          <div className="col-span-2 text-center">
                            <input
                              type="checkbox"
                              checked={subs.sms}
                              disabled={!preferences.channel_readiness.sms.ready}
                              className="h-3.5 w-3.5 text-rose-600 rounded border-slate-300 disabled:opacity-30"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferencesModal(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setSuccessMessage("Notification preferences saved successfully.");
                  setShowPreferencesModal(false);
                }}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE / TEST EVENT MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full flex flex-col my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Simulate Real-time Notification Event
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test event generation, deduplication safeguards, and role permission filtering
                </p>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTriggerTest} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Event Category *</label>
                <select
                  value={testEventType}
                  onChange={(e) => setTestEventType(e.target.value as NotificationEventType)}
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
                >
                  <option value="NEW_ENQUIRY">New Customer Enquiry</option>
                  <option value="LEAD_ASSIGNED">Lead Assignment</option>
                  <option value="FOLLOW_UP_REMINDER">Follow-up Reminder</option>
                  <option value="OVERDUE_TASK">Overdue Task</option>
                  <option value="NEW_GROUP_OPPORTUNITY">Group Opportunity</option>
                  <option value="NEGOTIATION_UPDATE">Negotiation Update</option>
                  <option value="QUOTATION_UPDATE">Quotation Revision</option>
                  <option value="CAMPAIGN_UPDATE">Campaign Milestone</option>
                  <option value="STAFF_INVITATION">Staff Invitation</option>
                  <option value="ACCOUNT_ACTIVITY">Account Security Activity</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Notification Title *</label>
                <Input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Message Content *</label>
                <textarea
                  rows={2}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  required
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={testPriority}
                    onChange={(e) => setTestPriority(e.target.value as NotificationPriority)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Delivery Channel</label>
                  <select
                    value={testChannel}
                    onChange={(e) => setTestChannel(e.target.value as NotificationChannel)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
                  >
                    <option value="IN_APP">In-App (Real-time)</option>
                    <option value="EMAIL">Email Gateway</option>
                    <option value="SMS">SMS Gateway</option>
                    <option value="WHATSAPP">WhatsApp Business</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Deduplication Key (Optional)</span>
                  <span className="text-xs text-slate-400">Prevents duplicates</span>
                </label>
                <Input
                  placeholder="e.g. enquiry:lead-123:created"
                  value={testDedupKey}
                  onChange={(e) => setTestDedupKey(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTestModal(false)}
                  disabled={testSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={testSubmitting}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {testSubmitting ? "Emitting..." : "Emit Notification"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for each Notification Card
  function renderNotificationCard(n: DealerNotification) {
    const cfg = EVENT_CONFIG[n.event_type] || {
      label: n.event_type,
      icon: Bell,
      color: "text-slate-700 border-slate-200 bg-slate-50",
      bgColor: "bg-slate-100 text-slate-800",
    };
    const Icon = cfg.icon;

    return (
      <Card
        key={n.id}
        onClick={() => handleCardClick(n)}
        className={`border-slate-200 shadow-sm transition-all hover:shadow-md cursor-pointer ${
          !n.is_read ? "bg-white border-l-4 border-l-rose-500" : "bg-slate-50/50 opacity-90"
        }`}
      >
        <CardContent className="p-3.5 space-y-2 text-xs">
          {/* Card Top Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border flex items-center gap-1 ${cfg.color}`}>
                <Icon className="h-3 w-3" />
                {cfg.label}
              </span>

              {renderPriorityBadge(n.priority)}

              {!n.is_read && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  NEW
                </span>
              )}

              {n.delivery_status === "FAILED" && (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  External Channel Offline
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-xs flex-shrink-0">
              <Clock className="h-3 w-3" />
              <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

              <button
                onClick={(e) => handleToggleRead(n, e)}
                className={`p-1 rounded hover:bg-slate-200 transition-colors ml-1 ${
                  n.is_read ? "text-slate-400" : "text-rose-600"
                }`}
                title={n.is_read ? "Mark as unread" : "Mark as read"}
              >
                <Check className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={(e) => handleDeleteNotification(n.id, e)}
                className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-700"
                title="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Title and Message */}
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 text-sm leading-snug">{n.title}</h4>
            <p className="text-slate-600 leading-relaxed">{n.message}</p>
          </div>

          {/* Failure Callout if external credentials were missing */}
          {n.delivery_failure_reason && (
            <div className="p-2 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <span>{n.delivery_failure_reason}</span>
            </div>
          )}

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="capitalize font-medium">Channel: {n.delivery_channel.toLowerCase()}</span>
              {n.related_entity?.entity_code && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {n.related_entity.entity_code}
                  </span>
                </>
              )}
            </div>

            {n.related_entity?.link_url && (
              <span className="text-rose-600 font-semibold flex items-center gap-1 hover:underline">
                Open Related Record <ExternalLink className="h-3 w-3" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
}
