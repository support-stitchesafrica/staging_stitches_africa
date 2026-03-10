"use client";

import React, { useState } from "react";
import {
	X,
	User,
	UserPlus,
	Loader2,
	Mail,
	Phone,
	MapPin,
	Check,
} from "lucide-react";
import { UserAddress } from "@/types";

interface GuestCheckoutModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSignIn: () => void;
	onGuestCheckout: (guestData: GuestCheckoutData) => Promise<void>;
}

export interface GuestCheckoutData {
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	address: Omit<UserAddress, "id" | "createdAt" | "updatedAt">;
}

type ModalView = "choice" | "guest-form";

export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({
	isOpen,
	onClose,
	onSignIn,
	onGuestCheckout,
}) => {
	const [view, setView] = useState<ModalView>("choice");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [termsAccepted, setTermsAccepted] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		email: "",
		firstName: "",
		lastName: "",
		phoneNumber: "",
		address: "",
		city: "",
		state: "",
		country: "Nigeria",
		countryCode: "NG",
		dialCode: "+234",
		postCode: "",
	});

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error for this field
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Explicitly allow space key
		if (e.key === " ") {
			e.stopPropagation();
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!emailRegex.test(formData.email)) {
			newErrors.email = "Please enter a valid email";
		}

		// Name validation
		if (!formData.firstName.trim()) {
			newErrors.firstName = "First name is required";
		}
		if (!formData.lastName.trim()) {
			newErrors.lastName = "Last name is required";
		}

		// Phone validation
		if (!formData.phoneNumber.trim()) {
			newErrors.phoneNumber = "Phone number is required";
		}

		// Address validation
		if (!formData.address.trim()) {
			newErrors.address = "Address is required";
		}
		if (!formData.city.trim()) {
			newErrors.city = "City is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleGuestCheckout = async () => {
		console.log("[GuestCheckoutModal] handleGuestCheckout called");

		if (!validateForm()) {
			console.log("[GuestCheckoutModal] Form validation failed");
			return;
		}

		console.log("[GuestCheckoutModal] Form validated successfully");
		setLoading(true);

		try {
			const guestData: GuestCheckoutData = {
				email: formData.email,
				firstName: formData.firstName.trim(),
				lastName: formData.lastName.trim(),
				phoneNumber: `${formData.dialCode}${formData.phoneNumber}`,
				address: {
					first_name: formData.firstName.trim(),
					last_name: formData.lastName.trim(),
					street_address: formData.address,
					flat_number: "",
					city: formData.city,
					state: formData.state || formData.city,
					country: formData.country,
					country_code: formData.countryCode,
					dial_code: formData.dialCode,
					phone_number: `${formData.dialCode}${formData.phoneNumber}`,
					post_code: formData.postCode,
					is_default: true,
					label: "Home",
				},
			};

			console.log("[GuestCheckoutModal] Guest data prepared:", guestData);
			console.log("[GuestCheckoutModal] Calling onGuestCheckout handler...");

			await onGuestCheckout(guestData);

			console.log(
				"[GuestCheckoutModal] onGuestCheckout completed successfully"
			);
			// Don't close modal here - let the parent component handle redirect
			// onClose();
		} catch (error: any) {
			console.error("[GuestCheckoutModal] Error during guest checkout:", error);
			setErrors({
				general: error.message || "Failed to process guest checkout",
			});
			setLoading(false);
		}
		// Don't set loading to false in finally - keep it spinning during redirect
	};

	const handleSignInClick = () => {
		onClose();
		onSignIn();
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center p-4"
			onKeyDown={(e) => {
				// Prevent modal from capturing space key
				if (e.key === " " && e.target !== e.currentTarget) {
					e.stopPropagation();
				}
			}}
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[61]">
				{/* Header */}
				<div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
					<h2 className="text-2xl font-bold text-gray-900">
						{view === "choice" ? "Checkout Options" : "Guest Checkout"}
					</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{view === "choice" ? (
						/* Choice View */
						<div className="space-y-4">
							<p className="text-gray-600 text-center mb-6">
								How would you like to proceed with your order?
							</p>

							{/* Sign In Option */}
							<div
								onClick={handleSignInClick}
								className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group select-none cursor-pointer"
							>
								<div className="flex items-center gap-4">
									<div className="p-3 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors">
										<User size={24} className="text-primary-600" />
									</div>
									<div className="text-left flex-1">
										<h3 className="font-bold text-lg text-gray-900 mb-1">
											Sign In
										</h3>
										<p className="text-sm text-gray-600">
											Already have an account? Sign in to access your saved
											information and order history.
										</p>
									</div>
								</div>
							</div>

							{/* Guest Checkout Option */}
							<div
								onClick={() => setView("guest-form")}
								className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group select-none cursor-pointer"
							>
								<div className="flex items-center gap-4">
									<div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
										<UserPlus size={24} className="text-green-600" />
									</div>
									<div className="text-left flex-1">
										<h3 className="font-bold text-lg text-gray-900 mb-1">
											Continue as Guest
										</h3>
										<p className="text-sm text-gray-600">
											Checkout quickly without creating an account. We'll create
											one for you and send login details.
										</p>
									</div>
								</div>
							</div>
						</div>
					) : (
						/* Guest Form View */
						<div className="space-y-4">
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
								<p className="text-xs text-blue-800">
									We'll create an account and email your login credentials.
								</p>
							</div>

							{errors.general && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-3">
									<p className="text-sm text-red-800">{errors.general}</p>
								</div>
							)}

							{/* Form Fields */}
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											First Name *
										</label>
										<input
											type="text"
											name="firstName"
											autoComplete="given-name"
											value={formData.firstName}
											onChange={(e) =>
												handleInputChange("firstName", e.target.value)
											}
											className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
												errors.firstName ? "border-red-500" : "border-gray-300"
											}`}
											placeholder="Adebayo"
										/>
										{errors.firstName && (
											<p className="text-sm text-red-600 mt-1">
												{errors.firstName}
											</p>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Last Name *
										</label>
										<input
											type="text"
											name="lastName"
											autoComplete="family-name"
											value={formData.lastName}
											onChange={(e) =>
												handleInputChange("lastName", e.target.value)
											}
											className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
												errors.lastName ? "border-red-500" : "border-gray-300"
											}`}
											placeholder="Okafor"
										/>
										{errors.lastName && (
											<p className="text-sm text-red-600 mt-1">
												{errors.lastName}
											</p>
										)}
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Email Address *
									</label>
									<input
										type="email"
										name="email"
										autoComplete="email"
										value={formData.email}
										onChange={(e) => handleInputChange("email", e.target.value)}
										className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
											errors.email ? "border-red-500" : "border-gray-300"
										}`}
										placeholder="adebayo@example.com"
									/>
									{errors.email && (
										<p className="text-sm text-red-600 mt-1">{errors.email}</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Phone Number *
									</label>
									<div className="flex gap-2">
										<select
											name="dialCode"
											value={formData.dialCode}
											onChange={(e) =>
												handleInputChange("dialCode", e.target.value)
											}
											className="w-24 px-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										>
											<option value="+234">🇳🇬 +234</option>
											<option value="+1">🇺🇸 +1</option>
											<option value="+44">🇬🇧 +44</option>
											<option value="+254">🇰🇪 +254</option>
											<option value="+27">🇿🇦 +27</option>
											<option value="+233">🇬🇭 +233</option>
										</select>
										<input
											type="tel"
											name="phoneNumber"
											autoComplete="tel-national"
											value={formData.phoneNumber}
											onChange={(e) =>
												handleInputChange("phoneNumber", e.target.value)
											}
											className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
												errors.phoneNumber
													? "border-red-500"
													: "border-gray-300"
											}`}
											placeholder="8012345678"
										/>
									</div>
									{errors.phoneNumber && (
										<p className="text-sm text-red-600 mt-1">
											{errors.phoneNumber}
										</p>
									)}
								</div>
							</div>

							{/* Shipping Address */}
							<div className="space-y-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Address *
									</label>
									<input
										type="text"
										name="address"
										autoComplete="street-address"
										value={formData.address}
										onChange={(e) =>
											handleInputChange("address", e.target.value)
										}
										className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
											errors.address ? "border-red-500" : "border-gray-300"
										}`}
										placeholder="15 Ademola Street, Flat 3"
									/>
									{errors.address && (
										<p className="text-sm text-red-600 mt-1">
											{errors.address}
										</p>
									)}
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											City *
										</label>
										<input
											type="text"
											name="city"
											autoComplete="address-level2"
											value={formData.city}
											onChange={(e) =>
												handleInputChange("city", e.target.value)
											}
											className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
												errors.city ? "border-red-500" : "border-gray-300"
											}`}
											placeholder="Lagos"
										/>
										{errors.city && (
											<p className="text-sm text-red-600 mt-1">{errors.city}</p>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											State / Postal Code
										</label>
										<input
											type="text"
											name="state"
											autoComplete="address-level1"
											value={formData.state}
											onChange={(e) =>
												handleInputChange("state", e.target.value)
											}
											className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
											placeholder="Lagos 100001"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Country
									</label>
									<select
										name="country"
										autoComplete="country-name"
										value={formData.country}
										onChange={(e) =>
											handleInputChange("country", e.target.value)
										}
										className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									>
										<option value="Nigeria">Nigeria</option>
										<option value="Kenya">Kenya</option>
										<option value="Ghana">Ghana</option>
										<option value="South Africa">South Africa</option>
										<option value="United States">United States</option>
										<option value="United Kingdom">United Kingdom</option>
									</select>
								</div>
							</div>

							{/* Disclaimer */}
							<div
								className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
									termsAccepted
										? "bg-blue-50 border-blue-500"
										: "bg-gray-50 border-gray-200 hover:border-gray-300"
								}`}
								onClick={() => setTermsAccepted(!termsAccepted)}
							>
								<div className="flex gap-3">
									<div
										className={`
                    flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5
                    ${
											termsAccepted
												? "bg-blue-500 border-blue-500"
												: "bg-white border-gray-300"
										}
                  `}
									>
										{termsAccepted && (
											<Check size={14} className="text-white" strokeWidth={3} />
										)}
									</div>
									<div className="text-sm">
										<p
											className={`font-medium mb-1 ${
												termsAccepted ? "text-blue-900" : "text-gray-900"
											}`}
										>
											Guest Checkout Note
										</p>
										<p
											className={`${
												termsAccepted ? "text-blue-800" : "text-gray-600"
											}`}
										>
											By continuing as a guest, you agree that we will save your
											contact details to track your order and provide you with
											the best possible service. Specific actions may
											automatically create an account for you.
										</p>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-3 pt-4">
								<button
									onClick={() => setView("choice")}
									className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
									disabled={loading}
								>
									Back
								</button>
								<button
									onClick={handleGuestCheckout}
									disabled={loading || !termsAccepted}
									className="flex-1 px-6 py-3 bg-gradient-to-r from-black to-gray-800 text-white font-semibold rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									{loading ? (
										<>
											<Loader2 size={20} className="animate-spin" />
											Processing...
										</>
									) : (
										"Continue to Payment"
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
