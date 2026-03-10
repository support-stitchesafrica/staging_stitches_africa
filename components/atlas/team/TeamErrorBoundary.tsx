"use client"

import React, { Component, ReactNode, ErrorInfo } from "react"
import { AlertTriangle, RefreshCw, Home, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TeamErrorBoundaryProps
{
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface TeamErrorBoundaryState
{
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

/**
 * Error boundary specifically for Atlas team management components
 * Provides graceful error handling and recovery options
 */
export class TeamErrorBoundary extends Component<TeamErrorBoundaryProps, TeamErrorBoundaryState>
{
    constructor(props: TeamErrorBoundaryProps)
    {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        }
    }

    static getDerivedStateFromError(error: Error): Partial<TeamErrorBoundaryState>
    {
        return {
            hasError: true,
            error,
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo)
    {
        console.error("[Team Error Boundary] Error caught:", error, errorInfo)

        this.setState({
            errorInfo,
        })

        // Call custom error handler if provided
        if (this.props.onError)
        {
            this.props.onError(error, errorInfo)
        }

        // Log to analytics if available
        if (typeof window !== "undefined" && (window as any).gtag)
        {
            (window as any).gtag("event", "exception", {
                description: `Team Management Error: ${error.message}`,
                fatal: false,
            })
        }
    }

    handleRetry = () =>
    {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        })
    }

    handleRefresh = () =>
    {
        if (typeof window !== "undefined")
        {
            window.location.reload()
        }
    }

    handleGoHome = () =>
    {
        if (typeof window !== "undefined")
        {
            window.location.href = "/atlas"
        }
    }

    render()
    {
        if (!this.state.hasError)
        {
            return this.props.children
        }

        // Use custom fallback if provided
        if (this.props.fallback)
        {
            return this.props.fallback
        }

        const { error, errorInfo } = this.state

        return (
            <div className="min-h-[600px] flex items-center justify-center bg-ga-background p-4">
                <div className="max-w-2xl w-full bg-ga-background border border-ga rounded-lg shadow-ga-card">
                    {/* Header */}
                    <div className="bg-ga-red/10 border-b border-ga-red/20 p-6 rounded-t-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-ga-red/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-ga-red" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-ga-primary">
                                    Team Management Error
                                </h1>
                                <p className="text-ga-secondary text-sm">
                                    Something went wrong while managing team members
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Error Message */}
                        <div>
                            <h2 className="text-lg font-semibold text-ga-primary mb-2">
                                What happened?
                            </h2>
                            <p className="text-ga-secondary leading-relaxed">
                                An unexpected error occurred while processing your team management request.
                                This could be due to a network issue, permission problem, or temporary service disruption.
                            </p>
                        </div>

                        {/* Error Details */}
                        {error && (
                            <div className="bg-ga-surface border border-ga rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-ga-primary mb-2">
                                    Error Details:
                                </h3>
                                <p className="text-sm text-ga-red font-mono">
                                    {error.message || "Unknown error"}
                                </p>
                            </div>
                        )}

                        {/* Recovery Suggestions */}
                        <div>
                            <h3 className="text-md font-semibold text-ga-primary mb-3">
                                How to fix this:
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-ga-secondary">
                                    <span className="text-ga-blue font-bold text-sm mt-1">•</span>
                                    <span className="text-sm">
                                        Try the "Retry" button to attempt the operation again
                                    </span>
                                </li>
                                <li className="flex items-start gap-2 text-ga-secondary">
                                    <span className="text-ga-blue font-bold text-sm mt-1">•</span>
                                    <span className="text-sm">
                                        Check your internet connection and try again
                                    </span>
                                </li>
                                <li className="flex items-start gap-2 text-ga-secondary">
                                    <span className="text-ga-blue font-bold text-sm mt-1">•</span>
                                    <span className="text-sm">
                                        Refresh the page to reload all team data
                                    </span>
                                </li>
                                <li className="flex items-start gap-2 text-ga-secondary">
                                    <span className="text-ga-blue font-bold text-sm mt-1">•</span>
                                    <span className="text-sm">
                                        If the problem persists, contact your system administrator
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 pt-4">
                            <Button
                                onClick={this.handleRetry}
                                className="gap-2 bg-ga-blue hover:bg-ga-blue/90 text-white"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </Button>

                            <Button
                                onClick={this.handleRefresh}
                                variant="outline"
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </Button>

                            <Button
                                onClick={this.handleGoHome}
                                variant="outline"
                                className="gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Go to Dashboard
                            </Button>
                        </div>

                        {/* Development Details */}
                        {process.env.NODE_ENV === "development" && errorInfo && (
                            <details className="border-t border-ga pt-4">
                                <summary className="cursor-pointer text-sm font-semibold text-ga-primary mb-2">
                                    Developer Information (Development Only)
                                </summary>
                                <div className="space-y-3 mt-3">
                                    <div>
                                        <h4 className="text-xs font-semibold text-ga-secondary mb-1">
                                            Component Stack:
                                        </h4>
                                        <pre className="bg-ga-surface p-3 rounded text-xs text-ga-secondary overflow-x-auto max-h-40 overflow-y-auto">
                                            {errorInfo.componentStack}
                                        </pre>
                                    </div>
                                    {error?.stack && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-ga-secondary mb-1">
                                                Stack Trace:
                                            </h4>
                                            <pre className="bg-ga-surface p-3 rounded text-xs text-ga-secondary overflow-x-auto max-h-40 overflow-y-auto">
                                                {error.stack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-ga-surface px-6 py-4 rounded-b-lg border-t border-ga">
                        <div className="flex items-center gap-2 text-ga-secondary">
                            <Users className="w-4 h-4" />
                            <p className="text-xs">
                                Atlas Team Management - If you need assistance, contact support@stitchesafrica.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
