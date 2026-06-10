import { MintsoftOrder } from "@/types/mintsoft";

/** Internal shape after normalizing checkout / Postman payloads. */
export type NormalizedMintsoftInput = {
	orderId: string;
	/** Mintsoft client id — required for admin API users. */
	clientId?: number;
	email: string;
	phone: string;
	currency: string;
	total: number;
	shipping: {
		firstName: string;
		lastName: string;
		address1: string;
		address2?: string;
		city: string;
		state?: string;
		postalCode: string;
		countryCode: string;
	};
	items: { sku: string; quantity: number; price: number }[];
};

function str(v: unknown): string {
	if (v == null) return "";
	return String(v).trim();
}

function num(v: unknown): number {
	if (typeof v === "number" && !Number.isNaN(v)) return v;
	const n = Number(v);
	return Number.isNaN(n) ? 0 : n;
}

/**
 * Accepts camelCase or snake_case (and common checkout aliases) so the same
 * route works from Postman and from app payloads.
 */
export function normalizeMintsoftRequestBody(
	body: unknown,
): NormalizedMintsoftInput {
	if (!body || typeof body !== "object") {
		throw new Error("Request body must be a JSON object");
	}
	const b = body as Record<string, unknown>;

	const shippingRaw = (b.shipping ??
		b.shippingAddress ??
		b.shipping_address) as Record<string, unknown> | undefined;
	if (!shippingRaw || typeof shippingRaw !== "object") {
		throw new Error(
			"Missing shipping object (shipping, shippingAddress, or shipping_address)",
		);
	}

	const orderId = str(b.orderId ?? b.order_id ?? b.id);
	if (!orderId) {
		throw new Error("Missing orderId (orderId, order_id, or id)");
	}

	const clientIdRaw = b.clientId ?? b.client_id ?? b.ClientId;
	const clientIdFromBody =
		clientIdRaw != null && clientIdRaw !== ""
			? num(clientIdRaw)
			: undefined;
	const clientIdFromEnv = (() => {
		const raw = process.env.MINTSOFT_CLIENT_ID?.trim();
		if (!raw) return undefined;
		const n = Number(raw);
		return Number.isFinite(n) && n > 0 ? n : undefined;
	})();
	const clientId =
		clientIdFromBody && clientIdFromBody > 0
			? clientIdFromBody
			: clientIdFromEnv;

	const email = str(b.email);
	if (!email) {
		throw new Error("Missing email");
	}

	const phone = str(b.phone ?? b.phoneNumber ?? b.phone_number ?? "");

	const currency = str(b.currency ?? "GBP") || "GBP";

	const total = num(b.total ?? b.orderTotal ?? b.order_total ?? b.amount);
	if (total <= 0) {
		throw new Error("Missing or invalid total");
	}

	const firstName = str(shippingRaw.firstName ?? shippingRaw.first_name);
	const lastName = str(shippingRaw.lastName ?? shippingRaw.last_name);
	const address1 = str(
		shippingRaw.address1 ??
			shippingRaw.street_address ??
			shippingRaw.streetAddress ??
			shippingRaw.line1 ??
			shippingRaw.address_line1,
	);
	const city = str(shippingRaw.city ?? shippingRaw.town);
	const state = str(shippingRaw.state ?? shippingRaw.county ?? "");
	const postalCode = str(
		shippingRaw.postalCode ??
			shippingRaw.post_code ??
			shippingRaw.postCode ??
			shippingRaw.zip ??
			shippingRaw.zipcode,
	);
	const countryCode = str(
		shippingRaw.countryCode ??
			shippingRaw.country_code ??
			b.countryCode ??
			b.country_code,
	).toUpperCase();

	if (!firstName || !lastName) {
		throw new Error(
			"Shipping firstName/lastName (or first_name/last_name) required",
		);
	}
	if (!address1) {
		throw new Error("Shipping address line required");
	}
	if (!city) {
		throw new Error("Shipping city required");
	}
	if (!postalCode) {
		throw new Error("Shipping postal code required");
	}
	if (!countryCode) {
		throw new Error(
			"Shipping countryCode (or country_code) or top-level country required",
		);
	}

	const itemsRaw = (b.items ??
		b.cartItems ??
		b.cart_items ??
		b.lineItems) as unknown;
	if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
		throw new Error("items must be a non-empty array");
	}

	const items = itemsRaw.map((raw: unknown, i: number) => {
		if (!raw || typeof raw !== "object") {
			throw new Error(`items[${i}] invalid`);
		}
		const item = raw as Record<string, unknown>;
		const sku = str(
			item.mintsoft_sku ??
				item.mintsoftSku ??
				item.sku ??
				item.SKU,
		);
		const quantity = num(item.quantity ?? item.qty);
		const price = num(item.price ?? item.unitPrice ?? item.unit_price);
		if (!sku) {
			throw new Error(
				`items[${i}]: missing mintsoft_sku (or sku) for Mintsoft line item`,
			);
		}
		if (quantity <= 0) {
			throw new Error(`items[${i}]: invalid quantity`);
		}
		if (price < 0) {
			throw new Error(`items[${i}]: invalid price`);
		}
		return { sku, quantity, price };
	});

	const address2 =
		str(
			shippingRaw.address2 ??
				shippingRaw.flat_number ??
				shippingRaw.address_line2,
		) || undefined;

	return {
		orderId,
		clientId,
		email,
		phone,
		currency,
		total,
		shipping: {
			firstName,
			lastName,
			address1,
			address2,
			city,
			state: state || undefined,
			postalCode,
			countryCode,
		},
		items,
	};
}

export const mapToMintsoftOrder = (
	order: NormalizedMintsoftInput,
): MintsoftOrder => {
	const courier =
		process.env.MINTSOFT_COURIER_SERVICE?.trim() ||
		"DPD Next Day (Standard Delivery)";
	const warehouse =
		process.env.MINTSOFT_WAREHOUSE?.trim() || "Mission Logix";

	const payload: MintsoftOrder = {
		OrderNumber: order.orderId,
		ExternalOrderReference: order.orderId,
		FirstName: order.shipping.firstName,
		LastName: order.shipping.lastName,

		Email: order.email,
		Phone: order.phone,

		Address1: order.shipping.address1,
		Address2: order.shipping.address2,

		Town: order.shipping.city,
		County: order.shipping.state,

		PostCode: order.shipping.postalCode,
		Country: order.shipping.countryCode,

		CourierService: courier,
		Warehouse: warehouse,

		Currency: order.currency,

		OrderValue: order.total,

		OrderItems: order.items.map((item) => ({
			SKU: item.sku,
			Quantity: item.quantity,
			UnitPrice: item.price,
			UnitPriceVat: 0,
		})),
	};

	if (order.clientId) {
		payload.ClientId = order.clientId;
	}

	return payload;
};
