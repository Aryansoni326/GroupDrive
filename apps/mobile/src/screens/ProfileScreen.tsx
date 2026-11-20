import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { EmptyState } from "../components/EmptyState";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { useMobileAuth } from "../context/AuthContext";
import { customerApi } from "@groupdrive/api-client";
import {
  JoinedGroupDetail,
  CustomerSavedVehicle,
  CustomerSavedComparison,
  CustomerEnquiryRecord,
  CustomerQuotationRecord,
  CustomerAppointment,
  CustomerNotification,
  CustomerNotificationPreferences,
  CustomerSession,
} from "@groupdrive/types";
import { formatINR, formatDate } from "@groupdrive/utils";

type AuthMode = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD" | "RESET_PASSWORD";

type DashboardTab =
  | "OVERVIEW"
  | "GROUPS"
  | "QUOTATIONS"
  | "ENQUIRIES"
  | "SAVED"
  | "APPOINTMENTS"
  | "SETTINGS";

export interface ProfileScreenProps {
  initialTab?: DashboardTab;
}

export function ProfileScreen({ initialTab }: ProfileScreenProps = {}) {
  const {
    user,
    stats,
    isAuthenticated,
    isLoading: authLoading,
    login,
    register,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyRequest,
    verifyConfirm,
    changePassword,
  } = useMobileAuth();

  // Auth Forms State
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Authenticated Dashboard State
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab || "OVERVIEW");
  const [dataLoading, setDataLoading] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Dashboard Data Records
  const [joinedGroups, setJoinedGroups] = useState<JoinedGroupDetail[]>([]);
  const [quotations, setQuotations] = useState<CustomerQuotationRecord[]>([]);
  const [enquiries, setEnquiries] = useState<CustomerEnquiryRecord[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<CustomerSavedVehicle[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<CustomerSavedComparison[]>([]);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [notificationPreferences, setNotificationPreferences] =
    useState<CustomerNotificationPreferences | null>(null);
  const [sessions, setSessions] = useState<CustomerSession[]>([]);

  // Edit Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editContactMethod, setEditContactMethod] = useState("PHONE");

  // Verification Modal
  const [verifyModalChannel, setVerifyModalChannel] = useState<"EMAIL" | "PHONE" | null>(null);
  const [verificationCode, setVerificationCode] = useState("123456");
  const [verifyDestination, setVerifyDestination] = useState("");

  // Change Password State
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMessage, setPwdMessage] = useState("");

  // Load All Account Records when Authenticated
  const loadAccountRecords = useCallback(async () => {
    setDataLoading(true);
    try {
      const [
        groupsRes,
        quotesRes,
        enquiriesRes,
        savedRes,
        comparisonsRes,
        appointmentsRes,
        notificationsRes,
        prefsRes,
        sessionsRes,
      ] = await Promise.all([
        customerApi.groups.getMyGroups(),
        customerApi.quotations.getMyQuotations(),
        customerApi.enquiries.getMyEnquiries(),
        customerApi.savedVehicles.getSavedVehicles(),
        customerApi.comparisons.getComparisons(),
        customerApi.appointments.getAppointments(),
        customerApi.notifications.getNotifications(),
        customerApi.notifications.getPreferences(),
        customerApi.security.getSessions(),
      ]);

      if (groupsRes.data) setJoinedGroups(groupsRes.data);
      if (quotesRes.data) setQuotations(quotesRes.data);
      if (enquiriesRes.data) setEnquiries(enquiriesRes.data);
      if (savedRes.data) setSavedVehicles(savedRes.data);
      if (comparisonsRes.data) setSavedComparisons(comparisonsRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (notificationsRes.data) setNotifications(notificationsRes.data);
      if (prefsRes.data) setNotificationPreferences(prefsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
    } catch (err) {
      console.error("Failed to load customer account records:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAccountRecords();
    }
  }, [isAuthenticated, loadAccountRecords]);

  // Auth Actions
  async function handleLogin() {
    setErrorMessage("");
    setActionLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRegister() {
    setErrorMessage("");
    setActionLoading(true);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        password,
        city,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleForgotPassword() {
    setErrorMessage("");
    setActionLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccessNotice(`Password reset instructions sent to ${res.email}. Valid for ${res.expires_in_minutes} minutes.`);
      setAuthMode("RESET_PASSWORD");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send reset code.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword() {
    setErrorMessage("");
    setActionLoading(true);
    try {
      await resetPassword({
        email,
        code_or_token: resetCode,
        new_password: newPassword,
      });
      setSuccessNotice("Password reset successfully. You can now sign in.");
      setAuthMode("LOGIN");
      setPassword(newPassword);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setActionLoading(false);
    }
  }

  function handleQuickDemo() {
    setEmail("customer@groupdrive.in");
    setPassword("Password@123");
  }

  // Profile Edit Handling
  const handleOpenEditProfile = () => {
    if (user) {
      setEditFirstName(user.first_name || "");
      setEditLastName(user.last_name || "");
      setEditPhone(user.phone_number || "");
      setEditCity(user.city || "Bengaluru");
      setEditAddress(user.address || "");
      setEditContactMethod(user.preferred_contact_method || "PHONE");
      setIsEditProfileOpen(true);
    }
  };

  const handleSaveProfile = async () => {
    setActionLoading(true);
    try {
      await updateProfile({
        first_name: editFirstName,
        last_name: editLastName,
        phone_number: editPhone,
        city: editCity,
        address: editAddress,
        preferred_contact_method: editContactMethod,
      });
      setIsEditProfileOpen(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update profile.");
    } finally {
      setActionLoading(false);
    }
  };

  // Verification Handling
  const handleStartVerification = async (channel: "EMAIL" | "PHONE") => {
    try {
      const res = await verifyRequest(channel);
      setVerifyModalChannel(channel);
      setVerifyDestination(res.destination);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send verification request.");
    }
  };

  const handleConfirmVerification = async () => {
    if (!verifyModalChannel) return;
    try {
      await verifyConfirm(verifyModalChannel, verificationCode);
      setVerifyModalChannel(null);
      Alert.alert("Verified", `Your ${verifyModalChannel.toLowerCase()} has been verified.`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Verification code invalid.");
    }
  };

  // Quotation Actions
  const handleAcceptQuotation = async (quotationId: string, dealerName: string) => {
    Alert.alert(
      "Accept Quotation",
      `Accept this binding quotation from ${dealerName}? The dealership sales team will be notified to begin priority handover paperwork.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept Quotation",
          onPress: async () => {
            try {
              await customerApi.quotations.acceptQuotation(quotationId);
              loadAccountRecords();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to accept quotation.");
            }
          },
        },
      ]
    );
  };

  const handleRejectQuotation = async (quotationId: string) => {
    Alert.alert(
      "Decline Quotation",
      "Are you sure you want to decline this quotation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await customerApi.quotations.rejectQuotation(quotationId);
              loadAccountRecords();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to decline quotation.");
            }
          },
        },
      ]
    );
  };

  // Remove Saved Vehicle
  const handleRemoveSavedVehicle = async (savedId: string) => {
    try {
      await customerApi.savedVehicles.removeSavedVehicle(savedId);
      setSavedVehicles((prev) => prev.filter((v) => v.id !== savedId));
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to remove vehicle.");
    }
  };

  // Delete Comparison Set
  const handleDeleteComparison = async (comparisonId: string) => {
    try {
      await customerApi.comparisons.deleteComparison(comparisonId);
      setSavedComparisons((prev) => prev.filter((c) => c.id !== comparisonId));
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete comparison.");
    }
  };

  // Notification Preferences Toggle
  const handleTogglePreference = async (key: keyof CustomerNotificationPreferences) => {
    if (!notificationPreferences) return;
    const updated = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    };
    setNotificationPreferences(updated);
    try {
      await customerApi.notifications.updatePreferences(updated);
    } catch {
      // Handled
    }
  };

  // Change Password Submit
  const handleChangePasswordSubmit = async () => {
    setPwdMessage("");
    if (!currentPwd || !newPwd) {
      setPwdMessage("Please enter your current and new password.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMessage("New password and confirmation do not match.");
      return;
    }
    try {
      await changePassword({
        current_password: currentPwd,
        new_password: newPwd,
      });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setPwdMessage("Password updated successfully.");
    } catch (err: any) {
      setPwdMessage(err.message || "Could not change password.");
    }
  };

  // Revoke Other Sessions
  const handleRevokeOtherSessions = async () => {
    try {
      await customerApi.security.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.is_current));
      Alert.alert("Sessions Terminated", "All other device sessions have been safely logged out.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to revoke sessions.");
    }
  };

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Verifying secure session...</Text>
      </View>
    );
  }

  // =========================================================================
  // AUTHENTICATED CUSTOMER DASHBOARD
  // =========================================================================
  if (isAuthenticated && user) {
    return (
      <View style={styles.container}>
        {/* Customer Profile Header Strip */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user.first_name?.[0] || "U"}
              </Text>
            </View>
            <View style={styles.profileHeaderInfo}>
              <View style={styles.badgeRow}>
                <Badge label="Verified Retail Buyer" variant="velocity" size="sm" />
                {user.is_email_verified ? (
                  <Badge label="Email Verified" variant="emerald" size="sm" />
                ) : (
                  <TouchableOpacity onPress={() => handleStartVerification("EMAIL")}>
                    <Badge label="Verify Email" variant="amber" size="sm" />
                  </TouchableOpacity>
                )}
                {user.is_phone_verified ? (
                  <Badge label="Phone Verified" variant="emerald" size="sm" />
                ) : (
                  <TouchableOpacity onPress={() => handleStartVerification("PHONE")}>
                    <Badge label="Verify Phone" variant="amber" size="sm" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.userName}>
                {user.first_name} {user.last_name}
              </Text>
              <Text style={styles.userEmail}>
                {user.email} • {user.phone_number || "+919876543210"}
              </Text>
              <Text style={styles.userLocation}>
                Metro Jurisdiction: {user.city || "Bengaluru"}
              </Text>
            </View>
          </View>

          <View style={styles.profileActionsRow}>
            <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditProfile}>
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={() => setShowSignOutDialog(true)}>
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Dashboard Segmented Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsStrip}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {[
            { id: "OVERVIEW", label: "Dashboard" },
            { id: "GROUPS", label: `My Groups (${joinedGroups.length})` },
            { id: "QUOTATIONS", label: `Quotations (${quotations.length})` },
            { id: "ENQUIRIES", label: `Enquiries (${enquiries.length})` },
            { id: "SAVED", label: `Saved (${savedVehicles.length})` },
            { id: "APPOINTMENTS", label: `Visits (${appointments.length})` },
            { id: "SETTINGS", label: "Settings & Security" },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, isSel && styles.tabPillActive]}
                onPress={() => setActiveTab(tab.id as DashboardTab)}
              >
                <Text style={[styles.tabPillText, isSel && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Body Content */}
        <ScrollView contentContainerStyle={styles.dashboardBody} showsVerticalScrollIndicator={false}>
          {dataLoading && (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 8 }} />
          )}

          {/* ===================================================================
              TAB 1: OVERVIEW DASHBOARD
              =================================================================== */}
          {activeTab === "OVERVIEW" && (
            <View style={styles.tabSection}>
              {/* Quick Stats Grid */}
              <View style={styles.statsGrid}>
                <TouchableOpacity
                  style={styles.statBox}
                  onPress={() => setActiveTab("GROUPS")}
                >
                  <Text style={styles.statNumber}>
                    {stats?.joined_groups_count ?? joinedGroups.length}
                  </Text>
                  <Text style={styles.statLabel}>Active Groups</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statBox}
                  onPress={() => setActiveTab("QUOTATIONS")}
                >
                  <Text style={styles.statNumber}>
                    {stats?.quotations_count ?? quotations.length}
                  </Text>
                  <Text style={styles.statLabel}>Dealer Quotes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statBox}
                  onPress={() => setActiveTab("ENQUIRIES")}
                >
                  <Text style={styles.statNumber}>
                    {stats?.enquiries_count ?? enquiries.length}
                  </Text>
                  <Text style={styles.statLabel}>Enquiries</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statBox}
                  onPress={() => setActiveTab("SAVED")}
                >
                  <Text style={styles.statNumber}>
                    {stats?.saved_vehicles_count ?? savedVehicles.length}
                  </Text>
                  <Text style={styles.statLabel}>Saved Cars</Text>
                </TouchableOpacity>
              </View>

              {/* Important Updates Strip */}
              <View style={styles.updatesCard}>
                <View style={styles.updatesHeader}>
                  <Badge label="Live Account Updates" variant="emerald" size="sm" />
                  <Text style={styles.updatesTitle}>Priority Status Feed</Text>
                </View>

                {notifications.length === 0 ? (
                  <Text style={styles.noUpdatesText}>No pending alerts or notifications.</Text>
                ) : (
                  notifications.map((notif) => (
                    <View key={notif.id} style={styles.updateRow}>
                      <View style={styles.updateBullet} />
                      <View style={styles.updateContent}>
                        <Text style={styles.updateTitle}>{notif.title}</Text>
                        <Text style={styles.updateMessage}>{notif.message}</Text>
                        <Text style={styles.updateTime}>{formatDate(notif.created_at)}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* ===================================================================
              TAB 2: MY GROUPS
              =================================================================== */}
          {activeTab === "GROUPS" && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionHeading}>Joined Buyer Clusters</Text>
              {joinedGroups.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="No Groups Joined Yet"
                  description="You are not participating in any collective buying pools. Join an active cluster to unlock institutional fleet discounts."
                />
              ) : (
                joinedGroups.map((grp) => (
                  <Card key={grp.membership.id} style={styles.cardItem}>
                    <View style={styles.cardItemHeader}>
                      <Badge label={grp.membership.group_code} variant="velocity" size="sm" />
                      <Badge label={grp.membership.status || "CONFIRMED"} variant="emerald" size="sm" />
                    </View>
                    <Text style={styles.cardItemTitle}>{grp.membership.model_name}</Text>
                    <Text style={styles.cardItemSub}>
                      Variant: {grp.membership.variant_name} • Colour: {grp.membership.colour_preference}
                    </Text>
                    <Text style={styles.cardItemLocation}>
                      Purchasing Region: {grp.membership.city}
                    </Text>
                    <View style={styles.cardSavingsBox}>
                      <Text style={styles.cardSavingsLabel}>Target Fleet Savings</Text>
                      <Text style={styles.cardSavingsVal}>
                        {formatINR(grp.group_details?.estimated_savings_inr || 45000, { compact: true })}
                      </Text>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ===================================================================
              TAB 3: DEALER QUOTATIONS
              =================================================================== */}
          {activeTab === "QUOTATIONS" && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionHeading}>Franchised Dealer Quotations</Text>
              {quotations.length === 0 ? (
                <EmptyState
                  icon="📄"
                  title="No Quotations Received Yet"
                  description="Quotations submitted by authorized showrooms for your enquiries and buyer groups will appear here."
                />
              ) : (
                quotations.map((q) => {
                  const pricing = q.pricing;
                  const isAccepted = q.quotation_status === "ACCEPTED";
                  const isRejected = q.quotation_status === "REJECTED";

                  return (
                    <Card key={q.id} style={styles.cardItem}>
                      <View style={styles.cardItemHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dealerName}>{q.dealer_name}</Text>
                          <Text style={styles.branchName}>{q.branch_name}</Text>
                        </View>
                        <Badge
                          label={q.quotation_status}
                          variant={isAccepted ? "emerald" : isRejected ? "rose" : "velocity"}
                          size="sm"
                        />
                      </View>

                      <View style={styles.divider} />

                      <Text style={styles.quoteModelName}>
                        {q.model_name} {q.variant_name} ({q.fuel_type} • {q.transmission})
                      </Text>
                      <Text style={styles.quoteQuoteNum}>Quote No: {q.quotation_number}</Text>

                      {/* Pricing Table */}
                      <View style={styles.pricingTable}>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceRowLabel}>Ex-Showroom Price</Text>
                          <Text style={styles.priceRowVal}>{formatINR(pricing.ex_showroom_price)}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceRowLabel}>RTO Road Tax (KA-03)</Text>
                          <Text style={styles.priceRowVal}>{formatINR(pricing.rto_road_tax)}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceRowLabel}>Comprehensive Insurance</Text>
                          <Text style={styles.priceRowVal}>{formatINR(pricing.insurance_amount)}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceRowLabel}>FASTag & Registration</Text>
                          <Text style={styles.priceRowVal}>{formatINR(pricing.fastag_charges)}</Text>
                        </View>
                        <View style={[styles.priceRow, styles.discountPriceRow]}>
                          <Text style={styles.discountRowLabel}>Total Showroom Discounts</Text>
                          <Text style={styles.discountRowVal}>- {formatINR(pricing.total_discounts)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.netPriceRow}>
                          <Text style={styles.netPriceLabel}>Final On-Road Price</Text>
                          <Text style={styles.netPriceVal}>{formatINR(pricing.final_on_road_price)}</Text>
                        </View>
                      </View>

                      <Text style={styles.deliveryTimelineText}>
                        Handover: Ready in {q.delivery_timeline_days} days • Direct showroom invoice
                      </Text>

                      {q.dealership_terms && (
                        <Text style={styles.termsText}>Terms: {q.dealership_terms}</Text>
                      )}

                      {/* Accept/Reject Buttons */}
                      {!isAccepted && !isRejected && (
                        <View style={styles.quoteActionsRow}>
                          <TouchableOpacity
                            style={styles.rejectQuoteBtn}
                            onPress={() => handleRejectQuotation(q.id)}
                          >
                            <Text style={styles.rejectQuoteText}>Decline</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.acceptQuoteBtn}
                            onPress={() => handleAcceptQuotation(q.id, q.dealer_name)}
                          >
                            <Text style={styles.acceptQuoteText}>Accept Quotation</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </Card>
                  );
                })
              )}
            </View>
          )}

          {/* ===================================================================
              TAB 4: MY ENQUIRIES
              =================================================================== */}
          {activeTab === "ENQUIRIES" && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionHeading}>Submitted Enquiries & Leads</Text>
              {enquiries.length === 0 ? (
                <EmptyState
                  icon="📝"
                  title="No Enquiries Submitted"
                  description="Enquiries submitted from vehicle cards or dealer profiles will be tracked here."
                />
              ) : (
                enquiries.map((enq) => (
                  <Card key={enq.id} style={styles.cardItem}>
                    <View style={styles.cardItemHeader}>
                      <Badge label={enq.brand_name} variant="secondary" size="sm" />
                      <Badge label={enq.status} variant="velocity" size="sm" />
                    </View>
                    <Text style={styles.cardItemTitle}>
                      {enq.model_name} {enq.variant_name || ""}
                    </Text>
                    <Text style={styles.cardItemSub}>
                      Assigned Showroom: {enq.dealership_name || "Regional OEM Center"}
                    </Text>
                    <View style={styles.enquiryDetailsGrid}>
                      <View style={styles.enqDetail}>
                        <Text style={styles.enqLabel}>Timeline</Text>
                        <Text style={styles.enqVal}>{enq.purchase_timeline}</Text>
                      </View>
                      <View style={styles.enqDetail}>
                        <Text style={styles.enqLabel}>Financing</Text>
                        <Text style={styles.enqVal}>{enq.financing_preference}</Text>
                      </View>
                      <View style={styles.enqDetail}>
                        <Text style={styles.enqLabel}>Submitted</Text>
                        <Text style={styles.enqVal}>{formatDate(enq.created_at)}</Text>
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ===================================================================
              TAB 5: SAVED VEHICLES & COMPARISONS
              =================================================================== */}
          {activeTab === "SAVED" && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionHeading}>Saved Vehicles Bookmarks</Text>
              {savedVehicles.length === 0 ? (
                <Text style={styles.emptyNote}>No vehicles saved yet.</Text>
              ) : (
                savedVehicles.map((sv) => (
                  <Card key={sv.id} style={styles.savedCarCard}>
                    <View style={styles.savedCarRow}>
                      <View style={styles.savedCarInfo}>
                        <Badge label={sv.brand_name} variant="secondary" size="sm" />
                        <Text style={styles.savedCarTitle}>{sv.model_name}</Text>
                        <Text style={styles.savedCarPrice}>
                          From {formatINR(sv.starting_price || 950000, { compact: true })}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeSavedBtn}
                        onPress={() => handleRemoveSavedVehicle(sv.id)}
                      >
                        <Text style={styles.removeSavedText}>✕ Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
              )}

              <Text style={[styles.sectionHeading, { marginTop: 18 }]}>
                Saved Comparison Sets
              </Text>
              {savedComparisons.length === 0 ? (
                <Text style={styles.emptyNote}>No comparison sets saved.</Text>
              ) : (
                savedComparisons.map((sc) => (
                  <Card key={sc.id} style={styles.savedCompCard}>
                    <View style={styles.cardItemHeader}>
                      <Text style={styles.savedCompTitle}>{sc.title}</Text>
                      <TouchableOpacity onPress={() => handleDeleteComparison(sc.id)}>
                        <Text style={styles.removeSavedText}>✕ Delete</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.savedCompModels}>
                      Vehicles: {sc.models?.map((m) => `${m.brand_name || ""} ${m.name}`).join(" vs ") || "Compared Models"}
                    </Text>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ===================================================================
              TAB 6: SHOWROOM APPOINTMENTS
              =================================================================== */}
          {activeTab === "APPOINTMENTS" && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionHeading}>Showroom Visits & Test Drives</Text>
              {appointments.length === 0 ? (
                <EmptyState
                  icon="🗓️"
                  title="No Appointments Scheduled"
                  description="Confirmed showroom visits and home test drive appointments will appear here."
                />
              ) : (
                appointments.map((apt) => (
                  <Card key={apt.id} style={styles.cardItem}>
                    <View style={styles.cardItemHeader}>
                      <Badge label={apt.appointment_type} variant="velocity" size="sm" />
                      <Badge label={apt.status} variant="emerald" size="sm" />
                    </View>
                    <Text style={styles.cardItemTitle}>{apt.model_name}</Text>
                    <Text style={styles.cardItemSub}>
                      Showroom: {apt.dealership_name} ({apt.branch_name})
                    </Text>
                    <View style={styles.appointmentTimeBox}>
                      <Text style={styles.aptDate}>Date: {apt.appointment_date}</Text>
                      <Text style={styles.aptSlot}>Time: {apt.time_slot}</Text>
                      {apt.consultant_name && (
                        <Text style={styles.aptConsultant}>Consultant: {apt.consultant_name}</Text>
                      )}
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* ===================================================================
              TAB 7: SETTINGS & SECURITY
              =================================================================== */}
          {activeTab === "SETTINGS" && (
            <View style={styles.tabSection}>
              <Text style={styles.sectionHeading}>Notification Preferences</Text>
              {notificationPreferences && (
                <Card style={styles.settingsCard}>
                  <View style={styles.prefRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prefTitle}>Quotation Alerts</Text>
                      <Text style={styles.prefSubtitle}>Instant notification when a dealer bids</Text>
                    </View>
                    <Switch
                      value={notificationPreferences.quotation_alerts}
                      onValueChange={() => handleTogglePreference("quotation_alerts")}
                      trackColor={{ false: "#CBD5E1", true: "#3B82F6" }}
                    />
                  </View>

                  <View style={styles.prefRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prefTitle}>Buyer Group Milestones</Text>
                      <Text style={styles.prefSubtitle}>Updates when clusters reach threshold</Text>
                    </View>
                    <Switch
                      value={notificationPreferences.group_milestones}
                      onValueChange={() => handleTogglePreference("group_milestones")}
                      trackColor={{ false: "#CBD5E1", true: "#3B82F6" }}
                    />
                  </View>

                  <View style={styles.prefRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prefTitle}>WhatsApp Updates</Text>
                      <Text style={styles.prefSubtitle}>Direct WhatsApp messages for quotations</Text>
                    </View>
                    <Switch
                      value={notificationPreferences.whatsapp_updates}
                      onValueChange={() => handleTogglePreference("whatsapp_updates")}
                      trackColor={{ false: "#CBD5E1", true: "#3B82F6" }}
                    />
                  </View>

                  <View style={styles.prefRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prefTitle}>Promotional Offers</Text>
                      <Text style={styles.prefSubtitle}>Seasonal dealer flash campaigns</Text>
                    </View>
                    <Switch
                      value={notificationPreferences.promotional_offers}
                      onValueChange={() => handleTogglePreference("promotional_offers")}
                      trackColor={{ false: "#CBD5E1", true: "#3B82F6" }}
                    />
                  </View>
                </Card>
              )}

              {/* Change Password */}
              <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Change Password</Text>
              <Card style={styles.settingsCard}>
                {pwdMessage ? (
                  <Text style={styles.pwdFeedback}>{pwdMessage}</Text>
                ) : null}
                <Input
                  label="Current Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                />
                <Input
                  label="New Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={newPwd}
                  onChangeText={setNewPwd}
                />
                <Input
                  label="Confirm New Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                />
                <Button
                  title="Update Password"
                  onPress={handleChangePasswordSubmit}
                  variant="velocity"
                  size="sm"
                  style={{ marginTop: 6 }}
                />
              </Card>

              {/* Active Sessions */}
              <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Active Device Sessions</Text>
              <Card style={styles.settingsCard}>
                {sessions.map((s) => (
                  <View key={s.session_id} style={styles.sessionItem}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.sessionTitleRow}>
                        <Text style={styles.sessionDevice}>{s.device}</Text>
                        {s.is_current && (
                          <Badge label="Current Device" variant="emerald" size="sm" />
                        )}
                      </View>
                      <Text style={styles.sessionMeta}>
                        IP: {s.ip_address} • {s.location} • {s.last_active}
                      </Text>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.revokeSessionsBtn}
                  onPress={handleRevokeOtherSessions}
                >
                  <Text style={styles.revokeSessionsText}>
                    Revoke All Other Device Sessions
                  </Text>
                </TouchableOpacity>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={isEditProfileOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsEditProfileOpen(false)}
        >
          <View style={styles.modalRoot}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Customer Profile</Text>
              <TouchableOpacity onPress={() => setIsEditProfileOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.nameRow}>
                <Input
                  label="First Name"
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  containerStyle={{ flex: 1 }}
                />
                <Input
                  label="Last Name"
                  value={editLastName}
                  onChangeText={setEditLastName}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <Input
                label="Phone Number"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <Input
                label="City / Jurisdiction"
                value={editCity}
                onChangeText={setEditCity}
              />

              <Input
                label="Registered Address"
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Residential or delivery address"
              />

              <View style={styles.contactMethodBox}>
                <Text style={styles.fieldLabel}>Preferred Contact Method</Text>
                <View style={styles.contactChipsRow}>
                  {["PHONE", "WHATSAPP", "EMAIL"].map((method) => {
                    const isSel = editContactMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        style={[styles.contactChip, isSel && styles.contactChipActive]}
                        onPress={() => setEditContactMethod(method)}
                      >
                        <Text style={[styles.contactChipText, isSel && styles.contactChipTextActive]}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Button
                title="Save Changes"
                onPress={handleSaveProfile}
                isLoading={actionLoading}
                variant="velocity"
                size="md"
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </Modal>

        {/* Verification Modal */}
        <Modal
          visible={!!verifyModalChannel}
          transparent
          animationType="fade"
          onRequestClose={() => setVerifyModalChannel(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.verifySheet}>
              <Text style={styles.verifyTitle}>Verify {verifyModalChannel}</Text>
              <Text style={styles.verifySub}>
                A 6-digit confirmation code has been sent to {verifyDestination}.
              </Text>

              <Input
                label="Verification Code"
                placeholder="123456"
                keyboardType="number-pad"
                value={verificationCode}
                onChangeText={setVerificationCode}
              />

              <View style={styles.verifyActions}>
                <Button
                  title="Confirm Code"
                  onPress={handleConfirmVerification}
                  variant="emerald"
                  size="md"
                />
                <Button
                  title="Cancel"
                  onPress={() => setVerifyModalChannel(null)}
                  variant="outline"
                  size="md"
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Confirmation Dialog for Sign Out */}
        <ConfirmationDialog
          visible={showSignOutDialog}
          title="Sign Out"
          message="Are you sure you want to sign out of your GROUPDRIVE account?"
          confirmLabel="Sign Out"
          variant="danger"
          onConfirm={() => {
            setShowSignOutDialog(false);
            logout();
          }}
          onCancel={() => setShowSignOutDialog(false)}
        />
      </View>
    );
  }

  // =========================================================================
  // UNAUTHENTICATED AUTH EXPERIENCE (LOGIN / REGISTER / RECOVERY)
  // =========================================================================
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.authScrollContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.authCard}>
        <View style={styles.authHeader}>
          <Badge label="GROUPDRIVE Customer Portal" variant="velocity" />
          <Text style={styles.authTitle}>
            {authMode === "LOGIN"
              ? "Welcome Back"
              : authMode === "REGISTER"
              ? "Create Buyer Account"
              : authMode === "FORGOT_PASSWORD"
              ? "Recover Password"
              : "Set New Password"}
          </Text>
          <Text style={styles.authSubtitle}>
            {authMode === "LOGIN"
              ? "Sign in to manage your saved vehicles, buyer groups, and dealer quotations."
              : authMode === "REGISTER"
              ? "Join as a verified retail car buyer to unlock institutional group discounts."
              : "Enter your registered email to receive secure recovery instructions."}
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {successNotice ? (
          <View style={styles.successNoticeBox}>
            <Text style={styles.successNoticeText}>✓ {successNotice}</Text>
          </View>
        ) : null}

        {/* Quick Demo Credentials Fill Button */}
        {authMode === "LOGIN" && (
          <TouchableOpacity style={styles.demoFillBtn} onPress={handleQuickDemo}>
            <Text style={styles.demoFillText}>
              ⚡ Tap to Fill Demo Buyer Credentials
            </Text>
          </TouchableOpacity>
        )}

        {/* Registration Fields */}
        {authMode === "REGISTER" && (
          <View style={styles.rowFields}>
            <Input
              label="First Name *"
              placeholder="Rahul"
              value={firstName}
              onChangeText={setFirstName}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Last Name *"
              placeholder="Menon"
              value={lastName}
              onChangeText={setLastName}
              containerStyle={{ flex: 1 }}
            />
          </View>
        )}

        {/* Common Email Field */}
        <Input
          label="Email Address *"
          placeholder="customer@groupdrive.in"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {authMode === "REGISTER" && (
          <Input
            label="Phone Number *"
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        )}

        {authMode === "REGISTER" && (
          <Input
            label="City / Metro Region *"
            placeholder="Bengaluru"
            value={city}
            onChangeText={setCity}
          />
        )}

        {/* Password field for Login & Register */}
        {(authMode === "LOGIN" || authMode === "REGISTER") && (
          <Input
            label="Password *"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        )}

        {/* Reset Password specific fields */}
        {authMode === "RESET_PASSWORD" && (
          <>
            <Input
              label="6-Digit Reset Code *"
              placeholder="123456"
              keyboardType="number-pad"
              value={resetCode}
              onChangeText={setResetCode}
            />
            <Input
              label="New Password *"
              placeholder="••••••••"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </>
        )}

        {/* Submit Button */}
        <Button
          title={
            authMode === "LOGIN"
              ? "Sign In"
              : authMode === "REGISTER"
              ? "Create Account"
              : authMode === "FORGOT_PASSWORD"
              ? "Send Recovery Link"
              : "Update Password"
          }
          onPress={
            authMode === "LOGIN"
              ? handleLogin
              : authMode === "REGISTER"
              ? handleRegister
              : authMode === "FORGOT_PASSWORD"
              ? handleForgotPassword
              : handleResetPassword
          }
          isLoading={actionLoading}
          variant="velocity"
          size="lg"
          style={{ marginTop: 8 }}
        />

        {/* Switch Links */}
        <View style={styles.switchLinksGroup}>
          {authMode === "LOGIN" && (
            <TouchableOpacity
              onPress={() => {
                setAuthMode("FORGOT_PASSWORD");
                setErrorMessage("");
              }}
            >
              <Text style={styles.linkText}>Forgot your password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              setAuthMode(authMode === "REGISTER" ? "LOGIN" : "REGISTER");
              setErrorMessage("");
            }}
          >
            <Text style={styles.switchModeText}>
              {authMode === "REGISTER"
                ? "Already have an account? Sign In"
                : "Don't have an account? Register as Buyer"}
            </Text>
          </TouchableOpacity>

          {(authMode === "FORGOT_PASSWORD" || authMode === "RESET_PASSWORD") && (
            <TouchableOpacity
              onPress={() => {
                setAuthMode("LOGIN");
                setErrorMessage("");
              }}
            >
              <Text style={styles.linkText}>← Back to Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
  },
  // Profile Header Card
  profileHeaderCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2563EB",
  },
  profileHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 11,
    color: "#64748B",
  },
  userLocation: {
    fontSize: 10,
    color: "#94A3B8",
  },
  profileActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  editProfileBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  signOutBtn: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
  },
  signOutBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  // Tabs Strip
  tabsStrip: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabsScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  tabPillActive: {
    backgroundColor: "#0F172A",
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  tabPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Body Content
  dashboardBody: {
    padding: 16,
    paddingBottom: 60,
  },
  tabSection: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statBox: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2563EB",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginTop: 2,
  },
  // Updates Feed
  updatesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
  },
  updatesHeader: {
    gap: 4,
  },
  updatesTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  noUpdatesText: {
    fontSize: 11,
    color: "#64748B",
  },
  updateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  updateBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginTop: 5,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  updateMessage: {
    fontSize: 11,
    color: "#475569",
    marginTop: 1,
  },
  updateTime: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 2,
  },
  // Card Items
  cardItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 6,
  },
  cardItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardItemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardItemSub: {
    fontSize: 11,
    color: "#64748B",
  },
  cardItemLocation: {
    fontSize: 10,
    color: "#94A3B8",
  },
  cardSavingsBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  cardSavingsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
    textTransform: "uppercase",
  },
  cardSavingsVal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#047857",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  // Quotations
  dealerName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  branchName: {
    fontSize: 10,
    color: "#64748B",
  },
  quoteModelName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  quoteQuoteNum: {
    fontSize: 10,
    color: "#94A3B8",
    fontFamily: "monospace",
  },
  pricingTable: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceRowLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  priceRowVal: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  discountPriceRow: {
    paddingVertical: 2,
  },
  discountRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },
  discountRowVal: {
    fontSize: 12,
    fontWeight: "900",
    color: "#047857",
  },
  netPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netPriceLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  netPriceVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2563EB",
  },
  deliveryTimelineText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "600",
  },
  termsText: {
    fontSize: 10,
    color: "#64748B",
    lineHeight: 14,
  },
  quoteActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  rejectQuoteBtn: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  rejectQuoteText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  acceptQuoteBtn: {
    flex: 2,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  acceptQuoteText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  // Enquiries
  enquiryDetailsGrid: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    gap: 8,
    marginTop: 4,
  },
  enqDetail: {
    flex: 1,
  },
  enqLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  enqVal: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 1,
  },
  // Saved Vehicles
  savedCarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 8,
  },
  savedCarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savedCarInfo: {
    gap: 2,
  },
  savedCarTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  savedCarPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  removeSavedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeSavedText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
  },
  emptyNote: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
  },
  savedCompCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  savedCompTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  savedCompModels: {
    fontSize: 11,
    color: "#64748B",
  },
  // Appointments
  appointmentTimeBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    gap: 2,
    marginTop: 4,
  },
  aptDate: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  aptSlot: {
    fontSize: 11,
    color: "#475569",
  },
  aptConsultant: {
    fontSize: 10,
    color: "#64748B",
  },
  // Settings
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 12,
  },
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  prefTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  prefSubtitle: {
    fontSize: 10,
    color: "#64748B",
  },
  pwdFeedback: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  sessionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionDevice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  sessionMeta: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  revokeSessionsBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  revokeSessionsText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "700",
  },
  // Modals
  modalRoot: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtnText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "bold",
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  nameRow: {
    flexDirection: "row",
    gap: 8,
  },
  contactMethodBox: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  contactChipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  contactChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contactChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  contactChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  contactChipTextActive: {
    color: "#2563EB",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  verifySheet: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  verifyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  verifySub: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  verifyActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  // Unauthenticated Auth Screen
  authScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  authCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  authHeader: {
    gap: 4,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  authSubtitle: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "600",
  },
  successNoticeBox: {
    backgroundColor: "#ECFDF5",
    padding: 10,
    borderRadius: 8,
  },
  successNoticeText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "700",
  },
  demoFillBtn: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
  },
  demoFillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E40AF",
  },
  rowFields: {
    flexDirection: "row",
    gap: 8,
  },
  switchLinksGroup: {
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  linkText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
});
