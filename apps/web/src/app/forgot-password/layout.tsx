import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Your Password",
  description:
    "Request a secure password reset link for your GROUPDRIVE customer account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

