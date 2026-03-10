"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { campaignService, type Campaign } from "@/lib/firebase/collections"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Mail, Users, Eye, MousePointer, Calendar, Send } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { SendCampaignDialog } from "@/components/newsletter/campaigns/send-campaign-dialog"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSendDialog, setShowSendDialog] = useState(false)

  useEffect(() => {
    const loadCampaign = async () => {
      if (!params.id || typeof params.id !== "string") return

      try {
        const data = await campaignService.getById(params.id)
        if (data) {
          setCampaign(data)
        } else {
          toast({
            title: "Campaign not found",
            description: "The campaign you're looking for doesn't exist.",
            variant: "destructive",
          })
          router.push("/dashboard/campaigns")
        }
      } catch (error) {
        console.error("[v0] Error loading campaign:", error)
        toast({
          title: "Error",
          description: "Failed to load campaign.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadCampaign()
  }, [params.id, toast, router])

  const statusColors = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    sending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    )
  }

  if (!campaign) {
    return null
  }

  const openRate = campaign.sentCount > 0 ? Math.round((campaign.openCount / campaign.sentCount) * 100) : 0
  const clickRate = campaign.sentCount > 0 ? Math.round((campaign.clickCount / campaign.sentCount) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/newsletter/campaigns">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-medium">{campaign.name}</h1>
                <Badge variant="secondary" className={statusColors[campaign.status]}>
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{campaign.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === "draft" && (
              <Button onClick={() => setShowSendDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Send Campaign</span>
                <span className="sm:hidden">Send</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recipients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-serif font-bold">{campaign.recipientCount}</div>
              <p className="text-xs text-muted-foreground">Total subscribers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-serif font-bold">{campaign.sentCount}</div>
              <p className="text-xs text-muted-foreground">Emails delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-serif font-bold">{openRate}%</div>
              <p className="text-xs text-muted-foreground">{campaign.openCount} opens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-serif font-bold">{clickRate}%</div>
              <p className="text-xs text-muted-foreground">{campaign.clickCount} clicks</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject Line</label>
                  <p className="mt-1 text-foreground">{campaign.subject}</p>
                </div>

                {campaign.previewText && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Preview Text</label>
                    <p className="mt-1 text-foreground">{campaign.previewText}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant="secondary" className={statusColors[campaign.status]}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>

                {campaign.scheduledAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Scheduled For</label>
                    <div className="mt-1 flex items-center gap-2 text-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{campaign.scheduledAt?.toDate ? format(campaign.scheduledAt.toDate(), "PPp") : "-"}</span>
                    </div>
                  </div>
                )}

                {campaign.sentAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sent At</label>
                    <div className="mt-1 flex items-center gap-2 text-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{campaign.sentAt?.toDate ? format(campaign.sentAt.toDate(), "PPp") : "-"}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recipient Lists</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {campaign.recipientLists.map((listId) => (
                      <Badge key={listId} variant="outline">
                        {listId}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof campaign.content === "string"
                        ? campaign.content
                        : campaign.content?.html ?? ""
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <SendCampaignDialog
        campaign={campaign}
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        onSuccess={() => {
          setShowSendDialog(false)
          router.push("/newsletter/campaigns")
        }}
      />
    </div>
  )
}
