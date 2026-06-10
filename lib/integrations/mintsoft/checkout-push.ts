import { isEuropeanOrder } from "@/lib/europe";
import { getMintsoftSkuFromCartItem } from "@/lib/integrations/mintsoft/mintsoft-fields";
import {
	buildMintsoftBodyForUnityItems,
	filterUnityCupCartItems,
	getShippingCountryCodeFromAddress,
	type CartLikeForUnity,
} from "@/lib/integrations/mintsoft/unityCup";

type AddressForMintsoft = Parameters<typeof buildMintsoftBodyForUnityItems>[0]["address"];

/**
 * After a successful shop/storefront order, push only Unity Cup lines to Mintsoft
 * when shipping is in the EU list. Non-blocking callers should `.catch(...)`.
 */
export async function pushUnityCupMintsoftAfterCheckout(args: {
	baseUrl: string;
	idToken: string;
	orderId: string;
	userId?: string;
	items: CartLikeForUnity[];
	address: AddressForMintsoft;
	email: string;
	phone: string;
	currency: string;
}): Promise<void> {
	const country = getShippingCountryCodeFromAddress(args.address);
	console.log("[Mintsoft] checkout shipping countryCode:", country);

	const unityItems = filterUnityCupCartItems(args.items);
	if (unityItems.length === 0) {
		console.log(
			"[Mintsoft] skip push: no Unity Cup (Mission Logix vendor) line items",
		);
		return;
	}

	if (!isEuropeanOrder(country)) {
		console.log(
			"[Mintsoft] skip push: country not eligible for Mission Logix / Mintsoft",
			country,
		);
		return;
	}

	const body = {
		...buildMintsoftBodyForUnityItems({
			orderId: args.orderId,
			email: args.email,
			phone: args.phone,
			currency: args.currency,
			address: args.address,
			unityItems: unityItems.map((item) => {
				const mintsoftSku = getMintsoftSkuFromCartItem(item);
				return { item, mintsoftSku };
			}),
		}),
		userId: args.userId,
	};

	const url = `${args.baseUrl.replace(/\/$/, "")}/api/integrations/mintsoft/push-order`;
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${args.idToken}`,
		},
		body: JSON.stringify(body),
	});

	const data: unknown = await res.json().catch(() => ({}));
	if (!res.ok) {
		console.error("[Mintsoft] push-order failed", res.status, data);
		throw new Error(
			typeof data === "object" &&
				data !== null &&
				"error" in data &&
				typeof (data as { error?: string }).error === "string"
				? (data as { error: string }).error
				: `Mintsoft push failed (${res.status})`,
		);
	}
	console.log("[Mintsoft] push-order success", data);
}
