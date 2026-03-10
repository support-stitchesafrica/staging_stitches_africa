import { renderBlocksToHTML } from "@/lib/email/renderBlocksToHTML";

/**
 * Builds final email HTML and injects open + click tracking.
 */
export function getFinalHtmlFromContent(
  content: any,
  campaignId?: string,
  email?: string
): string {
  if (!content) return "";

  let html = "";

  try {
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      if (parsed.html) html = parsed.html;
      else if (parsed.blocks)
        html = renderBlocksToHTML(parsed.blocks, parsed.templateStyles);
    }

    if (!html && typeof content === "object") {
      if (content.html) html = content.html;
      else if (content.blocks)
        html = renderBlocksToHTML(content.blocks, content.templateStyles);
    }

    if (!html && typeof content === "string" && content.includes("<html")) {
      html = content;
    }
  } catch {
    html = typeof content === "string" ? content : "";
  }

  if (!html) return "";

  // ✅ Ensure base URL works for staging/production
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://www.stitchesafrica.com"; // fallback

  if (campaignId) {
    // ✅ Inject open tracking pixel
    const encodedEmail = email ? encodeURIComponent(email) : "";
    const trackingPixel = `<img src="${baseUrl}/api/email/open/${campaignId}${
      email ? `?email=${encodedEmail}` : ""
    }" width="1" height="1" style="display:none;" />`;

    // ✅ Rewrite all links for click tracking
    html = html.replace(
      /href="([^"]+)"/g,
      (match, url) => {
        // Properly encode both the destination URL and email parameter
        const encodedUrl = encodeURIComponent(url);
        const emailParam = email ? `email=${encodedEmail}&` : "";
        return `href="${baseUrl}/api/email/click/${campaignId}?${emailParam}url=${encodedUrl}"`;
      }
    );

    // ✅ Append tracking pixel before closing body or at end
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${trackingPixel}</body>`);
    } else {
      html += trackingPixel;
    }
  }

  return html;
}
