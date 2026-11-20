"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCustomerAuth } from "@/lib/auth-context";

const CITIES = [
  { value: "Bengaluru", label: "Bengaluru" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Delhi NCR", label: "Delhi NCR" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Pune", label: "Pune" },
  { value: "Chennai", label: "Chennai" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useCustomerAuth();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [city, setCity] = React.useState("Bengaluru");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        password,
        city,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-xl mx-auto shadow-sm">
            GD
          </div>
          <Badge variant="brand" size="sm">
            GROUPDRIVE Marketplace
          </Badge>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Buyer Account
          </h2>
          <p className="text-xs text-slate-500">
            Pool purchasing power with verified buyers in your city and unlock volume dealership discounts.
          </p>
          <div className="pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <span>Already have an account?</span>
              <Link href="/login" className="text-blue-600 font-bold hover:underline">
                Log In here →
              </Link>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Rahul"
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Menon"
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
          />

          <Input
            label="Mobile Number (for dealer quote OTP)"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91 98765 43210"
            required
          />

          <Select
            label="Metro City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            options={CITIES}
          />

          <Input
            label="Create Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            isLoading={isLoading}
            className="w-full font-bold shadow-card"
          >
            Create Free Account
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
