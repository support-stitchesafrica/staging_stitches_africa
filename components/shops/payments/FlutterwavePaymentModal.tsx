"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, AlertCircle } from "lucide-react";
import { PaymentData } from "@/lib/payment-service";

interface FlutterwavePaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	paymentData: PaymentData;
	onSuccess: (transactionId: string) => void;
	onError: (error: string) => void;
}

declare global {
	interface Window {
		FlutterwaveCheckout: any;
	}
}

export default function FlutterwavePaymentModal({
	isOpen,
	onClose,
	paymentData,
	onSuccess,
	onError,
}: FlutterwavePaymentModalProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const flutterwaveInstanceRef = useRef<any>(null);

	// Initialize payment when modal opens
	useEffect(() => {
		if (isOpen) {
			initializePayment();
		}
	}, [isOpen]);

	// Load Flutterwave script - runs every time component mounts
	useEffect(() => {
		const loadFlutterwaveScript = () => {
			// If script already loaded, don't load again
			if (window.FlutterwaveCheckout) {
				return;
			}

			// Remove any existing Flutterwave scripts first
			const existingScripts = Array.from(document.scripts).filter((s) =>
				s.src.includes("checkout.flutterwave.com"),
			);
			existingScripts.forEach((s) => s.remove());

			// Create new script
			const script = document.createElement("script");
			script.src = "https://checkout.flutterwave.com/v3.js";
			script.async = true;
			document.body.appendChild(script);

			return () => {
				if (document.body.contains(script)) {
					document.body.removeChild(script);
				}
			};
		};

		loadFlutterwaveScript();
	}, [isOpen]);

	const initializePayment = async () => {
		setLoading(true);
		setError(null);

		try {
			// Wait for Flutterwave script to load
			let attempts = 0;
			while (!window.FlutterwaveCheckout && attempts < 50) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				attempts++;
			}

			if (!window.FlutterwaveCheckout) {
				throw new Error(
					"Flutterwave payment system is not loaded. Please refresh and try again.",
				);
			}

			// Convert currency to lowercase for Flutterwave
			const flutterwaveCurrency = paymentData.currency.toLowerCase();

			// Build Flutterwave hosted link URL for modal-like popup behavior
			const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
			const redirectUrl = `${baseUrl}/api/flutterwave/callback`;

			// Initialize Flutterwave Checkout - renders as a modal
			window.FlutterwaveCheckout({
				public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
				tx_ref: paymentData.orderId,
				amount: paymentData.amount,
				currency: flutterwaveCurrency,
				payment_options: "card,mobilemoney,ussd",
				customer: {
					email: paymentData.email,
					phone_number: paymentData.phone || "",
					name: paymentData.name,
				},
				customizations: {
					title: "Stitches Africa",
					description: paymentData.description,
					logo: "https://www.stitchesafrica.com/logo.png",
				},
				callback: handleFlutterwaveResponse,
				onclose: handleModalClose,
			});

			// Once checkout is opened, we can stop loading
			setLoading(false);
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to initialize Flutterwave payment";
			setError(errorMessage);
			onError(errorMessage);
			setLoading(false);
		}
	};

	const handleFlutterwaveResponse = (response: any) => {
		console.log("Flutterwave response:", response);

		if (response.status === "successful") {
			// Payment was successful
			console.log(
				"✅ Flutterwave payment successful:",
				response.transaction_id,
			);
			// Ensure transactionId is a string
			onSuccess(String(response.transaction_id));
			handleClose();
		} else if (response.status === "cancelled") {
			// User cancelled the payment - just close silently
			console.log("User cancelled Flutterwave payment");
			handleClose();
		} else {
			// Payment failed
			const errorMessage =
				response.message || "Payment failed. Please try again.";
			console.error("Flutterwave payment failed:", errorMessage);
			setError(errorMessage);
			onError(errorMessage);
			setLoading(false);
		}
	};

	const handleModalClose = () => {
		// Called when user closes the Flutterwave modal via X button
		// Just close our component wrapper - Flutterwave will handle its own cleanup
		console.log("Flutterwave modal closed by user");
		handleClose();
	};

	const handleClose = () => {
		setError(null);
		setLoading(false);

		// Remove any Flutterwave overlays from the DOM
		const flutterwaveOverlays = document.querySelectorAll(
			'[class*="flw"], [id*="flw"], iframe[src*="flutterwave"], [class*="rave"]',
		);
		flutterwaveOverlays.forEach((overlay) => {
			try {
				overlay.remove();
			} catch (e) {
				console.log("Could not remove overlay:", e);
			}
		});

		// Reset Flutterwave script state so it can be reinitialized
		if (window.FlutterwaveCheckout) {
			// Clear the reference to force a fresh initialization next time
			delete (window as any).FlutterwaveCheckout;
		}

		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Only show loading state while initializing - Flutterwave will take over the fullscreen */}
			{loading && (
				<div className="fixed inset-0 bg-white flex items-center justify-center z-50">
					<div className="flex flex-col items-center justify-center space-y-4">
						<div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black"></div>
						<span className="text-gray-600 font-medium">
							Initializing Flutterwave payment...
						</span>
					</div>
				</div>
			)}

			{/* Error state with retry option */}
			{error && !loading && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
						<div className="p-6">
							<div className="flex justify-center mb-4">
								<AlertCircle className="text-red-600" size={48} />
							</div>
							<h3 className="text-lg font-semibold text-center mb-2">
								Payment Error
							</h3>
							<p className="text-gray-600 text-center mb-6 text-sm">{error}</p>
							<div className="flex gap-3">
								<button
									onClick={handleClose}
									className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
								>
									Cancel
								</button>
								<button
									onClick={initializePayment}
									className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
								>
									Try Again
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
