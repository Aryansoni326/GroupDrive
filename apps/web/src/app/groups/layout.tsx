import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group Buying Marketplace - Collective Car Purchase Power",
  description:
    "Join active collective buyer groups for popular car models in your city. Pool demand with verified buyers to unlock institutional bulk purchase pricing directly from authorized dealerships.",
  alternates: {
    canonical: "/groups",
  },
  openGraph: {
    title: "Group Buying Marketplace | GROUPDRIVE",
    description:
      "Save up to Rs. 85,000 on popular new cars by joining collective buyer pools. Transparent dealer bidding and zero spam.",
    url: "/groups",
  },
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

