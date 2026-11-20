import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description: "Manage your saved vehicles, joined group pools, dealer enquiries, quotations, and appointments on GROUPDRIVE.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

