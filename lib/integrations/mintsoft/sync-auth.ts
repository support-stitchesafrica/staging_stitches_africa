import { NextResponse } from "next/server";

/** Protects cron/manual sync routes (inventory + order poll). */
export function assertMintsoftSyncAuthorized(req: Request): Response | null {
	const secret =
		process.env.MINTSOFT_SYNC_SECRET?.trim() ||
		process.env.MINTSOFT_INTEGRATION_SECRET?.trim();
	if (!secret) {
		console.warn(
			"[Mintsoft] sync routes unprotected — set MINTSOFT_SYNC_SECRET.",
		);
		return null;
	}

	const auth = req.headers.get("authorization")?.trim();
	const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : auth;
	if (token === secret) return null;

	const url = new URL(req.url);
	if (url.searchParams.get("secret") === secret) return null;

	return NextResponse.json({ success: false, error: "Unauthorized" }, {
		status: 401,
	});
}
