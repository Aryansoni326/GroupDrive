import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Joined Groups",
  description:
    "Monitor your active vehicle group buying participation, quoting progress, and dealership proposals.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyGroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

