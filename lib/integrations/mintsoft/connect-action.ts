import { mintsoftWebhookUrl } from "@/lib/integrations/mintsoft/config";
import type { MintsoftConnectAction } from "@/lib/integrations/mintsoft/types-api";

/** Webhook registration payload for PUT /api/Order/{id}/ConnectActions */
export function buildMintsoftConnectAction(
	stitchesOrderId: string,
): MintsoftConnectAction | null {
	const despatched = mintsoftWebhookUrl(
		"/api/integrations/mintsoft/webhooks/despatched",
	);
	const cancelled = mintsoftWebhookUrl(
		"/api/integrations/mintsoft/webhooks/cancelled",
	);
	const delivered = mintsoftWebhookUrl(
		"/api/integrations/mintsoft/webhooks/delivered",
	);

	if (!despatched || !cancelled) {
		console.warn(
			"[Mintsoft] MINTSOFT_WEBHOOK_BASE_URL not set — skipping ConnectActions (use polling sync).",
		);
		return null;
	}

	const action: MintsoftConnectAction = {
		Type: "API",
		SourceOrderId: stitchesOrderId,
		Complete: false,
		ExtraCode1: despatched,
		ExtraCode2: cancelled,
	};

	if (delivered) {
		action.ExtraCode3 = delivered;
	}

	const authHeader = process.env.MINTSOFT_WEBHOOK_AUTH_HEADER?.trim();
	if (authHeader) {
		action.ExtraCode4 = authHeader;
	}

	return action;
}
