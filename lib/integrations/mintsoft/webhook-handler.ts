import { NextResponse } from "next/server";

import {
	applyMintsoftUpdateToUserOrders,
	mapMintsoftOrderToPatch,
} from "@/lib/integrations/mintsoft/order-firestore";
import type { MintsoftOrderRecord } from "@/lib/integrations/mintsoft/types-api";
import { assertMintsoftWebhookAuthorized } from "@/lib/integrations/mintsoft/webhook-auth";

export async function handleMintsoftOrderWebhook(
	req: Request,
	kind: "despatched" | "cancelled" | "delivered",
): Promise<Response> {
	const denied = assertMintsoftWebhookAuthorized(req);
	if (denied) return denied;

	try {
		const body = (await req.json()) as MintsoftOrderRecord | MintsoftOrderRecord[];
		const order = Array.isArray(body) ? body[0] : body;

		if (!order?.OrderNumber && !order?.ExternalOrderReference && !order?.ID) {
			return NextResponse.json(
				{ success: false, error: "Unrecognized webhook payload" },
				{ status: 400 },
			);
		}

		console.log(
			`[Mintsoft] webhook ${kind} order=${order.OrderNumber ?? order.ExternalOrderReference} tracking=${order.TrackingNumber ?? "n/a"}`,
		);

		const patch = mapMintsoftOrderToPatch(order, kind);
		const result = await applyMintsoftUpdateToUserOrders(order, patch);

		console.log(
			`[Mintsoft] webhook ${kind} updated=${result.updated} orderIds=${result.orderIds.join(",") || "none"}`,
		);

		return NextResponse.json({
			success: true,
			kind,
			updated: result.updated,
			orderIds: result.orderIds,
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`[Mintsoft] webhook ${kind} failed:`, error);
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}
