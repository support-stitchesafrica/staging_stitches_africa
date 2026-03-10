"use client"

import React, {  useState , memo } from "react"
import { verifyBvn } from "@/vendor-services/youVerifyService"

export default function BvnVerification() {
  const [bvn, setBvn] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!bvn || bvn.length !== 11) {
      setError("BVN must be 11 digits")
      return
    }

    try {
      setLoading(true)
      const data = await verifyBvn({
        bvn,
        isSubjectConsent: true,
        isLive: true,
      })
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4">BVN Verification</h2>

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          value={bvn}
          onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter BVN"
          maxLength={11}
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify BVN"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}

      {result && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Verification Result</h3>
          <ul className="space-y-1 text-sm">
            <li><strong>First Name:</strong> {result.firstName}</li>
            <li><strong>Last Name:</strong> {result.lastName}</li>
            <li><strong>Date of Birth:</strong> {result.dateOfBirth}</li>
            <li><strong>Phone:</strong> {result.phoneNumber}</li>
            <li><strong>Enrollment Bank:</strong> {result.enrollmentBank}</li>
            <li><strong>Enrollment Branch:</strong> {result.enrollmentBranch}</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default memo(BvnVerification);
