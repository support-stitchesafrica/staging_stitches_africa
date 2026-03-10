"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingBag, Store, ArrowLeft, LogIn, UserPlus } from "lucide-react";

interface AuthSelectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAuthAction?: () => void;
}

type AuthStep = "SELECT_TYPE" | "VENDOR_ACTION";

export function AuthSelectionDialog({
	open,
	onOpenChange,
	onAuthAction,
}: AuthSelectionDialogProps) {
	const router = useRouter();
	const [step, setStep] = useState<AuthStep>("SELECT_TYPE");

	const handleCustomerClick = () => {
		onAuthAction?.();
		onOpenChange(false);
		router.push("/shops/auth");
		// Reset step after closing
		setTimeout(() => setStep("SELECT_TYPE"), 300);
	};

	const handleVendorClick = () => {
		setStep("VENDOR_ACTION");
	};

	const handleVendorSignIn = () => {
		onAuthAction?.();
		onOpenChange(false);
		router.push("/vendor");
		setTimeout(() => setStep("SELECT_TYPE"), 300);
	};

	const handleVendorSignUp = () => {
		onAuthAction?.();
		onOpenChange(false);
		router.push("/vendor/signup");
		setTimeout(() => setStep("SELECT_TYPE"), 300);
	};

	const handleBack = () => {
		setStep("SELECT_TYPE");
	};

	// Reset step when dialog closes purely via onOpenChange (e.g. clicking outside)
	React.useEffect(() => {
		if (!open) {
			const timer = setTimeout(() => setStep("SELECT_TYPE"), 300);
			return () => clearTimeout(timer);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md !bg-white !text-gray-900 border-0 shadow-xl"
				style={{ backgroundColor: "#ffffff", color: "#1f2937" }}
			>
				<DialogHeader className="!text-center relative">
					{step !== "SELECT_TYPE" && (
						<button
							onClick={handleBack}
							className="absolute left-0 top-0 p-2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none focus:outline-none"
							aria-label="Back"
						>
							<ArrowLeft size={20} />
						</button>
					)}
					<DialogTitle
						className="!text-2xl !font-bold !text-center !text-gray-900"
						style={{ color: "#1f2937" }}
					>
						{step === "SELECT_TYPE"
							? "Choose Your Account Type"
							: "Vendor Access"}
					</DialogTitle>
					<DialogDescription
						className="!text-center !pt-2 !text-gray-600"
						style={{ color: "#6b7280" }}
					>
						{step === "SELECT_TYPE"
							? "Select how you'd like to join Stitches Africa"
							: "Log in to your existing account or create a new one"}
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-1 gap-4 py-6">
					{step === "SELECT_TYPE" ? (
						<>
							{/* Customer Option */}
							<button
								onClick={handleCustomerClick}
								className="group relative flex flex-col items-center justify-center p-6 !border-2 !border-gray-200 rounded-lg hover:!border-black hover:!bg-gray-50 transition-all duration-200 text-left !bg-white"
								style={{
									backgroundColor: "#ffffff",
									border: "2px solid #e5e7eb",
								}}
							>
								<div className="flex items-center gap-4 w-full">
									<div className="shrink-0 w-12 h-12 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
										<ShoppingBag
											className="w-6 h-6 !text-gray-700 group-hover:!text-black"
											style={{ color: "#374151" }}
										/>
									</div>
									<div className="flex-1">
										<h3
											className="!font-semibold !text-lg !text-gray-900 group-hover:!text-black"
											style={{ color: "#1f2937" }}
										>
											Shop as a Customer
										</h3>
										<p
											className="!text-sm !text-gray-600 mt-1"
											style={{ color: "#6b7280" }}
										>
											Browse and purchase from our collection
										</p>
									</div>
									<div className="shrink-0">
										<svg
											className="w-5 h-5 !text-gray-400 group-hover:!text-black transition-colors"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											style={{ color: "#9ca3af" }}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</div>
								</div>
							</button>

							{/* Vendor Option */}
							<button
								onClick={handleVendorClick}
								className="group relative flex flex-col items-center justify-center p-6 !border-2 !border-gray-200 rounded-lg hover:!border-black hover:!bg-gray-50 transition-all duration-200 text-left !bg-white"
								style={{
									backgroundColor: "#ffffff",
									border: "2px solid #e5e7eb",
								}}
							>
								<div className="flex items-center gap-4 w-full">
									<div className="shrink-0 w-12 h-12 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
										<Store
											className="w-6 h-6 !text-gray-700 group-hover:!text-black"
											style={{ color: "#374151" }}
										/>
									</div>
									<div className="flex-1">
										<h3
											className="!font-semibold !text-lg !text-gray-900 group-hover:!text-black"
											style={{ color: "#1f2937" }}
										>
											Sell as a Vendor
										</h3>
										<p
											className="!text-sm !text-gray-600 mt-1"
											style={{ color: "#6b7280" }}
										>
											List your products and reach customers
										</p>
									</div>
									<div className="shrink-0">
										<svg
											className="w-5 h-5 !text-gray-400 group-hover:!text-black transition-colors"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											style={{ color: "#9ca3af" }}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</div>
								</div>
							</button>
						</>
					) : (
						<>
							{/* Vendor Sign In */}
							<button
								onClick={handleVendorSignIn}
								className="group relative flex flex-col items-center justify-center p-6 !border-2 !border-gray-200 rounded-lg hover:!border-black hover:!bg-gray-50 transition-all duration-200 text-left !bg-white"
								style={{
									backgroundColor: "#ffffff",
									border: "2px solid #e5e7eb",
								}}
							>
								<div className="flex items-center gap-4 w-full">
									<div className="shrink-0 w-12 h-12 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
										<LogIn className="w-6 h-6 !text-blue-700 group-hover:!text-blue-900" />
									</div>
									<div className="flex-1">
										<h3
											className="!font-semibold !text-lg !text-gray-900 group-hover:!text-black"
											style={{ color: "#1f2937" }}
										>
											Vendor Login
										</h3>
										<p
											className="!text-sm !text-gray-600 mt-1"
											style={{ color: "#6b7280" }}
										>
											Already have an account? Sign in here
										</p>
									</div>
									<div className="shrink-0">
										<svg
											className="w-5 h-5 !text-gray-400 group-hover:!text-black transition-colors"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											style={{ color: "#9ca3af" }}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</div>
								</div>
							</button>

							{/* Vendor Sign Up */}
							<button
								onClick={handleVendorSignUp}
								className="group relative flex flex-col items-center justify-center p-6 !border-2 !border-gray-200 rounded-lg hover:!border-black hover:!bg-gray-50 transition-all duration-200 text-left !bg-white"
								style={{
									backgroundColor: "#ffffff",
									border: "2px solid #e5e7eb",
								}}
							>
								<div className="flex items-center gap-4 w-full">
									<div className="shrink-0 w-12 h-12 rounded-full bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition-colors">
										<UserPlus className="w-6 h-6 !text-green-700 group-hover:!text-green-900" />
									</div>
									<div className="flex-1">
										<h3
											className="!font-semibold !text-lg !text-gray-900 group-hover:!text-black"
											style={{ color: "#1f2937" }}
										>
											Become a Vendor
										</h3>
										<p
											className="!text-sm !text-gray-600 mt-1"
											style={{ color: "#6b7280" }}
										>
											Join us and reach global customers
										</p>
									</div>
									<div className="shrink-0">
										<svg
											className="w-5 h-5 !text-gray-400 group-hover:!text-black transition-colors"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											style={{ color: "#9ca3af" }}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</div>
								</div>
							</button>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
