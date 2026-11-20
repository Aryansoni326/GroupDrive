"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Building,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  Clock,
  Car,
  Save,
  AlertCircle,
  AlertTriangle,
  Lock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { dealerApi, ApiClientError } from "../../../lib/api";
import { DealerEntity } from "@groupdrive/types";
import { formatDate } from "@groupdrive/utils";
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

export default function SettingsPage() {
  const { dealer, user, capabilities, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    trade_name: "",
    registered_office_address: "",
    primary_contact_phone: "",
    primary_contact_email: "",
    logo_url: "",
    website_url: "",
    description: "",
    operating_hours: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isOwner = user?.staff_role === "DEALER_OWNER";

  useEffect(() => {
    if (dealer) {
      setFormData({
        trade_name: dealer.trade_name || "",
        registered_office_address: dealer.registered_office_address || "",
        primary_contact_phone: dealer.primary_contact_phone || "",
        primary_contact_email: dealer.primary_contact_email || "",
        logo_url: dealer.logo_url || "",
        website_url: dealer.website_url || "",
        description: dealer.description || "",
        operating_hours: dealer.operating_hours || "09:00 AM - 08:00 PM (Monday - Sunday)",
      });
    }
  }, [dealer]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validation
    if (!formData.trade_name.trim()) {
      setErrorMessage("Customer-facing trade name is required.");
      return;
    }
    if (!formData.primary_contact_phone.trim() || formData.primary_contact_phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit primary contact phone number.");
      return;
    }
    if (!formData.primary_contact_email.trim() || !formData.primary_contact_email.includes("@")) {
      setErrorMessage("Please enter a valid primary contact email address.");
      return;
    }

    // Trigger confirmation modal before sensitive update
    setShowConfirmModal(true);
  };

  const executeSaveProfile = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload: Partial<DealerEntity> = {
        trade_name: formData.trade_name,
        registered_office_address: formData.registered_office_address,
        primary_contact_phone: formData.primary_contact_phone,
        primary_contact_email: formData.primary_contact_email,
        logo_url: formData.logo_url,
        website_url: formData.website_url,
        description: formData.description,
        operating_hours: formData.operating_hours,
      };

      const res = await dealerApi.updateProfile(payload);
      if (res.success) {
        setSuccessMessage("Dealership profile updated successfully in centralized GroupDrive system.");
        await refreshProfile();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update dealership profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Settings className="h-6 w-6 text-slate-700 mr-2" />
            Dealership Profile & Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage legal entity details, showroom branding, authorized franchise associations, and verified credentials
          </p>
        </div>

        <Badge variant="success" className="text-xs font-semibold px-3 py-1 self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
          KYC Status: {dealer?.kyc_status || "VERIFIED"}
        </Badge>
      </div>

      {/* Role Notice if not Dealer Owner */}
      {!isOwner && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-950">
              Read-Only Dealership Profile (Role: {user?.staff_role?.replace(/_/g, " ")})
            </p>
            <p className="text-amber-800 text-xs mt-0.5">
              Only the Dealer Owner (Principal) has authorization to edit corporate credentials, brand styling, and primary contacts.
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center space-x-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-900 flex items-center space-x-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Editable & Brand Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-slate-600" />
                  Dealership Identity & Branding
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Customer-facing trading name, public logo, and corporate web profile
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {/* Trade Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer-Facing Trade Name *
                  </label>
                  <Input
                    name="trade_name"
                    value={formData.trade_name}
                    onChange={handleInputChange}
                    disabled={!isOwner}
                    placeholder="e.g. Kalyani Motors Maruti Suzuki"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Displayed on customer quotations, demand radar bids, and booking vouchers.
                  </p>
                </div>

                {/* Dealer Logo URL & Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Dealership Logo URL
                    </label>
                    <Input
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleInputChange}
                      disabled={!isOwner}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50">
                    <span className="text-xs text-slate-400 font-medium mb-1">Logo Preview</span>
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Dealer Logo Preview"
                        className="h-10 w-24 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80";
                        }}
                      />
                    ) : (
                      <Car className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Primary Contacts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Business Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        name="primary_contact_phone"
                        value={formData.primary_contact_phone}
                        onChange={handleInputChange}
                        disabled={!isOwner}
                        className="pl-8"
                        placeholder="+919845012345"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Business Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        name="primary_contact_email"
                        type="email"
                        value={formData.primary_contact_email}
                        onChange={handleInputChange}
                        disabled={!isOwner}
                        className="pl-8"
                        placeholder="dealer.principal@dealership.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Website & Operating Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Official Website URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        name="website_url"
                        value={formData.website_url}
                        onChange={handleInputChange}
                        disabled={!isOwner}
                        className="pl-8"
                        placeholder="https://www.dealership.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Dealership Operating Hours
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        name="operating_hours"
                        value={formData.operating_hours}
                        onChange={handleInputChange}
                        disabled={!isOwner}
                        className="pl-8"
                        placeholder="09:00 AM - 08:00 PM (Mon - Sun)"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Description */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Profile & Network Overview
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={!isOwner}
                    className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    placeholder="Describe your authorized franchise network, delivery facilities, and service capability..."
                  />
                </div>

                {/* Business Address */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Registered Corporate Business Address
                  </label>
                  <Input
                    name="registered_office_address"
                    value={formData.registered_office_address}
                    onChange={handleInputChange}
                    disabled={!isOwner}
                    placeholder="Registered corporate address"
                  />
                </div>

                {isOwner && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      className="text-xs"
                      isLoading={isSaving}
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Save Dealership Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Protected Legal Entity & Statutory Credentials */}
          <div className="space-y-6">
            {/* Legal Entity Card (Protected) */}
            <Card className="border-slate-300 bg-slate-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center">
                    <Lock className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Statutory Corporate Record
                  </span>
                  <Badge variant="outline" className="text-xs bg-slate-100">
                    Immutable
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Government tax and legal identifiers verified during onboarding
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                <div className="space-y-0.5">
                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Legal Entity Name
                  </p>
                  <p className="font-semibold text-slate-900">
                    {dealer?.legal_entity_name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-400">
                      GSTIN
                    </p>
                    <p className="font-mono font-bold text-slate-800">
                      {dealer?.gstin}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-400">
                      PAN
                    </p>
                    <p className="font-mono font-bold text-slate-800">
                      {dealer?.pan}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Authorized OEM Brand Franchise
                  </p>
                  <p className="font-semibold text-rose-600 mt-0.5 flex items-center">
                    <Car className="h-3.5 w-3.5 mr-1" />
                    {dealer?.oem_brand_franchise}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 mt-2">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>KYC Verification Status: VERIFIED</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Verified on: {formatDate(dealer?.created_at)}. Modification requires GroupDrive compliance review.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Operational Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <a
                  href="/branches"
                  className="flex items-center justify-between p-2 rounded hover:bg-slate-50 border border-slate-100 transition-colors"
                >
                  <span className="font-medium text-slate-800">Manage Branches and Staff</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
                <a
                  href="/inventory"
                  className="flex items-center justify-between p-2 rounded hover:bg-slate-50 border border-slate-100 transition-colors"
                >
                  <span className="font-medium text-slate-800">Showroom Yard Inventory</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Sensitive Changes */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Profile Updates
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  You are about to update core dealership contact and branding records. This information will immediately reflect across customer quotations, regional demand groups, and invoice schedules.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Trade Name:</span> {formData.trade_name}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Contact Phone:</span> {formData.primary_contact_phone}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Contact Email:</span> {formData.primary_contact_email}
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={executeSaveProfile}
              >
                Confirm and Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
