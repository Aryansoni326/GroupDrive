import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Cars Side-by-Side - Specifications & Pricing",
  description:
    "Compare up to three car models or variants side-by-side on GROUPDRIVE. Analyze engine displacement, horsepower, torque, ARAI mileage, dimensions, boot space, safety equipment, and ex-showroom prices.",
  alternates: {
    canonical: "/compare",
  },
  openGraph: {
    title: "Side-by-Side Car Comparison | GROUPDRIVE",
    description:
      "Detailed technical specification and price comparison tool for new cars in India.",
    url: "/compare",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

