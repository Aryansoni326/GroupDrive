"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import {
  Car,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Building,
  UserCheck,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const DEMO_PRESETS = [
  {
    roleLabel: "Dealer Owner (Principal)",
    email: "owner@kalyanimotors.com",
    name: "Vikram Kalyani",
    dealership: "Kalyani Motors",
    tag: "Full Multi-Branch Access",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    roleLabel: "Branch Manager",
    email: "branchmgr@kalyanimotors.com",
    name: "Rajesh Rao",
    dealership: "Kalyani Motors",
    tag: "Whitefield Showroom Only",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    roleLabel: "Sales Manager",
    email: "salesmgr@kalyanimotors.com",
    name: "Arun Kumar",
    dealership: "Kalyani Motors",
    tag: "Quotes & Demand Radar",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    roleLabel: "Sales Executive",
    email: "salesexec@kalyanimotors.com",
    name: "Pooja Sharma",
    dealership: "Kalyani Motors",
    tag: "Read-Only / No Quote Rights",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    roleLabel: "Inventory Manager",
    email: "inventorymgr@kalyanimotors.com",
    name: "Mahesh Gowda",
    dealership: "Kalyani Motors",
    tag: "Hosur Central Yard Stock",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
  },
  {
    roleLabel: "Finance Executive",
    email: "financemgr@kalyanimotors.com",
    name: "Suresh Menon",
    dealership: "Kalyani Motors",
    tag: "Bannerghatta Flagship",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    roleLabel: "Rival Dealership (Tenant Isolation)",
    email: "sunil@advaithhyundai.com",
    name: "Sunil Reddy",
    dealership: "Advaith Hyundai",
    tag: "Separate Dealership Tenant",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const isExpired = searchParams.get("expired") === "true";

  const { login } = useAuth();
  const [email, setEmail] = useState("owner@kalyanimotors.com");
  const [password, setPassword] = useState("Password@123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      router.push(redirectUrl);
    } else {
      setLoginError(result.error || "Invalid email or password. Please verify your credentials.");
    }
  };

  const selectPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("Password@123");
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        {/* Main Website Theme Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-sm">
            GD
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-950">
            GROUP<span className="text-blue-600">DRIVE</span>
          </span>
        </div>

        <div className="mt-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            DealerOS Enterprise Portal
          </span>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Authorized Dealership Management and Demand Intelligence Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl space-y-4">
        {/* Session Expired Banner */}
        {isExpired && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center space-x-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>
              Your session has expired for security reasons. Please enter your password to resume.
            </span>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl sm:px-10 border border-slate-200/90">
          {loginError && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start space-x-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Authentication Failed</p>
                <p className="mt-0.5">{loginError}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Work Email Address
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 text-xs"
                  placeholder="name@dealership.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <span className="text-xs text-slate-400">
                  Default Demo: Password@123
                </span>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 pr-10 text-xs"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full text-sm font-bold py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-card"
                isLoading={isLoading}
              >
                Sign In to Dealership Workspace →
              </Button>
            </div>
          </form>

          {/* Demo Account Quick Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <UserCheck className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                Select Demo Role Account
              </span>
              <span className="text-[11px] text-slate-400">
                Click to load credentials
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_PRESETS.map((p) => {
                const isSelected = email === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => selectPreset(p.email)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 text-xs truncate">
                        {p.name}
                      </p>
                      <span
                        className={`text-xs px-1.5 py-0.2 rounded font-semibold border ${p.badgeColor}`}
                      >
                        {p.roleLabel.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      {p.email}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {p.dealership} - {p.tag}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multi-tenant isolated workspace for authorized dealers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
