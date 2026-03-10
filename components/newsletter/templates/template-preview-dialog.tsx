"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Template } from "@/lib/firebase/collections"

interface TemplatePreviewDialogProps {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUseTemplate?: (template: Template) => void
}

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: TemplatePreviewDialogProps) {
  if (!template) return null

  const parseContent = () => {
    try {
      return JSON.parse(template.content)
    } catch {
      return null
    }
  }

  const jsonContent = parseContent()

  // ✅ Recursive renderer for all block types
  const renderBlock = (block: any) => {
    switch (block.type) {
      case "image":
        return (
          <img
            key={block.id}
            src={block.content}
            alt=""
            style={{
              width: "100%",
              borderRadius: block.styles?.borderRadius || "0",
              padding: block.styles?.padding || "0",
              display: "block",
              margin: "0 auto",
            }}
          />
        )

      case "heading":
        return (
          <h2
            key={block.id}
            style={{
              textAlign: block.styles?.textAlign || "left",
              fontSize: block.styles?.fontSize || "24px",
              color: block.styles?.color || "#000",
              fontWeight: block.styles?.fontWeight || "bold",
              padding: block.styles?.padding || "8px 0",
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
              textAlign: block.styles?.textAlign || "left",
              fontSize: block.styles?.fontSize || "16px",
              color: block.styles?.color || "#444",
              padding: block.styles?.padding || "8px 0",
              lineHeight: "1.5",
            }}
          >
            {block.content}
          </p>
        )

      case "button":
        return (
          <div key={block.id} style={{ textAlign: "center", margin: "24px 0" }}>
            <a
              href={block.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: block.styles?.backgroundColor || "#111827",
                color: block.styles?.color || "#ffffff",
                padding: block.styles?.padding || "12px 32px",
                borderRadius: block.styles?.borderRadius || "4px",
                fontSize: block.styles?.fontSize || "16px",
                fontWeight: block.styles?.fontWeight || "600",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {block.content}
            </a>
          </div>
        )

      case "columns":
        return (
          <div
            key={block.id}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${block.columnCount || block.columns?.length || 2}, 1fr)`,
              gap: "16px",
              padding: block.styles?.padding || "8px 0",
            }}
          >
            {block.columns?.map((column: any[], colIdx: number) => (
              <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {column.map((childBlock) => renderBlock(childBlock))}
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="font-serif">{template.name}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="rounded-lg border border-border bg-white p-8 overflow-auto">
            {jsonContent ? (
              <div
                style={{
                  backgroundColor: jsonContent.templateStyles?.backgroundColor || "#f9f9f9",
                  fontFamily: jsonContent.templateStyles?.fontFamily || "Arial, sans-serif",
                  maxWidth: jsonContent.templateStyles?.maxWidth || "600px",
                  margin: "0 auto",
                  padding: "24px",
                }}
              >
                {jsonContent.blocks.map((block: any) => renderBlock(block))}
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: template.content }} />
            )}
          </div>
        </div>

        {onUseTemplate && (
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                onUseTemplate(template)
                onOpenChange(false)
              }}
            >
              Use Template
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
