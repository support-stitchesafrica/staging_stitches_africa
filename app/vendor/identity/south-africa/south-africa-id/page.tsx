"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { Toaster, toast } from "sonner"
import { verifySouthAfricanID } from "@/vendor-services/youVerifyService"
import { saveIdentityVerification, verifyAndUpdateIdentity } from "@/vendor-services/firebaseService"
import { getCurrentUserId } from "@/lib/globalFunctions"
import { ChevronRightIcon } from "lucide-react"

export default function SouthAfricaIDPage() {
  const router = useRouter()
  const [saidNumber, setSaidNumber] = useState("")
  const [saidError, setSaidError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

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

  const validateFields = (): boolean => {
    if (!saidNumber) {
      setSaidError("This field is required")
      return false
    }
    setSaidError(null)
    return true
  }

  const handleVerify = async () => {
    const navigatedFromRegistration = true
    if (!validateFields()) {
      toast.warning("Please fill in all required fields")
      return
    }

    if (!userId) {
      toast.error("User not logged in")
      return
    }

    try {
      setLoading(true)
      const saData = await verifySouthAfricanID({
        saidNumber,
        isSubjectConsent: true,
      })

      const fullName = `${saData.data?.firstName ?? ""} ${saData.data?.lastName ?? ""}`.trim()
      const idNumber = saidNumber

      await saveIdentityVerification({
        userId,
        fullName,
        idNumber,
        verificationType: "SAID number",
        countryCode: "ZA",
      })

      toast.success("Identity verified successfully!")
      await verifyAndUpdateIdentity(userId)

      if (navigatedFromRegistration) {
        router.push("/company-proof-of-address?fromRegistration=true")
      } else {
        router.push("/tailor-home")
      }
    } catch (error) {
      console.error(error)
      toast.error("SAID verification service is unavailable. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm flex items-center px-4 py-3">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="mr-3"
        >
          <ChevronRightIcon className="w-6 h-6 rotate-180 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          SAID Verification
        </h1>
      </header>

      {/* Body (centered card like NIN) */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
          <p className="text-gray-700 text-base sm:text-lg mb-6 text-center">
            Enter your valid South African ID number to proceed with verification.
          </p>

          {/* Input */}
          <label className="block text-gray-700 font-medium mb-2">
            SAID Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={saidNumber}
            onChange={(e) => setSaidNumber(e.target.value)}
            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition ${
              saidError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-green-500"
            }`}
            placeholder="Enter SAID Number"
          />
          {saidError && <p className="text-red-500 text-sm mt-1">{saidError}</p>}

          {/* Button */}
          <button
            onClick={handleVerify}
            disabled={loading}
            className="mt-6 w-full bg-black hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify Now"}
          </button>
        </div>
      </main>
    </div>
  )
}
