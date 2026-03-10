"use client"

import React from "react"
import type { Template } from "@/lib/firebase/collections"

interface TemplateBlock
{
    id: string
    type: string
    content: string
    link?: string
    styles: { [key: string]: string }
    columnCount?: number
    columns?: TemplateBlock[][]
}

interface TemplatePreviewProps
{
    template: Template | null
    content: string
    className?: string
}

export function TemplatePreview({ template, content, className = "" }: TemplatePreviewProps)
{
    // If no template is selected, show placeholder
    if (!template)
    {
        return (
            <div className={`flex items-center justify-center min-h-[400px] bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">No template selected</p>
                    <p className="text-sm mt-1">Choose a template to see the preview</p>
                </div>
            </div>
        )
    }

    // Parse template content to determine if it's block-based or HTML
    const parseTemplateContent = () =>
    {
        try
        {
            if (typeof template.content === "string")
            {
                const parsed = JSON.parse(template.content)
                if (parsed.blocks && Array.isArray(parsed.blocks))
                {
                    return { type: "blocks", data: parsed }
                }
                return { type: "html", data: template.content }
            } else if (template.content && typeof template.content === "object" && "blocks" in template.content)
            {
                return { type: "blocks", data: template.content }
            }
            return { type: "html", data: content || template.content }
        } catch
        {
            return { type: "html", data: content || (typeof template.content === "string" ? template.content : "") }
        }
    }

    const templateData = parseTemplateContent()

    // Render block-based templates
    const renderBlock = (block: TemplateBlock): React.ReactNode =>
    {
        const style = block.styles || {}

        switch (block.type)
        {
            case "heading":
                return (
                    <h2
                        key={block.id}
                        style={{
                            textAlign: style.textAlign as any || "left",
                            fontSize: style.fontSize || "24px",
                            color: style.color || "#000000",
                            fontWeight: style.fontWeight || "700",
                            padding: style.padding || "8px 0",
                            fontFamily: style.fontFamily || "inherit",
                            letterSpacing: style.letterSpacing || "normal",
                            margin: "0",
                            ...style
                        }}
                    >
                        {block.content}
                    </h2>
                )

            case "text":
                return (
                    <p
                        key={block.id}
                        style={{
                            textAlign: style.textAlign as any || "left",
                            fontSize: style.fontSize || "16px",
                            color: style.color || "#333333",
                            fontWeight: style.fontWeight || "400",
                            padding: style.padding || "8px 0",
                            lineHeight: style.lineHeight || "1.6",
                            letterSpacing: style.letterSpacing || "normal",
                            fontStyle: style.fontStyle || "normal",
                            backgroundColor: style.backgroundColor || "transparent",
                            borderRadius: style.borderRadius || "0",
                            margin: "0",
                            ...style
                        }}
                    >
                        {block.content}
                    </p>
                )

            case "image":
                return (
                    <div key={block.id} style={{ padding: style.padding || "0", textAlign: style.textAlign as any || "center" }}>
                        <img
                            src={block.content}
                            alt=""
                            style={{
                                width: style.width || "100%",
                                borderRadius: style.borderRadius || "0",
                                display: "block",
                                margin: "0 auto",
                                maxWidth: "100%",
                                height: "auto",
                                ...style
                            }}
                        />
                    </div>
                )

            case "button":
                return (
                    <div key={block.id} style={{ textAlign: "center", padding: style.padding || "16px 0" }}>
                        <a
                            href={block.link || "#"}
                            style={{
                                backgroundColor: style.backgroundColor || "#000000",
                                color: style.color || "#ffffff",
                                padding: style.padding || "12px 24px",
                                borderRadius: style.borderRadius || "4px",
                                fontSize: style.fontSize || "14px",
                                fontWeight: style.fontWeight || "600",
                                textDecoration: "none",
                                display: "inline-block",
                                border: style.border || "none",
                                textTransform: style.textTransform as any || "none",
                                letterSpacing: style.letterSpacing || "normal",
                                margin: style.margin || "0",
                                ...style
                            }}
                        >
                            {block.content}
                        </a>
                    </div>
                )

            case "divider":
                return (
                    <hr
                        key={block.id}
                        style={{
                            border: "none",
                            borderTop: `1px solid ${style.borderColor || "#E5E7EB"}`,
                            margin: style.padding || "24px 0",
                            ...style
                        }}
                    />
                )

            case "spacer":
                return (
                    <div
                        key={block.id}
                        style={{
                            padding: style.padding || "16px 0",
                            ...style
                        }}
                    />
                )

            case "columns":
                return (
                    <div
                        key={block.id}
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${block.columnCount || block.columns?.length || 2}, 1fr)`,
                            gap: "16px",
                            padding: style.padding || "8px 0",
                            ...style
                        }}
                    >
                        {block.columns?.map((column, colIdx) => (
                            <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {column.map((childBlock) => renderBlock(childBlock))}
                            </div>
                        ))}
                    </div>
                )

            case "social":
                try
                {
                    const socialLinks = JSON.parse(block.content)
                    return (
                        <div key={block.id} style={{ textAlign: style.textAlign as any || "center", padding: style.padding || "16px 0" }}>
                            {socialLinks.map((social: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={social.url}
                                    style={{
                                        display: "inline-block",
                                        margin: "0 8px",
                                        color: style.color || "#666666",
                                        textDecoration: "none",
                                        fontSize: style.fontSize || "14px"
                                    }}
                                >
                                    {social.platform}
                                </a>
                            ))}
                        </div>
                    )
                } catch
                {
                    return null
                }

            default:
                return null
        }
    }

    // Render the preview content
    const renderPreview = () =>
    {
        if (templateData.type === "blocks")
        {
            const { blocks, templateStyles } = templateData.data
            return (
                <div
                    style={{
                        backgroundColor: templateStyles?.backgroundColor || "#ffffff",
                        fontFamily: templateStyles?.fontFamily || "Arial, sans-serif",
                        maxWidth: templateStyles?.maxWidth || "600px",
                        margin: "0 auto",
                        padding: "24px",
                        lineHeight: "1.6"
                    }}
                >
                    {blocks.map((block: TemplateBlock) => renderBlock(block))}
                </div>
            )
        } else
        {
            // For HTML templates, render safely
            const htmlContent = templateData.data || content
            return (
                <div
                    style={{
                        maxWidth: "600px",
                        margin: "0 auto",
                        padding: "24px",
                        fontFamily: "Arial, sans-serif",
                        lineHeight: "1.6"
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            )
        }
    }

    return (
        <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
            {/* Preview header */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">Template Preview</p>
            </div>

            {/* Preview content with email-specific styling */}
            <div
                className="overflow-auto"
                style={{
                    backgroundColor: "#f9f9f9",
                    minHeight: "400px",
                    maxHeight: "600px"
                }}
            >
                <div className="p-4">
                    {renderPreview()}
                </div>
            </div>
        </div>
    )
}