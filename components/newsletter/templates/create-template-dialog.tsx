"use client"

import type React from "react"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { templateService } from "@/lib/firebase/collections"
import { useToast } from "@/hooks/use-toast"
import { TemplateLibrary } from "./template-library"
import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateTemplateDialog({ open, onOpenChange, onSuccess }: CreateTemplateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general" as "bespoke" | "ready-to-wear" | "general",
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const defaultContent = ""

      const templateId = await templateService.create({
        ...formData,
        content: defaultContent,
      })

      toast({
        title: "Template created",
        description: "Your template has been created successfully.",
      })

      setFormData({ name: "", description: "", category: "general" })
      onSuccess()
      onOpenChange(false)

      if (templateId) {
        router.push(`/newsletter/templates/${templateId}/edit`)
      }
    } catch (error) {
      console.error("[v0] Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = async (template: any) => {
    setLoading(true)
    try {
      console.log("[v0] Creating template from library:", template.name)

      const generateHTML = (blocks: any[], styles: any) => {
        return blocks
          .map((block) => {
            if (block.type === "heading") return `<h1>${block.content}</h1>`
            if (block.type === "text") return `<p>${block.content}</p>`
            if (block.type === "image") return `<img src="${block.content}" alt="Image" />`
            if (block.type === "button") return `<a href="${block.link || "#"}">${block.content}</a>`
            return ""
          })
          .join("\n")
      }

      const html = generateHTML(template.blocks, {})
      const content = JSON.stringify({
        blocks: template.blocks,
        templateStyles: {
          backgroundColor: "#f5f5f5",
          fontFamily: "Arial, sans-serif",
          primaryColor: "#1a1a1a",
          secondaryColor: "#666666",
          maxWidth: "600px",
        },
        html,
      })

      const templateId = await templateService.create({
        name: template.name,
        description: template.description,
        category: template.category,
        content,
      })

      toast({
        title: "Template added",
        description: "The template has been added to your collection.",
      })

      onSuccess()
      onOpenChange(false)

      if (templateId) {
        router.push(`/newsletter/templates/${templateId}/edit`)
      }
    } catch (error) {
      console.error("[v0] Error adding template:", error)
      toast({
        title: "Error",
        description: "Failed to add template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Create New Template</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 bg-transparent"
              onClick={() => setShowLibrary(true)}
            >
              <Sparkles className="h-4 w-4" />
              Browse Template Library
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or create from scratch</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Spring Collection 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this template"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "bespoke" | "ready-to-wear" | "general") =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bespoke">Bespoke</SelectItem>
                    <SelectItem value="ready-to-wear">Ready to Wear</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TemplateLibrary open={showLibrary} onOpenChange={setShowLibrary} onSelectTemplate={handleSelectTemplate} />
    </>
  )
}
