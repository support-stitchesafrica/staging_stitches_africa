// app/driver-license/page.tsx
"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { verifyDriversLicense } from "@/vendor-services/youVerifyService"
import { saveIdentityVerification, verifyAndUpdateIdentity } from "@/vendor-services/firebaseService"
import { toast } from "sonner"
import { getCurrentUserId } from "@/lib/globalFunctions"
import { ArrowLeft } from "lucide-react"

export default function DriverLicenseScreen() {
  const [licenseNumber, setLicenseNumber] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()

  const validateFields = () => {
    if (!licenseNumber.trim()) {
      setError("This field is required")
      return false
    }
    setError(null)
    return true
  }

  // ✅ Fix: fallback to localStorage if getCurrentUserId is null
  useEffect(() => {
    const id = getCurrentUserId()
    if (id) {
      setUserId(id)
    } else if (typeof window !== "undefined") {
      const tailorUID = localStorage.getItem("tailorUID")
      setUserId(tailorUID)
      console.log("Fallback userId from localStorage:", tailorUID)
    } else {
      toast.warning("No userId found")
    }
  }, [])

  const verifyIdentity = async () => {
    if (!validateFields()) {
      toast.error("Please fill in all required fields")
      return false
    }

    if (!userId) {
      toast.error("No logged-in user found.")
      return false
    }

    setLoading(true)
    try {
      const response = await verifyDriversLicense({ licenseNumber })

      if (!response?.data) {
        toast.error("Identity verification failed. Please try again.")
        return false
      }

      const fullName = `${response.data.lastName} ${response.data.firstName}`.trim()
      const idNumber = response.data.licenseNumber

      await saveIdentityVerification({
        userId,
        fullName,
        idNumber,
        countryCode: "NG",
        verificationType: "nigerian driver license",
      })

      toast.success("Identity verified successfully!")
      router.push("/vendor/company-proof-of-address")
      return true
    } catch (err) {
      console.error("API Error:", err)
      toast.error("Driver License verification service is unavailable. Please try again.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyNow = async () => {
    const isVerified = await verifyIdentity()

    if (isVerified) {
      if (!userId) {
        toast.error("User ID not found. Please log in again.")
        return
      }

      try {
        await verifyAndUpdateIdentity(userId)
        router.push("/company-proof-of-address?fromRegistration=true")
      } catch (error) {
        console.error("Firebase update failed:", error)
        toast.error("Error updating identity. Please try again.")
      }
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
          Driver License Verification
        </h1>
        <p className="text-gray-600 text-center mt-2">
          Enter your valid Driver’s License Number to continue.
        </p>

        {/* Form */}
        <div className="mt-8">
          <label className="block text-gray-700 font-medium mb-2">
            Driver’s License Number
          </label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 ${
              error
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
            {loading ? "Verifying..." : "Verify Now"}
          </button>
        </div>
      </div>
    </div>
  )
}
