"use client"

import { useRouter } from "next/navigation"

export default function NigerianIdentityScreen() {
  const router = useRouter()

  const verificationMethods = [
    { name: "NIN Verification", route: "/vendor/nin" },
    { name: "Driver Licence Verification", route: "/vendor/drivers-licence" },
    { name: "International Passport Verification", route: "/vendor/passport" },
    { name: "Phone Number Verification", route: "/vendor/phone-number" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-lg bg-gray-50 p-6 rounded-2xl shadow-md">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <span className="mr-1">←</span> Back
        </button>

        {/* Title & Subtitle */}
        <h1 className="text-2xl font-bold text-gray-900">
          Verify Your Identity in Nigeria
        </h1>
        <p className="mt-2 text-gray-600">
          Complete your identity verification using the methods available.
        </p>

        {/* Divider */}
        <div className="my-6 border-t border-gray-300" />

        {/* Section Title */}
        <h2 className="text-lg font-semibold text-gray-800">
          Verification Methods
        </h2>

        {/* List of Methods */}
        <div className="mt-4 space-y-3">
          {verificationMethods.map((method, index) => (
            <div
              key={index}
              onClick={() => router.push(method.route)}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-gray-800">{method.name}</span>
              <span className="text-blue-600">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
