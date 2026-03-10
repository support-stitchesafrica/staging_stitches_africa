"use client"

import { ChevronRightIcon } from "lucide-react"
import { useRouter } from "next/navigation"

const verificationMethodsList = [
  {
    name: "International Passport Verification",
    route: "/vendor/identity/ghana/ghana-international-passport",
  },
]

export default function GhanaIdentityPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm flex items-center px-4 py-3">
        <button
          className="mr-3"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ChevronRightIcon className="w-6 h-6 rotate-180 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          Verify Your Identity in Ghana
        </h1>
      </header>

      {/* Body (centered card like NIN) */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
          <p className="text-gray-700 text-base sm:text-lg mb-6 text-center">
            Choose a verification method to complete your identity verification.
          </p>

          <h2 className="text-gray-900 text-lg sm:text-xl font-semibold mb-4">
            Verification Methods
          </h2>

          <ul className="space-y-3">
            {verificationMethodsList.map((method) => (
              <li key={method.name}>
                <button
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-100 transition"
                  onClick={() => router.push(method.route)}
                >
                  <span className="text-gray-900 font-medium">{method.name}</span>
                  <ChevronRightIcon className="w-5 h-5 text-green-600" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
