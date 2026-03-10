'use client';

import type React from "react"
import { AtlasAuthProvider } from "@/contexts/AtlasAuthContext"

export default function AtlasLayout({
    children,
}: {
    children: React.ReactNode
})
{
    return (
        <AtlasAuthProvider>
            {children}
        </AtlasAuthProvider>
    )
}
