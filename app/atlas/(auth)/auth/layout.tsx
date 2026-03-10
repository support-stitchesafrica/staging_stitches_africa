'use client';

import type React from "react"
import { Toaster } from "sonner"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
})
{
    return (
        <div 
            className="min-h-screen bg-white font-sans atlas-dashboard"
            style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
        >
            <Toaster />
            {children}
        </div>
    )
}
