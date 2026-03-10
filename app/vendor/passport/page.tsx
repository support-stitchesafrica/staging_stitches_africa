"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { verifyPassport } from "@/vendor-services/youVerifyService"
import {
  saveIdentityVerification,
  verifyAndUpdateIdentity,
} from "@/vendor-services/firebaseService"
import { getCurrentUserId } from "@/lib/globalFunctions"

export default function InternationalPassportScreen() {
  const router = useRouter()

  const [passportNumber, setPassportNumber] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [errors, setErrors] = useState<{ passport?: string; lastName?: string }>(
    {}
  )

  // ✅ fallback to localStorage if getCurrentUserId is null
  useEffect(() => {
    const id = getCurrentUserId()
    if (id) {
      setUserId(id)
    } else if (typeof window !== "undefined") {
      const tailorUID = localStorage.getItem("tailorUID")
      if (tailorUID) {
        setUserId(tailorUID)
        console.log("Fallback userId from localStorage:", tailorUID)
      } else {
        toast.warning("No userId found")
      }
    }
  }, [])

  const validateFields = () => {
    const newErrors: typeof errors = {}
    if (!passportNumber.trim()) newErrors.passport = "This field is required"
    if (!lastName.trim()) newErrors.lastName = "This field is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleVerify = async () => {
    if (!validateFields()) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!userId) {
      toast.error("User ID not found. Please log in again.")
      return
    }

    try {
      setLoading(true)

      const result = await verifyPassport({
        passportNumber,
        lastName,
        isLive: true,
        isSubjectConsent: true,
      })

      if (!result) {
        toast.error("Passport verification service is unavailable. Please try again.")
        setLoading(false)
        return
      }

      console.log("Passport verification result:", result)

      const fullName = `${(result as any)?.lastName ?? ""} ${(result as any)?.firstName ?? ""}`.trim()
      const idNumber = (result as any)?.id || passportNumber

      await saveIdentityVerification({
        userId,
        fullName,
        idNumber,
        verificationType: "nigerian passport",
        countryCode: "NG",
      })

      await verifyAndUpdateIdentity(userId)

      toast.success("Identity verified successfully!")
      router.push("/vendor/company-proof-of-address")
    } catch (error: any) {
      console.error("Error verifying passport:", error)
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      {/* Card */}
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
          International Passport Verification
        </h1>
        <p className="text-gray-600 text-center mt-2">
          Enter your passport details to continue.
        </p>

        {/* Form */}
        <div className="mt-8">
          {/* Passport Number */}
          <label className="block text-gray-700 font-medium mb-2">
            Valid Passport Number
          </label>
          <input
            type="text"
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
              errors.passport
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-black"
            }`}
            placeholder="Enter Passport Number"
          />
          {errors.passport && <p className="text-red-500 text-sm mt-1">{errors.passport}</p>}

          {/* Last Name */}
          <label className="block text-gray-700 font-medium mt-6 mb-2">
            Last Name (for comparison)
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
              errors.lastName
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-black"
            }`}
            placeholder="Enter Last Name"
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold mt-6 shadow-md hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loading ? "Verifying..." : "Verify Now"}
          </button>
        </div>
      </div>
    </div>
  )
}
