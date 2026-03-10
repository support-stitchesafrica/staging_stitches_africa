"use client"

import React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Eye, Code } from "lucide-react"

interface PreviewModeToggleProps
{
    previewMode: boolean
    onToggle: (mode: boolean) => void
    disabled?: boolean
}

export function PreviewModeToggle({ previewMode, onToggle, disabled = false }: PreviewModeToggleProps)
{
    const handleValueChange = (value: string) =>
    {
        if (value === "preview")
        {
            onToggle(true)
        } else if (value === "raw")
        {
            onToggle(false)
        }
    }

    return (
        <ToggleGroup
            type="single"
            value={previewMode ? "preview" : "raw"}
            onValueChange={handleValueChange}
            variant="outline"
            size="sm"
            disabled={disabled}
        >
            <ToggleGroupItem value="preview" disabled={disabled}>
                <Eye className="mr-1.5 h-3 w-3" />
                Preview
            </ToggleGroupItem>
            <ToggleGroupItem value="raw" disabled={disabled}>
                <Code className="mr-1.5 h-3 w-3" />
                Raw HTML
            </ToggleGroupItem>
        </ToggleGroup>
    )
}