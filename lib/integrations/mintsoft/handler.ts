import { NextResponse } from "next/server";

import { verifyIdToken } from "@/lib/firebase-admin";
import { isEuropeanOrder } from "@/lib/europe";
import {
	mapToMintsoftOrder,
	normalizeMintsoftRequestBody,
} from "@/lib/orderMapper";
import { mintsoftCreateOrder, mintsoftRegisterConnectActions } from "@/lib/integrations/mintsoft/api";
import { buildMintsoftConnectAction } from "@/lib/integrations/mintsoft/connect-action";
import { enrichMintsoftRequestBodyItems } from "@/lib/integrations/mintsoft/mintsoft-fields-server";
import { formatMissingMintsoftSkuError } from "@/lib/integrations/mintsoft/mintsoft-fields";
import { tagUserOrdersWithMintsoftCreate } from "@/lib/integrations/mintsoft/order-firestore";

/**
 * Shared Mintsoft push authorization:
 * - If `MINTSOFT_INTEGRATION_SECRET` is set: require `Bearer <secret>` OR valid Firebase ID token.
 * - If unset: allow no header (e.g. Postman); if `Authorization: Bearer` is sent, it must be a valid Firebase ID token.
 */
async function assertMintsoftPushAuthorized(
	req: Request,
): Promise<Response | null> {
	const secret = process.env.MINTSOFT_INTEGRATION_SECRET?.trim();
	const auth = req.headers.get("authorization")?.trim();
	const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";

	if (secret) {
		if (!token) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}
		if (token === secret) {
			return null;
		}
		try {
			await verifyIdToken(token);
			return null;
		} catch {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}
	}

	if (!token) {
		return null;
	}
	try {
		await verifyIdToken(token);
		return null;
	} catch {
		return NextResponse.json(
			{ success: false, error: "Invalid or expired session token" },
			{ status: 401 },
		);
	}
}

/**
 * POST body: normalized "Stitches checkout–like" or Postman JSON.
 * See `normalizeMintsoftRequestBody` in lib/orderMapper.ts for accepted shapes.
 *
 * Auth: see `assertMintsoftPushAuthorized` (integration secret and/or Firebase ID token).
 */
export async function handleMintsoftPush(req: Request): Promise<Response> {
	const denied = await assertMintsoftPushAuthorized(req);
	if (denied) {
		return denied;
	}

	if (!process.env.MINTSOFT_BASE_URL?.trim()) {
		return NextResponse.json(
			{
				success: false,
				error: "Mintsoft is not configured (MINTSOFT_BASE_URL missing).",
			},
			{ status: 503 },
		);
	}

	try {
		const rawBody = (await req.json()) as Record<string, unknown>;
		const body = await enrichMintsoftRequestBodyItems(rawBody);
		const normalized = normalizeMintsoftRequestBody(body);

		const missingSkus = normalized.items
			.map((line, i) => ({ line, i }))
			.filter(({ line }) => !line.sku.trim());
		if (missingSkus.length > 0) {
			return NextResponse.json(
				{
					success: false,
					error: formatMissingMintsoftSkuError(
						missingSkus.map(({ i }) => ({
							product_id: String(
								(body.items as Record<string, unknown>[] | undefined)?.[i]
									?.product_id ?? `items[${i}]`,
							),
						})),
					),
				},
				{ status: 400 },
			);
		}

		console.log(
			"[Mintsoft] push-order normalized shipping countryCode:",
			normalized.shipping.countryCode,
		);

		if (!isEuropeanOrder(normalized.shipping.countryCode)) {
			return NextResponse.json({
				success: false,
				message: "Non-European shipping country — not sent to Mintsoft.",
				countryCode: normalized.shipping.countryCode,
			});
		}

		const payload = mapToMintsoftOrder(normalized);
		if (!payload.ClientId) {
			return NextResponse.json(
				{
					success: false,
					error:
						"Mintsoft admin users must set ClientId. Add MINTSOFT_CLIENT_ID to env or pass clientId in the request body. Find your id via GET /api/Client (field ID).",
				},
				{ status: 400 },
			);
		}

		const mintsoftResponse = await mintsoftCreateOrder(payload);
		const first = mintsoftResponse.find((r) => r.Success !== false) ?? mintsoftResponse[0];
		const mintsoftOrderId = first?.OrderId;

		let connectActionsRegistered = false;
		if (mintsoftOrderId) {
			const connect = buildMintsoftConnectAction(normalized.orderId);
			if (connect) {
				await mintsoftRegisterConnectActions(mintsoftOrderId, connect);
				connectActionsRegistered = true;
			}

			const userId =
				typeof body.userId === "string"
					? body.userId
					: typeof body.user_id === "string"
						? body.user_id
						: undefined;
			await tagUserOrdersWithMintsoftCreate({
				stitchesOrderId: normalized.orderId,
				userId,
				mintsoftOrderId,
				mintsoftStatus: first?.OrderStatus,
			}).catch((err) =>
				console.warn("[Mintsoft] failed to tag Firestore order:", err),
			);
		}

		return NextResponse.json({
			success: true,
			mintsoft: mintsoftResponse,
			mintsoftOrderId: mintsoftOrderId ?? null,
			connectActionsRegistered,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error";
		const axiosData =
			error &&
			typeof error === "object" &&
			"response" in error &&
			(error as { response?: { data?: unknown } }).response?.data;

		const status =
			error &&
			typeof error === "object" &&
			"response" in error &&
			typeof (error as { response?: { status?: number } }).response?.status ===
				"number"
				? (error as { response: { status: number } }).response.status
				: 500;

		if (status === 401) {
			console.error(
				"[Mintsoft] upstream API returned 401 — check ms-apikey header and that MINTSOFT_API_KEY is valid/static (see Mintsoft Auth docs).",
				axiosData ?? message,
			);
		}

		return NextResponse.json(
			{
				success: false,
				source: status === 401 ? "mintsoft_api" : "handler",
				error:
					status === 401
						? "Mintsoft API rejected credentials (401). Regenerate API key via POST /api/Auth or set a static key in Mintsoft admin."
						: (axiosData ?? message),
				details: status === 401 ? undefined : axiosData,
			},
			{ status: status >= 400 && status < 600 ? status : 500 },
		);
	}
}
