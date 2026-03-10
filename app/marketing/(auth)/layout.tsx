/**
 * Marketing Dashboard - Authentication Layout
 * Layout for authentication pages (login, register, setup, etc.)
 * This layout provides a clean, centered design without sidebar
 */

'use client';

import type React from "react"
import { Toaster } from 'sonner';
import Image from 'next/image';

export default function MarketingAuthLayout({
    children,
}: {
    children: React.ReactNode
})
{
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Toaster />

           

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-6">
                <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
                    © {new Date().getFullYear()} Stitches Africa. All rights reserved.
                </div>
            </footer>
        </div>
    )
}