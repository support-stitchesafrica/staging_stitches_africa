"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAtlasAuth } from "@/contexts/AtlasAuthContext"
import { AtlasUser } from "@/lib/atlas/types"
import { Loader2, AlertTriangle, UserX, WifiOff, ShieldAlert } from "lucide-react"
import { getAuth } from "firebase/auth"

interface DeactivateConfirmDialogProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    user: AtlasUser | null
    onSuccess: () => void
}

export function DeactivateConfirmDialog({ open, onOpenChange, user, onSuccess }: DeactivateConfirmDialogProps)
{
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()
    const { atlasUser } = useAtlasAuth()

    // Get role display name
    const getRoleDisplayName = (role: string): string =>
    {
        const roleMap: Record<string, string> = {
            superadmin: "Super Admin",
            founder: "Founder",
            sales_lead: "Sales Lead",
            brand_lead: "Brand Lead",
            logistics_lead: "Logistics Lead",
        }
        return roleMap[role] || role
    }

    // Handle deactivation
    const handleDeactivate = async () =>
    {
        if (!user)
        {
            return
        }

        if (!atlasUser)
        {
            setError("Authentication required")
            toast({
                title: "Authentication Error",
                description: "You must be logged in to deactivate users",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        setError(null)

        try
        {
            // Get the current user's Firebase ID token
            const auth = getAuth()
            const currentUser = auth.currentUser

            if (!currentUser)
            {
                throw new Error("Not authenticated. Please log in again.")
            }

            const idToken = await currentUser.getIdToken()

            const response = await fetch(`/api/atlas/team/members/${user.uid}/deactivate`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
            })

            const data = await response.json()

            if (!response.ok)
            {
                // Handle specific error cases
                if (response.status === 403)
                {
                    throw new Error("You don't have permission to deactivate users")
                }
                else if (response.status === 404)
                {
                    throw new Error("User not found")
                }
                else if (response.status === 400 && data.error?.includes("last Super Admin"))
                {
                    throw new Error("Cannot deactivate the last Super Admin")
                }
                else
                {
                    throw new Error(data.error || "Failed to deactivate user")
                }
            }

            toast({
                title: "✅ User Deactivated",
                description: `${user.fullName} has been deactivated and will no longer have access to Atlas`,
            })

            // Close dialog and trigger success callback
            onOpenChange(false)
            onSuccess()
        } catch (error)
        {
            console.error("Error deactivating user:", error)

            const errorMessage = error instanceof Error ? error.message : "Failed to deactivate user. Please try again."
            setError(errorMessage)

            // Check if it's a network error
            if (error instanceof TypeError && error.message.includes("fetch"))
            {
                toast({
                    title: "Network Error",
                    description: "Unable to connect to the server. Please check your internet connection.",
                    variant: "destructive",
                })
            }
            else
            {
                toast({
                    title: "Deactivation Failed",
                    description: errorMessage,
                    variant: "destructive",
                })
            }
        } finally
        {
            setLoading(false)
        }
    }

    // Reset error when dialog closes
    const handleOpenChange = (open: boolean) =>
    {
        if (!open)
        {
            setError(null)
        }
        onOpenChange(open)
    }

    if (!user)
    {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserX className="size-5 text-destructive" />
                        Deactivate User
                    </DialogTitle>
                    <DialogDescription>
                        This action will revoke {user.fullName}'s access to the Atlas dashboard
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Error Display */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-ga-red/10 border border-ga-red/20 rounded-md">
                            <ShieldAlert className="size-4 text-ga-red mt-0.5 shrink-0" />
                            <div className="text-sm text-ga-red">
                                <strong>Error:</strong> {error}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-start gap-3 p-4 bg-ga-blue/5 border border-ga-blue/20 rounded-lg">
                            <Loader2 className="w-5 h-5 text-ga-blue animate-spin mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-ga-primary">Deactivating user...</p>
                                <p className="text-xs text-ga-secondary mt-0.5">
                                    Revoking access permissions and sending notification
                                </p>
                            </div>
                        </div>
                    )}

                    {/* User Information */}
                    <div className="space-y-2 p-3 bg-muted rounded-md">
                        <div className="text-sm">
                            <span className="text-muted-foreground">User:</span>{" "}
                            <span className="font-medium">{user.fullName}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">Email:</span>{" "}
                            <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">Role:</span>{" "}
                            <span className="font-medium">{getRoleDisplayName(user.role)}</span>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
                        <div className="text-sm text-destructive">
                            <strong>Warning:</strong> Deactivating this user will immediately revoke their access to all Atlas dashboards.
                            If they are currently logged in, they will be redirected to the authentication page on their next navigation.
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="text-sm text-muted-foreground">
                        <p>After deactivation:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                            <li>The user will not be able to access any Atlas dashboards</li>
                            <li>Their account will remain in the system and can be reactivated later</li>
                            <li>A notification email will be sent to the user</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDeactivate}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Deactivate User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
