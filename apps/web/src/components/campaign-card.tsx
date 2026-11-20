"use client";

import * as React from "react";
import { formatDate } from "@groupdrive/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export interface CampaignCardProps {
  id: string;
  dealerName?: string;
  brandName?: string;
  title: string;
  description: string;
  discountType?: "PERCENTAGE" | "FLAT_AMOUNT" | "ACCESSORY_PACK" | string;
  discountValue?: number;
  validUntil: string;
  city?: string;
  onEnquire?: (campaignId: string, title: string) => void;
}

export function CampaignCard({
  id,
  dealerName = "Authorized Dealership",
  brandName = "Authorized Partner",
  title,
  description,
  discountType,
  discountValue = 25000,
  validUntil,
  city = "Bengaluru",
  onEnquire,
}: CampaignCardProps) {
  const getBenefitDisplay = () => {
    if (discountType === "FLAT_AMOUNT" || (discountValue && discountValue > 100)) {
      return `Rs ${discountValue.toLocaleString("en-IN")} Flat Off`;
    }
    if (discountType === "PERCENTAGE" && discountValue) {
      return `${discountValue}% Off Ex-Showroom`;
    }
    return "Complimentary Accessory & Protection Pack";
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-cardHover hover:border-slate-300 transition-all duration-300 p-6 space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {brandName}
            </span>
            <Badge variant="success" size="sm">
              Authorized Partner
            </Badge>
          </div>
          <h4 className="text-sm font-semibold text-slate-800 mt-1">
            {dealerName} ({city})
          </h4>
        </div>
        <Badge variant="secondary" size="sm">
          Limited Time
        </Badge>
      </div>

      {/* Offer Highlight Box */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
        <span className="text-xs font-semibold text-blue-800 block">
          Dealership Offer
        </span>
        <p className="text-xl font-extrabold text-blue-700 tracking-tight mt-0.5">
          {getBenefitDisplay()}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-1.5 flex-grow">
        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Expiry & CTA */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div className="text-[11px] text-slate-500">
          <span>Valid till: </span>
          <span className="font-semibold text-slate-700 font-mono">
            {formatDate(validUntil)}
          </span>
        </div>
        {onEnquire ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => onEnquire(id, title)}
          >
            Claim Offer
          </Button>
        ) : (
          <Button variant="default" size="sm">
            Claim Offer
          </Button>
        )}
      </div>
    </div>
  );
}
