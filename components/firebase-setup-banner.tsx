"use client"

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { app, db } from "@/lib/firebase/config"

export function FirebaseSetupBanner() {
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    try {
      // Check if Firebase app and db are properly initialized
      if (!app || !db) {
        setIsConfigured(false)
      }
    } catch (error) {
      console.error("Firebase configuration check failed:", error)
      setIsConfigured(false)
    }
  }, [])

  if (isConfigured) return null

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Firebase Configuration Required</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          Your Firebase instance is not properly initialized. Please verify your Firebase configuration in:
        </p>
        <pre className="bg-black/20 p-2 rounded text-xs overflow-x-auto">
          <code>src/firebase/config.ts</code>
        </pre>

        <p className="text-sm">
          Make sure your Firebase project ID, API key, and storage bucket are correct.
        </p>

        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                "https://console.firebase.google.com/project/stitches-africa/settings/general/",
                "_blank"
              )
            }
          >
            Open Firebase Console
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
