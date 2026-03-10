"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"
import { EmailEditor } from "@/components/newsletter/email-builder/email-editor"
import { Button } from "@/components/ui/button"
import { templateService, type Block, type TemplateStyles } from "@/lib/firebase/collections"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [initialBlocks, setInitialBlocks] = useState<Block[] | undefined>()
  const [initialTemplateStyles, setInitialTemplateStyles] = useState<TemplateStyles | undefined>()

  useEffect(() => {
    const loadTemplate = async () => {
      if (!params.id || typeof params.id !== "string") return

      try {
        console.log("[v0] Loading template:", params.id)
        const template = await templateService.getById(params.id)
        if (template) {
          setTemplateName(template.name)

          if (template.content) {
            try {
              const parsed = JSON.parse(template.content)
              console.log("[v0] Parsed template data:", parsed)
              if (parsed.blocks) {
                setInitialBlocks(parsed.blocks)
              }
              if (parsed.templateStyles) {
                setInitialTemplateStyles(parsed.templateStyles)
              }
              setContent(template.content)
            } catch (e) {
              console.log("[v0] Content is not JSON, using as HTML")
              setContent(template.content)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error loading template:", error)
        toast({
          title: "Error",
          description: "Failed to load template.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [params.id, toast])

  const handleSave = async () => {
    if (!params.id || typeof params.id !== "string") return

    setSaving(true)
    try {
      console.log("[v0] Saving template with content length:", content.length)
      await templateService.update(params.id, { content })
      toast({
        title: "Template saved",
        description: "Your changes have been saved successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving template:", error)
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/newsletter/templates">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-lg font-medium">{templateName}</h1>
              <p className="text-sm text-muted-foreground">Email Template Editor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/templates")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <EmailEditor
          content={content}
          onChange={setContent}
          initialBlocks={initialBlocks}
          initialTemplateStyles={initialTemplateStyles}
        />
      </div>
    </div>
  )
}
