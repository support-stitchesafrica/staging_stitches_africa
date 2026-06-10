import { NextResponse } from "next/server";

import { syncUnityCupInventoryFromMintsoft } from "@/lib/integrations/mintsoft/inventory-sync";
import { assertMintsoftSyncAuthorized } from "@/lib/integrations/mintsoft/sync-auth";

/**
 * POST /api/integrations/mintsoft/sync/inventory
 * Pulls stock from GET /api/Product/StockLevels (Mintsoft) into Unity Cup tailor_works.
 *
 * Optional JSON: { "since": "2024-01-01T00:00:00Z" } for incremental via UpdatedSince.
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
		let sinceIso: string | undefined;
		try {
			const body = await req.json();
			if (body?.since && typeof body.since === "string") {
				sinceIso = body.since;
			}
		} catch {
			// empty body is fine
		}

		const result = await syncUnityCupInventoryFromMintsoft({ sinceIso });
		return NextResponse.json({ success: true, ...result });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("[Mintsoft] inventory sync failed:", error);
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}
