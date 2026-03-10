"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { storage } from "@/firebase";
import { getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { ArrowLeft, UploadCloud } from "lucide-react";
import { saveCompanyAddress } from "@/vendor-services/firebaseService";

interface Country
{
	name: string;
	code: string;
}

export default function CompanyProofOfAddress()
{
	const router = useRouter();

	const [countries, setCountries] = useState<Country[]>([]);
	const [addressImage, setAddressImage] = useState("");
	const [addressFile, setAddressFile] = useState<File | null>(null);
	const [uploadingImage, setUploadingImage] = useState(false);

	const [form, setForm] = useState({
		streetAddress: "",
		city: "",
		state: "",
		postcode: "",
		country: "",
		countryCode: "",
	});

	const [errors, setErrors] = useState({
		streetAddress: "",
		city: "",
		state: "",
		postcode: "",
		country: "",
	});

	// Load countries
	useEffect(() =>
	{
		async function loadCountries()
		{
			try
			{
				const res = await fetch("/country_code.json");
				const data: Country[] = await res.json();
				setCountries(data);
			} catch (err)
			{
				console.error("Failed to load countries:", err);
			}
		}
		loadCountries();
	}, []);

	const handleChange = (field: string, value: string) =>
	{
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const handleCountryChange = (value: string) =>
	{
		const selected = countries.find((c) => c.name === value);
		setForm((prev) => ({
			...prev,
			country: selected?.name || "",
			countryCode: selected?.code || "",
		}));
		setErrors((prev) => ({ ...prev, country: "" }));
	};

	const validate = () =>
	{
		const newErrors: any = {};
		if (!form.streetAddress) newErrors.streetAddress = "This field is required";
		if (!form.city) newErrors.city = "This field is required";
		if (!form.state) newErrors.state = "This field is required";
		if (!form.postcode) newErrors.postcode = "This field is required";
		if (!form.country) newErrors.country = "This field is required";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
	{
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file size (max 10MB)
		if (file.size > 10 * 1024 * 1024)
		{
			toast.error("File size must be less than 10MB");
			return;
		}

		// Validate file type
		if (!file.type.startsWith("image/"))
		{
			toast.error("Please upload an image file");
			return;
		}

		setAddressFile(file);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () =>
		{
			setAddressImage(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleSaveAddress = async () =>
	{
		if (!validate()) return;

		if (!addressFile)
		{
			toast.error("Please upload a proof of address document");
			return;
		}

		try
		{
			setUploadingImage(true);

			// Get current user from Firebase Auth
			const auth = getAuth();
			const user = auth.currentUser;

			if (!user)
			{
				toast.error("User not authenticated. Please log in again.");
				return;
			}

			// Upload image to Firebase Storage
			const fileName = `address-proof-${Date.now()}-${addressFile.name}`;
			const fileRef = ref(storage, `address-docs/${fileName}`);

			await uploadBytes(fileRef, addressFile);
			const imageUrl = await getDownloadURL(fileRef);

			// Save to database using the service
			await saveCompanyAddress({
				userId: user.uid,
				streetAddress: form.streetAddress,
				city: form.city,
				state: form.state,
				postCode: form.postcode,
				country: form.country,
				proofOfAddress: imageUrl,
			});

			toast.success("Company address saved successfully!");
			router.push("/vendor/dashboard");
		} catch (error: any)
		{
			console.error("Error saving company address:", error);
			toast.error(
				error.message || "Error saving company address. Please try again."
			);
		} finally
		{
			setUploadingImage(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
				{/* Back button */}
				<div className="flex items-center mb-6">
					<button
						onClick={() => router.back()}
						className="p-2 rounded-full hover:bg-gray-100 transition"
					>
						<ArrowLeft className="w-6 h-6 text-gray-700" />
					</button>
				</div>

				{/* Title */}
				<h1 className="text-2xl font-bold text-gray-900 text-center">
					Address Verification
				</h1>
				<p className="text-gray-600 text-center mt-2 mb-6 text-sm">
					Provide your company’s current address and upload a valid proof of
					address document.
				</p>

				{/* Form */}
				<div className="space-y-4">
					<div>
						<input
							type="text"
							placeholder="Street Address"
							className={`w-full px-4 py-3 border rounded-xl ${errors.streetAddress ? "border-red-500" : "border-gray-300"
								}`}
							value={form.streetAddress}
							onChange={(e) => handleChange("streetAddress", e.target.value)}
						/>
						{errors.streetAddress && (
							<p className="text-red-500 text-sm mt-1">
								{errors.streetAddress}
							</p>
						)}
					</div>

					<div>
						<input
							type="text"
							placeholder="City"
							className={`w-full px-4 py-3 border rounded-xl ${errors.city ? "border-red-500" : "border-gray-300"
								}`}
							value={form.city}
							onChange={(e) => handleChange("city", e.target.value)}
						/>
						{errors.city && (
							<p className="text-red-500 text-sm mt-1">{errors.city}</p>
						)}
					</div>

					<div>
						<input
							type="text"
							placeholder="State / Province"
							className={`w-full px-4 py-3 border rounded-xl ${errors.state ? "border-red-500" : "border-gray-300"
								}`}
							value={form.state}
							onChange={(e) => handleChange("state", e.target.value)}
						/>
						{errors.state && (
							<p className="text-red-500 text-sm mt-1">{errors.state}</p>
						)}
					</div>

					<div>
						<input
							type="text"
							placeholder="Postcode"
							className={`w-full px-4 py-3 border rounded-xl ${errors.postcode ? "border-red-500" : "border-gray-300"
								}`}
							value={form.postcode}
							onChange={(e) => handleChange("postcode", e.target.value)}
						/>
						{errors.postcode && (
							<p className="text-red-500 text-sm mt-1">{errors.postcode}</p>
						)}
					</div>

					<div>
						<select
							className={`w-full px-4 py-3 border rounded-xl ${errors.country ? "border-red-500" : "border-gray-300"
								}`}
							value={form.country}
							onChange={(e) => handleCountryChange(e.target.value)}
						>
							<option value="">Select a country</option>
							{countries.map((c, i) => (
								<option key={i} value={c.name}>
									{c.name}
								</option>
							))}
						</select>
						{errors.country && (
							<p className="text-red-500 text-sm mt-1">{errors.country}</p>
						)}
					</div>

					<div>
						<label className="block text-sm text-gray-600 mb-2">
							Upload proof of address
						</label>
						<div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
							<input
								type="file"
								accept="image/*"
								onChange={handleFileUpload}
								className="hidden"
								id="address-upload"
								disabled={uploadingImage}
							/>
							<label
								htmlFor="address-upload"
								className={`cursor-pointer ${uploadingImage ? "cursor-not-allowed" : ""
									}`}
							>
								<UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
								<p className="text-sm text-gray-600">
									{uploadingImage
										? "Uploading..."
										: "Click to upload or drag & drop"}
								</p>
								<p className="text-xs text-gray-500 mt-1">
									Supported: JPEG, PNG, WebP (Max 10MB)
								</p>
							</label>
						</div>
						{addressImage && (
							<div className="mt-4 flex justify-center">
								<Image
									src={addressImage}
									alt="Proof of Address"
									width={200}
									height={200}
									className="rounded-lg border shadow object-cover"
								/>
							</div>
						)}
					</div>

					<button
						onClick={handleSaveAddress}
						disabled={uploadingImage}
						className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
					>
						{uploadingImage ? "Saving..." : "Submit Details"}
					</button>
				</div>
			</div>
		</div>
	);
}
