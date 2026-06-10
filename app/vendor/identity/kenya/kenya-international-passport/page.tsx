"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRightIcon } from "lucide-react";
import
  {
    saveIdentityVerification,
    verifyAndUpdateIdentity,
  } from "@/vendor-services/firebaseService";
import { getCurrentUserId } from "@/lib/globalFunctions";

export default function KenyaInternationalPassportPage()
{
  const router = useRouter();
  const [passportNumber, setPassportNumber] = useState("");
  const [passportError, setPassportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() =>
  {
    const id = getCurrentUserId();
    if (id)
    {
      setUserId(id);
    } else if (typeof window !== "undefined")
    {
      const fallbackId = localStorage.getItem("tailorUID");
      setUserId(fallbackId);
    }
  }, []);

  const handleVerify = async () =>
  {
    if (!passportNumber.trim())
    {
      setPassportError("This field is required");
      toast.warning("Please fill in all required fields");
      return;
    }
    setPassportError(null);

    if (!userId)
    {
      toast.error("User not found. Please log in again.");
      return;
    }

    try
    {
      setLoading(true);

      await saveIdentityVerification({
        userId,
        fullName: "",
        idNumber: passportNumber,
        verificationType: "kenyan passport",
        countryCode: "KE",
      });

      await verifyAndUpdateIdentity(userId);

      toast.success("Passport details saved successfully!");
      router.push("/company-proof-of-address?fromRegistration=true");
    } catch (error)
    {
      console.error("Save failed:", error);
      toast.error("Failed to save. Please try again.");
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm flex items-center px-4 py-3">
        <button onClick={() => router.back()} aria-label="Go back" className="mr-3">
          <ChevronRightIcon className="w-6 h-6 rotate-180 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          International Passport Verification
        </h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
          <p className="text-gray-700 text-base sm:text-lg mb-6 text-center">
            mber to continue.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Valid Passport Number
              </label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="Enter passport number"
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none fos:ring-2 transition ${passportError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-500"
                  }`}
              />
              {passportError && (
                <p className="text-red-500 text-sm mt-1">{passportError}</p>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-green-600 ite font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
