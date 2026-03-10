"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/shops/ui/input";
import { Button } from "@/components/shops/ui/Button";
import { Label } from "@/components/shops/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage()
{
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const email = typeof window !== "undefined" ? localStorage.getItem("resetEmail") : "";

  const handleReset = async () =>
  {
    if (!otp || !newPassword || !confirmPassword)
    {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword)
    {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6)
    {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try
    {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok)
      {
        toast.success("Password reset successful");
        localStorage.removeItem("resetEmail");
        router.push("/shops/auth");
      } else
      {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (err)
    {
      console.error(err);
      toast.error("Request failed");
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-4 xs:py-6 sm:py-8 md:py-12 px-3 xs:px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow p-8">
          <Button
            variant="ghost"
            className="flex items-center gap-2 mb-4 text-gray-600 hover:text-black"
            onClick={() => router.push("/shops/forgot-password")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-gray-600">
              Enter the OTP sent to your email and create a new password
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1"
                maxLength={6}
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
                minLength={6}
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
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-9 right-3 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center">
              <span
                className="text-sm text-blue-600 hover:underline"
                onClick={() => router.push("/shops/forgot-password")}
              >
                Didn't receive OTP? Try again
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}