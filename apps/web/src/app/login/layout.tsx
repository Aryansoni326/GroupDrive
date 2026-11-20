import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Sign In",
  description:
    "Sign in to your GROUPDRIVE customer account to access your saved vehicles, active group pools, and dealer quotations.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

