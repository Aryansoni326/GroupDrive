"use client";

import * as React from "react";
import Link from "next/link";
import { customerApi } from "@groupdrive/api-client";
import { DealerCampaign } from "@groupdrive/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaign-card";
import { EnquiryModal } from "@/components/enquiry-modal";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<DealerCampaign[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [enquiryCampaign, setEnquiryCampaign] = React.useState<{ brand: string; model: string } | null>(null);

  React.useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await customerApi.campaigns.listCampaigns();
        if (res.data) setCampaigns(res.data);
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white border-b border-slate-900 py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">
                Authorized OEM Network
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                Verified Dealership Showroom Promotions
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Dealership & Regional Launch Campaigns
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Authorized dealership partners post time-limited exclusive packages for individual and group deliveries with zero broker markups.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading dealership promotions...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">No active promotions right now</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Check back soon for new regional dealership promotions or join an active buyer group.
            </p>
            <Link href="/groups">
              <Button variant="default" size="sm">
                Explore Buyer Groups
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((camp) => (
              <CampaignCard
                key={camp.id}
                id={camp.id}
                dealerName={camp.branch_name || "Authorized Dealership"}
                title={camp.title}
                description={camp.description}
                discountType={camp.campaign_type}
                discountValue={camp.offer_details?.discount_amount || 25000}
                validUntil={camp.valid_until}
                onEnquire={(id, title) => setEnquiryCampaign({ brand: "Authorized Dealership", model: title })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Direct Offer Enquiry Modal */}
      {enquiryCampaign && (
        <EnquiryModal
          isOpen={!!enquiryCampaign}
          onClose={() => setEnquiryCampaign(null)}
          brandName={enquiryCampaign.brand}
          modelName={enquiryCampaign.model}
        />
      )}
    </div>
  );
}
