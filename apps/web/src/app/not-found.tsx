import React from "react";
import Link from "next/link";
import { Car, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-4">
        <Car className="w-7 h-7 text-rose-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        The vehicle model, group opportunity or page you are looking for does not exist or has been relocated.
      </p>
      <Link href="/">
        <Button variant="default">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Homepage
        </Button>
      </Link>
    </div>
  );
}

