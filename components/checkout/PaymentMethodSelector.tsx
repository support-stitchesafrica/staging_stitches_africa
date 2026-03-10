"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import Image from "next/image";

export type PaymentMethodType = {
	provider: "stripe" | "flutterwave" | "paystack";
	currency: "USD" | "NGN";
};

interface PaymentMethodSelectorProps {
	selectedProvider: "stripe" | "flutterwave" | "paystack";
	selectedCurrency: "USD" | "NGN";
	onSelect: (method: PaymentMethodType) => void;
	disabled?: boolean;
	className?: string;
}

export function PaymentMethodSelector({
	selectedProvider,
	selectedCurrency,
	onSelect,
	disabled = false,
	className,
}: PaymentMethodSelectorProps) {
	const { t } = useLanguage();

	const methods: {
		id: string;
		provider: "stripe" | "flutterwave" | "paystack";
		currency: "USD" | "NGN";
		title: string;
		description: string;
		icon?: React.ReactNode;
	}[] = [
		{
			id: "stripe-usd",
			provider: "stripe",
			currency: "USD",
			title: t.checkout.paymentMethods.stripe.title, // "Stripe (USD)"
			description: t.checkout.paymentMethods.stripe.description, // "Credit/Debit Cards"
			icon: <CreditCard className="h-5 w-5 text-gray-600" />,
		},
		{
			id: "flutterwave-usd",
			provider: "flutterwave",
			currency: "USD",
			title: `${t.checkout.paymentMethods.flutterwave.title} (USD)`,
			description: t.checkout.paymentMethods.flutterwave.international, // "International Cards"
			icon: <CreditCard className="h-5 w-5 text-blue-600" />,
		},
		{
			id: "flutterwave-ngn",
			provider: "flutterwave",
			currency: "NGN",
			title: `${t.checkout.paymentMethods.flutterwave.title} (NGN)`,
			description: t.checkout.paymentMethods.flutterwave.description, // "Naira Cards & Transfer"
			icon: <CreditCard className="h-5 w-5 text-orange-600" />,
		},
		{
			id: "paystack-ngn",
			provider: "paystack",
			currency: "NGN",
			title: t.checkout.paymentMethods.paystack.title, // "Paystack (NGN)"
			description: t.checkout.paymentMethods.paystack.description, // "Naira Cards, Bank Transfer, USSD"
			icon: <CreditCard className="h-5 w-5 text-green-600" />,
		},
	];

	return (
		<div className={cn("space-y-4", className)}>
			<h3 className="font-semibold text-lg text-gray-900">
				{t.checkout.paymentMethods.choosePaymentMethod}
			</h3>

			<div className="space-y-3">
				{methods.map((method) => {
					const isSelected =
						selectedProvider === method.provider &&
						selectedCurrency === method.currency;

					return (
						<div
							key={method.id}
							onClick={() =>
								!disabled &&
								onSelect({
									provider: method.provider,
									currency: method.currency,
								})
							}
							className={cn(
								"relative flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200",
								isSelected
									? "border-black ring-1 ring-black bg-gray-50/50"
									: "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
								disabled && "opacity-60 cursor-not-allowed",
							)}
						>
							<div className="flex-shrink-0 mr-4 p-2 bg-gray-100 rounded-lg">
								{method.icon}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-base font-medium text-gray-900">
									{method.title}
								</p>
								<p className="text-sm text-gray-500">{method.description}</p>
							</div>
							<div className="flex-shrink-0 ml-4">
								<div
									className={cn(
										"h-5 w-5 rounded-full border flex items-center justify-center",
										isSelected
											? "border-black bg-black text-white"
											: "border-gray-300",
									)}
								>
									{isSelected && (
										<div className="h-2 w-2 rounded-full bg-white" />
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 rounded-lg text-xs text-gray-500">
				<ShieldCheck className="h-4 w-4 text-green-600" />
				<span>{t.checkout.paymentMethods.secureCheckout}</span>
			</div>
		</div>
	);
}
