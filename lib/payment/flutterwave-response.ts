/**
 * Flutterwave inline checkout callback helpers.
 * Card payments often return status "successful"; bank transfer returns "completed".
 */

export function isFlutterwavePaymentSuccessful(response: unknown): boolean {
	if (!response || typeof response !== "object") return false;

	const r = response as Record<string, unknown>;
	const status = String(r.status ?? "").toLowerCase();

	if (status === "successful" || status === "completed") return true;

	if (String(r.charge_response_code ?? "") === "00") return true;

	const message = String(
		r.charge_response_message ?? r.message ?? "",
	).toLowerCase();
	if (
		message.includes("approved") ||
		message.includes("successful") ||
		message.includes("success")
	) {
		return true;
	}

	return false;
}

export function isFlutterwavePaymentCancelled(response: unknown): boolean {
	if (!response || typeof response !== "object") return false;
	const status = String((response as Record<string, unknown>).status ?? "").toLowerCase();
	return status === "cancelled" || status === "canceled";
}

/** Bank transfer / async methods may report pending before completed. */
export function isFlutterwavePaymentPending(response: unknown): boolean {
	if (!response || typeof response !== "object") return false;
	const status = String((response as Record<string, unknown>).status ?? "").toLowerCase();
	return status === "pending";
}

export function getFlutterwavePaymentRef(response: unknown): string {
	if (!response || typeof response !== "object") return "";
	const r = response as Record<string, unknown>;
	const txRef = r.tx_ref;
	if (txRef != null && String(txRef).trim() !== "") return String(txRef);
	if (r.transaction_id != null) return String(r.transaction_id);
	if (r.id != null) return String(r.id);
	return "";
}
