"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Eye, Copy, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Template } from "@/lib/firebase/collections"

interface TemplateCardProps {
  template: Template
  onPreview: (template: Template) => void
  onDuplicate: (template: Template) => void
  onDelete: (template: Template) => void
  onEdit: (template: Template) => void
}

export function TemplateCard({ template, onPreview, onDuplicate, onDelete, onEdit }: TemplateCardProps) {
  const categoryColors = {
    bespoke: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "ready-to-wear": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    general: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  }

  // 🧠 Try to parse JSON and extract the first image block
  const getThumbnail = () => {
    if (template.thumbnail) return template.thumbnail

    try {
      const parsed = JSON.parse(template.content)
      if (parsed?.blocks?.length) {
        const imageBlock = parsed.blocks.find((b: any) => b.type === "image")
        if (imageBlock) return imageBlock.content
      }
    } catch {
      // ignore JSON parse errors
    }

    // fallback: try to extract first <img> tag from HTML
    const match = template.content.match(/<img[^>]+src="([^">]+)"/)
    return match ? match[1] : null
  }

  const thumbnail = getThumbnail()

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={template.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <p className="text-sm font-medium">No preview</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-full items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => onPreview(template)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onEdit(template)}>
              Edit
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 overflow-hidden">
            <h3 className="truncate font-medium text-foreground">{template.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(template)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3">
          <Badge variant="secondary" className={categoryColors[template.category]}>
            {template.category === "ready-to-wear" ? "Ready to Wear" : template.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
