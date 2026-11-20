"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { customerApi } from "@groupdrive/api-client";
import {
  CustomerUser,
  JoinedGroupDetail,
  CustomerQuotationRecord,
  CustomerEnquiryRecord,
  CustomerSavedVehicle,
  CustomerSavedComparison,
  CustomerAppointment,
  CustomerNotification,
  CustomerNotificationPreferences,
  CustomerSession,
  CustomerProfileStats,
} from "@groupdrive/types";
import { useCustomerAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatINR, formatDate } from "@groupdrive/utils";

type DashboardTab =
  | "overview"
  | "quotations"
  | "enquiries"
  | "groups"
  | "saved"
  | "appointments"
  | "comparisons"
  | "settings";

export default function CustomerDashboardPage() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, logout, updateProfile } = useCustomerAuth();

  const initialTab = (searchParams.get("tab") as DashboardTab) || "overview";
  const [activeTab, setActiveTab] = React.useState<DashboardTab>(initialTab);

  // Core Data States
  const [stats, setStats] = React.useState<CustomerProfileStats | null>(null);
  const [quotations, setQuotations] = React.useState<CustomerQuotationRecord[]>([]);
  const [enquiries, setEnquiries] = React.useState<CustomerEnquiryRecord[]>([]);
  const [joinedGroups, setJoinedGroups] = React.useState<JoinedGroupDetail[]>([]);
  const [savedVehicles, setSavedVehicles] = React.useState<CustomerSavedVehicle[]>([]);
  const [savedComparisons, setSavedComparisons] = React.useState<CustomerSavedComparison[]>([]);
  const [appointments, setAppointments] = React.useState<CustomerAppointment[]>([]);
  const [notifications, setNotifications] = React.useState<CustomerNotification[]>([]);
  const [notifPreferences, setNotifPreferences] = React.useState<CustomerNotificationPreferences>({
    email_notifications: true,
    sms_alerts: true,
    whatsapp_updates: true,
    quotation_alerts: true,
    group_milestones: true,
    promotional_offers: false,
  });
  const [sessions, setSessions] = React.useState<CustomerSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Quotation Specific Modals & States
  const [isComparing, setIsComparing] = React.useState(false);
  const [selectedQuotation, setSelectedQuotation] = React.useState<CustomerQuotationRecord | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Settings & Profile Edit Form States
  const [editFirstName, setEditFirstName] = React.useState("");
  const [editLastName, setEditLastName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editCity, setEditCity] = React.useState("Bengaluru");
  const [editAddress, setEditAddress] = React.useState("");
  const [editContactMethod, setEditContactMethod] = React.useState("WHATSAPP");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Verification Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = React.useState(false);
  const [verifyChannel, setVerifyChannel] = React.useState<"EMAIL" | "PHONE">("EMAIL");
  const [verifyOtp, setVerifyOtp] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);

  // Appointment Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
  const [bookDealerId, setBookDealerId] = React.useState("dlr-kalyani-blr-001");
  const [bookModelName, setBookModelName] = React.useState("Maruti Suzuki Brezza");
  const [bookType, setBookType] = React.useState("SHOWROOM_VISIT");
  const [bookDate, setBookDate] = React.useState("2026-11-20");
  const [bookSlot, setBookSlot] = React.useState("11:00 AM - 12:30 PM");
  const [bookNotes, setBookNotes] = React.useState("");
  const [isBookingApt, setIsBookingApt] = React.useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // Notice Alert Banner
  const [feedbackNotice, setFeedbackNotice] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load all customer data
  const loadCustomerData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        profileRes,
        quotesRes,
        enqRes,
        groupsRes,
        savedRes,
        cmpRes,
        aptsRes,
        notifsRes,
        prefsRes,
        sessionsRes,
      ] = await Promise.all([
        customerApi.profile.getProfile(),
        customerApi.quotations.getMyQuotations(),
        customerApi.enquiries.getMyEnquiries(),
        customerApi.groups.getMyGroups(),
        customerApi.savedVehicles.getSavedVehicles(),
        customerApi.comparisons.getComparisons(),
        customerApi.appointments.getAppointments(),
        customerApi.notifications.getNotifications(),
        customerApi.notifications.getPreferences(),
        customerApi.security.getSessions(),
      ]);

      if (profileRes.data) {
        setStats(profileRes.data.stats);
        if (profileRes.data.user) {
          setEditFirstName(profileRes.data.user.first_name || "");
          setEditLastName(profileRes.data.user.last_name || "");
          setEditPhone(profileRes.data.user.phone_number || "");
          setEditCity(profileRes.data.user.city || "Bengaluru");
          setEditAddress(profileRes.data.user.address || "");
          setEditContactMethod(profileRes.data.user.preferred_contact_method || "WHATSAPP");
        }
      }
      if (quotesRes.data) setQuotations(quotesRes.data);
      if (enqRes.data) setEnquiries(enqRes.data as unknown as CustomerEnquiryRecord[]);
      if (groupsRes.data) setJoinedGroups(groupsRes.data);
      if (savedRes.data) setSavedVehicles(savedRes.data);
      if (cmpRes.data) setSavedComparisons(cmpRes.data);
      if (aptsRes.data) setAppointments(aptsRes.data);
      if (notifsRes.data) setNotifications(notifsRes.data);
      if (prefsRes.data) setNotifPreferences(prefsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
    } catch (err) {
      console.error("Error loading customer dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadCustomerData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadCustomerData]);

  // Quotation Handlers
  const handleOpenBreakdown = (quote: CustomerQuotationRecord) => {
    setSelectedQuotation(quote);
    setIsBreakdownModalOpen(true);
  };

  const handleCloseBreakdown = () => {
    setIsBreakdownModalOpen(false);
    setSelectedQuotation(null);
  };

  const handleAcceptQuotation = async (quoteId: string) => {
    setActionLoadingId(quoteId);
    setFeedbackNotice(null);
    try {
      const res = await customerApi.quotations.acceptQuotation(quoteId);
      if (res.data) {
        setQuotations((prev) =>
          prev.map((q) =>
            q.id === quoteId ? { ...q, quotation_status: "ACCEPTED" as const } : q
          )
        );
        const matchedQuote = quotations.find((q) => q.id === quoteId);
        if (matchedQuote?.lead_id) {
          setEnquiries((prev) =>
            prev.map((e) => (e.id === matchedQuote.lead_id ? { ...e, status: "BOOKED" } : e))
          );
        }
        if (selectedQuotation && selectedQuotation.id === quoteId) {
          setSelectedQuotation((prev) =>
            prev ? { ...prev, quotation_status: "ACCEPTED" as const } : null
          );
        }
        setFeedbackNotice({
          type: "success",
          message:
            "Quotation accepted successfully. The authorized dealership will prepare vehicle allocation and contact you for delivery.",
        });
      }
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to accept quotation.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectQuotation = async (quoteId: string) => {
    setActionLoadingId(quoteId);
    setFeedbackNotice(null);
    try {
      const res = await customerApi.quotations.rejectQuotation(quoteId);
      if (res.data) {
        setQuotations((prev) =>
          prev.map((q) =>
            q.id === quoteId ? { ...q, quotation_status: "REJECTED" as const } : q
          )
        );
        if (selectedQuotation && selectedQuotation.id === quoteId) {
          setSelectedQuotation((prev) =>
            prev ? { ...prev, quotation_status: "REJECTED" as const } : null
          );
        }
        setFeedbackNotice({
          type: "success",
          message: "Quotation declined.",
        });
      }
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to decline quotation.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Saved Vehicle Remove Handler
  const handleRemoveSavedVehicle = async (vehicleId: string) => {
    try {
      await customerApi.savedVehicles.removeSavedVehicle(vehicleId);
      setSavedVehicles((prev) => prev.filter((v) => v.id !== vehicleId && v.model_id !== vehicleId));
      setFeedbackNotice({
        type: "success",
        message: "Vehicle removed from bookmarks.",
      });
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to remove vehicle bookmark.",
      });
    }
  };

  // Saved Comparison Remove Handler
  const handleDeleteComparison = async (comparisonId: string) => {
    try {
      await customerApi.comparisons.deleteComparison(comparisonId);
      setSavedComparisons((prev) => prev.filter((c) => c.id !== comparisonId));
      setFeedbackNotice({
        type: "success",
        message: "Saved comparison removed.",
      });
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to delete comparison.",
      });
    }
  };

  // Appointment Handlers
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingApt(true);
    setFeedbackNotice(null);

    try {
      const res = await customerApi.appointments.bookAppointment({
        dealer_id: bookDealerId,
        model_name: bookModelName,
        appointment_type: bookType,
        appointment_date: bookDate,
        time_slot: bookSlot,
        notes: bookNotes,
      });

      if (res.data) {
        setAppointments((prev) => [res.data, ...prev]);
        setIsBookModalOpen(false);
        setFeedbackNotice({
          type: "success",
          message: "Appointment confirmed with authorized dealership showroom.",
        });
      }
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to schedule appointment.",
      });
    } finally {
      setIsBookingApt(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await customerApi.appointments.cancelAppointment(appointmentId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: "CANCELLED" } : a))
      );
      setFeedbackNotice({
        type: "success",
        message: "Appointment cancelled.",
      });
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to cancel appointment.",
      });
    }
  };

  // Notification Handlers
  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await customerApi.notifications.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await customerApi.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Verification Handlers
  const handleStartVerification = async (channel: "EMAIL" | "PHONE") => {
    setVerifyChannel(channel);
    setVerifyOtp("123456");
    setIsVerifyModalOpen(true);
    try {
      await customerApi.auth.verifyRequest(channel);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const res = await customerApi.auth.verifyConfirm(verifyChannel, verifyOtp);
      if (res.data) {
        setIsVerifyModalOpen(false);
        setFeedbackNotice({
          type: "success",
          message: `${verifyChannel === "EMAIL" ? "Email address" : "Phone number"} verified successfully.`,
        });
        loadCustomerData();
      }
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Invalid verification code.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Profile Edit Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setFeedbackNotice(null);

    try {
      await updateProfile({
        first_name: editFirstName,
        last_name: editLastName,
        phone_number: editPhone,
        city: editCity,
        address: editAddress,
        preferred_contact_method: editContactMethod,
      });
      setFeedbackNotice({
        type: "success",
        message: "Profile details updated successfully.",
      });
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to update profile.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Notification Preferences Update Handler
  const handleTogglePreference = async (key: keyof CustomerNotificationPreferences) => {
    const updated = { ...notifPreferences, [key]: !notifPreferences[key] };
    setNotifPreferences(updated);
    try {
      await customerApi.notifications.updatePreferences(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackNotice(null);

    if (newPassword !== confirmNewPassword) {
      setFeedbackNotice({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }
    if (newPassword.length < 6) {
      setFeedbackNotice({
        type: "error",
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await customerApi.security.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setFeedbackNotice({
        type: "success",
        message: "Your password has been changed successfully.",
      });
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to change password. Please verify current password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Session Revoke Handler
  const handleRevokeOtherSessions = async () => {
    try {
      await customerApi.security.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.is_current));
      setFeedbackNotice({
        type: "success",
        message: "All other device sessions have been revoked.",
      });
    } catch (err: any) {
      setFeedbackNotice({
        type: "error",
        message: err.message || "Failed to revoke sessions.",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading customer profile session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-card p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto border border-blue-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Track dealer quotations, manage saved vehicles, view upcoming appointments, and follow group allocations.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login">
              <Button variant="default" className="w-full font-bold">
                Sign In to Account
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full text-xs">
                Create a Free Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="gd-dash-wrapper">
      {/* Top Banner & Customer Welcome (Luxury Automotive Executive Styling) */}
      <section className="gd-dash-hero">
        <div className="gd-dash-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="gd-dash-badge-brand">
                  ★ Personal Buyer Account
                </span>
                {user?.is_email_verified ? (
                  <span className="gd-dash-badge-verified">
                    ✓ Verified Email
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartVerification("EMAIL")}
                    className="gd-dash-badge-warning"
                  >
                    ⚠ Verify Email Now
                  </button>
                )}
                {user?.is_phone_verified ? (
                  <span className="gd-dash-badge-verified">
                    ✓ Verified Phone
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartVerification("PHONE")}
                    className="gd-dash-badge-warning"
                  >
                    ⚠ Verify Phone Now
                  </button>
                )}
              </div>

              <h1 className="gd-dash-title">
                Welcome, {user?.first_name} {user?.last_name}
              </h1>
              <p className="gd-dash-subtitle">
                <span>📍 {user?.city || "Bengaluru"}</span>
                <span>•</span>
                <span>✉ {user?.email}</span>
                <span>•</span>
                <span>📞 {user?.phone_number}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="gd-dash-btn-outline"
                onClick={() => setIsBookModalOpen(true)}
              >
                + Book Showroom Visit
              </button>
              <Link href="/cars" className="gd-dash-btn-primary">
                Explore Catalogue →
              </Link>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="gd-dash-metrics-grid">
            <div
              onClick={() => setActiveTab("quotations")}
              className="gd-dash-metric-card"
            >
              <div className="gd-dash-metric-label">
                <span>Quotations</span>
                <span className="gd-dash-metric-dot text-blue-400" />
              </div>
              <div className="gd-dash-metric-value text-blue-400">
                {quotations.length}
              </div>
            </div>

            <div
              onClick={() => setActiveTab("enquiries")}
              className="gd-dash-metric-card"
            >
              <div className="gd-dash-metric-label">
                <span>Enquiries</span>
                <span className="gd-dash-metric-dot text-indigo-400" />
              </div>
              <div className="gd-dash-metric-value text-indigo-400">
                {enquiries.length}
              </div>
            </div>

            <div
              onClick={() => setActiveTab("groups")}
              className="gd-dash-metric-card"
            >
              <div className="gd-dash-metric-label">
                <span>Buyer Groups</span>
                <span className="gd-dash-metric-dot text-emerald-400" />
              </div>
              <div className="gd-dash-metric-value text-emerald-400">
                {joinedGroups.length}
              </div>
            </div>

            <div
              onClick={() => setActiveTab("saved")}
              className="gd-dash-metric-card"
            >
              <div className="gd-dash-metric-label">
                <span>Saved Cars</span>
                <span className="gd-dash-metric-dot text-amber-400" />
              </div>
              <div className="gd-dash-metric-value text-amber-400">
                {savedVehicles.length}
              </div>
            </div>

            <div
              onClick={() => setActiveTab("appointments")}
              className="gd-dash-metric-card"
            >
              <div className="gd-dash-metric-label">
                <span>Appointments</span>
                <span className="gd-dash-metric-dot text-cyan-400" />
              </div>
              <div className="gd-dash-metric-value text-cyan-400">
                {appointments.filter((a) => a.status === "CONFIRMED").length}
              </div>
            </div>

            <div
              onClick={() => setActiveTab("overview")}
              className="gd-dash-metric-card"
            >
              <div className="gd-dash-metric-label">
                <span>Active Alerts</span>
                <span className="gd-dash-metric-dot text-rose-400" />
              </div>
              <div className="gd-dash-metric-value text-rose-400">
                {unreadNotifsCount}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabbed Container */}
      <div className="gd-dash-content-area">
        {/* Navigation Tabs Pill Bar */}
        <div className="gd-dash-tabs-nav">
          {[
            { id: "overview", label: "Overview" },
            { id: "quotations", label: `Quotations (${quotations.length})` },
            { id: "enquiries", label: `Enquiries (${enquiries.length})` },
            { id: "groups", label: `Buyer Groups (${joinedGroups.length})` },
            { id: "saved", label: `Saved Cars (${savedVehicles.length})` },
            { id: "appointments", label: `Appointments (${appointments.length})` },
            { id: "comparisons", label: `Comparisons (${savedComparisons.length})` },
            { id: "settings", label: "Account Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`gd-dash-tab-btn ${
                activeTab === tab.id ? "gd-dash-tab-btn-active" : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Action / Error Notice */}
        {feedbackNotice && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-4 ${
              feedbackNotice.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{feedbackNotice.type === "success" ? "✓" : "⚠"}</span>
              <span>{feedbackNotice.message}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB: OVERVIEW (Welcome, Recent Activity, Alerts, Quick Highlights)
           ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Alert Banner if unread notifications */}
            {unreadNotifsCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    🔔
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">
                      You have {unreadNotifsCount} unread notification{unreadNotifsCount > 1 ? "s" : ""}
                    </p>
                    <p className="text-blue-700 text-[11px]">
                      {notifications.find((n) => !n.is_read)?.message || "Review updates on your quotes and appointments."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleMarkAllNotificationsRead}
                  className="bg-white text-blue-700 border-blue-300"
                >
                  Mark All Read
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Recent Activity & Open Enquiries */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Dealership Quotations Highlight */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Recent Quotations</h3>
                      <p className="text-xs text-slate-500">Official offers received from authorized dealers</p>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setActiveTab("quotations")}
                    >
                      View All ({quotations.length})
                    </Button>
                  </div>

                  {quotations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No quotations received yet. Request a quotation from vehicle pages.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quotations.slice(0, 2).map((q) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="brand" size="sm">
                                {q.dealer_name}
                              </Badge>
                              <Badge
                                variant={
                                  q.quotation_status === "ACCEPTED"
                                    ? "success"
                                    : q.quotation_status === "REJECTED"
                                    ? "danger"
                                    : "secondary"
                                }
                                size="sm"
                              >
                                {q.quotation_status}
                              </Badge>
                            </div>
                            <p className="font-bold text-slate-900 text-sm">
                              {q.model_name} • {q.variant_name}
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              Delivery in {q.delivery_timeline_days} days • Total savings: {formatINR(q.pricing.total_discounts)}
                            </p>
                          </div>
                          <div className="text-left sm:text-right space-y-1">
                            <span className="text-base font-black text-slate-900 font-mono block">
                              {formatINR(q.net_on_road_price)}
                            </span>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenBreakdown(q)}
                              className="text-[11px]"
                            >
                              Price Breakdown
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Open Enquiries Highlight */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Enquiry & Test Drive Status</h3>
                      <p className="text-xs text-slate-500">Live synchronization with DealerOS</p>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setActiveTab("enquiries")}
                    >
                      View All ({enquiries.length})
                    </Button>
                  </div>

                  {enquiries.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No active enquiries logged.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enquiries.slice(0, 2).map((enq) => (
                        <div
                          key={enq.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <Badge variant="secondary" size="sm">
                              {enq.status}
                            </Badge>
                            <h4 className="font-bold text-slate-900">
                              {enq.brand_name} {enq.model_name} {enq.variant_name ? `(${enq.variant_name})` : ""}
                            </h4>
                            <p className="text-slate-500 text-[11px]">
                              Showroom: {enq.dealership_name || "Authorized Dealership"} • {enq.city}
                            </p>
                          </div>
                          <div className="text-slate-400 font-mono text-[10px]">
                            Logged: {formatDate(enq.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Upcoming Appointments & Notifications */}
              <div className="space-y-6">
                {/* Upcoming Appointments Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900">Next Appointment</h3>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setActiveTab("appointments")}
                      className="text-blue-600"
                    >
                      Manage
                    </Button>
                  </div>

                  {appointments.filter((a) => a.status === "CONFIRMED").length === 0 ? (
                    <div className="p-5 text-center bg-slate-50 rounded-xl space-y-2 text-xs">
                      <p className="text-slate-500">No appointments scheduled.</p>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setIsBookModalOpen(true)}
                        className="w-full text-xs"
                      >
                        Book Showroom Visit
                      </Button>
                    </div>
                  ) : (
                    appointments
                      .filter((a) => a.status === "CONFIRMED")
                      .slice(0, 1)
                      .map((apt) => (
                        <div key={apt.id} className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <Badge variant="brand" size="sm">
                              {apt.appointment_type.replace("_", " ")}
                            </Badge>
                            <span className="font-bold text-blue-900">{apt.appointment_date}</span>
                          </div>
                          <p className="font-bold text-slate-900 text-sm">{apt.model_name}</p>
                          <p className="text-slate-600 text-[11px]">{apt.dealership_name}</p>
                          <p className="text-slate-500 text-[11px]">{apt.branch_name}</p>
                          <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-blue-800">Slot: {apt.time_slot}</span>
                            <span className="text-emerald-700 font-bold">✓ Confirmed</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Notifications Feed */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900">Notifications</h3>
                    <span className="text-xs text-slate-400">{notifications.length} total</span>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                      {notifications.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            n.is_read
                              ? "bg-slate-50/50 border-slate-100 text-slate-600"
                              : "bg-blue-50/40 border-blue-100 text-slate-900 font-semibold"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold text-slate-900 leading-snug">{n.title}</p>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: DEALERSHIP QUOTATIONS (Cards & Matrix)
           ========================================================================= */}
        {activeTab === "quotations" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Official Dealership Quotations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct itemized price quotes provided by verified authorized dealer showrooms.
                </p>
              </div>

              {quotations.length > 1 && (
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                  <button
                    onClick={() => setIsComparing(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !isComparing ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Card View
                  </button>
                  <button
                    onClick={() => setIsComparing(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isComparing ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Side-by-Side Matrix</span>
                    <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px]">
                      {quotations.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {quotations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mx-auto text-xl">
                  📋
                </div>
                <p className="text-base font-bold text-slate-900">No quotations received yet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When you submit an enquiry or join a buyer group, authorized dealerships prepare verified on-road pricing and exclusive offers for you here.
                </p>
                <Link href="/cars">
                  <Button variant="default" size="sm">
                    Request Dealer Quotes
                  </Button>
                </Link>
              </div>
            ) : isComparing ? (
              /* Side-by-Side Comparison Matrix */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold">Dealership Quotation Comparison Matrix</h3>
                    <p className="text-[11px] text-slate-400">
                      Comparing competing offers side-by-side with full on-road price breakdowns.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setIsComparing(false)}
                    className="text-white border-slate-700 hover:bg-slate-800"
                  >
                    Switch to Cards
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="p-3.5 font-bold text-slate-500 uppercase tracking-wider w-56">
                          Quotation Spec
                        </th>
                        {quotations.map((q) => (
                          <th key={q.id} className="p-3.5 font-bold text-slate-900 min-w-[260px] border-l border-slate-200">
                            <div className="space-y-1">
                              <Badge
                                variant={
                                  q.quotation_status === "ACCEPTED"
                                    ? "success"
                                    : q.quotation_status === "REJECTED"
                                    ? "danger"
                                    : "brand"
                                }
                                size="sm"
                              >
                                {q.quotation_status}
                              </Badge>
                              <div className="text-sm font-black text-slate-900">{q.dealer_name}</div>
                              <div className="text-[11px] text-slate-500 font-normal">{q.branch_name || "Showroom"}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/40">Vehicle & Variant</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 font-medium text-slate-900">
                            <div>{q.model_name}</div>
                            <div className="text-slate-500 text-[11px]">{q.variant_name} ({q.fuel_type} • {q.transmission})</div>
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/40">Ex-Showroom Price</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 font-mono text-slate-900">
                            {formatINR(q.pricing.ex_showroom_price)}
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/40">RTO & Road Tax</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 font-mono text-slate-700">
                            {formatINR(q.pricing.rto_road_tax)}
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/40">Comprehensive Insurance</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 font-mono text-slate-700">
                            {formatINR(q.pricing.insurance_amount)}
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-emerald-50/30 bg-emerald-50/20">
                        <td className="p-3.5 font-semibold text-emerald-900 bg-emerald-100/40">Dealer Cash Discount</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 font-mono font-bold text-emerald-700">
                            - {formatINR(q.pricing.dealer_discount)}
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-emerald-50/30 bg-emerald-50/20">
                        <td className="p-3.5 font-semibold text-emerald-900 bg-emerald-100/40">Manufacturer Offer</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 font-mono font-bold text-emerald-700">
                            - {formatINR(q.pricing.manufacturer_offer)}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-emerald-100/50">
                        <td className="p-3.5 font-bold text-emerald-950">Total Discount Savings</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 font-mono font-black text-emerald-800 text-sm">
                            - {formatINR(q.pricing.total_discounts)}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-slate-900 text-white font-black">
                        <td className="p-4 text-slate-200 text-xs">Final Net On-Road Price</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-4 border-l border-slate-800 font-mono text-base text-white">
                            {formatINR(q.net_on_road_price)}
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/40">Delivery Commitment</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 text-slate-800">
                            {q.delivery_timeline_days} calendar days from booking
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/40">Actions</td>
                        {quotations.map((q) => (
                          <td key={q.id} className="p-3.5 border-l border-slate-200 space-y-2">
                            <Button
                              variant="outline"
                              size="xs"
                              className="w-full text-xs font-semibold"
                              onClick={() => handleOpenBreakdown(q)}
                            >
                              View Breakdown
                            </Button>
                            {q.quotation_status === "SUBMITTED" && (
                              <Button
                                variant="success"
                                size="xs"
                                className="w-full text-xs font-bold"
                                disabled={actionLoadingId === q.id}
                                onClick={() => handleAcceptQuotation(q.id)}
                              >
                                {actionLoadingId === q.id ? "Processing..." : "Accept This Offer"}
                              </Button>
                            )}
                            {q.quotation_status === "ACCEPTED" && (
                              <div className="text-center py-1 text-emerald-700 font-bold text-xs">
                                ✓ Accepted
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Quotation Cards View */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {quotations.map((q) => {
                  const isAccepted = q.quotation_status === "ACCEPTED";
                  const isPending = q.quotation_status === "SUBMITTED" || q.quotation_status === "DRAFT";

                  return (
                    <div
                      key={q.id}
                      className={`bg-white rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between space-y-5 shadow-card ${
                        isAccepted
                          ? "border-emerald-300 ring-2 ring-emerald-400/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="brand" size="sm">
                                {q.dealer_name}
                              </Badge>
                              <Badge variant="success" size="sm">
                                Verified Dealership
                              </Badge>
                            </div>
                            <h3 className="text-base font-black text-slate-900 leading-snug">
                              {q.model_name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                              {q.variant_name} • {q.fuel_type} • {q.transmission} • {q.colour}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Branch: {q.branch_name || "Authorized Delivery Centre"}
                            </p>
                          </div>

                          <div className="text-right space-y-1">
                            <Badge
                              variant={
                                isAccepted ? "success" : q.quotation_status === "REJECTED" ? "danger" : "default"
                              }
                              size="sm"
                            >
                              {q.quotation_status}
                            </Badge>
                            <p className="text-[10px] text-slate-400 font-mono block">
                              Ref: {q.quotation_number}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Net Final On-Road Total
                            </span>
                            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                              {formatINR(q.net_on_road_price)}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              Ex-Showroom: {formatINR(q.pricing.ex_showroom_price)}
                            </span>
                          </div>

                          <div className="text-right">
                            <Badge variant="success" size="default" className="font-mono font-bold">
                              Save {formatINR(q.pricing.total_discounts)}
                            </Badge>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              Ready in {q.delivery_timeline_days} days
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-lg border border-slate-100 space-y-1">
                          <p className="font-semibold text-slate-800 text-[11px]">Dealership Offer Highlights:</p>
                          <p className="text-[11px] leading-relaxed text-slate-600">{q.dealership_terms}</p>
                          {q.valid_until && (
                            <p className="text-[10px] text-slate-400 pt-1">
                              Offer Valid Until: {formatDate(q.valid_until)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-semibold"
                          onClick={() => handleOpenBreakdown(q)}
                        >
                          View Itemized Breakdown
                        </Button>

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-slate-500 hover:text-rose-600"
                              disabled={actionLoadingId === q.id}
                              onClick={() => handleRejectQuotation(q.id)}
                            >
                              Decline
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              className="text-xs font-bold px-4"
                              disabled={actionLoadingId === q.id}
                              onClick={() => handleAcceptQuotation(q.id)}
                            >
                              {actionLoadingId === q.id ? "Confirming..." : "Accept Quotation"}
                            </Button>
                          </div>
                        )}

                        {isAccepted && (
                          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Dealership Confirmed - Booking in Progress</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB: ENQUIRIES & TEST DRIVES
           ========================================================================= */}
        {activeTab === "enquiries" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  My Enquiries & Test Drive Requests
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronized live with authorized DealerOS CRM showrooms.
                </p>
              </div>
              <Link href="/cars">
                <Button variant="default" size="sm" className="text-xs font-bold">
                  Book New Test Drive
                </Button>
              </Link>
            </div>

            {enquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <p className="text-base font-bold text-slate-900">No active enquiries</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select any vehicle from our catalogue to request a home test drive or competitive dealer quote.
                </p>
                <Link href="/cars">
                  <Button variant="default" size="sm">
                    Explore Vehicles
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enquiries.map((enq) => {
                  const hasQuotes = (enq.quotations_count || 0) > 0 || enq.status === "QUOTATION_SENT";
                  return (
                    <div
                      key={enq.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="brand" size="sm">
                            {enq.brand_name}
                          </Badge>
                          <Badge variant="success" size="sm">
                            {enq.status}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {enq.city}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-mono">Ref: {enq.id}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">
                            {enq.brand_name} {enq.model_name} {enq.variant_name ? `(${enq.variant_name})` : ""}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>Dealership: <strong className="text-slate-800">{enq.dealership_name || "Authorized Dealership Showroom"}</strong></span>
                            <span>•</span>
                            <span>Branch: <strong className="text-slate-800">{enq.branch_name || "Central Delivery Desk"}</strong></span>
                            <span>•</span>
                            <span>Timeline: <strong className="text-slate-800">{enq.purchase_timeline || "Within 30 days"}</strong></span>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Logged on: {formatDate(enq.created_at)}</span>
                          <span>•</span>
                          <span>Source: {enq.source || "WEBSITE_DIRECT"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {hasQuotes ? (
                          <Button
                            variant="success"
                            size="sm"
                            className="text-xs font-bold whitespace-nowrap"
                            onClick={() => setActiveTab("quotations")}
                          >
                            View Quotations →
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            Showroom Desk Processing
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB: JOINED BUYER GROUPS
           ========================================================================= */}
        {activeTab === "groups" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Joined Collective Buyer Groups
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track regional group clusters, volume discount commitments, and allocation updates.
                </p>
              </div>
              <Link href="/groups">
                <Button variant="default" size="sm" className="text-xs font-bold">
                  Browse Public Groups
                </Button>
              </Link>
            </div>

            {joinedGroups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <p className="text-base font-bold text-slate-900">You have not joined any buyer groups yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Find your vehicle of choice and join a regional cluster to unlock collective dealership discounts.
                </p>
                <Link href="/groups">
                  <Button variant="default" size="sm">
                    Browse Active Groups
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {joinedGroups.map((item, idx) => {
                  const grp = item.group_details;
                  const membership = item.membership;
                  const brandName = grp?.brand_name || "Maruti Suzuki";
                  const modelName = grp?.model_name || membership?.model_name || "Vehicle";
                  const city = grp?.city || membership?.city || "Bengaluru";
                  const groupId = grp?.id || membership?.group_id || `grp-${idx}`;
                  const title = `${brandName} ${modelName} ${city} Group`;
                  const savings = grp?.estimated_savings_inr || 45000;
                  const membersCount = grp?.current_members_count || 1;
                  const maxCap = grp?.max_capacity || 10;

                  return (
                    <div
                      key={membership?.id || groupId}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="brand" size="sm">{brandName}</Badge>
                          <Badge variant="secondary" size="sm">{city}</Badge>
                          <Badge variant="success" size="sm">Confirmed Member</Badge>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>Variant: <strong className="text-slate-800">{membership?.variant_name || "Top Variant"}</strong></span>
                          <span>•</span>
                          <span>Colour: <strong className="text-slate-800">{membership?.colour_preference || "Pearl White"}</strong></span>
                          <span>•</span>
                          <span>Ref: <strong className="font-mono text-slate-800">{membership?.group_code || groupId}</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Savings</span>
                          <span className="text-xl font-black text-emerald-600 font-mono">{formatINR(savings)}</span>
                          <span className="text-[10px] text-slate-400 block">{membersCount} / {maxCap} Joined</span>
                        </div>
                        <Link href={`/groups/${groupId}`}>
                          <Button variant="outline" size="sm" className="whitespace-nowrap">
                            View Group Status →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB: SAVED VEHICLES
           ========================================================================= */}
        {activeTab === "saved" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Saved Vehicles</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vehicles bookmarked from the catalogue for price monitoring and collective purchase.
                </p>
              </div>
              <Link href="/cars">
                <Button variant="default" size="sm" className="text-xs font-bold">
                  Explore More Vehicles
                </Button>
              </Link>
            </div>

            {savedVehicles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <p className="text-base font-bold text-slate-900">No saved vehicles yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse our vehicle catalogue and click the bookmark button to save vehicles here.
                </p>
                <Link href="/cars">
                  <Button variant="default" size="sm">
                    Browse Catalogue
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedVehicles.map((sv) => (
                  <div
                    key={sv.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
                  >
                    <div>
                      {sv.image_url && (
                        <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                          <img
                            src={sv.image_url}
                            alt={sv.model_name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveSavedVehicle(sv.id)}
                            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-rose-600 rounded-full p-1.5 shadow-sm transition-all"
                            title="Remove from saved"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <div className="p-5 space-y-3">
                        <div className="space-y-1">
                          <Badge variant="brand" size="sm">
                            {sv.brand_name}
                          </Badge>
                          <h3 className="text-base font-black text-slate-900">{sv.model_name}</h3>
                          {sv.variant_name && (
                            <p className="text-xs text-slate-500">{sv.variant_name}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {sv.fuel_type && <span>{sv.fuel_type}</span>}
                          {sv.transmission && (
                            <>
                              <span>•</span>
                              <span>{sv.transmission}</span>
                            </>
                          )}
                        </div>

                        {sv.starting_price && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Starting Price
                            </span>
                            <span className="text-base font-black text-slate-900 font-mono">
                              {formatINR(sv.starting_price)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center gap-2">
                      <Link href={`/cars/${sv.model_id}`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full text-xs font-bold">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSavedVehicle(sv.id)}
                        className="text-xs text-slate-400 hover:text-rose-600"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB: APPOINTMENTS & SHOWROOM VISITS
           ========================================================================= */}
        {activeTab === "appointments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Showroom Visits & Test Drive Appointments
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official scheduled test drives, showroom visits, and documentation sessions.
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                className="text-xs font-bold"
                onClick={() => setIsBookModalOpen(true)}
              >
                + Schedule New Visit
              </Button>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <p className="text-base font-bold text-slate-900">No appointments scheduled</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Book a private showroom experience or test drive at your convenience.
                </p>
                <Button variant="default" size="sm" onClick={() => setIsBookModalOpen(true)}>
                  Schedule Visit Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => {
                  const isConfirmed = apt.status === "CONFIRMED";
                  return (
                    <div
                      key={apt.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={isConfirmed ? "success" : "secondary"} size="sm">
                            {apt.status}
                          </Badge>
                          <Badge variant="brand" size="sm">
                            {apt.appointment_type.replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-mono">Ref: {apt.id}</span>
                        </div>

                        <h3 className="text-base font-black text-slate-900">
                          {apt.model_name} {apt.variant_name ? `• ${apt.variant_name}` : ""}
                        </h3>

                        <div className="text-xs text-slate-600 space-y-0.5">
                          <p>
                            <strong>Dealership:</strong> {apt.dealership_name} ({apt.branch_name || "Showroom"})
                          </p>
                          <p>
                            <strong>Date & Slot:</strong> {apt.appointment_date} at {apt.time_slot}
                          </p>
                          {apt.consultant_name && (
                            <p className="text-slate-500">
                              Assigned Sales Consultant: {apt.consultant_name}
                            </p>
                          )}
                          {apt.notes && (
                            <p className="text-slate-500 italic mt-1">Note: {apt.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isConfirmed && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => handleCancelAppointment(apt.id)}
                          >
                            Cancel Appointment
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB: SAVED COMPARISONS
           ========================================================================= */}
        {activeTab === "comparisons" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Saved Comparisons</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-vehicle comparison sets saved for technical analysis and decision making.
                </p>
              </div>
              <Link href="/compare">
                <Button variant="default" size="sm" className="text-xs font-bold">
                  New Comparison
                </Button>
              </Link>
            </div>

            {savedComparisons.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <p className="text-base font-bold text-slate-900">No saved comparisons</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Compare two or more vehicles and save them to quickly review specification differences anytime.
                </p>
                <Link href="/compare">
                  <Button variant="default" size="sm">
                    Open Comparison Tool
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedComparisons.map((cmp) => (
                  <div
                    key={cmp.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <h3 className="text-base font-black text-slate-900">{cmp.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {cmp.models?.map((m) => (
                          <Badge key={m.id} variant="secondary" size="sm">
                            {m.brand_name ? `${m.brand_name} ` : ""}{m.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400">Saved: {formatDate(cmp.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/compare?models=${cmp.model_ids.join(",")}`}>
                        <Button variant="default" size="sm" className="text-xs font-bold">
                          Compare Side-by-Side
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComparison(cmp.id)}
                        className="text-xs text-slate-400 hover:text-rose-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB: ACCOUNT SETTINGS (Profile, Verification, Preferences, Security)
           ========================================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-8">
            {/* Section 1: Personal Profile Editing */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Personal Profile & Contact Details</h3>
                <p className="text-xs text-slate-500">
                  Manage your personal details used for dealership communications and registration documents.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                  />
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Preferred Metro City
                    </label>
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      {["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    rows={2}
                    placeholder="Enter your residential address for vehicle registration"
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Preferred Communication Channel
                  </label>
                  <div className="flex gap-4 text-xs">
                    {["WHATSAPP", "PHONE", "EMAIL"].map((method) => (
                      <label key={method} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="contact_method"
                          value={method}
                          checked={editContactMethod === method}
                          onChange={(e) => setEditContactMethod(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="font-semibold text-slate-800">
                          {method === "WHATSAPP" ? "WhatsApp" : method === "PHONE" ? "Phone Call" : "Email"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  isLoading={isSavingProfile}
                  className="font-bold text-xs"
                >
                  Save Profile Changes
                </Button>
              </form>
            </div>

            {/* Section 2: Account Verification Status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Contact Verification</h3>
                <p className="text-xs text-slate-500">
                  Verified contacts receive faster priority responses and verified booking certificates from dealers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl text-xs">
                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Email Address</p>
                    <p className="text-slate-500">{user?.email}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                      {user?.is_email_verified ? "✓ Verified" : "⚠ Unverified"}
                    </p>
                  </div>
                  {!user?.is_email_verified && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleStartVerification("EMAIL")}
                    >
                      Verify Email
                    </Button>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Mobile Number</p>
                    <p className="text-slate-500">{user?.phone_number}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                      {user?.is_phone_verified ? "✓ Verified" : "⚠ Unverified"}
                    </p>
                  </div>
                  {!user?.is_phone_verified && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleStartVerification("PHONE")}
                    >
                      Verify Phone
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Notification Preferences */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Notification Preferences</h3>
                <p className="text-xs text-slate-500">
                  Control the communication channels you wish to receive updates on.
                </p>
              </div>

              <div className="space-y-4 max-w-2xl text-xs">
                {[
                  {
                    key: "whatsapp_updates" as const,
                    title: "WhatsApp Alerts",
                    desc: "Receive instant updates when dealers submit quotations or when your appointment is confirmed.",
                  },
                  {
                    key: "sms_alerts" as const,
                    title: "SMS Notifications",
                    desc: "Receive booking OTPs and urgent allocation milestones directly on your mobile.",
                  },
                  {
                    key: "email_notifications" as const,
                    title: "Email Digests",
                    desc: "Receive detailed PDF quotation copies and weekly price trend updates.",
                  },
                  {
                    key: "quotation_alerts" as const,
                    title: "Quotation Alerts",
                    desc: "Notify me immediately when authorized dealerships submit competing offers.",
                  },
                  {
                    key: "group_milestones" as const,
                    title: "Buyer Group Milestones",
                    desc: "Receive alerts when collective buyer groups reach quota thresholds.",
                  },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-bold text-slate-900">{pref.title}</p>
                      <p className="text-slate-500 text-[11px]">{pref.desc}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePreference(pref.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        notifPreferences[pref.key] ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full block shadow-xs transition-transform ${
                          notifPreferences[pref.key] ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Security & Password */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Account Security & Credentials</h3>
                <p className="text-xs text-slate-500">
                  Update your account password and review authorized active devices.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-type new password"
                  required
                />
                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  isLoading={isChangingPassword}
                  className="font-bold text-xs"
                >
                  Change Password
                </Button>
              </form>

              {/* Active Sessions List */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Active Sessions & Devices</h4>
                    <p className="text-[11px] text-slate-500">
                      Devices currently authorized with your customer credentials.
                    </p>
                  </div>
                  {sessions.length > 1 && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleRevokeOtherSessions}
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Sign Out Other Devices
                    </Button>
                  )}
                </div>

                <div className="space-y-2.5 max-w-2xl text-xs">
                  {sessions.map((sess) => (
                    <div
                      key={sess.session_id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{sess.device}</span>
                          {sess.is_current && (
                            <Badge variant="success" size="sm">
                              Current Session
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          IP: {sess.ip_address} • Location: {sess.location} • Last active: {sess.last_active}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secure Sign Out Section */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Sign Out of Account</h4>
                  <p className="text-[11px] text-slate-500">
                    Terminates your session on this browser.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-xs text-rose-600 border-slate-300 hover:bg-rose-50"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: ITEMIZED PRICE BREAKDOWN
         ========================================================================= */}
      {isBreakdownModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="brand" size="sm">{selectedQuotation.dealer_name}</Badge>
                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                    {selectedQuotation.quotation_number}
                  </Badge>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Itemized On-Road Price Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedQuotation.model_name} • {selectedQuotation.variant_name} ({selectedQuotation.fuel_type} • {selectedQuotation.transmission})
                </p>
              </div>
              <button
                onClick={handleCloseBreakdown}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  1. Base Price & Statutory Charges
                </h4>
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ex-Showroom Price</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatINR(selectedQuotation.pricing.ex_showroom_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">RTO Registration & Road Tax</span>
                    <span className="font-mono text-slate-800">
                      {formatINR(selectedQuotation.pricing.rto_road_tax)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Comprehensive Vehicle Insurance (1+3 Years)</span>
                    <span className="font-mono text-slate-800">
                      {formatINR(selectedQuotation.pricing.insurance_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">FASTag RFID Activation</span>
                    <span className="font-mono text-slate-800">
                      {formatINR(selectedQuotation.pricing.fastag_charges)}
                    </span>
                  </div>
                  {selectedQuotation.pricing.tcs_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">TCS (1% Section 206C)</span>
                      <span className="font-mono text-slate-800">
                        {formatINR(selectedQuotation.pricing.tcs_amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  2. Dealership Inclusions & Protection Packs
                </h4>
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Accessories Pack</span>
                    <span className="font-mono text-slate-800">
                      {formatINR(selectedQuotation.pricing.accessories_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Extended Warranty Package</span>
                    <span className="font-mono text-slate-800">
                      {formatINR(selectedQuotation.pricing.extended_warranty_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold text-slate-700">
                    <span>Gross On-Road Total</span>
                    <span className="font-mono">
                      {formatINR(selectedQuotation.pricing.gross_on_road_price)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  3. Exclusive Discounts & Manufacturer Schemes
                </h4>
                <div className="bg-emerald-50/60 rounded-xl p-3.5 space-y-2 border border-emerald-100">
                  <div className="flex justify-between text-emerald-800">
                    <span>Authorized Dealer Discount</span>
                    <span className="font-mono font-bold">
                      - {formatINR(selectedQuotation.pricing.dealer_discount)}
                    </span>
                  </div>
                  {selectedQuotation.pricing.manufacturer_offer > 0 && (
                    <div className="flex justify-between text-emerald-800">
                      <span>OEM Consumer Offer</span>
                      <span className="font-mono font-bold">
                        - {formatINR(selectedQuotation.pricing.manufacturer_offer)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-emerald-200 font-black text-emerald-900 text-sm">
                    <span>Total Discount Savings</span>
                    <span className="font-mono">
                      - {formatINR(selectedQuotation.pricing.total_discounts)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 text-white rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Final Net Payable On-Road Price
                  </span>
                  <span className="text-2xl font-black font-mono tracking-tight">
                    {formatINR(selectedQuotation.net_on_road_price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-300 block">
                    Delivery in {selectedQuotation.delivery_timeline_days} days
                  </span>
                  {selectedQuotation.valid_until && (
                    <span className="text-[10px] text-slate-400 block">
                      Valid until {formatDate(selectedQuotation.valid_until)}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">Dealership Terms & Notes:</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">{selectedQuotation.dealership_terms}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={handleCloseBreakdown} className="text-xs">
                Close
              </Button>

              {selectedQuotation.quotation_status === "SUBMITTED" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 hover:text-rose-600"
                    disabled={actionLoadingId === selectedQuotation.id}
                    onClick={() => handleRejectQuotation(selectedQuotation.id)}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    className="text-xs font-bold px-5"
                    disabled={actionLoadingId === selectedQuotation.id}
                    onClick={() => handleAcceptQuotation(selectedQuotation.id)}
                  >
                    {actionLoadingId === selectedQuotation.id ? "Accepting..." : "Accept This Quotation"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: BOOK SHOWROOM VISIT / TEST DRIVE
         ========================================================================= */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Schedule Showroom Visit</h3>
                <p className="text-xs text-slate-500">Book an appointment with an authorized dealership</p>
              </div>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Dealership</label>
                <select
                  value={bookDealerId}
                  onChange={(e) => setBookDealerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="dlr-kalyani-blr-001">Kalyani Motors Maruti Suzuki (Whitefield Showroom)</option>
                  <option value="dlr-pratham-blr-006">Pratham Motors Maruti Suzuki Nexa (Bellandur Lounge)</option>
                  <option value="dlr-advaith-blr-002">Advaith Hyundai Bengaluru (Residency Road)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vehicle of Interest</label>
                <select
                  value={bookModelName}
                  onChange={(e) => setBookModelName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Maruti Suzuki Brezza">Maruti Suzuki Brezza</option>
                  <option value="Maruti Suzuki Grand Vitara">Maruti Suzuki Grand Vitara</option>
                  <option value="Hyundai Creta">Hyundai Creta</option>
                  <option value="Tata Nexon EV">Tata Nexon EV</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Appointment Type</label>
                  <select
                    value={bookType}
                    onChange={(e) => setBookType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="SHOWROOM_VISIT">Showroom Visit</option>
                    <option value="HOME_TEST_DRIVE">Home Test Drive</option>
                    <option value="DOCUMENTATION_HANDOVER">Paperwork Session</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
                <select
                  value={bookSlot}
                  onChange={(e) => setBookSlot(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM (Morning)</option>
                  <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM (Midday)</option>
                  <option value="02:30 PM - 04:00 PM">02:30 PM - 04:00 PM (Afternoon)</option>
                  <option value="04:30 PM - 06:00 PM">04:30 PM - 06:00 PM (Evening)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Special Notes / Requirements</label>
                <textarea
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Would like to test drive the Automatic variant"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBookModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  isLoading={isBookingApt}
                  className="font-bold px-4"
                >
                  Confirm Appointment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CONTACT VERIFICATION OTP
         ========================================================================= */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl border border-blue-200">
              🔑
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Verify Your {verifyChannel === "EMAIL" ? "Email Address" : "Phone Number"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit code dispatched to your {verifyChannel.toLowerCase()}.
              </p>
            </div>

            <form onSubmit={handleConfirmVerification} className="space-y-4 text-xs">
              <Input
                label="6-Digit Verification Code"
                value={verifyOtp}
                onChange={(e) => setVerifyOtp(e.target.value)}
                placeholder="123456"
                required
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  isLoading={isVerifying}
                  className="w-1/2 font-bold"
                >
                  Verify
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
