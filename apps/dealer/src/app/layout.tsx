import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";

export const metadata: Metadata = {
  title: "DealerOS - Dealership Management Platform | GroupDrive",
  description:
    "Enterprise automotive dealership operating software for authorized dealers. Manage branches, track yard inventory, inspect regional buyer demand, and submit itemized quotations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

