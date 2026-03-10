"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CouponInputProps {
	onApply: (code: string) => Promise<{ success: boolean; error?: string }>;
	onRemove: () => void;
	appliedCode?: string;
	discount?: number;
	discountType?: "PERCENTAGE" | "FIXED";
	formattedDiscount?: string;
	disabled?: boolean;
	className?: string;
}

export function CouponInput({
	onApply,
	onRemove,
	appliedCode,
	discount,
	discountType,
	formattedDiscount,
	disabled = false,
	className,
}: CouponInputProps) {
	const { t } = useLanguage();
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleApply = async () => {
		if (!code.trim()) {
			const errorMsg = t.checkout.coupon.error.empty;
			setError(errorMsg);
			toast.error(errorMsg);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const result = await onApply(code.trim().toUpperCase());

			if (!result.success) {
				const errorMsg = result.error || t.checkout.coupon.error.invalid;
				setError(errorMsg);
				toast.error(errorMsg);
			} else {
				setCode(""); // Clear input on success
			}
		} catch (err: any) {
			const errorMsg = err.message || t.checkout.coupon.error.failed;
			setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleRemove = () => {
		setError(null);
		setCode("");
		onRemove();
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !appliedCode) {
			e.preventDefault();
			handleApply();
		}
	};

	// If coupon is applied, show success state
	if (appliedCode) {
		return (
			<div className={cn("space-y-2", className)}>
				<div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
					<div className="flex items-center gap-3">
						<div className="flex-shrink-0">
							<CheckCircle className="h-5 w-5 text-green-600" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-green-900">
								{t.checkout.coupon.applied}
							</p>
							<p className="text-xs text-green-700 font-mono mt-0.5">
								{appliedCode}
							</p>
						</div>
						{formattedDiscount ? (
							<div className="flex-shrink-0">
								<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
									{formattedDiscount} {t.checkout.coupon.off}
								</span>
							</div>
						) : (
							discount !== undefined && (
								<div className="flex-shrink-0">
									<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
										-{discount}% {t.checkout.coupon.off}
									</span>
								</div>
							)
						)}
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleRemove}
						disabled={disabled}
						className="ml-2 text-green-700 hover:text-green-900 hover:bg-green-100"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	}

	// Input state
	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center gap-2">
				<Tag className="h-4 w-4 text-gray-500" />
				<label
					htmlFor="coupon-code"
					className="text-sm font-medium text-gray-700"
				>
					{t.checkout.coupon.label}
				</label>
			</div>

			<div className="flex gap-2">
				<div className="flex-1">
					<Input
						id="coupon-code"
						type="text"
						placeholder={t.checkout.coupon.placeholder}
						value={code}
						onChange={(e) => {
							setCode(e.target.value.toUpperCase());
							setError(null);
						}}
						onKeyPress={handleKeyPress}
						disabled={disabled || loading}
						className={cn(
							"font-mono uppercase",
							error && "border-red-300 focus:border-red-500 focus:ring-red-500",
						)}
					/>
				</div>
				<Button
					type="button"
					onClick={handleApply}
					disabled={disabled || loading || !code.trim()}
					className="bg-purple-600 hover:bg-purple-700 min-w-[100px]"
				>
					{loading ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							{t.checkout.coupon.applying}
						</>
					) : (
						t.checkout.coupon.apply
					)}
				</Button>
			</div>

			{error && (
				<div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
					<XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
					<p className="text-sm text-red-700">{error}</p>
				</div>
			)}

			<p className="text-xs text-gray-500">{t.checkout.coupon.description}</p>
		</div>
	);
}
