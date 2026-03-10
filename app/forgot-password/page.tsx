"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
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

      if (res.ok) {
        toast.success("OTP sent to your email");
        localStorage.setItem("resetEmail", email);
        router.push("/reset-password");
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error("❌ Request failed:", err);
      toast.error("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      {/* ✅ Mobile logo */}
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

          {/* ✅ Go Back Button */}
          <Button
            variant="ghost"
            className="flex items-center gap-2 mb-4 text-gray-600 hover:text-black"
            onClick={() => router.push("/vendor")}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
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
            className="w-full bg-black hover:bg-black"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </div>
      </div>
    </div>
  );
}
