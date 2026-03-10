"use client"

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Eye, Send, Copy, Trash2, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Campaign } from "@/lib/firebase/collections"
import { getCampaignStats } from "@/lib/firebase/eventService"
import { format } from "date-fns"

interface CampaignCardProps {
  campaign: Campaign
  onView: (campaign: Campaign) => void
  onSend: (campaign: Campaign) => void
  onDuplicate: (campaign: Campaign) => void
  onDelete: (campaign: Campaign) => void
}

export function CampaignCard({ campaign, onView, onSend, onDuplicate, onDelete }: CampaignCardProps) {
  const [stats, setStats] = useState({ openCount: 0, clickCount: 0 })

  useEffect(() => {
  if (campaign.status === "sent") {
    getCampaignStats(campaign.id!).then((res) => setStats(res));
  }
}, [campaign.id, campaign.status]);

  const statusColors = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    sending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  }

  const openRate =
    campaign.sentCount && campaign.sentCount > 0
      ? Math.round((campaign.openCount / campaign.sentCount) * 100)
      : 0

  const clickRate =
    campaign.sentCount && campaign.sentCount > 0
      ? Math.round((campaign.clickCount / campaign.sentCount) * 100)
      : 0

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-serif text-lg font-medium text-foreground">{campaign.name}</h3>
              <Badge
                variant="secondary"
                className={statusColors[campaign.status as keyof typeof statusColors]}
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{campaign.subject}</p>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-serif font-medium text-foreground">
                  {campaign.recipientCount || 0}
                </p>
                <p className="text-xs text-muted-foreground">Recipients</p>
              </div>

              {campaign.status === "sent" && (
                <>
                  <div>
                    <p className="text-2xl font-serif font-medium text-foreground">{openRate}%</p>
                    <p className="text-xs text-muted-foreground">Open Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-serif font-medium text-foreground">{clickRate}%</p>
                    <p className="text-xs text-muted-foreground">Click Rate</p>
                  </div>
                </>
              )}
            </div>

            {campaign.scheduledAt && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Scheduled for{" "}
                  {campaign.scheduledAt.toDate
                    ? format(campaign.scheduledAt.toDate(), "PPp")
                    : "-"}
                </span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={() => onView(campaign)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              {campaign.status === "draft" && (
                <DropdownMenuItem onClick={() => onSend(campaign)}>
                  <Send className="mr-2 h-4 w-4" /> Send Campaign
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(campaign)}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(campaign)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(campaign)} className="flex-1">
            View
          </Button>
          {campaign.status === "draft" && (
            <Button size="sm" onClick={() => onSend(campaign)} className="flex-1">
              <Send className="mr-2 h-4 w-4" /> Send
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
