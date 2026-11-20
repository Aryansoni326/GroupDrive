import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({
  title = "Failed to load data",
  message,
  onRetry,
}: ErrorCardProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900">{title}</h4>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          {onRetry && (
            <div className="mt-4">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="bg-white border-red-300 text-red-800 hover:bg-red-100"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Retry Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

