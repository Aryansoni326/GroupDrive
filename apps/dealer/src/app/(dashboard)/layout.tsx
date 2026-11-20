"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/layout/sidebar";
import { Header } from "../../components/layout/header";
import { useAuth } from "../../lib/auth-context";
import { cn } from "@groupdrive/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state while checking authentication credentials
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            Verifying Dealership Credentials...
          </span>
        </div>
      </div>
    );
  }

  // Prevent flash of protected UI if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-200 ease-in-out",
          isCollapsed ? "lg:pl-16" : "lg:pl-60"
        )}
      >
        <Header onToggleSidebar={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
