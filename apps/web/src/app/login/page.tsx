"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomerAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCustomerAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickDemo() {
    setEmail("customer@groupdrive.in");
    setPassword("Password@123");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-xl mx-auto shadow-sm">
            GD
          </div>
          <Badge variant="brand" size="sm">
            GROUPDRIVE Marketplace
          </Badge>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Sign In
          </h2>
          <p className="text-xs text-slate-500">
            Access your joined buyer groups, dealer bids, and delivery allocations.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Quick Demo Credentials Pill */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-900">Demo Customer Account</p>
            <p className="text-[10px] text-blue-700 font-mono">customer@groupdrive.in</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleQuickDemo}
            className="text-[10px] font-bold bg-white text-blue-700 hover:bg-blue-100"
          >
            Auto Fill
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="default"
            size="lg"
            isLoading={isLoading}
            className="w-full font-bold shadow-card"
          >
            Sign In to Account
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 space-y-2">
          <p>
            Don't have an account yet?{" "}
            <Link href="/register" className="text-blue-600 font-bold hover:underline">
              Create an Account
            </Link>
          </p>
          <p className="text-[11px] text-slate-400">
            Dealership partner?{" "}
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 font-semibold hover:underline"
            >
              Log in to DealerOS →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
