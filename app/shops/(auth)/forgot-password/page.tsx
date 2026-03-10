"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/shops/ui/input";
import { Button } from "@/components/shops/ui/Button";
import { Label } from "@/components/shops/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage()
{
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () =>
  {
    if (!email)
    {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try
    {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          adminName: email.split("@")[0], // fallback name
        }),
      });

      const data = await res.json();
      console.log("🔍 Forgot Password API Response:", data);

      if (res.ok)
      {
        toast.success("OTP sent to your email");
        localStorage.setItem("resetEmail", email);
        router.push("/shops/reset-password");
      } else
      {
        toast.error(data.error || "Something went wrong");
      }
    } catch (err)
    {
      console.error("❌ Request failed:", err);
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
          {/* Go Back Button */}
          <Button
            variant="ghost"
            className="flex items-center gap-2 mb-4 text-gray-600 hover:text-black"
            onClick={() => router.push("/shops/auth")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Forgot Password</h2>
            <p className="mt-2 text-gray-600">
              Enter your email address and we'll send you an OTP to reset your password
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}