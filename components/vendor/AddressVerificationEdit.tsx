"use client";

import { useEffect, useState } from "react";
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
import { MapPin, Upload } from "lucide-react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

interface AddressVerificationEditProps {
	existingData?: any;
	onSave: () => void;
	onCancel: () => void;
}

interface Country {
	name: string;
	code: string;
}

export function AddressVerificationEdit({
	existingData,
	onSave,
	onCancel,
}: AddressVerificationEditProps) {
	const [loading, setLoading] = useState(false);
	const [countries, setCountries] = useState<Country[]>([]);
	const [addressImage, setAddressImage] = useState(
		existingData?.proofOfAddress || ""
	);

	const [formData, setFormData] = useState({
		streetAddress: existingData?.streetAddress || "",
		city: existingData?.city || "",
		state: existingData?.state || "",
		postcode: existingData?.postCode || "",
		country: existingData?.country || "",
		countryCode: existingData?.countryCode || "",
	});

	// Load countries
	useEffect(() => {
		async function loadCountries() {
			try {
				const res = await fetch("/country_code.json");
				const data: Country[] = await res.json();
				setCountries(data);
			} catch (err) {
				console.error("Failed to load countries:", err);
			}
		}
		loadCountries();
	}, []);

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleCountryChange = (value: string) => {
		const selected = countries.find((c) => c.name === value);
		setFormData((prev) => ({
			...prev,
			country: selected?.name || "",
			countryCode: selected?.code || "",
		}));
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("File size must be less than 5MB");
			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			setAddressImage(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const validate = () => {
		if (!formData.streetAddress) {
			toast.error("Street address is required");
			return false;
		}
		if (!formData.city) {
			toast.error("City is required");
			return false;
		}
		if (!formData.state) {
			toast.error("State is required");
			return false;
		}
		if (!formData.postcode) {
			toast.error("Postcode is required");
			return false;
		}
		if (!formData.country) {
			toast.error("Country is required");
			return false;
		}
		return true;
	};

	const handleSave = async () => {
		if (!validate()) return;

		setLoading(true);
		try {
			const tailorUID = localStorage.getItem("tailorUID");
			if (!tailorUID) {
				toast.error("User not found");
				return;
			}

			const updateData = {
				"company-address-verification": {
					streetAddress: formData.streetAddress,
					city: formData.city,
					state: formData.state,
					postCode: formData.postcode,
					country: formData.country,
					countryCode: formData.countryCode,
					proofOfAddress: addressImage,
					status: "pending",
					updatedAt: new Date().toISOString(),
				},
			};

			await updateDoc(doc(db, "staging_tailors", tailorUID), updateData);

			toast.success("Company address updated successfully");

			// 🟢 Duplicate update to tailors_local collection
			try {
				const localTailorRef = doc(db, "staging_tailors_local", tailorUID);
				const localDocSnap = await getDoc(localTailorRef);
				
				if (localDocSnap.exists()) {
					await updateDoc(localTailorRef, updateData);
					console.log("Address updated in tailors_local:", tailorUID);
				} else {
					console.log("Tailor not found in tailors_local, skipping update");
				}
			} catch (localError) {
				console.error("Error updating tailors_local:", localError);
				// Don't throw error here - main operation succeeded
			}

			onSave();
		} catch (error: any) {
			console.error("Error updating address:", error);
			toast.error(error.message || "Failed to update address");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MapPin className="h-5 w-5 text-purple-600" />
					Update Company Address
				</CardTitle>
				<CardDescription>
					Update your business address and proof of address document
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label>Street Address *</Label>
					<Input
						value={formData.streetAddress}
						onChange={(e) => handleChange("streetAddress", e.target.value)}
						placeholder="Enter street address"
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label>City *</Label>
						<Input
							value={formData.city}
							onChange={(e) => handleChange("city", e.target.value)}
							placeholder="City"
						/>
					</div>

					<div>
						<Label>State / Province *</Label>
						<Input
							value={formData.state}
							onChange={(e) => handleChange("state", e.target.value)}
							placeholder="State"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label>Postcode / ZIP *</Label>
						<Input
							value={formData.postcode}
							onChange={(e) => handleChange("postcode", e.target.value)}
							placeholder="Postcode"
						/>
					</div>

					<div>
						<Label>Country *</Label>
						<select
							value={formData.country}
							onChange={(e) => handleCountryChange(e.target.value)}
							className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value="">Select Country</option>
							{countries.map((c, i) => (
								<option key={i} value={c.name}>
									{c.name}
								</option>
							))}
						</select>
					</div>
				</div>

				<div>
					<Label>
						Upload Proof of Address (Optional - keep existing if not uploaded)
					</Label>
					<div className="mt-2 flex items-center gap-2">
						<input
							type="file"
							accept="image/*"
							onChange={handleFileUpload}
							className="hidden"
							id="address-upload"
						/>
						<label
							htmlFor="address-upload"
							className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
						>
							<Upload className="h-4 w-4" />
							<span className="text-sm">Choose File</span>
						</label>
						{addressImage && (
							<span className="text-sm text-green-600">
								✓ Document uploaded
							</span>
						)}
					</div>
					<p className="text-xs text-gray-500 mt-1">
						Upload utility bill, bank statement, or official document (Max 5MB)
					</p>

					{addressImage && (
						<div className="mt-3">
							<p className="text-sm text-gray-600 mb-2">
								{existingData?.proofOfAddress === addressImage
									? "Current Document:"
									: "New Document Preview:"}
							</p>
							<img
								src={addressImage}
								alt="Proof of Address"
								className="max-h-40 w-auto border rounded-lg"
							/>
						</div>
					)}
				</div>

				{existingData && (
					<div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
						<p className="text-sm font-medium text-purple-900">
							Current Status: {existingData.status || "Pending"}
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
						{loading ? "Saving..." : "Save & Continue"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
