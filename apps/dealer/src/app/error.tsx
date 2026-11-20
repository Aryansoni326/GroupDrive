"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring if configured
    console.error("DealerOS Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">
        Something went wrong in DealerOS
      </h2>
      <p className="mt-1 text-sm text-slate-500 max-w-md">
        {error.message ||
          "An unexpected error occurred while loading this dealership view."}
      </p>
      <div className="mt-6 flex space-x-3">
        <Button onClick={() => reset()} variant="default" size="sm">
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

