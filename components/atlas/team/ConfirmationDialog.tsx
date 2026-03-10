"use client"

import React from "react"
import
    {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
        DialogDescription,
    } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ConfirmationDialogProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void | Promise<void>
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "danger" | "warning" | "info" | "success"
    loading?: boolean
    children?: React.ReactNode
}

/**
 * Reusable confirmation dialog for destructive or important actions
 */
export function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "info",
    loading = false,
    children,
}: ConfirmationDialogProps)
{
    const handleConfirm = async () =>
    {
        await onConfirm()
    }

    const variantConfig = {
        danger: {
            icon: XCircle,
            iconColor: "text-ga-red",
            bgColor: "bg-ga-red/10",
            borderColor: "border-ga-red/20",
            buttonClass: "bg-ga-red hover:bg-ga-red/90 text-white",
        },
        warning: {
            icon: AlertTriangle,
            iconColor: "text-yellow-600",
            bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
            borderColor: "border-yellow-200 dark:border-yellow-900",
            buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
        },
        info: {
            icon: Info,
            iconColor: "text-ga-blue",
            bgColor: "bg-ga-blue/10",
            borderColor: "border-ga-blue/20",
            buttonClass: "bg-ga-blue hover:bg-ga-blue/90 text-white",
        },
        success: {
            icon: CheckCircle,
            iconColor: "text-ga-green",
            bgColor: "bg-ga-green/10",
            borderColor: "border-ga-green/20",
            buttonClass: "bg-ga-green hover:bg-ga-green/90 text-white",
        },
    }

    const config = variantConfig[variant]
    const Icon = config.icon

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className={`size-5 ${config.iconColor}`} />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {children && <div className="py-4">{children}</div>}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className={config.buttonClass}
                    >
                        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
