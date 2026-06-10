import { NextResponse } from "next/server";

import { pollPendingMintsoftOrders } from "@/lib/integrations/mintsoft/order-poll-sync";
import { assertMintsoftSyncAuthorized } from "@/lib/integrations/mintsoft/sync-auth";

/**
 * POST /api/integrations/mintsoft/sync/orders
 * Polls GET /api/Order/{id} for Firestore orders with mintsoft.orderId (backup to webhooks).
 */
export async function POST(req: Request) {
	const denied = assertMintsoftSyncAuthorized(req);
	if (denied) return denied;

	if (!process.env.MINTSOFT_BASE_URL?.trim()) {
		return NextResponse.json(
			{ success: false, error: "Mintsoft is not configured." },
			{ status: 503 },
		);
	}

	try {
		const result = await pollPendingMintsoftOrders();
		return NextResponse.json({ success: true, ...result });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("[Mintsoft] order poll sync failed:", error);
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}
