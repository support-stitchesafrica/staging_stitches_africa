/** Public base URL Mintsoft will POST webhooks to (no trailing slash). */
import { getAppBaseUrl } from "@/lib/env";

export function getMintsoftWebhookBaseUrl(): string {
	const explicit = process.env.MINTSOFT_WEBHOOK_BASE_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");
	return getAppBaseUrl();
}

export function mintsoftWebhookUrl(path: string): string | null {
	const base = getMintsoftWebhookBaseUrl();
	if (!base) return null;
	const secret = process.env.MINTSOFT_WEBHOOK_SECRET?.trim();
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const url = `${base}${normalizedPath}`;
	if (!secret) return url;
	return `${url}?APIKEY=${encodeURIComponent(secret)}`;
}
