"use client"

import { useState } from "react";
import { Header } from "@/components/newsletter/dashboard/header"
import { TemplateCard } from "@/components/newsletter/templates/template-card"
import { TemplatePreviewDialog } from "@/components/newsletter/templates/template-preview-dialog"
import { CreateTemplateDialog } from "@/components/newsletter/templates/create-template-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTemplates } from "@/lib/hooks/use-firebase"
import { templateService, type Template } from "@/lib/firebase/collections"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"

export default function TemplatesPage() {
  const { templates, loading, refetch } = useTemplates()
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  const router = useRouter()

  const filteredTemplates = activeTab === "all" ? templates : templates.filter((t) => t.category === activeTab)

  const handleDuplicate = async (template: Template) => {
    try {
      await templateService.create({
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        content: template.content,
        thumbnail: template.thumbnail,
      })
      toast({
        title: "Template duplicated",
        description: "The template has been duplicated successfully.",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (template: Template) => {
    if (!template.id) return
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      await templateService.delete(template.id)
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully.",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (template: Template) => {
    router.push(`/newsletter/templates/${template.id}/edit`)
  }

  return (
    <div>
      <Header
        title="Templates"
        description="Create and manage your email templates for bespoke and ready-to-wear collections."
        action={{
          label: "New Template",
          onClick: () => setCreateDialogOpen(true),
        }}
      />

      <div className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="bespoke">Bespoke</TabsTrigger>
            <TabsTrigger value="ready-to-wear">Ready to Wear</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 sm:mt-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">No templates yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first template to get started with your newsletters.
                  </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>Create Template</Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={setPreviewTemplate}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <TemplatePreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      />

      <CreateTemplateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={refetch} />
    </div>
  )
}
