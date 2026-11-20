"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { customerApi } from "@groupdrive/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [resetCode, setResetCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [step, setStep] = React.useState<"request" | "reset" | "success">("request");
  const [isLoading, setIsLoading] = React.useState(false);
  const [notice, setNotice] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setIsLoading(true);

    try {
      const res = await customerApi.auth.forgotPassword({ email });
      setNotice({
        type: "success",
        message:
          res.message ||
          "Password reset instructions and a 6-digit verification code have been dispatched.",
      });
      // For instant testing/demo ease, prefill reset code if provided
      setResetCode("123456");
      setStep("reset");
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err.message || "Unable to request password reset. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);

    if (newPassword !== confirmPassword) {
      setNotice({
        type: "error",
        message: "New passwords do not match. Please verify and retype.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setNotice({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await customerApi.auth.resetPassword({
        email,
        code_or_token: resetCode.trim(),
        new_password: newPassword,
      });
      setNotice({
        type: "success",
        message: res.message || "Password reset successfully. You can now log in.",
      });
      setStep("success");
    } catch (err: any) {
      setNotice({
        type: "error",
        message: err.message || "Failed to reset password. Please check your verification code.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-xl mx-auto shadow-sm">
            GD
          </div>
          <Badge variant="brand" size="sm">
            Security & Identity
          </Badge>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === "success" ? "Password Updated" : "Reset Your Password"}
          </h2>
          <p className="text-xs text-slate-500">
            {step === "request"
              ? "Enter your registered email address to receive a secure verification code."
              : step === "reset"
              ? `Enter the 6-digit verification code sent to ${email} and choose a new password.`
              : "Your password has been securely reset. You can now sign in with your new credentials."}
          </p>
        </div>

        {notice && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium ${
              notice.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {notice.message}
          </div>
        )}

        {step === "request" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <Input
              label="Registered Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@groupdrive.in"
              required
            />

            <Button
              type="submit"
              variant="default"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold shadow-card"
            >
              Send Verification Code
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="6-Digit Verification Code"
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="e.g. 123456"
              required
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
            />

            <Button
              type="submit"
              variant="default"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold shadow-card"
            >
              Update Password
            </Button>

            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-1"
            >
              ← Use a different email address
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-4 pt-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl border border-emerald-200">
              ✓
            </div>
            <Link href="/login" className="block">
              <Button variant="default" size="lg" className="w-full font-bold shadow-card">
                Return to Sign In
              </Button>
            </Link>
          </div>
        )}

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          Remember your credentials?{" "}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

