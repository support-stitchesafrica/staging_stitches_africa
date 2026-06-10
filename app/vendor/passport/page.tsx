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

export default function InternationalPassportScreen()
{
  const router = useRouter();
  const [passportNumber, setPassportNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ passport?: string; lastName?: string }>({});

  useEffect(() =>
  {
    const id = getCurrentUserId();
    if (id)
    {
      setUserId(id);
    } else if (typeof window !== "undefined")
    {
      const tailorUID = localStorage.getItem("tailorUID");
      if (tailorUID)
      {
        setUserId(tailorUID);
      } else
      {
        toast.warning("No userId found");
      }
    }
  }, []);

  const validateFields = () =>
  {
    const newErrors: typeof errors = {};
    if (!passportNumber.trim()) newErrors.passport = "This field is required";
    if (!lastName.trim()) newErrors.lastName = "This field is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async () =>
  {
    if (!validateFields())
    {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!userId)
    {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    try
    {
      setLoading(true);

      await saveIdentityVerification({
        userId,
        fullName: lastName,
        idNumber: passportNumber,
        verificationType: "nigerian passport",
        countryCode: "NG",
      });

      await verifyAndUpdateIdentity(userId);

      toast.success("Passport details saved successfully!");
      router.push("/vendor/company-proof-of-address");
    } catch (error: any)
    {
      console.error("Error saving passport:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
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
          International Passport
        </h1>
        <p className="text-gray-600 text-center mt-2">
          Enter your passport details to continue.
        </p>

        <div className="mt-8">
          <label className="block text-gray-700 font-medium mb-2">
            Valid Passport Number
          </label>
          <input
            type="text"
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.passport
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-black"
              }`}
            placeholder="Enter Passport Number"
          />
          {errors.passport && (
            <p className="text-red-500 text-sm mt-1">{errors.passport}</p>
          )}

          <label className="block text-gray-700 font-medium mt-6 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.lastName
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-black"
              }`}
            placeholder="Enter Last Name"
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}

          <button
            onClick={handleVerify}
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
