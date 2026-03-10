"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useMarketingAuth } from "@/contexts/MarketingAuthContext"
import { Loader2, Mail, User, Shield } from "lucide-react"

interface AddMemberDialogProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

type MarketingRole = 'super_admin' | 'team_lead' | 'bdm' | 'team_member';

const AUTHORIZED_DOMAINS = ['@stitchesafrica.com', '@stitchesafrica.pro'];

export function AddMemberDialog({ open, onOpenChange, onSuccess }: AddMemberDialogProps)
{
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<MarketingRole | "">("")
    const [errors, setErrors] = useState<{
        fullName?: string
        email?: string
        role?: string
    }>({})

    const { toast } = useToast()
    const { marketingUser, refreshUser } = useMarketingAuth()

    // Validate email domain
    const validateEmail = (email: string): boolean =>
    {
        if (!email)
        {
            return false
        }

        const isValidDomain = AUTHORIZED_DOMAINS.some(domain =>
            email.toLowerCase().endsWith(domain)
        )

        return isValidDomain
    }

    // Validate form
    const validateForm = (): boolean =>
    {
        const newErrors: typeof errors = {}

        if (!fullName.trim())
        {
            newErrors.fullName = "Full name is required"
        }

        if (!email.trim())
        {
            newErrors.email = "Email is required"
        } else if (!validateEmail(email))
        {
            newErrors.email = `Email must end with ${AUTHORIZED_DOMAINS.join(" or ")}`
        }

        if (!role)
        {
            newErrors.role = "Role is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault()

        if (!validateForm())
        {
            toast({
                title: "Validation Error",
                description: "Please fix the errors in the form before submitting",
                variant: "destructive",
            })
            return
        }

        if (!marketingUser)
        {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to invite users",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try
        {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;

            if (!currentUser)
            {
                throw new Error("Authentication required. Please log in again.")
            }

            let idToken = await currentUser.getIdToken()

            let response = await fetch("/api/marketing/invites/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    name: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    role,
                }),
            })

            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                
                response = await fetch("/api/marketing/invites/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        name: fullName.trim(),
                        email: email.trim().toLowerCase(),
                        role,
                    }),
                })
            }

            const data = await response.json()

            if (!response.ok)
            {
                // Handle specific error cases
                if (response.status === 403)
                {
                    throw new Error("You don't have permission to invite users")
                }
                else if (response.status === 409)
                {
                    throw new Error("A user with this email already exists or has a pending invitation")
                }
                else if (response.status === 429)
                {
                    throw new Error("Too many invitations sent. Please try again later.")
                }
                else
                {
                    throw new Error(data.error || "Failed to send invitation")
                }
            }

            // Check if email was sent successfully
            if (data.emailSent) {
                toast({
                    title: "✅ Invitation Sent",
                    description: `An invitation email has been sent to ${email}`,
                })
            } else {
                // Invitation created but email failed
                toast({
                    title: "⚠️ Invitation Created (Email Failed)",
                    description: data.warning || `Invitation created but email failed to send. Please share this link manually: ${data.invitation?.invitationLink || 'Check invitation list'}`,
                    variant: "default",
                    duration: 10000, // Show for 10 seconds
                })
                
                // Log the email error for debugging
                console.warn('Email sending failed:', data.emailError)
            }

            // Reset form
            setFullName("")
            setEmail("")
            setRole("")
            setErrors({})

            // Close dialog and trigger success callback
            onOpenChange(false)
            onSuccess()
        } catch (error)
        {
            console.error("Error sending invitation:", error)

            const errorMessage = error instanceof Error ? error.message : "Failed to send invitation. Please try again."

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
                    title: "Invitation Failed",
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
            setFullName("")
            setEmail("")
            setRole("")
            setErrors({})
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Send an invitation to a new team member to join the Marketing Dashboard. They will receive an email with instructions to set up their account.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                <Loader2 className="w-5 h-5 text-primary animate-spin mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Sending invitation...</p>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        Creating user account and sending email
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Full Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">
                                <User className="inline-block mr-1 size-4" />
                                Full Name
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) =>
                                {
                                    setFullName(e.target.value)
                                    if (errors.fullName)
                                    {
                                        setErrors({ ...errors, fullName: undefined })
                                    }
                                }}
                                disabled={loading}
                                aria-invalid={!!errors.fullName}
                            />
                            {errors.fullName && (
                                <p className="text-sm text-destructive">{errors.fullName}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                <Mail className="inline-block mr-1 size-4" />
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john.doe@stitchesafrica.com"
                                value={email}
                                onChange={(e) =>
                                {
                                    setEmail(e.target.value)
                                    if (errors.email)
                                    {
                                        setErrors({ ...errors, email: undefined })
                                    }
                                }}
                                disabled={loading}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Must be a {AUTHORIZED_DOMAINS.join(" or ")} email address
                            </p>
                        </div>

                        {/* Role Field */}
                        <div className="space-y-2">
                            <Label htmlFor="role">
                                <Shield className="inline-block mr-1 size-4" />
                                Role
                            </Label>
                            <Select
                                value={role}
                                onValueChange={(value) =>
                                {
                                    setRole(value as MarketingRole)
                                    if (errors.role)
                                    {
                                        setErrors({ ...errors, role: undefined })
                                    }
                                }}
                                disabled={loading}
                            >
                                <SelectTrigger id="role" className="w-full" aria-invalid={!!errors.role}>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="team_lead">Team Lead</SelectItem>
                                    <SelectItem value="bdm">BDM (Business Development Manager)</SelectItem>
                                    <SelectItem value="team_member">Team Member</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-sm text-destructive">{errors.role}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {role === "super_admin" && "Full access to all features and user management"}
                                {role === "team_lead" && "Manage team members and view team analytics"}
                                {role === "bdm" && "Manage vendors and teams, view analytics"}
                                {role === "team_member" && "Basic access to assigned vendors"}
                                {!role && "Select a role to see permissions"}
                            </p>
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
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
