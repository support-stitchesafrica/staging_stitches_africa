/**
 * Shared layout, styles, and helpers for shop order emails (customer, vendor, admin).
 */

export const EMAIL_LOGO_URL =
  'https://ik.imagekit.io/mztf7lvnc/Stitches%20Africa%20Logo-06-cut.png';

/** Brand accent — light theme */
export const BRAND_ORANGE = '#FB923C';
export const BRAND_ORANGE_BUTTON = '#FDBA74';
/** Lighter orange accents in dark mode */
export const BRAND_ORANGE_DARK = '#FED7AA';
export const BRAND_ORANGE_BUTTON_DARK = '#FFEDD5';

export interface OrderItemPreview {
  title: string;
  quantity: number;
  price: number;
  image?: string;
  type?: string;
  size?: string;
  color?: string;
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatPrice(amount: number, currency: string): string {
  const c = currency || 'NGN';
  if (c === 'NGN') {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function itemImageHtml(imageUrl: string | undefined, title: string): string {
  const u = imageUrl?.trim();
  if (!u || !/^https:\/\//i.test(u)) return '';
  return `<div style="margin: 0 0 10px;">
    <img src="${escapeHtml(u)}" alt="${escapeHtml(title)}" width="120" style="display:block;max-width:120px;width:120px;height:auto;border-radius:6px;border:1px solid #eee;object-fit:cover;" />
  </div>`;
}

export function itemVariantHtml(item: OrderItemPreview): string {
  const parts: string[] = [];
  if (item.size?.trim()) parts.push(`Size: ${escapeHtml(item.size.trim())}`);
  if (item.color?.trim()) parts.push(`Color: ${escapeHtml(item.color.trim())}`);
  if (parts.length === 0) return '';
  return `<p class="item-variant" style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${parts.join(' &nbsp;·&nbsp; ')}</p>`;
}

export function emailHeaderHtml(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" class="email-header" style="background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff); border-collapse: collapse;">
      <tr>
        <td bgcolor="#ffffff" class="email-header" style="background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff); padding: 22px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="vertical-align: middle; padding-right: 14px;">
                <img
                  src="${EMAIL_LOGO_URL}"
                  alt="Stitches Africa"
                  width="52"
                  height="52"
                  style="display: block; width: 52px; height: 52px; object-fit: contain;"
                />
              </td>
              <td style="vertical-align: middle;">
                <span class="brand-name" style="font-size: 22px; font-weight: 700; letter-spacing: 0.02em; color: #000000 !important; -webkit-text-fill-color: #000000 !important; line-height: 1.2;">Stitches Africa</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function emailFooterHtml(note = 'This is an automated email. Please do not reply to this message.'): string {
  return `
    <div class="email-footer" style="background-color: #e5e7eb; padding: 20px; text-align: center; font-size: 0.9em; color: #6b7280;">
      <p style="margin: 0 0 6px;">© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
      <p style="margin: 0;">${escapeHtml(note)}</p>
    </div>`;
}

export function emailThemeStyles(): string {
  return `
            :root { color-scheme: light dark; supported-color-schemes: light dark; }
            .email-header, .email-header td {
              background-color: #ffffff !important;
              background-image: linear-gradient(#ffffff, #ffffff) !important;
            }
            .email-header .brand-name { color: #000000 !important; -webkit-text-fill-color: #000000 !important; }
            .track-dark, .track-dark p, .track-dark span { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
            .track-dark .track-muted { color: #d1d5db !important; -webkit-text-fill-color: #d1d5db !important; }
            .track-dark .track-btn span { color: #1f2937 !important; -webkit-text-fill-color: #1f2937 !important; }
            @media (prefers-color-scheme: dark) {
              .email-outer { background-color: #111827 !important; color: #e5e7eb !important; }
              .email-main { background-color: #1f2937 !important; color: #e5e7eb !important; }
              .email-main h2, .email-main h3, .email-main strong, .email-card strong { color: #f9fafb !important; -webkit-text-fill-color: #f9fafb !important; }
              .email-main .accent, .email-main .thank-you { color: ${BRAND_ORANGE_DARK} !important; -webkit-text-fill-color: ${BRAND_ORANGE_DARK} !important; }
              .text-muted { color: #9ca3af !important; -webkit-text-fill-color: #9ca3af !important; }
              .email-card { background-color: #374151 !important; border-color: #4b5563 !important; color: #e5e7eb !important; }
              .email-card td { color: #e5e7eb !important; }
              .item-variant { color: #9ca3af !important; }
              .item-divider { border-color: #4b5563 !important; }
              .email-footer { background-color: #0f172a !important; color: #9ca3af !important; }
              .email-header, .email-header td {
                background-color: #ffffff !important;
                background-image: linear-gradient(#ffffff, #ffffff) !important;
              }
              .email-header .brand-name { color: #000000 !important; -webkit-text-fill-color: #000000 !important; }
              .track-dark, .track-dark td { background-color: #1f2937 !important; }
              .track-dark, .track-dark p, .track-dark span { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
              .track-dark .track-muted { color: #d1d5db !important; -webkit-text-fill-color: #d1d5db !important; }
              .track-dark .track-id-box, .track-dark .track-id-box td { background-color: #374151 !important; }
              .track-dark .track-btn td,
              .track-dark .track-btn a { background-color: ${BRAND_ORANGE_BUTTON_DARK} !important; }
              .track-dark .track-btn span { color: #1f2937 !important; -webkit-text-fill-color: #1f2937 !important; }
            }`;
}

export function emailDocumentOpen(title: string): string {
  return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <title>${escapeHtml(title)}</title>
          <style type="text/css">${emailThemeStyles()}</style>
        </head>
        <body class="email-outer" style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
          ${emailHeaderHtml()}
          <div class="email-main" style="padding: 24px; background-color: #f9fafb;">`;
}

export function emailDocumentClose(footerNote?: string): string {
  return `
          </div>
          ${emailFooterHtml(footerNote)}
        </body>
        </html>`;
}

/** Dark CTA card — same look in light and dark email clients. */
export function actionCtaSectionHtml(params: {
  eyebrow: string;
  headline: string;
  orderId: string;
  orderIdLabel?: string;
  buttonLabel: string;
  buttonUrl: string;
}): string {
  const { eyebrow, headline, orderId, orderIdLabel = 'Order ID', buttonLabel, buttonUrl } = params;
  const trackBg = '#1f2937';
  const textWhite =
    'color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;';
  const textMuted =
    'color:#d1d5db !important; -webkit-text-fill-color:#d1d5db !important;';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${trackBg}" class="track-dark" style="margin: 28px 0; border-radius: 12px; background-color: ${trackBg}; border-collapse: separate;">
      <tr>
        <td bgcolor="${trackBg}" class="track-dark" style="background-color: ${trackBg}; padding: 24px; border-radius: 12px;">
          <p class="track-muted" style="margin: 0 0 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; ${textMuted}">${escapeHtml(eyebrow)}</p>
          <p style="margin: 0 0 18px; font-size: 18px; font-weight: 600; line-height: 1.35; ${textWhite}">${escapeHtml(headline)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#374151" class="track-id-box" style="background-color: #374151; border-radius: 8px; margin-bottom: 20px;">
            <tr>
              <td bgcolor="#374151" style="background-color: #374151; padding: 12px 16px; border-radius: 8px;">
                <p class="track-muted" style="margin: 0 0 4px; font-size: 11px; ${textMuted}">${escapeHtml(orderIdLabel)}</p>
                <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 700; letter-spacing: 0.04em; ${textWhite}">${escapeHtml(orderId)}</p>
              </td>
            </tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="track-btn">
            <tr>
              <td bgcolor="${BRAND_ORANGE_BUTTON}" style="background-color: ${BRAND_ORANGE_BUTTON}; border-radius: 8px;">
                <a href="${buttonUrl}"
                   style="background-color: ${BRAND_ORANGE_BUTTON}; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 14px;">
                  <span style="color: #1f2937 !important; -webkit-text-fill-color: #1f2937 !important;">${escapeHtml(buttonLabel)}</span>
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function renderOrderItemsList(
  items: OrderItemPreview[],
  fp: (amount: number) => string,
): string {
  return items
    .map(
      (item) => `
                <div class="item-divider" style="border-bottom: 1px solid #eee; padding: 14px 0;">
                  ${itemImageHtml(item.image, item.title)}
                  <p style="margin: 5px 0;"><strong style="color: #111827;">${escapeHtml(item.title)}</strong></p>
                  ${itemVariantHtml(item)}
                  <p class="text-muted" style="margin: 6px 0 0; color: #4b5563;">Qty ${item.quantity} × ${fp(item.price)}</p>
                  ${item.type === 'bespoke' ? '<p style="margin: 6px 0 0; color: #9333ea; font-size: 13px;"><em>Bespoke — custom made</em></p>' : ''}
                </div>`,
    )
    .join('');
}
