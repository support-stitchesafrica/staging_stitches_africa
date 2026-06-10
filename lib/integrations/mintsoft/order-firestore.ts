import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import type { MintsoftOrderRecord } from "@/lib/integrations/mintsoft/types-api";

export type MintsoftOrderPatch = {
	orderStatus: string;
	trackingNumber?: string;
	trackingUrl?: string;
	carrier?: string;
	mintsoftOrderId?: number;
	mintsoftStatus?: string;
	mintsoftStatusId?: number;
	despatchDate?: string;
	webhookKind?: string;
};

function stitchesOrderIdsFromMintsoft(
	order: MintsoftOrderRecord,
): string[] {
	const ids = new Set<string>();
	if (order.OrderNumber?.trim()) ids.add(order.OrderNumber.trim());
	if (order.ExternalOrderReference?.trim()) {
		ids.add(order.ExternalOrderReference.trim());
	}
	return [...ids];
}

/** Find `users_orders/{uid}/user_orders/*` docs for a Stitches order id. */
export async function findUserOrderDocsByStitchesOrderId(
	stitchesOrderId: string,
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
	const id = stitchesOrderId.trim();
	if (!id) return [];

	try {
		const groupSnap = await adminDb
			.collectionGroup("user_orders")
			.where("order_id", "==", id)
			.get();
		if (!groupSnap.empty) return groupSnap.docs;
	} catch (err) {
		console.warn(
			"[Mintsoft] collectionGroup order_id query failed, scanning users_orders:",
			err,
		);
	}

	const usersSnap = await adminDb.collection("users_orders").limit(500).get();
	const matches: FirebaseFirestore.QueryDocumentSnapshot[] = [];

	for (const userDoc of usersSnap.docs) {
		const orderSnap = await adminDb
			.collection("users_orders")
			.doc(userDoc.id)
			.collection("user_orders")
			.where("order_id", "==", id)
			.limit(20)
			.get();
		matches.push(...orderSnap.docs);
	}

	return matches;
}

/** Match `users_orders` by Mintsoft numeric order id (e.g. Postman tests without changing `order_id`). */
export async function findUserOrderDocsByMintsoftOrderId(
	mintsoftOrderId: number,
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
	if (!Number.isFinite(mintsoftOrderId) || mintsoftOrderId <= 0) {
		return [];
	}

	try {
		const groupSnap = await adminDb
			.collectionGroup("user_orders")
			.where("mintsoft.orderId", "==", mintsoftOrderId)
			.get();
		if (!groupSnap.empty) return groupSnap.docs;
	} catch (err) {
		console.warn(
			"[Mintsoft] collectionGroup mintsoft.orderId query failed, scanning users_orders:",
			err,
		);
	}

	const usersSnap = await adminDb.collection("users_orders").limit(500).get();
	const matches: FirebaseFirestore.QueryDocumentSnapshot[] = [];

	for (const userDoc of usersSnap.docs) {
		const orderSnap = await adminDb
			.collection("users_orders")
			.doc(userDoc.id)
			.collection("user_orders")
			.where("mintsoft.orderId", "==", mintsoftOrderId)
			.limit(20)
			.get();
		matches.push(...orderSnap.docs);
	}

	return matches;
}

export async function applyMintsoftUpdateToUserOrders(
	order: MintsoftOrderRecord,
	patch: MintsoftOrderPatch,
): Promise<{ updated: number; orderIds: string[] }> {
	const stitchesIds = stitchesOrderIdsFromMintsoft(order);
	const mintsoftId = order.ID;

	const now = new Date();
	const eventDescription =
		patch.webhookKind === "cancelled"
			? "Order cancelled at warehouse"
			: patch.webhookKind === "delivered"
				? "Delivered"
				: patch.trackingNumber
					? `Shipped — tracking ${patch.trackingNumber}`
					: "Shipped from warehouse";

	const trackingEvent = {
		typeCode: patch.orderStatus === "delivered" ? "OK" : "DF",
		time: now.toISOString().slice(11, 19),
		description: eventDescription,
		date: now.toISOString().slice(0, 10),
		serviceArea: [{ description: "Mission Logix", code: "ML" }],
		deliveryType: "mintsoft",
		signedBy: "",
	};

	const updatePayload: Record<string, unknown> = {
		order_status: patch.orderStatus,
		last_update: FieldValue.serverTimestamp(),
		last_dhl_event: trackingEvent,
		mintsoft: {
			orderId: patch.mintsoftOrderId ?? order.ID ?? null,
			status: patch.mintsoftStatus ?? order.OrderStatus ?? null,
			statusId: patch.mintsoftStatusId ?? order.OrderStatusId ?? null,
			despatchDate: patch.despatchDate ?? order.DespatchDate ?? null,
			lastWebhookAt: FieldValue.serverTimestamp(),
			lastWebhookKind: patch.webhookKind ?? null,
		},
	};

	if (patch.trackingNumber) {
		updatePayload["shipping.trackingNumber"] = patch.trackingNumber;
	}
	if (patch.trackingUrl) {
		updatePayload["shipping.trackingUrl"] = patch.trackingUrl;
	}
	if (patch.carrier) {
		updatePayload["shipping.carrier"] = patch.carrier;
	}

	let updated = 0;
	const updatedOrderIds = new Set<string>();
	const updatedDocPaths = new Set<string>();

	const docSets: FirebaseFirestore.QueryDocumentSnapshot[][] = [];

	if (stitchesIds.length > 0) {
		for (const stitchesOrderId of stitchesIds) {
			docSets.push(await findUserOrderDocsByStitchesOrderId(stitchesOrderId));
		}
	}
	if (mintsoftId) {
		docSets.push(await findUserOrderDocsByMintsoftOrderId(mintsoftId));
	}

	for (const docs of docSets) {
		for (const doc of docs) {
			if (updatedDocPaths.has(doc.ref.path)) continue;
			updatedDocPaths.add(doc.ref.path);
			const existing = doc.data().dhl_events_snapshot;
			const events = Array.isArray(existing) ? [...existing] : [];
			const payload = {
				...updatePayload,
				dhl_events_snapshot: [trackingEvent, ...events],
			};
			await doc.ref.update(payload);
			updated += 1;
			const data = doc.data();
			if (data.order_id) updatedOrderIds.add(String(data.order_id));
		}
	}

	if (stitchesIds.length === 0 && !mintsoftId) {
		return { updated: 0, orderIds: [] };
	}

	return { updated, orderIds: [...updatedOrderIds] };
}

/** Persist Mintsoft ids on user order lines after create (optional userId). */
export async function tagUserOrdersWithMintsoftCreate(args: {
	stitchesOrderId: string;
	userId?: string;
	mintsoftOrderId: number;
	mintsoftStatus?: string;
}): Promise<void> {
	const { stitchesOrderId, userId, mintsoftOrderId, mintsoftStatus } = args;
	const payload = {
		mintsoft: {
			orderId: mintsoftOrderId,
			externalOrderReference: stitchesOrderId,
			status: mintsoftStatus ?? "Created",
			createdAt: FieldValue.serverTimestamp(),
		},
		last_update: FieldValue.serverTimestamp(),
	};

	if (userId) {
		const snap = await adminDb
			.collection("users_orders")
			.doc(userId)
			.collection("user_orders")
			.where("order_id", "==", stitchesOrderId)
			.get();
		if (!snap.empty) {
			const batch = adminDb.batch();
			snap.docs.forEach((d) => batch.update(d.ref, payload));
			await batch.commit();
			return;
		}
	}

	const docs = await findUserOrderDocsByStitchesOrderId(stitchesOrderId);
	await Promise.all(docs.map((d) => d.ref.update(payload)));
}

export function mapMintsoftOrderToPatch(
	order: MintsoftOrderRecord,
	kind: "despatched" | "cancelled" | "delivered" | "polled",
): MintsoftOrderPatch {
	const statusName = (order.OrderStatus ?? "").toLowerCase();
	const isCancelled =
		kind === "cancelled" || statusName.includes("cancel");
	const isDelivered =
		kind === "delivered" || statusName.includes("deliver");

	let orderStatus = "processing";
	if (isCancelled) orderStatus = "cancelled";
	else if (isDelivered) orderStatus = "delivered";
	else if (
		kind === "despatched" ||
		order.DespatchDate ||
		order.TrackingNumber ||
		statusName.includes("despatch") ||
		statusName.includes("dispatch")
	) {
		orderStatus = "shipped";
	}

	return {
		orderStatus,
		trackingNumber: order.TrackingNumber?.trim() || undefined,
		trackingUrl: order.TrackingURL?.trim() || undefined,
		carrier: order.CourierServiceName?.trim() || "Mission Logix",
		mintsoftOrderId: order.ID,
		mintsoftStatus: order.OrderStatus,
		mintsoftStatusId: order.OrderStatusId,
		despatchDate: order.DespatchDate,
		webhookKind: kind,
	};
}
