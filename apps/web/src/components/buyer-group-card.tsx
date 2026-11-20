"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR } from "@groupdrive/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export interface BuyerGroupCardProps {
  id: string;
  title?: string;
  groupCode?: string;
  brandName: string;
  modelName: string;
  variantName?: string;
  city: string;
  currentMembers: number;
  minMembers?: number;
  maxMembers?: number;
  status: "FORMING" | "OPEN_FOR_QUOTES" | "QUOTES_RECEIVED" | "COMPLETED" | string;
  estimatedDiscount?: number;
  closesInDays?: number;
  imageUrl?: string;
  onJoin?: (groupId: string, title: string) => void;
}

export function BuyerGroupCard({
  id,
  title,
  groupCode,
  brandName,
  modelName,
  variantName = "Top Variant",
  city,
  currentMembers = 0,
  minMembers = 5,
  maxMembers = 10,
  status,
  estimatedDiscount = 45000,
  closesInDays = 4,
  imageUrl = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
  onJoin,
}: BuyerGroupCardProps) {
  const displayTitle = title || `${brandName} ${modelName} ${city} Group`;
  const percentFilled = Math.min(Math.round((currentMembers / maxMembers) * 100), 100);
  const minThresholdPercent = Math.round((minMembers / maxMembers) * 100);

  const getStatusBadge = () => {
    switch (status) {
      case "OPEN_FOR_QUOTES":
        return (
          <Badge variant="brand" size="sm" pulseDot>
            Dealers Bidding Now
          </Badge>
        );
      case "QUOTES_RECEIVED":
        return (
          <Badge variant="success" size="sm">
            Best Quote Ready
          </Badge>
        );
      case "FORMING":
      default:
        return (
          <Badge variant="warning" size="sm" pulseDot>
            Forming ({Math.max(0, maxMembers - currentMembers)} spots left)
          </Badge>
        );
    }
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-cardHover hover:border-slate-300 transition-all duration-300 overflow-hidden">
      {/* Top Media Bar */}
      <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
        <img
          src={imageUrl}
          alt={`${brandName} ${modelName}`}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out opacity-90"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Top Floating Tags */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
          <Badge variant="secondary" size="sm" className="bg-slate-900/80 text-white backdrop-blur-md border-slate-700">
            {city}
          </Badge>
          {getStatusBadge()}
        </div>

        {/* Vehicle Headline on image */}
        <div className="absolute bottom-3 inset-x-3 text-white z-10">
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            {brandName}
          </p>
          <h3 className="text-base font-extrabold text-white line-clamp-1">
            {modelName} <span className="text-slate-300 font-normal text-xs">({variantName})</span>
          </h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-grow p-5 space-y-4">
        {/* Estimated Collective Savings Callout */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Estimated Collective Discount
            </span>
            <p className="text-lg font-black text-emerald-700 font-mono tabular-nums">
              Save {formatINR(estimatedDiscount)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-emerald-600 block">
              per member
            </span>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200/60 text-emerald-800">
              Zero Upfront Fee
            </span>
          </div>
        </div>

        {/* Member Capacity Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              Group Capacity ({currentMembers}/{maxMembers} Buyers)
            </span>
            <span className="font-mono text-slate-500 font-semibold">
              {percentFilled}% Filled
            </span>
          </div>
          <Progress
            value={percentFilled}
            threshold={minThresholdPercent}
            variant={status === "OPEN_FOR_QUOTES" ? "brand" : "emerald"}
          />
          <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Min quota: {minMembers} members</span>
            <span>Closes in {closesInDays} days</span>
          </div>
        </div>

        {/* Group Title / Details */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {displayTitle}
        </p>

        {/* Trust Note */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-[11px]">Direct dealer invoice - OEM warranty applies</span>
        </div>

        {/* Actions */}
        <div className="pt-2 grid grid-cols-2 gap-2 mt-auto">
          <Link href={`/groups/${id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              View Group
            </Button>
          </Link>
          {onJoin ? (
            <Button
              variant="success"
              size="sm"
              className="w-full"
              onClick={() => onJoin(id, displayTitle)}
            >
              Join Group
            </Button>
          ) : (
            <Link href={`/groups/${id}`} className="w-full">
              <Button variant="success" size="sm" className="w-full">
                Join Group
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
