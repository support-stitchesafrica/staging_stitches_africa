"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { UserCheck, Gift, TrendingUp, Sparkles } from "lucide-react"

interface ReferrerInfoCardProps
{
    referrerName: string
}

export function ReferrerInfoCard({ referrerName }: ReferrerInfoCardProps)
{
    return (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-primary" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                You've been referred by {referrerName}!
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Join Stitches Africa and enjoy exclusive benefits
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                            <div className="flex items-start gap-2">
                                <Gift className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Welcome Bonus</p>
                                    <p className="text-xs text-muted-foreground">Get started with exclusive offers</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Priority Support</p>
                                    <p className="text-xs text-muted-foreground">Fast-track customer service</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">Special Perks</p>
                                    <p className="text-xs text-muted-foreground">Access to member-only deals</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
