import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Account",
  description:
    "Join GROUPDRIVE as a verified buyer to unlock institutional group discounts directly from authorized OEM dealerships.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

