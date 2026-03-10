"use client"

import type React from "react"
import { useEffect } from "react";
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/newsletter/dashboard/sidebar"
import { MobileNav } from "@/components/newsletter/dashboard/mobile-nav"
import { FirebaseSetupBanner } from "@/components/firebase-setup-banner"
import { AuthProvider, useAuth } from "@/lib/auth/auth-context"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, newsletterUser, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log("[v0] No user found, redirecting to login")
        router.push("/login")
      } else if (!newsletterUser?.isNewsuser) {
        console.log("User not authorized, redirecting to login")
        router.push("/login")
      }
    }
  }, [user, newsletterUser, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!user || !newsletterUser?.isNewsuser) {
    return null
  }

  return (
    <div className="flex h-screen  overflow-hidden">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 bg-white overflow-y-auto">
        <div className="p-4 md:p-6 lg:mt-0 mt-10 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}
