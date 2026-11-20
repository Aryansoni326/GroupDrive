import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
      <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">Loading marketplace data...</p>
    </div>
  );
}

