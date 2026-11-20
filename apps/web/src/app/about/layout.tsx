import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - Revolutionizing Car Buying in India",
  description:
    "Learn about GROUPDRIVE's mission to transform India's automotive retail ecosystem by empowering individual buyers with collective negotiation power and enabling dealerships through DealerOS.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About GROUPDRIVE | Collective Automotive Commerce",
    description:
      "Transforming car buying into a transparent, collective, and cost-effective experience for customers and authorized dealerships.",
    url: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

