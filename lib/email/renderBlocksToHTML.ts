export function renderBlocksToHTML(blocks: any[], templateStyles?: any): string {
  if (!Array.isArray(blocks)) return ""

  const renderBlock = (block: any): string => {
    const style = Object.entries(block.styles || {})
      .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${value}`)
      .join(";")

    switch (block.type) {
      case "text":
        return `<p style="margin: 0 0 16px; color: #4B5563; line-height: 1.6; font-size: 15px; ${style}">${block.content}</p>`

      case "heading":
        return `<h2 style="margin: 0 0 16px; color: #111827; font-weight: 600; font-size: 24px; ${style}">${block.content}</h2>`

      case "divider":
        return `<hr style="border: none; border-top: 1px solid ${block.styles?.borderColor || "#E5E7EB"}; margin: ${block.styles?.padding || "24px 0"};" />`

      case "image":
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: ${block.styles?.padding || "16px 0"};">
                  <tr>
                    <td align="${block.styles?.textAlign || "center"}">
                      <img src="${block.content}" alt="" style="max-width: 100%; height: auto; display: block; border-radius: ${block.styles?.borderRadius || "8px"};" />
                    </td>
                  </tr>
                </table>`

      case "button":
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="border-radius: ${block.styles?.borderRadius || "6px"}; background-color: ${block.styles?.backgroundColor || "#111827"};">
                            <a href="${block.link}" target="_blank" style="display: inline-block; padding: ${block.styles?.padding || "12px 28px"}; font-size: ${block.styles?.fontSize || "15px"}; color: ${block.styles?.color || "#ffffff"}; text-decoration: none; font-weight: ${block.styles?.fontWeight || "600"}; border-radius: ${block.styles?.borderRadius || "6px"};">
                              ${block.content}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>`

      case "columns":
        const colHTML = block.columns
          .map(
            (col: any[]) =>
              `<td style="vertical-align: top; padding: 12px; width: ${100 / block.columns.length}%;">${col.map(renderBlock).join("")}</td>`
          )
          .join("")
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">
                  <tr>${colHTML}</tr>
                </table>`

      default:
        return ""
    }
  }

  return blocks.map(renderBlock).join("")
}
