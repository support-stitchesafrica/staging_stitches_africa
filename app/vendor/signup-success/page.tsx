"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function SignupSuccessScreen() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center space-y-6">
        {/* Success Image */}
        <div className="flex justify-center">
          <Image
            src="/images/signup-success.jpg" // ✅ Replace with your success illustration
            alt="Signup Success"
            width={200}
            height={200}
            className="object-contain"
          />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-800">
          🎉 You’ve successfully signed up to <span className="text-green-400">Stitches Africa!</span>
        </h1>
        <p className="text-gray-600">
          To get started, you can either continue with your company verification or do it later and go straight to your vendor dashboard.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Button
            className="w-full md:w-1/2 bg-black hover:bg-gray-700 text-white rounded-xl py-3 text-lg font-medium"
            onClick={() => router.push("/vendor/company-verification")}
          >
            Continue Verification
          </Button>
          <Button
            variant="outline"
            className="w-full md:w-1/2 border-gray-600 text-black hover:bg-gray-200 rounded-xl py-3 text-lg font-medium"
            onClick={() => router.push("/vendor/dashboard")}
          >
            Go to Vendor Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
