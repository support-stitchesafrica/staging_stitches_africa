"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDbInstance } from "@/firebase";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	buildConnectedPayoutRows,
	type ConnectedPayoutRow,
} from "@/vendor-services/connectedPayoutAccounts";
import { FileText, Loader2, RefreshCw } from "lucide-react";

export type PayoutAccountsSummaryTableProps = {
	/**
	 * Preferred Firestore `tailors/{id}` document ID.
	 * Falls back to `localStorage.tailorUID`, then `fallbackAuthUserId`.
	 */
	tailorId?: string | null;
	/** e.g. Firebase auth uid if LS tailorUID is empty */
	fallbackAuthUserId?: string | null;
	className?: string;
};

function resolveTailorDocId(
	tailorId: string | null | undefined,
	fallbackAuthUserId: string | null | undefined,
): string | null
{
	if (tailorId && tailorId.length > 0) return tailorId;
	if (typeof window !== "undefined")
	{
		const ls = localStorage.getItem("tailorUID");
		if (ls) return ls;
	}
	return fallbackAuthUserId ?? null;
}

export function PayoutAccountsSummaryTable({
	tailorId,
	fallbackAuthUserId,
	className,
}: PayoutAccountsSummaryTableProps)
{
	const [rows, setRows] = useState<ConnectedPayoutRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const effectiveId = resolveTailorDocId(tailorId ?? null, fallbackAuthUserId ?? null);

	const load = useCallback(async () =>
	{
		const primaryId = resolveTailorDocId(tailorId ?? null, fallbackAuthUserId ?? null);
		const secondaryId =
			primaryId && fallbackAuthUserId && fallbackAuthUserId !== primaryId
				? fallbackAuthUserId
				: null;

		if (!primaryId && !secondaryId)
		{
			setRows([]);
			setLoading(false);
			setError(null);
			return;
		}

		setLoading(true);
		setError(null);
		try
		{
			const tryRead = async (id: string) =>
			{
				const snap = await getDoc(doc(getDbInstance(), "tailors", id));
				return snap.exists() ? snap : null;
			};

			let snap = primaryId ? await tryRead(primaryId) : null;
			if (!snap && secondaryId)
			{
				snap = await tryRead(secondaryId);
			}

			if (!snap)
			{
				setRows([]);
				return;
			}
			setRows(
				buildConnectedPayoutRows(snap.data() as Record<string, unknown>),
			);
		} catch (e)
		{
			console.error("[PayoutAccountsSummaryTable]", e);
			setError("Could not load payout accounts.");
			setRows([]);
		} finally
		{
			setLoading(false);
		}
	}, [tailorId, fallbackAuthUserId]);

	useEffect(() =>
	{
		void load();
	}, [load]);

	return (
		<Card className={className}>
			<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
				<div>
					<CardTitle className="flex items-center gap-2 text-lg">
						<FileText className="h-5 w-5" />
						All payout subaccounts
					</CardTitle>
					<CardDescription>
						Flutterwave, Paystack, and Stripe connections stored on your tailor
						profile
					</CardDescription>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="shrink-0 gap-2"
					disabled={loading || (!effectiveId && !fallbackAuthUserId)}
					onClick={() => void load()}
				>
					{loading ? (
						<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
					) : (
						<RefreshCw className="h-4 w-4" aria-hidden />
					)}
					Refresh
				</Button>
			</CardHeader>
			<CardContent>
				{!effectiveId && !fallbackAuthUserId && !loading ? (
					<p className="text-sm text-muted-foreground py-6 text-center">
						Sign in as a vendor to see connected accounts.
					</p>
				) : error ? (
					<p className="text-sm text-destructive py-4 text-center">{error}</p>
				) : loading ? (
					<div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
						<Loader2 className="h-5 w-5 animate-spin" aria-hidden />
						<span>Loading accounts…</span>
					</div>
				) : rows.length === 0 ? (
					<p className="text-sm text-muted-foreground py-6 text-center">
						No payout accounts recorded yet. Create one below using Subaccounts or
						your payout setup flow.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead>Platform</TableHead>
								<TableHead>Name / label</TableHead>
								<TableHead className="min-w-[12rem]">Bank account / ID</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.key}>
									<TableCell>
										<Badge
											variant="outline"
											className={
												row.platform === "Flutterwave"
													? "border-orange-200 bg-orange-50 text-orange-900"
													: row.platform === "Paystack"
														? "border-sky-200 bg-sky-50 text-sky-900"
														: "border-violet-200 bg-violet-50 text-violet-900"
											}
										>
											{row.platform}
										</Badge>
									</TableCell>
									<TableCell className="font-medium text-gray-900 max-w-[14rem]">
										<span className="break-words">{row.name}</span>
									</TableCell>
									<TableCell className="text-gray-600 whitespace-normal max-w-xl">
										<code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
											{row.details}
										</code>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
