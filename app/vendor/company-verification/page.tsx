"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { verifyBusiness } from "@/vendor-services/youVerifyService";
import { saveBusinessVerification } from "@/vendor-services/firebaseService";
import { useRouter } from "next/navigation";
import { getCurrentUserId } from "@/lib/globalFunctions";
import { auth, storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useDropzone } from "react-dropzone";
import { FileText, UploadCloud } from "lucide-react";

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

// ✅ Schema
const companySchema = z.object({
	country: z.string().min(1, "Select a country"),
	companyName: z.string().min(2, "Company name required"),
	businessType: z.string().min(1, "Select business type"),
	registrationNumber: z
		.string()
		.min(2, "Registration number required")
		.refine((val) => validateRegistrationNumber(val), {
			message:
				"Invalid format. Use: RC1234567, BN1234567, IT123456, LP123456, or LLP123456",
		}),
	cacFile: z
		.any()
		.refine((file) => file instanceof File, { message: "CAC file required" })
		.optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompanyVerificationPage() {
	const router = useRouter();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<CompanyFormValues>({
		resolver: zodResolver(companySchema),
		defaultValues: {
			country: "",
			companyName: "",
			businessType: "",
			registrationNumber: "",
			cacFile: undefined,
		},
	});

	const [userId, setUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [fileType, setFileType] = useState<string | null>(null);

	// ✅ Auto-format registration number (remove spaces, uppercase)
	const registrationRegister = register("registrationNumber");
	const handleRegistrationNumberChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const formatted = e.target.value.replace(/\s+/g, "").toUpperCase();
		e.target.value = formatted; // Update the input value
		registrationRegister.onChange(e); // Call react-hook-form's onChange
	};

	// ✅ Get current user ID or fallback from localStorage
	useEffect(() => {
		const id = getCurrentUserId();
		if (id) {
			setUserId(id);
		} else if (typeof window !== "undefined") {
			const storedId = localStorage.getItem("tailorUID");
			setUserId(storedId);
			if (storedId) {
				console.log("Fallback userId from localStorage:", storedId);
			}
		}
	}, []);

	// ✅ File drop handler
	const onDrop = (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;
		const file = acceptedFiles[0];
		setValue("cacFile", file);
		setFileName(file.name);
		setFileType(file.type.split("/")[1] || file.name.split(".").pop() || "");
		if (file.type.startsWith("image/")) {
			setPreview(URL.createObjectURL(file));
		} else {
			setPreview(null);
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "image/*": [], "application/pdf": [] },
		multiple: false,
	});

	// ✅ Validate Firebase auth and token
	const checkAuthAndGetToken = async (): Promise<string | null> => {
		try {
			const currentUser = auth.currentUser;
			if (!currentUser) {
				toast.error("Session expired. Please log in again.");
				localStorage.removeItem("tailorUID");
				localStorage.removeItem("tailorToken");
				setTimeout(() => router.push("/vendor"), 1500);
				return null;
			}

			const token = await currentUser.getIdToken(true);
			if (!token) {
				toast.error("Unable to verify authentication. Please log in again.");
				await auth.signOut();
				localStorage.removeItem("tailorUID");
				localStorage.removeItem("tailorToken");
				setTimeout(() => router.push("/vendor"), 1500);
				return null;
			}

			return token;
		} catch (error: any) {
			console.error("Auth validation error:", error);
			toast.error("Authentication error. Please log in again.");
			await auth.signOut();
			localStorage.removeItem("tailorUID");
			localStorage.removeItem("tailorToken");
			setTimeout(() => router.push("/vendor"), 1500);
			return null;
		}
	};

	// ✅ Submit handler
	const handleVerify: SubmitHandler<CompanyFormValues> = async (data) => {
		// ⛔ Prevent multiple clicks
		if (loading) return;

		if (!userId) {
			toast.error("No user ID found. Please log in again.");
			router.push("/vendor");
			return;
		}

		if (!data.cacFile) {
			toast.error("Please upload your CAC document");
			return;
		}

		setLoading(true);
		try {
			// ✅ Ensure valid token
			const token = await checkAuthAndGetToken();
			if (!token) {
				setLoading(false);
				return;
			}

			// ✅ Build payload for verification API (clean registration number)
			const cleanedRegNumber = data.registrationNumber
				.replace(/\s+/g, "")
				.toUpperCase();
			const payload = {
				registrationNumber: cleanedRegNumber,
				countryCode: data.country,
				isLive: true,
				registrationName: data.companyName?.trim() || undefined,
			};

			const verificationResult = await verifyBusiness(payload);

			if (!verificationResult?.success) {
				toast.error("Business verification failed. Please check your details.");
				setLoading(false);
				return;
			}

			// ✅ Upload CAC file
			const cacFile = data.cacFile as File;
			const fileRef = ref(
				storage,
				`business-docs/${Date.now()}-${cacFile.name}`
			);
			await uploadBytes(fileRef, cacFile);
			const cacUrl = await getDownloadURL(fileRef);

			// ✅ Save verification info
			await saveBusinessVerification(
				userId,
				data.registrationNumber,
				data.companyName,
				data.country,
				cacUrl,
				verificationResult
			);

			toast.success("Business verified successfully");
			router.push("/vendor/choose-country");
		} catch (error: any) {
			console.error("Error verifying business:", error);
			toast.error(error.message || "An error occurred during verification");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
			<div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-6 sm:p-8">
				<form onSubmit={handleSubmit(handleVerify)} className="space-y-6">
					<h2 className="text-2xl font-bold text-gray-900 text-center sm:text-left">
						Company Verification
					</h2>
					<p className="text-sm text-gray-500">
						Provide your company details and upload the CAC document to verify
						your business.
					</p>

					<div className="flex flex-col space-y-4">
						<div>
							<Label>Country</Label>
							<select
								{...register("country")}
								className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
							>
								<option value="">Select Country</option>
								<option value="NG">Nigeria</option>
								<option value="KE">Kenya</option>
								<option value="ZA">South Africa</option>
							</select>
						</div>

						<div>
							<Label>Company Name</Label>
							<Input
								{...register("companyName")}
								placeholder="Your Company Name"
							/>
						</div>

						<div>
							<Label>Business Type</Label>
							<select
								{...register("businessType")}
								className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
							<Label>Company Registration Number</Label>
							<Input
								{...registrationRegister}
								onChange={handleRegistrationNumberChange}
								placeholder="RC1234567, BN7720978, IT123456, etc."
								className={errors.registrationNumber ? "border-red-500" : ""}
							/>
							<p className="text-xs text-gray-500 mt-1">
								Format: RC, BN, IT, LP, or LLP followed by numbers (no spaces)
							</p>
							{errors.registrationNumber && (
								<p className="text-xs text-red-600 mt-1">
									{errors.registrationNumber.message}
								</p>
							)}
						</div>

						<div>
							<Label>Upload CAC Document</Label>
							<div
								{...getRootProps()}
								className={`border-2 mt-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
									isDragActive
										? "border-green-500 bg-green-50"
										: "border-gray-300"
								}`}
							>
								<UploadCloud className="w-8 h-8 text-green-500" />
								<input {...getInputProps()} />
								{isDragActive ? (
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
										<p className="text-sm font-medium text-gray-800">
											{fileName}
										</p>
										<p className="text-xs text-gray-500">
											{fileType?.toUpperCase()} file
										</p>
									</div>
								</div>
							)}

							{preview && (
								<div className="mt-2">
									<p className="text-sm text-gray-600">Preview:</p>
									<img
										src={preview}
										alt="CAC Preview"
										className="mt-1 max-h-40 w-auto border rounded-lg"
									/>
								</div>
							)}
						</div>
					</div>

					<Button
						type="submit"
						className="w-full bg-black hover:bg-gray-700 text-white font-semibold py-2 rounded-lg"
						disabled={loading}
					>
						{loading ? "Verifying..." : "Verify Details"}
					</Button>
				</form>
			</div>
		</div>
	);
}
