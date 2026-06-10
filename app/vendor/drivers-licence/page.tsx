"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import
  {
    saveIdentityVerification,
    verifyAndUpdateIdentity,
  } from "@/vendor-services/firebaseService";
import { getCurrentUserId } from "@/lib/globalFunctions";

export default function DriverLicenseScreen()
{
  const [licenseNumber, setLicenseNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() =>
  {
    const id = getCurrentUserId();
    if (id)
    {
      setUserId(id);
    } else if (typeof window !== "undefined")
    {
      const tailorUID = localStorage.getItem("tailorUID");
      setUserId(tailorUID);
    }
  }, []);

  const handleVerifyNow = async () =>
  {
    if (!licenseNumber.trim())
    {
      setError("This field is required");
      toast.error("Please fill in all required fields");
      return;
    }
    setError(null);

    if (!userId)
    {
      toast.error("No logged-in user found.");
      return;
    }

    setLoading(true);
    try
    {
      await saveIdentityVerification({
        userId,
        fullName: "",
        idNumber: licenseNumber,
        countryCode: "NG",
        verificationType: "nigerian driver license",
      });

      await verifyAndUpdateIdentity(userId);

      toast.success("Driver's license saved successfully!");
      router.push("/vendor/company-proof-of-address");
    } catch (err: any)
    {
      console.error("Save error:", err);
      toast.error("Failed to save. Please try again.");
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
          Driver License Verification
        </h1>
        <p className="text-gray-600 text-center mt-2">
          Enter your valid Driver's License Number to continue.
        </p>

        <div className="mt-8">
          <label className="block text-gray-700 font-medium mb-2">
            Driver's License Number
          </label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 ${error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-black"
              }`}
            placeholder="Enter License Number"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

          <button
            onClick={handleVerifyNow}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold mt-6 shadow-md hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
