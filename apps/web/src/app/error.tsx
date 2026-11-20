"use client";

import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Web Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        {error.message || "An unexpected error occurred while processing your request. Please try again."}
      </p>
      <Button onClick={reset} variant="default">
        Try Again
      </Button>
    </div>
  );
}

