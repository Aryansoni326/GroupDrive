import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Dealer Campaigns & Flash Offers",
  description:
    "Explore active promotional campaigns, cash discounts, free accessory bundles, and exchange bonuses directly published by verified OEM authorized dealerships on GROUPDRIVE.",
  alternates: {
    canonical: "/campaigns",
  },
  openGraph: {
    title: "Dealer Campaigns & Offers | GROUPDRIVE",
    description:
      "Exclusive car offers and manufacturer-backed promotions from authorized dealers.",
    url: "/campaigns",
  },
};

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

