"use client"

import { useRouter } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"

export default function KenyaIdentityPage() {
  const router = useRouter()

  const verificationMethodsList = [
    {
      name: "International Passport Verification",
      path: "/vendor/identity/kenya/kenya-international-passport",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
          Verify Your Identity in Kenya
        </h1>
      </header>

      {/* Body (centered) */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
          <p className="text-gray-700 text-base sm:text-lg mb-6 text-center">
            Complete your identity verification using the methods available.
          </p>

          <div className="my-4">
            <hr className="border-gray-300" />
          </div>

          <h2 className="text-gray-900 text-lg sm:text-xl font-semibold mb-4">
            Verification Methods
          </h2>

          <div className="flex flex-col gap-3">
            {verificationMethodsList.map((method) => (
              <button
                key={method.name}
                onClick={() => router.push(method.path)}
                className="flex justify-between items-center w-full p-4 bg-gray-50 rounded-lg shadow hover:bg-gray-100 transition"
              >
                <span className="text-gray-900 font-medium">{method.name}</span>
                <ChevronRightIcon className="w-5 h-5 text-green-600" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
