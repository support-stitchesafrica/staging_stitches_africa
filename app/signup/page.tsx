"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { ReferrerInfoCard } from "@/components/referral/signup/ReferrerInfoCard"

function SignUpForm()
{
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signUp } = useAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    // Referral code state
    const [referralCode, setReferralCode] = useState<string | null>(null)
    const [referrerInfo, setReferrerInfo] = useState<{ name: string; code: string } | null>(null)
    const [validatingCode, setValidatingCode] = useState(false)
    const [codeValid, setCodeValid] = useState<boolean | null>(null)

    // Extract and validate referral code from URL
    useEffect(() =>
    {
        const refCode = searchParams.get('ref')
        if (refCode)
        {
            setReferralCode(refCode.trim().toUpperCase())
            validateReferralCode(refCode.trim().toUpperCase())
        }
    }, [searchParams])

    const validateReferralCode = async (code: string) =>
    {
        setValidatingCode(true)
        try
        {
            const response = await fetch('/api/referral/validate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            })

            const data = await response.json()

            if (data.valid && data.referrer)
            {
                setReferrerInfo(data.referrer)
                setCodeValid(true)
            } else
            {
                setCodeValid(false)
                toast.error('Invalid referral code')
            }
        } catch (error)
        {
            console.error('Error validating referral code:', error)
            setCodeValid(false)
            toast.error('Failed to validate referral code')
        } finally
        {
            setValidatingCode(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword)
        {
            setError("Passwords do not match")
            return
        }

        if (password.length < 6)
        {
            setError("Password must be at least 6 characters")
            return
        }

        setLoading(true)

        try
        {
            // Create the user account
            await signUp(email, password, displayName)

            // If there's a valid referral code, track the sign-up
            if (referralCode && codeValid)
            {
                try
                {
                    const response = await fetch('/api/referral/track-signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            referralCode,
                            refereeData: {
                                userId: email, // Using email as userId for now
                                email: email,
                                name: displayName || email.split('@')[0],
                            },
                        }),
                    })

                    const data = await response.json()

                    if (data.success)
                    {
                        toast.success('Account created! Your referrer has been credited.')
                    } else
                    {
                        console.error('Failed to track referral:', data.error)
                        // Don't fail the sign-up if referral tracking fails
                    }
                } catch (referralError)
                {
                    console.error('Error tracking referral:', referralError)
                    // Don't fail the sign-up if referral tracking fails
                }
            }

            toast.success('Account created successfully!')
            router.push("/newsletter")
        } catch (err: any)
        {
            console.error("Registration error:", err)
            setError(err.message || "Failed to create account. Please try again.")
        } finally
        {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
            <div className="w-full max-w-4xl space-y-6">
                {/* Show referrer info if valid referral code */}
                {referralCode && codeValid && referrerInfo && (
                    <ReferrerInfoCard referrerName={referrerInfo.name} />
                )}

                <Card className="w-full">
                    <CardHeader className="space-y-1">
                        <div className="flex h-16 items-center px-6">
                            <Link
                                href="/"
                                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <div className="flex items-center justify-center rounded-md">
                                    <img
                                        src="/Stitches-Africa-Logo-06.png"
                                        alt="Stitches Africa Logo"
                                        className="h-10 w-auto sm:h-12 md:h-14 lg:h-16 object-contain"
                                    />
                                </div>
                                <span className="font-serif text-lg md:text-xl font-medium text-foreground">
                                    Stitches Africa
                                </span>
                            </Link>
                        </div>
                        <CardTitle className="text-3xl font-serif text-center">Create Account</CardTitle>
                        <CardDescription className="text-center">
                            {referralCode && codeValid
                                ? `Join Stitches Africa with ${referrerInfo?.name}'s referral`
                                : "Sign up to get started"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {referralCode && validatingCode && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>Validating referral code...</AlertDescription>
                                </Alert>
                            )}

                            {referralCode && codeValid === false && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        The referral code is invalid or expired. You can still sign up without it.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {referralCode && codeValid && (
                                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-600 dark:text-green-400">
                                        Referral code applied! You're signing up with {referrerInfo?.name}'s referral.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="displayName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="displayName"
                                        type="text"
                                        placeholder="John Doe"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating account..." : "Create Account"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <div className="text-sm text-center text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign in here
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default function SignUpPage()
{
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <SignUpForm />
        </Suspense>
    )
}
