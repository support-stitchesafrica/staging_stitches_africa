"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { User, ChevronRight } from "lucide-react";
import {
	verifyNin,
	verifyDriversLicense,
	verifyPassport,
	verifyPhoneNumber,
	verifyGhanaPassport,
	verifyKenyanPassport,
	verifySouthAfricanID,
} from "@/vendor-services/youVerifyService";
import { saveIdentityVerification } from "@/vendor-services/firebaseService";

interface IdentityVerificationEditProps {
	existingData?: any;
	countryCode?: string;
	onSave: () => void;
	onCancel: () => void;
}

export function IdentityVerificationEdit({
	existingData,
	countryCode,
	onSave,
	onCancel,
}: IdentityVerificationEditProps) {
	const [loading, setLoading] = useState(false);
	const [showCountrySelection, setShowCountrySelection] = useState(
		!countryCode
	);
	const [selectedCountry, setSelectedCountry] = useState(countryCode || "");
	const [selectedMethod, setSelectedMethod] = useState(
		existingData?.verificationType || ""
	);
	const [showMethodSelection, setShowMethodSelection] = useState(false);
	const [formData, setFormData] = useState({
		idNumber: existingData?.idNumber || "",
		fullName: existingData?.fullName || "",
		middleName: existingData?.middleName || "",
	});

	const countries = [
		{ name: "Nigeria", code: "NG", flag: "🇳🇬" },
		{ name: "Ghana", code: "GH", flag: "🇬🇭" },
		{ name: "South Africa", code: "ZA", flag: "🇿🇦" },
		{ name: "Kenya", code: "KE", flag: "🇰🇪" },
	];

	const verificationMethods: Record<string, { name: string; value: string }[]> =
		{
			NG: [
				{ name: "NIN Verification", value: "nin" },
				{ name: "Driver's Licence Verification", value: "drivers_licence" },
				{ name: "International Passport Verification", value: "passport" },
				{ name: "Phone Number Verification", value: "phone" },
			],
			GH: [{ name: "International Passport Verification", value: "passport" }],
			KE: [{ name: "International Passport Verification", value: "passport" }],
			ZA: [{ name: "SAID Verification", value: "said" }],
		};

	const handleCountrySelect = (code: string) => {
		setSelectedCountry(code);
		setShowCountrySelection(false);
		// If country has multiple methods or no method selected, show method selection
		const methods = verificationMethods[code] || [];
		if (methods.length > 1 || !selectedMethod) {
			setShowMethodSelection(true);
		} else if (methods.length === 1) {
			setSelectedMethod(methods[0].value);
		}
	};

	const handleMethodSelect = (method: string) => {
		setSelectedMethod(method);
		setShowMethodSelection(false);
	};

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		if (!formData.idNumber) {
			toast.error("Please enter your ID number");
			return;
		}

		setLoading(true);
		try {
			const tailorUID = localStorage.getItem("tailorUID");
			if (!tailorUID) {
				toast.error("User not found");
				return;
			}

			// Verify identity based on country and method
			let verificationResult: any;

			try {
				switch (selectedMethod) {
					case "nin":
						// Nigerian NIN verification
						verificationResult = await verifyNin({
							nin: formData.idNumber,
							isSubjectConsent: true,
							isLive: true,
						});
						break;

					case "drivers_licence":
						// Nigerian Driver's Licence verification
						verificationResult = await verifyDriversLicense({
							licenseNumber: formData.idNumber,
							isLive: true,
						});
						break;

					case "phone":
						// Phone Number verification
						verificationResult = await verifyPhoneNumber({
							mobile: formData.idNumber,
							isSubjectConsent: true,
							isLive: true,
						});
						break;

					case "passport":
						// Passport verification based on country
						if (selectedCountry === "NG") {
							verificationResult = await verifyPassport({
								passportNumber: formData.idNumber,
								isSubjectConsent: true,
								lastName: formData.fullName || "",
								isLive: true,
							});
						} else if (selectedCountry === "GH") {
							verificationResult = await verifyGhanaPassport({
								passportNumber: formData.idNumber,
								isSubjectConsent: true,
								isLive: true,
							});
						} else if (selectedCountry === "KE") {
							verificationResult = await verifyKenyanPassport({
								passportNumber: formData.idNumber,
								isSubjectConsent: true,
								isLive: true,
							});
						}
						break;

					case "said":
						// South African ID verification
						verificationResult = await verifySouthAfricanID({
							saidNumber: formData.idNumber,
							isSubjectConsent: true,
							isLive: true,
						});
						break;

					default:
						throw new Error("Unknown verification method");
				}
			} catch (verifyError: any) {
				console.error("Verification API error:", verifyError);
				toast.error(
					verifyError.message ||
						"Verification service is unavailable. Please try again."
				);
				setLoading(false);
				return;
			}

			if (!verificationResult?.success) {
				toast.error("Identity verification failed. Please check your details.");
				setLoading(false);
				return;
			}

			// Save to Firebase
			await saveIdentityVerification({
				userId: tailorUID,
				idNumber: formData.idNumber,
				fullName: verificationResult.data?.fullName || formData.fullName,
				verificationType: selectedMethod || "id",
				countryCode: selectedCountry,
				middleName: formData.middleName,
			});

			toast.success("Identity verification updated successfully");
			onSave();
		} catch (error: any) {
			console.error("Error updating identity verification:", error);
			toast.error(error.message || "Failed to update identity verification");
		} finally {
			setLoading(false);
		}
	};

	// Show country selection if no country code exists
	if (showCountrySelection) {
		return (
			<Card className="max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5 text-green-600" />
						Select Your Country
					</CardTitle>
					<CardDescription>
						Choose your country to update identity verification
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{countries.map((country) => (
						<div
							key={country.code}
							onClick={() => handleCountrySelect(country.code)}
							className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition"
						>
							<span className="flex items-center gap-3 text-lg font-medium">
								<span className="text-2xl">{country.flag}</span>
								{country.name}
							</span>
							<ChevronRight className="h-5 w-5 text-blue-600" />
						</div>
					))}

					<Button variant="outline" onClick={onCancel} className="w-full mt-4">
						Cancel
					</Button>
				</CardContent>
			</Card>
		);
	}

	// Show verification method selection
	if (showMethodSelection) {
		const methods = verificationMethods[selectedCountry] || [];
		const currentCountry = countries.find((c) => c.code === selectedCountry);

		return (
			<Card className="max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5 text-green-600" />
						Choose Verification Method - {currentCountry?.flag}{" "}
						{currentCountry?.name}
					</CardTitle>
					<CardDescription>
						Select how you want to verify your identity
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{methods.map((method) => (
						<div
							key={method.value}
							onClick={() => handleMethodSelect(method.value)}
							className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-green-400 transition"
						>
							<span className="text-lg font-medium">{method.name}</span>
							<ChevronRight className="h-5 w-5 text-green-600" />
						</div>
					))}

					<Button
						variant="outline"
						onClick={() => {
							if (!countryCode) {
								setShowMethodSelection(false);
								setShowCountrySelection(true);
							} else {
								onCancel();
							}
						}}
						className="w-full mt-4"
					>
						Back
					</Button>
				</CardContent>
			</Card>
		);
	}

	// Get country info
	const currentCountry = countries.find((c) => c.code === selectedCountry);
	const availableMethods = verificationMethods[selectedCountry] || [];
	const currentMethod = availableMethods.find(
		(m) => m.value === selectedMethod
	);

	return (
		<Card className="max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="h-5 w-5 text-green-600" />
					Update Identity Verification - {currentCountry?.flag}{" "}
					{currentCountry?.name}
				</CardTitle>
				<CardDescription>
					Update your personal identity documents
					{existingData && (
						<span className="block mt-1 text-emerald-600">
							Current verification:{" "}
							{existingData.verificationType?.toUpperCase() || "ID"} -{" "}
							{existingData.status}
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Verification Method Selector */}
				{availableMethods.length > 1 && (
					<div className="bg-gray-50 p-3 rounded-lg border">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-700">
									Verification Method:
								</p>
								<p className="text-sm text-gray-600">
									{currentMethod?.name || "Select a method"}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowMethodSelection(true)}
							>
								Change Method
							</Button>
						</div>
					</div>
				)}

				{/* NIN Verification */}
				{selectedMethod === "nin" && (
					<>
						<div>
							<Label>NIN (National Identity Number) *</Label>
							<Input
								value={formData.idNumber}
								onChange={(e) => handleChange("idNumber", e.target.value)}
								placeholder="Enter your 11-digit NIN"
								maxLength={11}
							/>
							<p className="text-xs text-gray-500 mt-1">
								Your NIN will be verified against NIMC database
							</p>
						</div>

						<div>
							<Label>Full Name (as on NIN)</Label>
							<Input
								value={formData.fullName}
								onChange={(e) => handleChange("fullName", e.target.value)}
								placeholder="Full Name"
							/>
						</div>

						<div>
							<Label>Middle Name (Optional)</Label>
							<Input
								value={formData.middleName}
								onChange={(e) => handleChange("middleName", e.target.value)}
								placeholder="Middle Name"
							/>
						</div>
					</>
				)}

				{/* Driver's Licence Verification */}
				{selectedMethod === "drivers_licence" && (
					<>
						<div>
							<Label>Driver's Licence Number *</Label>
							<Input
								value={formData.idNumber}
								onChange={(e) => handleChange("idNumber", e.target.value)}
								placeholder="Enter your driver's licence number"
							/>
							<p className="text-xs text-gray-500 mt-1">
								Your licence will be verified against FRSC database
							</p>
						</div>

						<div>
							<Label>Full Name (as on Licence)</Label>
							<Input
								value={formData.fullName}
								onChange={(e) => handleChange("fullName", e.target.value)}
								placeholder="Full Name"
							/>
						</div>
					</>
				)}

				{/* Passport Verification */}
				{selectedMethod === "passport" && (
					<>
						<div>
							<Label>Passport Number *</Label>
							<Input
								value={formData.idNumber}
								onChange={(e) => handleChange("idNumber", e.target.value)}
								placeholder="Enter your passport number"
							/>
							<p className="text-xs text-gray-500 mt-1">
								Your passport will be verified
							</p>
						</div>

						<div>
							<Label>Full Name (as on Passport)</Label>
							<Input
								value={formData.fullName}
								onChange={(e) => handleChange("fullName", e.target.value)}
								placeholder="Full Name"
							/>
						</div>
					</>
				)}

				{/* Phone Number Verification */}
				{selectedMethod === "phone" && (
					<div>
						<Label>Phone Number *</Label>
						<Input
							value={formData.idNumber}
							onChange={(e) => handleChange("idNumber", e.target.value)}
							placeholder="Enter your phone number"
						/>
						<p className="text-xs text-gray-500 mt-1">
							Your phone number will be verified
						</p>
					</div>
				)}

				{/* SAID Verification (South Africa) */}
				{selectedMethod === "said" && (
					<>
						<div>
							<Label>SAID Number *</Label>
							<Input
								value={formData.idNumber}
								onChange={(e) => handleChange("idNumber", e.target.value)}
								placeholder="Enter your SAID number"
							/>
							<p className="text-xs text-gray-500 mt-1">
								Your South African ID will be verified
							</p>
						</div>

						<div>
							<Label>Full Name (as on ID)</Label>
							<Input
								value={formData.fullName}
								onChange={(e) => handleChange("fullName", e.target.value)}
								placeholder="Full Name"
							/>
						</div>
					</>
				)}

				{existingData && (
					<div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
						<p className="text-sm font-medium text-blue-900">
							Current Verification Status:
						</p>
						<p className="text-sm text-blue-700 mt-1">
							{existingData.feedbackMessage || "Verified"}
						</p>
					</div>
				)}

				<div className="flex gap-3 pt-4">
					<Button
						variant="outline"
						onClick={onCancel}
						className="flex-1"
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						className="flex-1 bg-emerald-600 hover:bg-emerald-700"
						disabled={loading}
					>
						{loading ? "Verifying..." : "Save & Continue"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
