"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronRightIcon } from "lucide-react";
import { saveIdentityVerification } from "@/vendor-services/firebaseService";

export default function GhanaInternationalPassportPage()
{
  const [passportNumber, setPassportNumber] = useState("");
  const [passportError, setPassportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () =>
  {
    if (!passportNumber.trim())
    {
      setPassportError("This field is required");
      toast.warning("Please fill in all required fields");
      return;
    }
    setPassportError(null);

    const userId = localStorage.getItem("userId") || localStorage.getItem("tailorUID") || "";
    if (!userId)
    {
      toast.error("User not found. Please log in again.");
      return;
    }

    setLoading(true);
    try
    {
      await saveIdentityVerification({
        userId,
        fullName: "",
        idNumber: passportNumber,
        verificationType: "ghanaian passport",
        countryCode: "GH",
      });

      toast.success("Passport details saved successfully!");
      router.push("/company-proof-of-address?fromRegistration=true");
    } catch (error: any)
    {
      console.error("Save failed:", error);
      toast.error("Something went wrong. Please try again.");
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm flex items-center px-4 py-3">
        <button onClick={() => router.back()} aria-label="Go back" className="mr-3">
          <ChevronRightIcon className="w-6 h-6 rotate-180 text-gray-300" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          International Passport Verification
        </h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
          <p className="text-gray-700 text-base sm:text-lg mb-6 text-center">
            Enter your valid Ghanaian passport number to continue.
          </p>

          <div className="space-y-4">
            <div>
              <Label className="block text-gray-700 font-medium mb-2">
                Valid Passport Number
              </Label>
              <Input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="Enter passport number"
                className={passportError ? "border-red-500" : ""}
              />
              {passportError && (
                <p className="text-red-500 text-sm mt-1">{passportError}</p>
              )}
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
