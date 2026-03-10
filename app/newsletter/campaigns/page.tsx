"use client"

import { useState } from "react";
import { Header } from "@/components/newsletter/dashboard/header"
import { CampaignCard } from "@/components/newsletter/campaigns/campaign-card"
import { SendCampaignDialog } from "@/components/newsletter/campaigns/send-campaign-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCampaigns } from "@/lib/hooks/use-firebase"
import { campaignService, type Campaign } from "@/lib/firebase/collections"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"

export default function CampaignsPage() {
  const { campaigns, loading, refetch } = useCampaigns()
  const [sendCampaign, setSendCampaign] = useState<Campaign | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  const router = useRouter()

  const filteredCampaigns = activeTab === "all" ? campaigns : campaigns.filter((c) => c.status === activeTab)

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      await campaignService.create({
        name: `${campaign.name} (Copy)`,
        subject: campaign.subject,
        previewText: campaign.previewText,
        templateId: campaign.templateId,
        content: campaign.content,
        status: "draft",
        recipientLists: campaign.recipientLists,
        recipientCount: 0,
        sentCount: 0,
        openCount: 0,
        clickCount: 0,
        openedBy: [],
        clickedBy: [],
      })
      toast({
        title: "Campaign duplicated",
        description: "The campaign has been duplicated successfully.",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate campaign.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (campaign: Campaign) => {
    if (!campaign.id) return
    if (!confirm("Are you sure you want to delete this campaign?")) return

    try {
      await campaignService.delete(campaign.id)
      toast({
        title: "Campaign deleted",
        description: "The campaign has been deleted successfully.",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <Header
        title="Campaigns"
        description="Create and manage your email campaigns."
        action={{
          label: "New Campaign",
          onClick: () => router.push("/newsletter/campaigns/new"),
        }}
      />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Campaigns</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Loading campaigns...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4">
                <Mail className="h-16 w-16 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">No campaigns yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first campaign to start sending newsletters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onView={(c) => router.push(`/newsletter/campaigns/${c.id}`)}
                    onSend={setSendCampaign}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <SendCampaignDialog
        campaign={sendCampaign}
        open={!!sendCampaign}
        onOpenChange={(open) => !open && setSendCampaign(null)}
        onSuccess={refetch}
      />
    </div>
  )
}
