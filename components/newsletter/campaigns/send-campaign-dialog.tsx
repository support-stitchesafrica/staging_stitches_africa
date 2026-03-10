"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { sendBulkEmails, sendEmail } from "@/lib/email/send-email"
import { useToast } from "@/hooks/use-toast"
import { Send, CheckCircle2, AlertCircle } from "lucide-react"
import { type Campaign, campaignService } from "@/lib/firebase/collections"
import { renderBlocksToHTML } from "@/lib/email/renderBlocksToHTML"

import { getFinalHtmlFromContent } from "@/utils/email"

interface SendCampaignDialogProps {
  campaign: Campaign | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SendCampaignDialog({ campaign, open, onOpenChange, onSuccess }: SendCampaignDialogProps) {
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!campaign || !campaign.id) return
    setSending(true)
    setProgress(0)
    setResult(null)

    try {
      const emails = Array.isArray(campaign.recipientLists)
        ? campaign.recipientLists.map((r: any) =>
            typeof r === "string" ? r : r.email
          )
        : []

      if (emails.length === 0) throw new Error("No recipients found.")

      await campaignService.update(campaign.id, {
        status: "sending",
        recipientCount: emails.length,
      })

      // Track sent count for updating campaign stats
      let sentCount = 0
      
      // Send emails one by one to include personalized tracking
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i]
        // ✅ Use centralized helper with email parameter for personalized tracking
        const html = getFinalHtmlFromContent(campaign.content, campaign.id, email)
        
        const result = await sendEmail({
          to: [email],
          subject: campaign.subject,
          html,
        })
        
        if (result.success) {
          sentCount++
        }
        
        // Update progress
        setProgress(((i + 1) / emails.length) * 100)
        
        // Add small delay to avoid hitting API limits
        if (i < emails.length - 1) {
          await new Promise((r) => setTimeout(r, 100))
        }
      }
      
      const sendResult = { sent: sentCount, failed: emails.length - sentCount }

      setResult(sendResult)

      await campaignService.update(campaign.id, {
        status: "sent",
        sentCount: sendResult.sent,
        sentAt: new Date(),
      })

      toast({
        title: "Campaign sent",
        description: `Successfully sent to ${sendResult.sent} recipient(s).`,
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send campaign.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }


  const handleClose = () => {
    if (!sending) {
      setProgress(0)
      setResult(null)
      onOpenChange(false)
    }
  }

  if (!campaign) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Send Campaign</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  <strong>Campaign:</strong> {campaign.name}
                </p>
                <p className="text-sm text-foreground">
                  <strong>Subject:</strong> {campaign.subject}
                </p>
                <p className="text-sm text-foreground">
                  <strong>Recipients:</strong> {campaign.recipientLists?.length || 0} listed emails
                </p>
              </div>

              {sending && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sending emails...</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {!sending && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    This will send the campaign only to the listed recipient emails. This action cannot be undone.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                ) : (
                  <AlertCircle className="h-16 w-16 text-yellow-600" />
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">Campaign Sent</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Successfully sent to {result.sent} recipient(s)
                  {result.failed > 0 && `, ${result.failed} failed`}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending..." : "Send Now"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
