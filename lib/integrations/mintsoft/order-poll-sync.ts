import { adminDb } from "@/lib/firebase-admin";
import {
	mintsoftGetOrder,
	mintsoftSearchOrderByNumber,
} from "@/lib/integrations/mintsoft/api";
import type { MintsoftOrderRecord } from "@/lib/integrations/mintsoft/types-api";
import {
	applyMintsoftUpdateToUserOrders,
	mapMintsoftOrderToPatch,
} from "@/lib/integrations/mintsoft/order-firestore";

const MAX_USERS_SCAN = 80;
const ORDERS_PER_USER = 20;

/** Poll Mintsoft for orders tagged with mintsoft.orderId and sync status/tracking. */
export async function pollPendingMintsoftOrders(): Promise<{
	processed: number;
	updated: number;
	errors: string[];
}> {
	const usersSnap = await adminDb.collection("users_orders").limit(MAX_USERS_SCAN).get();
	const seenMintsoftIds = new Set<number>();
	let updated = 0;
	const errors: string[] = [];

	for (const userDoc of usersSnap.docs) {
		const ordersSnap = await userDoc.ref
			.collection("user_orders")
			.limit(ORDERS_PER_USER)
			.get();

		for (const orderDoc of ordersSnap.docs) {
			const data = orderDoc.data();
			const mintsoftId = data.mintsoft?.orderId as number | undefined;
			const orderId = data.order_id as string | undefined;
			const status = data.order_status as string | undefined;

			if (!mintsoftId || seenMintsoftIds.has(mintsoftId)) continue;
			if (status === "delivered" || status === "cancelled") continue;

			seenMintsoftIds.add(mintsoftId);

			try {
				let record: MintsoftOrderRecord;
				try {
					record = await mintsoftGetOrder(mintsoftId);
				} catch {
					if (!orderId) continue;
					const found = await mintsoftSearchOrderByNumber(orderId);
					record = found[0];
					if (!record) continue;
				}

				const patch = mapMintsoftOrderToPatch(record, "polled");
				if (
					patch.orderStatus === "processing" &&
					!patch.trackingNumber &&
					!record.DespatchDate
				) {
					continue;
				}

				const result = await applyMintsoftUpdateToUserOrders(record, patch);
				if (result.updated > 0) updated += 1;
			} catch (err) {
				errors.push(
					`mintsoft:${mintsoftId} ${err instanceof Error ? err.message : "poll failed"}`,
				);
			}
		}
	}

	return { processed: seenMintsoftIds.size, updated, errors };
}
