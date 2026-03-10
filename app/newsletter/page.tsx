"use client"

import { Header } from "@/components/newsletter/dashboard/header"
import { StatsCard } from "@/components/newsletter/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Users, Send, TrendingUp, ArrowRight } from "lucide-react"
import { useCampaigns, useSubscribers } from "@/lib/hooks/use-firebase"
import { useRouter } from "next/navigation"
import { useWaitingList } from "@/lib/hooks/use-waiting-list";

export default function DashboardPage() {
  const router = useRouter()
  const { campaigns, loading: campaignsLoading } = useCampaigns()
  const { subscribers, loading: subscribersLoading } = useSubscribers()
  const { waitingList, loading: waitingLoading, refetch: refetchWaiting } = useWaitingList();

  const totalCampaigns = campaigns.length
  const sentCampaigns = campaigns.filter((c) => c.status === "sent").length
  const totalSubscribers = subscribers.length + waitingList.length
  const activeSubscribers = subscribers.filter((s) => s.status === "active").length

  const recentCampaigns = campaigns.slice(0, 5)

  return (
    <div>
      <Header
        title="Dashboard"
        description="Welcome back! Here's what's happening with your newsletters."
        action={{
          label: "New Campaign",
          onClick: () => router.push("/newsletter/campaigns/new"),
        }}
      />

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Campaigns" value={totalCampaigns} change={{ value: "+12%", trend: "up" }} icon={Mail} />
        <StatsCard title="Sent Campaigns" value={sentCampaigns} change={{ value: "+8%", trend: "up" }} icon={Send} />
        <StatsCard
          title="Total Subscribers"
          value={totalSubscribers}
          change={{ value: "+23%", trend: "up" }}
          icon={Users}
        />
        <StatsCard
          title="Active Subscribers"
          value={activeSubscribers}
          change={{ value: "+15%", trend: "up" }}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading campaigns...</p>
              </div>
            ) : recentCampaigns.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2">
                <Mail className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No campaigns yet</p>
                <Button variant="outline" size="sm" onClick={() => router.push("/newsletter/campaigns/new")}>
                  Create your first campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium text-foreground">{campaign.recipientCount}</p>
                        <p className="text-xs text-muted-foreground">recipients</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/newsletter/campaigns/${campaign.id}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              onClick={() => router.push("/newsletter/campaigns/new")}
            >
              <Mail className="h-5 w-5" />
              Create New Campaign
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              onClick={() => router.push("/newsletter/templates")}
            >
              <Send className="h-5 w-5" />
              Browse Templates
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              onClick={() => router.push("/newsletter/subscribers")}
            >
              <Users className="h-5 w-5" />
              Manage Subscribers
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
