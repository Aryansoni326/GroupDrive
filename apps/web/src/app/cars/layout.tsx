import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore All Cars - Prices, Specs & Group Deals",
  description:
    "Search and filter new vehicles in India across top brands including Maruti Suzuki, Hyundai, and Tata. Compare prices, mileage, transmissions, and view active group buying savings on GROUPDRIVE.",
  alternates: {
    canonical: "/cars",
  },
  openGraph: {
    title: "Explore Cars | GROUPDRIVE Marketplace",
    description:
      "Browse verified new car catalogue with real-world specifications, filter by fuel, transmission, body type, and budget.",
    url: "/cars",
    images: [
      {
        url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&h=630&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "Explore Cars on GROUPDRIVE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore New Cars in India | GROUPDRIVE",
    description:
      "Find your next car with transparent pricing and collective dealer group discounts.",
    images: [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&h=630&fit=crop&q=80",
    ],
  },
};

export default function CarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

