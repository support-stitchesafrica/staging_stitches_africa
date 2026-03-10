"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronRightIcon } from "lucide-react"
import { verifyKenyanPassport } from "@/vendor-services/youVerifyService"
import { saveIdentityVerification, verifyAndUpdateIdentity } from "@/vendor-services/firebaseService"
import { getCurrentUserId } from "@/lib/globalFunctions"

export default function KenyaInternationalPassportPage() {
  const router = useRouter()

  const [passportNumber, setPassportNumber] = useState("")
  const [passportError, setPassportError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // ✅ Load userId safely (fallback to localStorage)
  useEffect(() => {
    const id = getCurrentUserId()
    if (id) {
      setUserId(id)
    } else if (typeof window !== "undefined") {
      const fallbackId = localStorage.getItem("tailorUID")
      setUserId(fallbackId)
      console.log("Fallback userId from localStorage:", fallbackId)
    } else {
      toast.warning("No userId found")
    }
  }, [])

  const validateFields = (): boolean => {
    if (!passportNumber.trim()) {
      setPassportError("This field is required")
      return false
    }
    setPassportError(null)
    return true
  }

  const handleVerify = async () => {
    const navigatedFromRegistration = true

    if (!validateFields()) {
      toast.warning("Please fill in all required fields")
      return
    }

    if (!userId) {
      toast.error("User not found. Please log in again.")
      return
    }

    try {
      setLoading(true)

      const result = await verifyKenyanPassport({
        passportNumber,
        isSubjectConsent: true,
      })

      const firstName = result.data?.firstName
      const lastName = result.data?.lastName
      const idNumber = result.data?.idNumber

      if (!firstName || !lastName || !idNumber) {
        toast.error("Failed to retrieve passport details. Please try again.")
        return
      }

      const fullName = `${lastName} ${firstName}`.trim()

      await saveIdentityVerification({
        userId,
        fullName,
        idNumber,
        verificationType: "kenyan passport",
        countryCode: "KE",
      })

      await verifyAndUpdateIdentity(userId)

      toast.success("Identity verified successfully!")

      if (navigatedFromRegistration) {
        router.push("/company-proof-of-address?fromRegistration=true")
      } else {
        router.push("/tailor-home")
      }
    } catch (error) {
      console.error("Verification failed:", error)
      toast.error("Passport verification service is unavailable. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm flex items-center px-4 py-3">
        <button onClick={() => router.back()} aria-label="Go back" className="mr-3">
          <ChevronRightIcon className="w-6 h-6 rotate-180 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          International Passport Verification
        </h1>
      </header>

      {/* Body - centered like NIN screen */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
          <p className="text-gray-700 text-base sm:text-lg mb-6 text-center">
            Enter your valid Kenyan passport number to proceed with verification.
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
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition ${
                  passportError
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Now"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
