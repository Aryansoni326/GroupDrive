"use client";

import React, { useState } from "react";
import { X, CheckCircle, Loader2, Calendar, Phone, Mail, User, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { customerApi } from "@groupdrive/api-client";
import { useCustomerAuth } from "@/lib/auth-context";

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  modelName: string;
  variantName?: string;
  dealershipName?: string;
  branchId?: string;
  branchName?: string;
  initialEnquiryType?: "TEST_DRIVE" | "PRICE_QUOTE";
}

export function EnquiryModal({
  isOpen,
  onClose,
  brandName,
  modelName,
  variantName,
  dealershipName,
  branchId,
  branchName,
  initialEnquiryType = "TEST_DRIVE",
}: EnquiryModalProps) {
  const { user } = useCustomerAuth();
  const [customerName, setCustomerName] = useState(user ? `${user.first_name} ${user.last_name}` : "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone_number || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [enquiryType, setEnquiryType] = useState<"TEST_DRIVE" | "PRICE_QUOTE">(initialEnquiryType);

  React.useEffect(() => {
    if (initialEnquiryType) {
      setEnquiryType(initialEnquiryType);
    }
  }, [initialEnquiryType, isOpen]);
  const [timeline, setTimeline] = useState("WITHIN_15_DAYS");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!customerEmail.includes("@") || !customerEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await customerApi.enquiries.submitEnquiry({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        city: "Bengaluru",
        brand_name: brandName,
        model_name: modelName,
        variant_name: variantName,
        preferred_branch_id: branchId,
        enquiry_type: enquiryType,
        purchase_timeline: timeline,
        financing_preference: "LOAN",
        notes: dealershipName
          ? `[Assigned Dealer: ${dealershipName}${branchName ? ` - ${branchName}` : ""}] ${notes}`
          : notes,
      });

      if (res.success) {
        setSuccessResult(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to submit enquiry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleResetAndClose() {
    setSuccessResult(null);
    setErrorMessage("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <Badge variant="rose" className="mb-1 text-[11px]">
              {dealershipName ? `Direct to ${dealershipName}` : "Authorized Dealer Direct"}
            </Badge>
            <h3 id="enquiry-modal-title" className="text-lg font-bold text-slate-900">
              {enquiryType === "TEST_DRIVE" ? "Book Showroom / Doorstep Test Drive" : "Request Official Quotation"}
            </h3>
            <p className="text-xs text-slate-500">
              {brandName} {modelName} {variantName ? `- ${variantName}` : ""}
              {branchName ? ` • ${branchName}` : ""}
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Close enquiry modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {successResult ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Enquiry Confirmed!</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Assigned to <span className="font-semibold text-slate-800">{successResult.dealership_name}</span>. A senior sales consultant will call you within 30 minutes to confirm your schedule.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 inline-block font-mono">
                Booking Reference: {successResult.enquiry_id}
              </div>
              <div className="pt-2">
                <Button onClick={handleResetAndClose} className="w-full">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {errorMessage}
                </div>
              )}

              {/* Enquiry Type Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setEnquiryType("TEST_DRIVE")}
                  className={`py-2 rounded-md transition-all ${
                    enquiryType === "TEST_DRIVE"
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Book Test Drive
                </button>
                <button
                  type="button"
                  onClick={() => setEnquiryType("PRICE_QUOTE")}
                  className={`py-2 rounded-md transition-all ${
                    enquiryType === "PRICE_QUOTE"
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Price Breakdown Quote
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        required
                        type="tel"
                        placeholder="10-digit mobile"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        required
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Planned Purchase Timeline
                  </label>
                  <select
                    aria-label="Planned Purchase Timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="IMMEDIATE">Immediate (Within 7 days)</option>
                    <option value="WITHIN_15_DAYS">Within 15 days</option>
                    <option value="WITHIN_30_DAYS">Within 30 days</option>
                    <option value="EXPLORING_2_3_MONTHS">Exploring for next month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Specific Requirements or Preferred Time
                  </label>
                  <Input
                    placeholder="e.g. Saturday afternoon at Whitefield showroom or home visit"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified dealership direct routing</span>
                </div>
                <span>Zero spam guarantee</span>
              </div>

              <Button
                type="submit"
                variant="default"
                isLoading={isLoading}
                className="w-full h-11 text-sm font-semibold shadow-card"
              >
                {enquiryType === "TEST_DRIVE" ? "Confirm Test Drive Booking" : "Send Official Price Quote"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

