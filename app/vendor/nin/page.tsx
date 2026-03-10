"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { auth } from "@/firebase";
import { verifyNin } from "@/vendor-services/youVerifyService";
import {
  saveIdentityVerification,
  verifyAndUpdateIdentity,
} from "@/vendor-services/firebaseService";

type NINData = {
  lastName: string;
  firstName: string;
  middleName?: string | null;
  idNumber: string;
};

type NINResponse = {
  data?: NINData | null;
};

export default function NinVerificationScreen() {
  const router = useRouter();

  const [nin, setNin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!nin.trim()) {
      setError("This field is required");
      return false;
    }
    setError(null);
    return true;
  };

  const handleVerify = async () => {
    if (!validate()) {
      toast.warning("Please fill in all required fields");
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast.error("You must be signed in to continue.");
      return;
    }

    try {
      setLoading(true);

      const result = (await verifyNin({
        nin: nin.trim(),
        isSubjectConsent: true,
        isLive: true,
        premiumNin: true,
      })) as NINResponse;

      if (!result?.data) {
        toast.error("Identity verification failed. Please try again.");
        return;
      }

      const { lastName, firstName, idNumber, middleName } = result.data;
      const fullName = `${lastName ?? ""} ${firstName ?? ""}`.trim();

      await saveIdentityVerification({
        userId,
        idNumber,
        fullName,
        verificationType: "nin",
        countryCode: "NG",
        middleName: middleName ?? undefined,
      });

      toast.success("Identity verified successfully!");

      try {
        await verifyAndUpdateIdentity(userId);
      } catch (e) {
        console.error("verifyAndUpdateIdentity error:", e);
      }

      router.push("/vendor/company-proof-of-address");
    } catch (err: any) {
      console.error("NIN verification error:", err);
      toast.error(
        err?.message ||
          "NIN verification service is unavailable. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      {/* Card Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {/* AppBar */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          NIN Verification
        </h1>
        <p className="text-gray-600 text-center mt-2">
          Enter your National Identification Number to verify your identity.
        </p>

        {/* Form */}
        <div className="mt-8">
          <label className="block text-gray-700 font-medium mb-2">
            Valid NIN
          </label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            type="text"
            value={nin}
            onChange={(e) => setNin(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-black"
            }`}
            placeholder="Enter your NIN"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full mt-6 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loading ? "Verifying..." : "Verify Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
