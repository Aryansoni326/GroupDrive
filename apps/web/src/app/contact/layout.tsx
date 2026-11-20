import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Concierge Support",
  description:
    "Get in touch with the GROUPDRIVE concierge and customer success teams. Find our headquarters, phone assistance, email channels, and dealership onboarding support.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact GROUPDRIVE | Customer Support & Dealership Partnerships",
    description:
      "Direct support channels for car buyers and authorized dealership partners.",
    url: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

