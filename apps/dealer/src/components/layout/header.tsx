"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Check,
  UserCheck,
  Radio,
  FileSpreadsheet,
  Tag,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";
import { BranchSwitcher } from "./branch-switcher";
import { UserMenu } from "./user-menu";
import { dealerApi } from "../../lib/api";
import { DealerNotification, NotificationSummaryStats, NotificationEventType } from "@groupdrive/types";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const EVENT_ICONS: Record<NotificationEventType, React.ElementType> = {
  NEW_ENQUIRY: UserCheck,
  LEAD_ASSIGNED: UserCheck,
  FOLLOW_UP_REMINDER: Clock,
  OVERDUE_TASK: AlertCircle,
  NEW_GROUP_OPPORTUNITY: Radio,
  NEGOTIATION_UPDATE: Radio,
  QUOTATION_UPDATE: FileSpreadsheet,
  CAMPAIGN_UPDATE: Tag,
  STAFF_INVITATION: Users,
  ACCOUNT_ACTIVITY: Shield,
};

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<DealerNotification[]>([]);
  const [summary, setSummary] = useState<NotificationSummaryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotificationData = useCallback(async () => {
    try {
      const [nRes, sRes] = await Promise.all([
        dealerApi.getNotifications(),
        dealerApi.getNotificationSummary(),
      ]);
      if (nRes.success && nRes.data) {
        setNotifications(nRes.data.slice(0, 5));
      }
      if (sRes.success && sRes.data) {
        setSummary(sRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications in header:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await dealerApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (summary) {
        setSummary({ ...summary, unread_count: 0, urgent_unread_count: 0 });
      }
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleNotificationClick = async (notif: DealerNotification) => {
    if (!notif.is_read) {
      try {
        await dealerApi.markNotificationRead(notif.id, true);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        if (summary && summary.unread_count > 0) {
          setSummary({ ...summary, unread_count: summary.unread_count - 1 });
        }
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
    setShowNotifications(false);
    if (notif.related_entity?.link_url) {
      router.push(notif.related_entity.link_url);
    } else {
      router.push("/notifications");
    }
  };

  const unreadCount = summary?.unread_count ?? notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur transition-all">
      <div className="flex items-center space-x-3 md:space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Showroom Branch Switcher */}
        <BranchSwitcher />
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Search */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search VIN, model or group..."
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotificationData();
            }}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border border-slate-200 bg-white shadow-xl py-2 z-50 text-sm">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {unreadCount} Unread
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      All caught up
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    No notifications available
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = EVENT_ICONS[n.event_type] || Bell;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 transition-colors cursor-pointer flex items-start space-x-2.5 ${
                          !n.is_read ? "bg-rose-50/30 hover:bg-rose-50/60" : "hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${
                            n.priority === "URGENT"
                              ? "bg-rose-100 text-rose-700"
                              : n.priority === "HIGH"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900 truncate pr-2 text-sm">
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="h-2 w-2 rounded-full bg-rose-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                            <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {n.related_entity && (
                              <span className="text-rose-600 font-medium flex items-center gap-0.5 text-xs">
                                View <ArrowRight className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 w-full justify-center text-xs"
                >
                  View Notification Center <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
