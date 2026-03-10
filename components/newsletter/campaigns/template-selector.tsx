"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useTemplates } from "@/lib/hooks/use-firebase"
import type { Template } from "@/lib/firebase/collections"
import { FileText, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void
  selectedTemplateId?: string
}

export function TemplateSelector({ onSelectTemplate, selectedTemplateId }: TemplateSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const { templates, loading } = useTemplates()

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const filteredTemplates = activeTab === "all" ? templates : templates.filter((t) => t.category === activeTab)

  const handleSelect = (template: Template) => {
    onSelectTemplate(template)
    setDialogOpen(false)
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Template</label>
        {selectedTemplate ? (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {selectedTemplate.thumbnail ? (
                    <img
                      src={selectedTemplate.thumbnail || "/placeholder.svg"}
                      alt={selectedTemplate.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{selectedTemplate.name}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedTemplate.category === "ready-to-wear" ? "Ready to Wear" : selectedTemplate.category}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => setDialogOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Choose a Template
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Select Template</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="bespoke">Bespoke</TabsTrigger>
              <TabsTrigger value="ready-to-wear">Ready to Wear</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">Loading templates...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="text-lg font-medium">No templates found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create templates first to use them in campaigns.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`group cursor-pointer overflow-hidden transition-all hover:shadow-lg ${
                        template.id === selectedTemplateId ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleSelect(template)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {template.thumbnail ? (
                          <img
                            src={template.thumbnail || "/placeholder.svg"}
                            alt={template.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex h-full items-center justify-center">
                            <Button size="sm" variant="secondary">
                              Select Template
                            </Button>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
                        <div className="mt-3">
                          <Badge variant="secondary" className="text-xs">
                            {template.category === "ready-to-wear" ? "Ready to Wear" : template.category}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
