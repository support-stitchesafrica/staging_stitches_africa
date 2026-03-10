export interface EmailOptions {
  to: string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

/**
 * Sends a single email via your /api/send-email route.
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to send email: ${text}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Sends bulk emails in batches with progress tracking.
 */
export async function sendBulkEmails(
  emails: string[],
  subject: string,
  html: string,
  onProgress?: (sent: number, total: number) => void
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0
  const batchSize = 50 // number of emails to send per batch

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)

    const results = await Promise.allSettled(
      batch.map((email) =>
        sendEmail({
          to: [email],
          subject,
          html,
        })
      )
    )

    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value.success) sent++
      else failed++
    })

    if (onProgress) onProgress(sent + failed, emails.length)

    // wait 1s between batches to avoid hitting API limits
    if (i + batchSize < emails.length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  return { sent, failed }
}
