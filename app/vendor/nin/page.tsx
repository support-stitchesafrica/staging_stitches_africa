"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/firebase";
import
  {
    saveIdentityVerification,
    verifyAndUpdateIdentity,
  } from "@/vendor-services/firebaseService";

export default function NinVerificationScreen()
{
  const router = useRouter();
  const [nin, setNin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () =>
  {
    if (!nin.trim())
    {
      setError("This field is required");
      return false;
    }
    setError(null);
    return true;
  };

  const handleVerify = async () =>
  {
    if (!validate())
    {
      toast.warning("Please fill in all required fields");
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId)
    {
      toast.error("You must be signed in to continue.");
      return;
    }

    try
    {
      setLoading(true);

      await saveIdentityVerification({
        userId,
        idNumber: nin.trim(),
        fullName: "",
        verificationType: "nin",
        countryCode: "NG",
      });

      toast.success("NIN saved successfully!");

      try
      {
        await verifyAndUpdateIdentity(userId);
      } catch (e)
      {
        console.error("verifyAndUpdateIdentity error:", e);
      }

      router.push("/vendor/company-proof-of-address");
    } catch (err: any)
    {
      console.error("NIN save error:", err);
      toast.error(err?.message || "Failed to save NIN. Please try again.");
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">
          NIN Verification
        </h1>
        <p className="text-gray-600 text-center mt-2">
          Enter your National Identification Number to continue.
        </p>

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
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${error
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
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
