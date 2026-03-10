"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAtlasAuth } from "@/contexts/AtlasAuthContext"
import { AtlasUser, AtlasRole } from "@/lib/atlas/types"
import { Loader2, Shield, AlertCircle } from "lucide-react"
import { getAuth } from "firebase/auth"

interface EditRoleDialogProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    user: AtlasUser | null
    onSuccess: () => void
}

export function EditRoleDialog({ open, onOpenChange, user, onSuccess }: EditRoleDialogProps)
{
    const [loading, setLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState<AtlasRole | "">("")
    const [optimisticRole, setOptimisticRole] = useState<AtlasRole | null>(null)
    const [error, setError] = useState<string | null>(null)

    const { toast } = useToast()
    const { atlasUser } = useAtlasAuth()

    // Initialize selected role when user changes
    useEffect(() =>
    {
        if (user)
        {
            setSelectedRole(user.role)
            setOptimisticRole(null)
        }
    }, [user])

    // Get role display name
    const getRoleDisplayName = (role: AtlasRole): string =>
    {
        const roleMap: Record<AtlasRole, string> = {
            superadmin: "Super Admin",
            founder: "Founder",
            sales_lead: "Sales Lead",
            brand_lead: "Brand Lead",
            logistics_lead: "Logistics Lead",
        }
        return roleMap[role] || role
    }

    // Get role description
    const getRoleDescription = (role: AtlasRole): string =>
    {
        const descriptionMap: Record<AtlasRole, string> = {
            superadmin: "Full access to all dashboards and team management",
            founder: "Access to all dashboards except team management",
            sales_lead: "Access to overview and sales dashboards",
            brand_lead: "Access to overview and traffic dashboards",
            logistics_lead: "Access to overview, traffic, sales, and logistics dashboards",
        }
        return descriptionMap[role] || ""
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault()

        if (!user || !selectedRole)
        {
            return
        }

        if (selectedRole === user.role)
        {
            toast({
                title: "No Changes",
                description: "The selected role is the same as the current role",
            })
            return
        }

        if (!atlasUser)
        {
            setError("Authentication required")
            toast({
                title: "Authentication Error",
                description: "You must be logged in to update user roles",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        setError(null)

        // Store the original role for rollback
        const originalRole = user.role

        // Optimistically update the UI
        setOptimisticRole(selectedRole)

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

            const response = await fetch(`/api/atlas/team/members/${user.uid}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    role: selectedRole,
                }),
            })

            const data = await response.json()

            if (!response.ok)
            {
                // Handle specific error cases
                if (response.status === 403)
                {
                    throw new Error("You don't have permission to update user roles")
                }
                else if (response.status === 404)
                {
                    throw new Error("User not found")
                }
                else if (response.status === 400 && data.error?.includes("last Super Admin"))
                {
                    throw new Error("Cannot change the role of the last Super Admin")
                }
                else
                {
                    throw new Error(data.error || "Failed to update user role")
                }
            }

            toast({
                title: "✅ Role Updated",
                description: `${user.fullName}'s role has been changed to ${getRoleDisplayName(selectedRole)}`,
            })

            // Close dialog and trigger success callback
            onOpenChange(false)
            onSuccess()
        } catch (error)
        {
            console.error("Error updating user role:", error)

            // Revert optimistic update
            setOptimisticRole(null)
            setSelectedRole(originalRole)

            const errorMessage = error instanceof Error ? error.message : "Failed to update user role. Please try again."
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
                    title: "Role Update Failed",
                    description: errorMessage,
                    variant: "destructive",
                })
            }
        } finally
        {
            setLoading(false)
        }
    }

    // Reset form when dialog closes
    const handleOpenChange = (open: boolean) =>
    {
        if (!open)
        {
            setSelectedRole(user?.role || "")
            setOptimisticRole(null)
            setError(null)
        }
        onOpenChange(open)
    }

    if (!user)
    {
        return null
    }

    const displayRole = optimisticRole || user.role
    const hasChanges = selectedRole !== user.role

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit User Role</DialogTitle>
                    <DialogDescription>
                        Change the role and permissions for {user.fullName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Error Display */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-ga-red/10 border border-ga-red/20 rounded-md">
                                <AlertCircle className="size-4 text-ga-red mt-0.5 shrink-0" />
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
                                    <p className="text-sm font-medium text-ga-primary">Updating role...</p>
                                    <p className="text-xs text-ga-secondary mt-0.5">
                                        Applying new permissions
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
                                <span className="text-muted-foreground">Current Role:</span>{" "}
                                <span className="font-medium">{getRoleDisplayName(displayRole)}</span>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="role">
                                <Shield className="inline-block mr-1 size-4" />
                                New Role
                            </Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value) => setSelectedRole(value as AtlasRole)}
                                disabled={loading}
                            >
                                <SelectTrigger id="role" className="w-full">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                    <SelectItem value="founder">Founder</SelectItem>
                                    <SelectItem value="sales_lead">Sales Lead</SelectItem>
                                    <SelectItem value="brand_lead">Brand Lead</SelectItem>
                                    <SelectItem value="logistics_lead">Logistics Lead</SelectItem>
                                </SelectContent>
                            </Select>
                            {selectedRole && (
                                <p className="text-xs text-muted-foreground">
                                    {getRoleDescription(selectedRole as AtlasRole)}
                                </p>
                            )}
                        </div>

                        {/* Warning for Super Admin role changes */}
                        {user.role === "superadmin" && selectedRole !== "superadmin" && (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                                <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                                <div className="text-xs text-yellow-800 dark:text-yellow-200">
                                    <strong>Warning:</strong> Changing this Super Admin's role will remove their team management privileges. Ensure at least one other Super Admin exists.
                                </div>
                            </div>
                        )}
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
                        <Button type="submit" disabled={loading || !hasChanges}>
                            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Update Role
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
