"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function GroupsPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/cars?tab=groups");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Redirecting to Group Buying Hub...</p>
      </div>
    </div>
  );
}
