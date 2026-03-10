"use client"

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/newsletter/analytics/metric-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { campaignService, subscriberService } from "@/lib/firebase/collections"
import type { Campaign, Subscriber } from "@/lib/firebase/collections"
import { Users, Mail, TrendingUp, MousePointerClick, BarChart3, Calendar } from "lucide-react"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format, subDays, startOfDay } from "date-fns"

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [campaignsData, subscribersData] = await Promise.all([
        campaignService.getAll(),
        subscriberService.getAll(),
      ])
      setCampaigns(campaignsData)
      setSubscribers(subscribersData)
    } catch (error) {
      console.error("Failed to load analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const totalSubscribers = subscribers.length
  const activeSubscribers = subscribers.filter((s) => s.status === "active").length
  const totalCampaigns = campaigns.filter((c) => c.status === "sent").length
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.openCount || 0), 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clickCount || 0), 0)
  const avgOpenRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0"
  const avgClickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0"

  // Subscriber growth data (last 30 days)
  const subscriberGrowthData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dayStart = startOfDay(date)
    const count = subscribers.filter((s) => {
      if (!s.createdAt?.toDate) return false
      const subDate = startOfDay(s.createdAt.toDate())
      return subDate <= dayStart
    }).length

    return {
      date: format(date, "MMM d"),
      subscribers: count,
    }
  })

  // Campaign performance data
  const campaignPerformanceData = campaigns
    .filter((c) => c.status === "sent")
    .slice(0, 10)
    .reverse()
    .map((c) => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
      sent: c.sentCount || 0,
      opens: c.openCount || 0,
      clicks: c.clickCount || 0,
    }))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Track your newsletter performance and subscriber growth
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Subscribers"
          value={totalSubscribers.toLocaleString()}
          change={`${activeSubscribers} active`}
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="Campaigns Sent"
          value={totalCampaigns.toLocaleString()}
          description={`${totalSent.toLocaleString()} total emails`}
          icon={Mail}
        />
        <MetricCard
          title="Average Open Rate"
          value={`${avgOpenRate}%`}
          change={totalOpens > 0 ? `${totalOpens.toLocaleString()} opens` : "No data yet"}
          changeType={Number.parseFloat(avgOpenRate) > 20 ? "positive" : "neutral"}
          icon={TrendingUp}
        />
        <MetricCard
          title="Average Click Rate"
          value={`${avgClickRate}%`}
          change={totalClicks > 0 ? `${totalClicks.toLocaleString()} clicks` : "No data yet"}
          changeType={Number.parseFloat(avgClickRate) > 2 ? "positive" : "neutral"}
          icon={MousePointerClick}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Subscriber Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg sm:text-xl">Subscriber Growth</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Total subscribers over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                subscribers: {
                  label: "Subscribers",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px] sm:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subscriberGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="subscribers"
                    stroke="var(--color-subscribers)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg sm:text-xl">Campaign Performance</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Recent campaign engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sent: {
                  label: "Sent",
                  color: "hsl(var(--chart-1))",
                },
                opens: {
                  label: "Opens",
                  color: "hsl(var(--chart-2))",
                },
                clicks: {
                  label: "Clicks",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[250px] sm:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sent" fill="var(--color-sent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opens" fill="var(--color-opens)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg sm:text-xl">Recent Campaigns</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Performance overview of your latest campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns
              .filter((c) => c.status === "sent")
              .slice(0, 5)
              .map((campaign) => {
                const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0
                const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0

                return (
                  <div
                    key={campaign.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm sm:text-base">{campaign.name}</p>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {campaign.sentCount?.toLocaleString() || 0} sent
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {openRate.toFixed(1)}% opens
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {clickRate.toFixed(1)}% clicks
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {campaign.sentAt?.toDate ? format(campaign.sentAt.toDate(), "MMM d, yyyy") : "-"}
                      </p>
                    </div>
                  </div>
                )
              })}
            {campaigns.filter((c) => c.status === "sent").length === 0 && (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No campaigns sent yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
