import { Timestamp } from "firebase-admin/firestore";

/**
 * Split total shipping (order currency) across line items by (originalPrice + duty) × qty weights.
 */
export function allocateShippingByItemWeights(
	items: any[],
	totalShippingFee: number,
): number[]
{
	const n = items.length;
	if (n === 0) return [];
	const fee =
		typeof totalShippingFee === "number" && totalShippingFee > 0
			? totalShippingFee
			: 0;
	const values = items.map((item) =>
	{
		const unit =
			typeof item?.originalPrice === "number"
				? item.originalPrice
				: typeof item?.price === "number"
					? item.price
					: 0;
		const duty =
			typeof item?.dutyCharge === "number"
				? item.dutyCharge
				: typeof item?.duty_charge === "number"
					? item.duty_charge
					: 0;
		return (unit + duty) * (item?.quantity ?? 1);
	});
	const sumVal = values.reduce((a, b) => a + b, 0);
	if (sumVal <= 0 || fee <= 0)
	{
		const each = n > 0 ? Number((fee / n).toFixed(2)) : 0;
		return items.map(() => each);
	}
	const allocated = values.map((v) => Number(((fee * v) / sumVal).toFixed(2)));
	const drift = Number(
		(fee - allocated.reduce((a, b) => a + b, 0)).toFixed(2),
	);
	allocated[n - 1] = Number((allocated[n - 1] + drift).toFixed(2));
	return allocated;
}

export interface VvipMirrorOptions {
	userId: string;
	masterOrderId: string;
	items: any[];
	/** Shipping total in order currency */
	shippingFee: number;
	shippingAddress: Record<string, any> | undefined;
	userNameFallback?: string;
	orderStatus?: string;
}

/**
 * Builds one `users_orders/{userId}/user_orders/{orderId}_{idx}` document per cart line,
 * aligned with `UserOrder` fields used elsewhere (plus VVIP mirrors).
 */
export function buildVvipUserOrderMirrorWrites(
	opts: VvipMirrorOptions,
): Array<{ docId: string; data: Record<string, unknown> }>
{
	const {
		userId,
		masterOrderId,
		items,
		shippingFee,
		shippingAddress,
		userNameFallback = "",
		orderStatus = "pending",
	} = opts;

	const shippingAlloc = allocateShippingByItemWeights(items, shippingFee ?? 0);
	const addr = shippingAddress || {};
	const firstName =
		addr.first_name ||
		addr.firstName ||
		(userNameFallback || "").split(/\s+/).filter(Boolean)[0] ||
		"";
	const lastName =
		addr.last_name ||
		addr.lastName ||
		(userNameFallback || "").split(/\s+/).slice(1).join(" ") ||
		"";

	const nowTs = Timestamp.now();

	return items.map((item: any, idx: number) =>
	{
		const mirrorId = `${masterOrderId}_${idx}`;
		const productId = item.product_id || item.productId || item.id || "";
		const lineShipping =
			idx < shippingAlloc.length ? shippingAlloc[idx] ?? 0 : 0;

		return {
			docId: mirrorId,
			data: {
				order_id: mirrorId,
				product_order_ref: `${masterOrderId}-${productId}`,
				user_id: userId,
				product_id: productId,
				tailor_id: item.tailor_id || item.vendor?.id || item.tailor?.id || "",
				tailor_name:
					item.tailor || item.tailor_name || item.vendor?.name || "",
				title: item.title || item.name || "",
				description: item.description || "",
				price: item.price ?? item.originalPrice ?? 0,
				quantity: item.quantity ?? 1,
				size: item.size ?? null,
				color: item.color ?? null,
				images: item.images || (item.image ? [item.image] : []),
				order_status: orderStatus,
				delivery_type: "manual_transfer",
				delivery_date: new Date().toISOString(),
				shipping_fee: lineShipping,
				shipping: {
					carrier: "manual_transfer",
					createdAt: nowTs,
				},
				isVvip: true,
				payment_method: "manual_transfer",
				payment_status: "pending_verification",
				_isMirror: true,
				vvip_order_ref: masterOrderId,
				source_price:
					item.sourcePrice ?? item.source_price ?? undefined,
				source_currency:
					item.sourceCurrency ?? item.source_currency ?? undefined,
				source_original_price:
					item.sourceOriginalPrice ??
					item.source_original_price ??
					undefined,
				source_platform_commission:
					item.sourcePlatformCommission ??
					item.source_platform_commission ??
					undefined,
				original_price:
					item.originalPrice ?? item.original_price ?? undefined,
				duty_charge:
					item.dutyCharge ?? item.duty_charge ?? undefined,
				user_address: {
					first_name: firstName,
					last_name: lastName,
					street_address:
						addr.street_address || addr.streetAddress || "",
					flat_number: addr.flat_number || "",
					city: addr.city || "",
					state: addr.state || "",
					country: addr.country || "",
					country_code: addr.country_code || addr.countryCode || "",
					dial_code: addr.dial_code || addr.dialCode || "",
					post_code:
						addr.post_code || addr.postcode || "",
					phone_number:
						addr.phone_number || addr.phoneNumber || "",
				},
				created_at: nowTs,
				timestamp: nowTs,
				last_update: nowTs,
			},
		};
	});
}
