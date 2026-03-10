'use client';

import type React from "react"
import { MarketingAuthProvider } from "@/contexts/MarketingAuthContext"
import SuperAdminDetector from "@/components/marketing/SuperAdminDetector"
import { Toaster } from 'sonner';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <MarketingAuthProvider>
            <SuperAdminDetector>
                <div className="min-h-screen bg-white">
                    <Toaster />
                    {children}
                </div>
            </SuperAdminDetector>
        </MarketingAuthProvider>
    );
}