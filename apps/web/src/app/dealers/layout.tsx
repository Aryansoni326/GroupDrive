import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authorized OEM Dealerships Directory",
  description:
    "Locate and connect with verified authorized car dealerships in Bengaluru, Mumbai, Delhi and across India. Explore showroom branches, available inventory, and exclusive dealer promotional campaigns.",
  alternates: {
    canonical: "/dealers",
  },
  openGraph: {
    title: "Authorized Dealership Network | GROUPDRIVE",
    description:
      "Find verified Maruti Suzuki, Hyundai, and Tata Motors authorized dealers. Transparent quotation requests and direct showroom contact.",
    url: "/dealers",
  },
};

export default function DealersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

