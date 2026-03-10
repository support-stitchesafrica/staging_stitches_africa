"use client"

import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"

export default function ChooseCountryPage() {
  const router = useRouter()

  const countries = [
    { name: "Nigeria", flag: "🇳🇬", route: "/vendor/identity/nigeria" },
    { name: "Ghana", flag: "🇬🇭", route: "/vendor/identity/ghana" },
    { name: "South Africa", flag: "🇿🇦", route: "/vendor/identity/south-africa" },
    { name: "Kenya", flag: "🇰🇪", route: "/vendor/identity/kenya" },
  ]

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            VERIFY YOUR IDENTITY
          </h1>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">
            Select your country to see the available identity verification options.
          </p>
        </div>

        <div className="my-6 border-t border-gray-200" />

        <h2 className="text-lg sm:text-xl font-semibold text-center">
          Choose Your Country
        </h2>

        {/* Responsive Grid of Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {countries.map((c) => (
            <div
              key={c.name}
              onClick={() => router.push(c.route)}
              className="cursor-pointer bg-white border border-gray-200 shadow-sm rounded-2xl p-6 flex items-center justify-between hover:shadow-lg hover:border-purple-400 transition-all"
            >
              <span className="flex items-center gap-3 text-lg sm:text-xl font-medium">
                <span className="text-2xl">{c.flag}</span> {c.name}
              </span>
              <ChevronRight className="h-5 w-5 text-purple-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
