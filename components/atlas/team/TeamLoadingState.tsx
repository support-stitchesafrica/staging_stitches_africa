"use client"

import React from "react"
import { Loader2, Users, UserPlus, Shield } from "lucide-react"

interface TeamLoadingStateProps
{
    message?: string
    variant?: "page" | "dialog" | "inline" | "skeleton"
}

/**
 * Reusable loading state component for team management operations
 */
export function TeamLoadingState({ message, variant = "page" }: TeamLoadingStateProps)
{
    if (variant === "skeleton")
    {
        return (
            <div className="space-y-4 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-ga-surface rounded"></div>
                        <div className="h-4 w-48 bg-ga-surface rounded"></div>
                    </div>
                    <div className="h-10 w-32 bg-ga-surface rounded"></div>
                </div>

                {/* Search Skeleton */}
                <div className="h-12 w-full bg-ga-surface rounded-lg"></div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-ga-surface rounded-lg"></div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-ga-surface rounded-lg"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (variant === "inline")
    {
        return (
            <div className="flex items-center gap-2 text-ga-secondary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{message || "Loading..."}</span>
            </div>
        )
    }

    if (variant === "dialog")
    {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-ga-blue animate-spin mb-3" />
                <p className="text-sm text-ga-secondary">{message || "Processing..."}</p>
            </div>
        )
    }

    // Default: page variant
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="relative">
                <Users className="w-16 h-16 text-ga-surface" />
                <Loader2 className="w-8 h-8 text-ga-blue animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-lg font-medium text-ga-primary">
                    {message || "Loading team members..."}
                </p>
                <p className="text-sm text-ga-secondary">
                    Please wait while we fetch the latest data
                </p>
            </div>
        </div>
    )
}

/**
 * Loading state for specific operations
 */
export function OperationLoadingState({ operation }: { operation: "invite" | "role" | "deactivate" | "reactivate" })
{
    const config = {
        invite: {
            icon: UserPlus,
            message: "Sending invitation...",
            description: "Creating user account and sending email",
        },
        role: {
            icon: Shield,
            message: "Updating role...",
            description: "Applying new permissions",
        },
        deactivate: {
            icon: Users,
            message: "Deactivating user...",
            description: "Revoking access permissions",
        },
        reactivate: {
            icon: Users,
            message: "Reactivating user...",
            description: "Restoring access permissions",
        },
    }

    const { icon: Icon, message, description } = config[operation]

    return (
        <div className="flex items-start gap-3 p-4 bg-ga-blue/5 border border-ga-blue/20 rounded-lg">
            <div className="relative mt-1">
                <Icon className="w-5 h-5 text-ga-blue" />
                <Loader2 className="w-3 h-3 text-ga-blue animate-spin absolute -top-1 -right-1" />
            </div>
            <div>
                <p className="text-sm font-medium text-ga-primary">{message}</p>
                <p className="text-xs text-ga-secondary mt-0.5">{description}</p>
            </div>
        </div>
    )
}
