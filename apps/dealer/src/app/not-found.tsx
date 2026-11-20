import Link from "next/link";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
        <HelpCircle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">
        Page Not Found
      </h2>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        The requested dealership page or resource could not be found.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button variant="default" size="sm">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

