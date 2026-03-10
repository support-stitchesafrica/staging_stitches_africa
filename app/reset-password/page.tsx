"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const email = typeof window !== "undefined" ? localStorage.getItem("resetEmail") : "";

  const handleReset = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password reset successful");
        localStorage.removeItem("resetEmail");
        router.push("/vendor");
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white w-14 h-14 flex items-center justify-center rounded-full shadow">
            <img
              src="/Stitches-Africa-Logo-06.png"
              alt="logo"
              className="w-20 h-20 object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-gray-800">Vendor</span>
        </div>

        <Button
          variant="ghost"
          className="flex items-center gap-2 mb-4 text-gray-600 hover:text-black"
          onClick={() => router.push("/vendor")}
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>

        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="relative">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-9 right-3 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-9 right-3 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Forgot password link */}
          <div className="text-right">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => router.push("/forgot-password")}
            >
              Forgot Password?
            </button>
          </div>

          <Button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-black hover:bg-black/90"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
