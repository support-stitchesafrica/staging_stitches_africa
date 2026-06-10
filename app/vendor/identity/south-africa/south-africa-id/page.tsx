"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { ChevronRightIcon } from "lucide-react";
import
  {
    saveIdentityVerification,
    verifyAndUpdateIdentity,
  } from "@/vendor-services/firebaseService";
import { getCurrentUserId } from "@/lib/globalFunctions";

export default function SouthAfricaIDPage()
{
  const router = useRouter();
  const [saidNumber, setSaidNumber] = useState("");
  const [saidError, setSaidError] = useState<string | null>(null);
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
      const tailorUID = localStorage.getItem("tailorUID");
      setUserId(tailorUID);
    }
  }, []);

  const handleVerify = async () =>
  {
    if (!saidNumber)
    {
      setSaidError("This field is required");
      toast.warning("Please fill in all required fields");
      return;
    }
    setSaidError(null);

    if (!userId)
    {
      toast.error("User not logged in");
      return;
    }

    try
    {
      setLoading(true);

      await saveIdentityVerification({
        userId,
        fullName: "",
        idNumber: saidNumber,
        verificationType: "SAID number",
        countryCode: "ZA",
      });

      await verifyAndUpdateIdentity(userId);

      toast.success("SAID saved successfully!");
      router.push("/company-proof-of-address?fromRegistration=true");
    } catch (error)
    {
      console.error(error);
      toast.error("Failed to save. Please try again.");
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />

      <header className="bg-white shadow-sm flex items-center px-4 py-3">
        <button onClick={() => router.back()} aria-label="Go back" className="mr-3">
          <ChevronRightIcon className="w-6 h-6 rotate-180 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">SAID Verification</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
          <p className="text-gray-700 text-base sm:text-lg mb-6 text-center">
            Enter your valid South African ID number to continue.
          </p>

          <label className="block text-gray-700 font-medium mb-2">SAID Number</label>
          <input
            type="text"
            inputMode="numeric"
            value={saidNumber}
            onChange={(e) => setSaidNumber(e.target.value)}
            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition ${saidError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-green-500"
              }`}
            placeholder="Enter SAID Number"
          />
          {saidError && <p className="text-red-500 text-sm mt-1">{saidError}</p>}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="mt-6 w-full bg-black hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </main>
    </div>
  );
}
