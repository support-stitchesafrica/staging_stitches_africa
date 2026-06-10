import { NextResponse } from "next/server";

/** Validates Mintsoft webhook calls (?APIKEY= or Authorization / ExtraCode4). */
export function assertMintsoftWebhookAuthorized(
	req: Request,
): Response | null {
	const secret = process.env.MINTSOFT_WEBHOOK_SECRET?.trim();
	if (!secret) {
		console.warn(
			"[Mintsoft] MINTSOFT_WEBHOOK_SECRET unset — accepting webhook without verification.",
		);
		return null;
	}

	const url = new URL(req.url);
	if (url.searchParams.get("APIKEY") === secret) {
		return null;
	}

	const auth = req.headers.get("authorization")?.trim();
	if (auth === secret || auth === `Bearer ${secret}`) {
		return null;
	}
	if (auth && auth.replace(/^Basic\s+/i, "") === secret) {
		return null;
	}

	return NextResponse.json({ success: false, error: "Unauthorized" }, {
		status: 401,
	});
}
