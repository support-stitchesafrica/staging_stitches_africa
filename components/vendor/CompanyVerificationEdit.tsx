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
import { verifyBusiness } from "@/vendor-services/youVerifyService";
import { saveBusinessVerification } from "@/vendor-services/firebaseService";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase";
import { useDropzone } from "react-dropzone";
import { FileText, UploadCloud, Building2 } from "lucide-react";

// ✅ Registration number validation helper
const validateRegistrationNumber = (value: string): boolean => {
	// Remove spaces and convert to uppercase for validation
	const cleaned = value.replace(/\s+/g, "").toUpperCase();

	// Valid formats: RC, BN, IT, LP, LLP followed by digits
	const validPatterns = [
		/^RC\d+$/, // RC123456
		/^BN\d+$/, // BN7720978
		/^IT\d+$/, // IT123456
		/^LP\d+$/, // LP987654
		/^LLP\d+$/, // LLP456789
	];

	return validPatterns.some((pattern) => pattern.test(cleaned));
};

interface CompanyVerificationEditProps {
	existingData?: any;
	onSave: () => void;
	onCancel: () => void;
}

export function CompanyVerificationEdit({
	existingData,
	onSave,
	onCancel,
}: CompanyVerificationEditProps) {
	const [loading, setLoading] = useState(false);
	const [uploadingFile, setUploadingFile] = useState(false);
	const [formData, setFormData] = useState({
		country: existingData?.country || "",
		companyName: existingData?.companyName || "",
		businessType: existingData?.typeOfEntity || "",
		registrationNumber: existingData?.registrationNumber || "",
	});
	const [cacFile, setCacFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState<string | null>(
		existingData?.documentImageUrl ? "Existing Document" : null
	);
	const [preview, setPreview] = useState<string | null>(
		existingData?.documentImageUrl || null
	);
	const [fileType, setFileType] = useState<string | null>(
		existingData?.documentImageUrl
			? existingData.documentImageUrl.toLowerCase().includes(".pdf")
				? "pdf"
				: "image"
			: null
	);
	const [registrationError, setRegistrationError] = useState<string | null>(
		null
	);

	const onDrop = (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;
		const file = acceptedFiles[0];

		// Validate file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("File size must be less than 10MB");
			return;
		}

		setCacFile(file);
		setFileName(file.name);

		if (file.type === "application/pdf") {
			setFileType("pdf");
			setPreview(URL.createObjectURL(file));
		} else if (file.type.startsWith("image/")) {
			setFileType("image");
			setPreview(URL.createObjectURL(file));
		} else {
			toast.error("Please upload a PDF or image file");
			setFileType(null);
			setPreview(null);
			setCacFile(null);
			setFileName(null);
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "image/*": [], "application/pdf": [] },
		multiple: false,
	});

	const handleChange = (field: string, value: string) => {
		// Auto-format registration number: remove spaces and convert to uppercase
		if (field === "registrationNumber") {
			const formatted = value.replace(/\s+/g, "").toUpperCase();
			setFormData((prev) => ({ ...prev, [field]: formatted }));

			// Validate in real-time
			if (formatted && !validateRegistrationNumber(formatted)) {
				setRegistrationError(
					"Invalid format. Use: RC1234567, BN7720978, IT123456, LP123456, or LLP123456"
				);
			} else {
				setRegistrationError(null);
			}
		} else {
			setFormData((prev) => ({ ...prev, [field]: value }));
		}
	};

	const handleSave = async () => {
		if (!formData.registrationNumber || !formData.companyName) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Validate registration number format
		if (!validateRegistrationNumber(formData.registrationNumber)) {
			toast.error("Invalid registration number format");
			setRegistrationError(
				"Invalid format. Use: RC1234567, BN7720978, IT123456, LP123456, or LLP123456"
			);
			return;
		}

		setLoading(true);
		try {
			const tailorUID = localStorage.getItem("tailorUID");
			if (!tailorUID) {
				toast.error("User not found");
				return;
			}

			// Clean and verify business
			const cleanedRegNumber = formData.registrationNumber
				.replace(/\s+/g, "")
				.toUpperCase();
			const payload: any = {
				registrationNumber: cleanedRegNumber,
				countryCode: formData.country,
				isLive: true,
			};

			if (formData.companyName?.trim()) {
				payload.registrationName = formData.companyName.trim();
			}

			const verificationResult = await verifyBusiness(payload);

			if (!verificationResult?.success) {
				toast.error("Business verification failed. Please check your details.");
				setLoading(false);
				return;
			}

			// Upload document if new file selected
			let documentUrl = existingData?.documentImageUrl || "";
			if (cacFile) {
				setUploadingFile(true);
				try {
					// Create a unique filename with timestamp
					const fileName = `${Date.now()}-${cacFile.name}`;
					const fileRef = ref(storage, `business-docs/${fileName}`);

					// Upload the file to Firebase Storage
					await uploadBytes(fileRef, cacFile);

					// Get the download URL
					documentUrl = await getDownloadURL(fileRef);

					console.log("Document uploaded successfully:", documentUrl);
					toast.success("Document uploaded successfully");
				} catch (uploadError) {
					console.error("Error uploading document:", uploadError);
					toast.error("Failed to upload document. Please try again.");
					setLoading(false);
					setUploadingFile(false);
					return;
				} finally {
					setUploadingFile(false);
				}
			}

			// Save to Firebase
			await saveBusinessVerification(
				tailorUID,
				formData.registrationNumber,
				formData.companyName,
				formData.country,
				documentUrl,
				verificationResult
			);

			toast.success("Company verification updated successfully");
			console.log(
				"Business verification saved with document URL:",
				documentUrl
			);
			onSave();
		} catch (error: any) {
			console.error("Error updating company verification:", error);
			toast.error(error.message || "Failed to update company verification");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Building2 className="h-5 w-5 text-blue-600" />
					Update Company Verification
				</CardTitle>
				<CardDescription>
					Update your company registration details and documents
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label>Country *</Label>
					<select
						value={formData.country}
						onChange={(e) => handleChange("country", e.target.value)}
						className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Select Country</option>
						<option value="NG">Nigeria</option>
						<option value="KE">Kenya</option>
						<option value="ZA">South Africa</option>
						{/* <option value="GH">Ghana</option> */}
					</select>
				</div>

				<div>
					<Label>Company Name *</Label>
					<Input
						value={formData.companyName}
						onChange={(e) => handleChange("companyName", e.target.value)}
						placeholder="Your Company Name"
					/>
				</div>

				<div>
					<Label>Business Type</Label>
					<select
						value={formData.businessType}
						onChange={(e) => handleChange("businessType", e.target.value)}
						className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Select Type</option>
						<option value="private">Private company (Ltd by shares)</option>
						<option value="business">Business Name</option>
						<option value="trustees">Incorporated Trustees</option>
						<option value="partnership">Limited Partnership</option>
						<option value="llp">Limited Liability Partnership</option>
					</select>
				</div>

				<div>
					<Label>Company Registration Number *</Label>
					<Input
						value={formData.registrationNumber}
						onChange={(e) => handleChange("registrationNumber", e.target.value)}
						placeholder="RC1234567, BN7720978, IT123456, etc."
						className={registrationError ? "border-red-500" : ""}
					/>
					<p className="text-xs text-gray-500 mt-1">
						Format: RC, BN, IT, LP, or LLP followed by numbers (no spaces)
					</p>
					{registrationError && (
						<p className="text-xs text-red-600 mt-1">{registrationError}</p>
					)}
				</div>

				<div>
					<Label>
						Upload CAC Document (Optional - keep existing if not uploaded)
					</Label>
					<div
						{...getRootProps()}
						className={`border-2 mt-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
							isDragActive
								? "border-blue-500 bg-blue-50"
								: uploadingFile
								? "border-orange-500 bg-orange-50"
								: "border-gray-300"
						}`}
					>
						<UploadCloud
							className={`w-8 h-8 ${
								uploadingFile
									? "text-orange-500 animate-pulse"
									: "text-blue-500"
							}`}
						/>
						<input {...getInputProps()} disabled={uploadingFile} />
						{uploadingFile ? (
							<p className="text-orange-700">Uploading document...</p>
						) : isDragActive ? (
							<p className="text-gray-700">Drop the file here...</p>
						) : (
							<p className="text-gray-700">
								Drag & drop your CAC document here, or click to select
							</p>
						)}
					</div>

					{fileName && (
						<div className="mt-2 flex items-center space-x-2 border p-2 rounded-lg bg-gray-50">
							<FileText className="w-5 h-5 text-gray-600" />
							<div>
								<p className="text-sm font-medium text-gray-800">{fileName}</p>
							</div>
						</div>
					)}

					{preview && (
						<div className="mt-2">
							<p className="text-sm text-gray-600">
								{preview.startsWith("http")
									? "Current Document:"
									: "New Document Preview:"}
							</p>
							{fileType === "pdf" ? (
								<div className="mt-1 border rounded-lg p-4 bg-gray-50">
									<div className="flex items-center gap-2">
										<FileText className="w-6 h-6 text-red-600" />
										<div>
											<p className="text-sm font-medium">PDF Document</p>
											<a
												href={preview}
												target="_blank"
												rel="noopener noreferrer"
												className="text-xs text-blue-600 hover:underline"
											>
												Click to view PDF
											</a>
										</div>
									</div>
								</div>
							) : (
								<img
									src={preview}
									alt="Document Preview"
									className="mt-1 max-h-40 w-auto border rounded-lg"
								/>
							)}
						</div>
					)}
				</div>

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
						disabled={loading || uploadingFile}
					>
						{uploadingFile
							? "Uploading Document..."
							: loading
							? "Saving..."
							: "Save & Continue"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
