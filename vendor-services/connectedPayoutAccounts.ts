/**
 * Normalize Flutterwave / Paystack / Stripe records from `tailors/{id}` into table rows.
 */

export type ConnectedPayoutRow = {
	key: string;
	platform: "Flutterwave" | "Paystack" | "Stripe";
	name: string;
	details: string;
};

/** Build rows from tailor Firestore document data */
export function buildConnectedPayoutRows(
	data: Record<string, unknown>,
): ConnectedPayoutRow[]
{
	const rows: ConnectedPayoutRow[] = [];
	const seen = new Set<string>();

	const addFw = (entry: unknown, index: number) =>
	{
		if (!entry || typeof entry !== "object") return;
		const o = entry as Record<string, unknown>;
		const sid = String(o.subaccount_id ?? o.id ?? `i${index}`);
		const dedupe = `fw:${sid}`;
		if (seen.has(dedupe)) return;
		seen.add(dedupe);
		const name = String(
			o.business_name ?? o.full_name ?? o.bank_name ?? "Flutterwave subaccount",
		);
		const bank = o.bank_name ?? o.account_bank ?? "";
		const acct = o.account_number ?? "";
		const bits = [bank, acct].filter((x) => String(x).length > 0);
		const details =
			bits.length > 0 ? bits.map(String).join(" · ") : String(o.subaccount_id ?? "—");
		rows.push({ key: dedupe, platform: "Flutterwave", name, details });
	};

	if (Array.isArray(data.flutterwaveSubaccounts))
	{
		data.flutterwaveSubaccounts.forEach((e, i) => addFw(e, i));
	}
	if (data.flutterwaveSubaccount)
	{
		addFw(data.flutterwaveSubaccount, 0);
	}

	const addPs = (entry: unknown, index: number) =>
	{
		if (!entry || typeof entry !== "object") return;
		const o = entry as Record<string, unknown>;
		const code = String(o.subaccount_code ?? o.id ?? index);
		const dedupe = `ps:${code}`;
		if (seen.has(dedupe)) return;
		seen.add(dedupe);
		const name = String(o.business_name ?? "Paystack subaccount");
		const bits = [o.bank_name, o.account_number, o.subaccount_code].filter(
			(x) => x != null && String(x).length > 0,
		);
		const details = bits.length > 0 ? bits.map(String).join(" · ") : code;
		rows.push({ key: dedupe, platform: "Paystack", name, details });
	};

	if (Array.isArray(data.paystackSubaccounts))
	{
		data.paystackSubaccounts.forEach((e, i) => addPs(e, i));
	}
	if (data.paystackSubaccount)
	{
		addPs(data.paystackSubaccount, 0);
	}

	const addStripeId = (accountId: string, label?: string) =>
	{
		const dedupe = `st:${accountId}`;
		if (seen.has(dedupe)) return;
		seen.add(dedupe);
		const display =
			accountId.length > 28
				? `${accountId.slice(0, 12)}…${accountId.slice(-8)}`
				: accountId;
		rows.push({
			key: dedupe,
			platform: "Stripe",
			name: label ?? "Stripe Connect",
			details: display,
		});
	};

	if (Array.isArray(data.stripeConnectAccounts))
	{
		(data.stripeConnectAccounts as unknown[]).forEach((entry) =>
		{
			if (typeof entry === "string")
			{
				addStripeId(entry);
			} else if (entry && typeof entry === "object")
			{
				const o = entry as Record<string, unknown>;
				const id = o.accountId ?? o.id ?? o.stripeConnectAccountId;
				if (typeof id === "string" && id.length > 0)
				{
					const lab =
						typeof o.label === "string"
							? o.label
							: typeof o.email === "string"
								? o.email
								: undefined;
					addStripeId(id, lab);
				}
			}
		});
	}

	const primaryStripe =
		(typeof data.stripeConnectAccountId === "string" &&
			data.stripeConnectAccountId) ||
		(typeof data.stripeAccountId === "string" && data.stripeAccountId) ||
		"";
	if (primaryStripe)
	{
		addStripeId(primaryStripe);
	}

	const platOrder: Record<ConnectedPayoutRow["platform"], number> = {
		Flutterwave: 0,
		Paystack: 1,
		Stripe: 2,
	};
	rows.sort((a, b) =>
	{
		const po = platOrder[a.platform] - platOrder[b.platform];
		if (po !== 0) return po;
		return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
	});

	return rows;
}
