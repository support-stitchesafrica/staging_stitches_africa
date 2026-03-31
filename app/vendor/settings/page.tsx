"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import
	{
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import
	{
		Upload,
		FileText,
		AlertCircle,
		CheckCircle,
		XCircle,
		Banknote,
		Wallet,
	} from "lucide-react";
import { uploadImages } from "@/vendor-services/uploadImages";
import { toast } from "sonner";
import
	{
		getTailorProfile,
		requestKycUpload,
		TailorProfile,
		updateTailorProfile,
	} from "@/vendor-services/tailorProfile";
import { useRouter, useSearchParams } from "next/navigation";
import { getTailorKyc, TailorKyc } from "@/vendor-services/tailorService";
import ChangePasswordDialog from "@/components/change=password";
import { VendorDashboard } from "@/components/vendor-dashboard";
import
	{
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
	} from "@/components/ui/dialog";
import { auth, app, db } from "@/firebase";
import { KycUpdateModal } from "@/components/vendor/KycUpdateModal";
import { StripeConnectAccount } from "@/components/vendor/StripeConnectAccount";
import { EmailChangeDialog } from "@/components/vendor/EmailChangeDialog";
import { EmailChangeDetector } from "@/components/vendor/EmailChangeDetector";
import Select from "react-select";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ImageBasedSizeGuideInput } from "@/components/vendor/ImageBasedSizeGuideInput";

// Client-only debug component to avoid hydration mismatches
function DebugInfo({
	tailorUID,
	profile,
}: {
	tailorUID: string | null;
	profile: any;
})
{
	const [mounted, setMounted] = useState(false);

	useEffect(() =>
	{
		setMounted(true);
	}, []);

	if (!mounted)
	{
		return null;
	}

	return (
		<div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono">
			<div>Debug: tailorUID = {tailorUID ? "✅ Set" : "❌ Not set"}</div>
			<div>
				Debug: profile.email ={" "}
				{profile.email ? `✅ ${profile.email}` : "❌ Not set"}
			</div>
			<div>
				Debug: profile = {JSON.stringify(profile, null, 2).substring(0, 200)}
			</div>
		</div>
	);
}

export default function Settings()
{
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<SettingsInner />
		</Suspense>
	);
}

function SettingsInner()
{
	const [profile, setProfile] = useState<Partial<TailorProfile>>({});
	const [kyc, setKyc] = useState<TailorKyc | null>(null);
	const [loading, setLoading] = useState(true); // Start as true since we're loading initially
	const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Track if we've attempted to load
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [kycUpdateModalOpen, setKycUpdateModalOpen] = useState(false);
	const [emailChangeDialogOpen, setEmailChangeDialogOpen] = useState(false);
	const [duplicating, setDuplicating] = useState(false); // TEMP: for duplicate button
	const [stripeOnboardingResult, setStripeOnboardingResult] = useState<{
		type: "success" | "error" | null;
		message: string;
	}>({ type: null, message: "" });
	const [selectedPayoutProvider, setSelectedPayoutProvider] = useState<"flutterwave" | "stripe" | null>(null);
	const [hasFlutterwaveAccount, setHasFlutterwaveAccount] = useState(false);
	const [hasStripeAccount, setHasStripeAccount] = useState(false);
	// Size Guide state - Changed to handle image URLs instead of table data
	const [sizeGuideImages, setSizeGuideImages] = useState<string[]>([]);
	const [savingSizeGuide, setSavingSizeGuide] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState(
		searchParams.get("tab") || "profile"
	);

	const tailorUID =
		typeof window !== "undefined" ? localStorage.getItem("tailorUID") : null;

	const fetchData = async () =>
	{
		if (!tailorUID)
		{
			setLoading(false);
			setHasLoadedOnce(true);
			return;
		}
		setLoading(true);

		const [profileRes, kycRes] = await Promise.all([
			getTailorProfile(tailorUID),
			getTailorKyc(tailorUID),
		]);

		if (profileRes.success) setProfile(profileRes.data as any);
		if (kycRes) setKyc(kycRes);

		// Load size guide from vendor profile
		try
		{
			const tailorRef = doc(db, "staging_tailors", tailorUID);
			const tailorDoc = await getDoc(tailorRef);
			if (tailorDoc.exists())
			{
				const data = tailorDoc.data();
				// Handle both old format (table-based) and new format (image-based)
				if (data?.sizeGuideImages && Array.isArray(data.sizeGuideImages))
				{
					// New format: array of image URLs
					setSizeGuideImages(data.sizeGuideImages);
				} else if (data?.sizeGuide)
				{
					// Old format: table-based size guide - could convert if needed
					// For now, we'll just ignore the old format and treat as empty
					setSizeGuideImages([]);
				} else
				{
					setSizeGuideImages([]);
				}
			}
		} catch (error)
		{
			console.error("Error loading size guide:", error);
		}

		setLoading(false);
		setHasLoadedOnce(true); // Mark that we've attempted to load
	};

	useEffect(() =>
	{
		fetchData();
	}, [tailorUID]);

	// Check for existing payout accounts
	useEffect(() =>
	{
		const checkExistingAccounts = async () =>
		{
			if (!tailorUID) return;

			try
			{
				// Check for Flutterwave subaccount
				const tailorRef = doc(db, "staging_tailors", tailorUID);
				const tailorDoc = await getDoc(tailorRef);

				if (tailorDoc.exists())
				{
					const data = tailorDoc.data();

					// Check if Flutterwave subaccount exists
					if (data?.flutterwaveSubaccount)
					{
						setHasFlutterwaveAccount(true);
						if (!selectedPayoutProvider)
						{
							setSelectedPayoutProvider("flutterwave");
						}
					}

					// Check if Stripe account exists
					if (data?.stripeAccountId)
					{
						setHasStripeAccount(true);
						if (!selectedPayoutProvider && !data?.flutterwaveSubaccount)
						{
							setSelectedPayoutProvider("stripe");
						}
					}
				}
			} catch (error)
			{
				console.error("Error checking existing accounts:", error);
			}
		};

		checkExistingAccounts();
	}, [tailorUID]);

	// Handle Stripe onboarding redirect
	useEffect(() =>
	{
		const stripeOnboarding = searchParams.get("stripe_onboarding");

		if (stripeOnboarding === "success")
		{
			toast.success("Stripe account connected successfully! Refreshing your account details...", {
				duration: 5000,
			});
			// Dispatch event to trigger StripeConnectAccount refresh
			window.dispatchEvent(new Event("stripe_onboarding_complete"));
			// Clean up URL after a brief delay
			setTimeout(() =>
			{
				router.replace("/vendor/settings?tab=account-details");
			}, 1000);
		} else if (stripeOnboarding === "refresh")
		{
			toast.info("Your Stripe account is still being set up. Please complete your setup to enable payouts.");
			// Dispatch event to trigger StripeConnectAccount refresh
			window.dispatchEvent(new Event("stripe_onboarding_refresh"));
			// Clean up URL
			router.replace("/vendor/settings?tab=account-details");
		}
	}, [searchParams, router]);

	const handleChange = (field: keyof TailorProfile, value: any) =>
	{
		setProfile((prev) => ({ ...prev, [field]: value }));
	};

	// Helper function to normalize type field (handle both string and array)
	const getNormalizedType = (type: string[] | string | undefined): string[] =>
	{
		if (Array.isArray(type)) return type;
		if (typeof type === "string" && type) return [type];
		return [];
	};

	const handleTabChange = (value: string) =>
	{
		setActiveTab(value);
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", value);
		router.replace(`/vendor/settings?${params.toString()}`, { scroll: false });
	};

	console.log(kyc);
	const handleSubmit = async () =>
	{
		setSaving(true);
		const res = await updateTailorProfile(tailorUID as string, profile);
		setSaving(false);
		if (res.success)
		{
			toast.success("Profile updated successfully");
		} else
		{
			toast.error(res.message);
		}
	};

	const handleSaveSizeGuide = async () =>
	{
		if (!tailorUID)
		{
			toast.error("Vendor ID not found");
			return;
		}

		try
		{
			setSavingSizeGuide(true);
			const tailorRef = doc(db, "staging_tailors", tailorUID);
			await updateDoc(tailorRef, {
				sizeGuideImages: sizeGuideImages,
				updatedAt: new Date(),
			});
			toast.success("Size guide saved successfully!");
		} catch (error)
		{
			console.error("Error saving size guide:", error);
			toast.error("Failed to save size guide");
		} finally
		{
			setSavingSizeGuide(false);
		}
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) =>
	{
		const files = e.target.files;
		if (!files || files.length === 0 || !tailorUID) return;
		try
		{
			setUploading(true);
			const urls = await uploadImages([files[0]], tailorUID);
			setProfile((prev) => ({ ...prev, brand_logo: urls[0] }));
		} catch (err: any)
		{
			toast.error("Image upload failed", err);
		} finally
		{
			setUploading(false);
		}
	};

	const renderObjectDetails = (obj?: Record<string, any>) =>
	{
		if (!obj || Object.keys(obj).length === 0)
			return <p className="text-gray-500 italic">No data available</p>;

		return (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{Object.entries(obj).map(([key, value]) => (
					<div key={key} className="bg-gray-50 p-3 rounded">
						<p className="text-xs font-semibold text-gray-500">{key}</p>
						<p className="text-sm text-gray-900">{String(value ?? "")}</p>
					</div>
				))}
			</div>
		);
	};

	const handleKycUpdateRequest = async () =>
	{
		try
		{
			const tailorUID = localStorage.getItem("tailorUID");
			if (!tailorUID)
			{
				toast.error("User ID not found.");
				return;
			}

			// Get Firebase auth token
			const user = auth.currentUser;
			if (!user)
			{
				toast.error("User not authenticated.");
				return;
			}

			const accessToken = await user.getIdToken();

			// Call the service to update Firestore
			const res = await requestKycUpload(tailorUID, true, reason);

			if (res.success)
			{
				toast.success(
					res.message || "KYC update request submitted successfully."
				);
				setOpen(false);
				setReason("");

				// Send email notification via Firebase callable function
				try
				{
					const functions = getFunctions(app, "europe-west1");
					const sendKycEmail = httpsCallable(
						functions,
						"sendKycUpdateRequestEmail"
					);

					// Helper function to safely convert to ISO string
					const toISOStringSafe = (date: any): string =>
					{
						if (!date) return "";
						try
						{
							const d = new Date(date);
							if (isNaN(d.getTime())) return "";
							return d.toISOString();
						} catch
						{
							return "";
						}
					};

					const emailData = {
						// Vendor Information
						vendorId: tailorUID,
						brandName:
							profile.brand_name || profile.brandName || "Unknown Brand",
						fullName:
							`${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
							"N/A",
						email: profile.email || "N/A",
						phoneNumber: profile.phoneNumber || "N/A",
						accountCreatedDate:
							toISOStringSafe(profile.createdAt) || new Date().toISOString(),

						// Request Details
						requestReason: reason,
						requestDate: new Date().toISOString(),
						requestedBy: profile.email || user.email || "N/A",

						// KYC Status
						companyVerification: {
							status: kyc?.companyVerification?.status || "pending",
							documentUrl: kyc?.companyVerification?.documentImageUrl || "",
							lastUpdated: toISOStringSafe(
								kyc?.companyVerification?.verifiedAt
							),
							rcNumber: kyc?.companyVerification?.registrationNumber || "",
						},
						identityVerification: {
							verificationType:
								kyc?.identityVerification?.verificationType || "",
							idNumber: kyc?.identityVerification?.idNumber || "",
							lastUpdated: "",
							fullName: kyc?.identityVerification?.fullName || "",
						},
						addressVerification: {
							documentUrl:
								kyc?.companyAddressVerification?.proofOfAddress || "",
							lastUpdated: "",
							address: kyc?.companyAddressVerification?.streetAddress || "",
						},

						// Business Metrics
						totalProducts: (kyc as any)?.totalProducts || 0,
						vendorType: Array.isArray(profile.type)
							? profile.type
							: profile.type
								? [profile.type]
								: [],

						// URLs and Auth
						logoUrl:
							profile.brand_logo ||
							"https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
						accessToken: accessToken,
					};

					const emailResult = await sendKycEmail(emailData);
					console.log("✅ Email sent successfully:", emailResult);
				} catch (emailError: any)
				{
					console.error("❌ Failed to send email notification:", emailError);
					// Don't show error to user since the main request succeeded
					// Just log it for debugging
				}
			} else
			{
				toast.error(res.message || "Failed to request KYC update.");
			}
		} catch (err: any)
		{
			toast.error(
				err.message || "Something went wrong while requesting KYC update."
			);
		}
	};

	const handleKycUpdateFlow = (selected: {
		company: boolean;
		identity: boolean;
		address: boolean;
	}) =>
	{
		// Build URL params for selected items
		const params = new URLSearchParams();
		if (selected.company) params.set("company", "true");
		if (selected.identity) params.set("identity", "true");
		if (selected.address) params.set("address", "true");

		// Navigate to flow page
		router.push(`/vendor/kyc-update-flow?${params.toString()}`);
		setKycUpdateModalOpen(false);
	};

	// ============================================
	// TEMP: Duplicate Tailor Works Button Handler
	// TODO: Remove this after testing
	// ============================================
	const handleDuplicateTailorWorks = async () =>
	{
		setDuplicating(true);
		try
		{
			const functions = getFunctions(app, "europe-west1");
			const duplicate = httpsCallable(functions, "duplicateTailorsToLocal");

			const result = await duplicate();

			console.log("✅ Duplicate Success:", result.data);
			toast.success(
				`Successfully duplicated ${(result.data as any)?.documentsCopied || 0
				} documents!`
			);
		} catch (error: any)
		{
			console.error("❌ Duplicate Error:", error);
			toast.error(`Error: ${error.message || "Failed to duplicate documents"}`);
		} finally
		{
			setDuplicating(false);
		}
	};
	// ============================================

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Automatically detect email changes after verification */}
			<EmailChangeDetector />
			<ModernNavbar />

			<main className="container mx-auto px-4 py-8">
				<div className=" ">
					<div className="mb-8">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold text-gray-900 mb-2">
									Settings
								</h1>
								<p className="text-gray-600">
									Manage your account settings and preferences
								</p>
							</div>

							{/* ============================================ */}
							{/* TEMP: Duplicate Button - DELETE AFTER TESTING */}
							{/* ============================================ */}
							{/* <Button
								onClick={handleDuplicateTailorWorks}
								disabled={duplicating}
								className="bg-purple-600 hover:bg-purple-700 text-white"
							>
								{duplicating ? "Duplicating..." : "🔄 Duplicate Tailor Works"}
							</Button> */}
							{/* ============================================ */}
						</div>
					</div>
					<div className="mb-8 w-full">
						{/* Case 1: Incomplete KYC */}
						{(!kyc?.companyAddressVerification?.status ||
							!kyc?.companyVerification?.status ||
							!kyc?.identityVerification?.status) && (
								<Card className="border-yellow-500 bg-yellow-50">
									<CardHeader>
										<CardTitle className="flex items-center text-yellow-800">
											<AlertCircle className="h-5 w-5 mr-2" />
											Complete Your KYC to Enable Payouts
										</CardTitle>
										<CardDescription className="text-yellow-700">
											You&rsquo;re currently{" "}
											<strong>not eligible for payouts</strong> until you complete
											all required KYC verifications.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex flex-col sm:flex-row gap-3">
											{!kyc?.companyVerification?.status && (
												<Button
													className="bg-black hover:bg-black/90 text-white"
													onClick={() =>
													(window.location.href =
														"/vendor/company-verification")
													}
												>
													Complete Company Verification
												</Button>
											)}
											{!kyc?.identityVerification?.status &&
												kyc?.companyVerification?.status && (
													<Button
														className="bg-black hover:bg-black/90 text-white"
														onClick={() =>
															(window.location.href = "/vendor/choose-country")
														}
													>
														Complete Identity Verification
													</Button>
												)}
											{!kyc?.companyAddressVerification?.status &&
												kyc?.identityVerification?.status &&
												kyc?.companyVerification?.status && (
													<Button
														className="bg-black hover:bg-black/90 text-white"
														onClick={() =>
														(window.location.href =
															"/vendor/company-proof-of-address")
														}
													>
														Complete Proof of Address
													</Button>
												)}
										</div>
									</CardContent>
								</Card>
							)}

						{/* Case 2: KYC Complete but No Subaccount */}
						{kyc?.companyAddressVerification?.status &&
							kyc?.companyVerification?.status &&
							kyc?.identityVerification?.status &&
							!kyc?.hasSubaccount === true && (
								<Card className="border-blue-500 bg-blue-50 mt-6">
									<CardHeader>
										<CardTitle className="flex items-center text-blue-800">
											<AlertCircle className="h-5 w-5 mr-2" />
											Add Your Bank Details for Payouts
										</CardTitle>
										<CardDescription className="text-blue-700">
											Your KYC is complete, but we need your payout account
											details to enable withdrawals.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Button
											className="bg-blue-600 hover:bg-blue-700 text-white"
											onClick={() =>
											(window.location.href =
												"/vendor/settings?tab=account-details")
											}
										>
											Add Payout Account
										</Button>
									</CardContent>
								</Card>
							)}
					</div>
				</div>

				<div className="flex flex-col lg:flex-row gap-8">
					{/* Sidebar Navigation */}
					<nav className="flex flex-row lg:flex-col lg:w-1/4 mt-8 gap-2 rounded-lg overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
						<span
							onClick={() => handleTabChange("profile")}
							className={`
								cursor-pointer block w-auto lg:w-full lg:py-6 py-2 px-3 lg:px-4 rounded-lg text-center lg:text-left font-medium transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink text-sm lg:text-base
								${activeTab === "profile"
									? "bg-black text-white shadow-md"
									: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
								}
							`}
						>
							Profile
						</span>
						<span
							onClick={() => handleTabChange("kyc")}
							className={`
								cursor-pointer block w-auto lg:w-full lg:py-6 py-2 px-3 lg:px-4 rounded-lg text-center lg:text-left font-medium transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink text-sm lg:text-base
								${activeTab === "kyc"
									? "bg-black text-white shadow-md"
									: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
								}
							`}
						>
							KYC Documents
						</span>
						<span
							onClick={() => handleTabChange("account-details")}
							className={`
								cursor-pointer block w-auto lg:w-full lg:py-6 py-2 px-3 lg:px-4 rounded-lg text-center lg:text-left font-medium transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink text-sm lg:text-base
								${activeTab === "account-details"
									? "bg-black text-white shadow-md"
									: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
								}
							`}
						>
							Account Details
						</span>
						<span
							onClick={() => handleTabChange("size-guide")}
							className={`
								cursor-pointer block w-auto lg:w-full lg:py-6 py-2 px-3 lg:px-4 rounded-lg text-center lg:text-left font-medium transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink text-sm lg:text-base
								${activeTab === "size-guide"
									? "bg-black text-white shadow-md"
									: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
								}
							`}
						>
							Size Guide
						</span>
					</nav>

					{/* Content Area */}
					<div className="flex-1">
						{/* Profile Tab */}
						{activeTab === "profile" && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Tailor Profile Settings</CardTitle>
									</CardHeader>
									<CardContent className="grid gap-6">
										<div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
											<Avatar className="h-24 w-24">
												<AvatarImage
													src={
														profile.brand_logo ||
														"/placeholder.svg?height=96&width=96"
													}
												/>
												<AvatarFallback className="text-lg">JD</AvatarFallback>
											</Avatar>
											<div>
												<input
													type="file"
													accept="image/*"
													ref={fileInputRef}
													onChange={handleImageUpload}
													className="hidden"
												/>
												<Button
													variant="outline"
													size="sm"
													onClick={() => fileInputRef.current?.click()}
													disabled={uploading}
												>
													<Upload className="h-4 w-4 mr-2" />
													{uploading ? "Uploading..." : "Change Photo"}
												</Button>
												<p className="text-sm text-gray-500 mt-2">
													JPG, GIF or PNG. 1MB max.
												</p>
											</div>
										</div>

										{/* Profile Form */}
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="grid gap-2">
												<Label>Brand Name</Label>
												<Input
													value={profile.brand_name || ""}
													onChange={(e) =>
														handleChange("brand_name", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>First Name</Label>
												<Input
													value={profile.first_name || ""}
													onChange={(e) =>
														handleChange("first_name", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Last Name</Label>
												<Input
													value={profile.last_name || ""}
													onChange={(e) =>
														handleChange("last_name", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<div className="flex items-center justify-between">
													<Label>Email</Label>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => setEmailChangeDialogOpen(true)}
														className="text-xs h-7"
													>
														Change
													</Button>
												</div>
												<Input value={profile.email || ""} disabled />
												<p className="text-xs text-gray-500">
													Click "Change" to update your email address
												</p>
											</div>
											<div className="grid gap-2">
												<Label>Type</Label>
												<div>
													<Select
														isMulti
														options={[
															{ value: "Bespoke", label: "Bespoke" },
															{ value: "Ready to Wear", label: "Ready to Wear" },
														]}
														value={getNormalizedType(profile.type).map((val) => ({
															value: val,
															label: val,
														}))}
														onChange={(selected) =>
															handleChange(
																"type",
																selected ? selected.map((s) => s.value) : []
															)
														}
														isDisabled={saving}
														styles={{
															control: (base) => ({
																...base,
																borderRadius: "0.375rem", // rounded-md
																borderColor: "#d1d5db", // gray-300
																padding: "2px",
															}),
														}}
													/>
													<p className="text-xs text-red-300 mt-1">
														You can select multiple types
													</p>
												</div>
											</div>
											<div className="grid gap-2">
												<Label>Role</Label>
												<Input
													value={profile.role || ""}
													onChange={(e) => handleChange("role", e.target.value)}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Phone Number</Label>
												<Input
													value={profile.phoneNumber || ""}
													onChange={(e) =>
														handleChange("phoneNumber", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Address</Label>
												<Input
													value={profile.address || ""}
													onChange={(e) =>
														handleChange("address", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Date of Birth</Label>
												<Input
													type="date"
													value={profile.dateOfBirth || ""}
													onChange={(e) =>
														handleChange("dateOfBirth", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>State of Origin</Label>
												<Input
													value={profile.stateOfOrigin || ""}
													onChange={(e) =>
														handleChange("stateOfOrigin", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Gender</Label>
												<Input
													value={profile.gender || ""}
													onChange={(e) => handleChange("gender", e.target.value)}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Nationality</Label>
												<Input
													value={profile.nationality || ""}
													onChange={(e) =>
														handleChange("nationality", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>LGA</Label>
												<Input
													value={profile.localGovernmentArea || ""}
													onChange={(e) =>
														handleChange("localGovernmentArea", e.target.value)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Languages Spoken (comma separated)</Label>
												<Input
													value={profile.languagesSpoken?.join(", ") || ""}
													onChange={(e) =>
														handleChange(
															"languagesSpoken",
															e.target.value.split(",").map((s) => s.trim())
														)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Years of Experience</Label>
												<Input
													type="number"
													value={profile.yearsOfExperience || 0}
													onChange={(e) =>
														handleChange(
															"yearsOfExperience",
															Number(e.target.value)
														)
													}
												/>
											</div>
											<div className="grid gap-2">
												<Label>Skill Specialties (comma separated)</Label>
												<Input
													value={profile.skillSpecialties?.join(", ") || ""}
													onChange={(e) =>
														handleChange(
															"skillSpecialties",
															e.target.value.split(",").map((s) => s.trim())
														)
													}
												/>
											</div>
											<div className="md:col-span-2 grid gap-2">
												<Label>Bio</Label>
												<Input
													value={profile.bio || ""}
													onChange={(e) => handleChange("bio", e.target.value)}
												/>
											</div>
										</div>

										<div className="pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
											<Button
												onClick={handleSubmit}
												disabled={saving}
												className="w-full md:w-auto"
											>
												{saving ? "Saving..." : "Update Profile"}
											</Button>
											<Button
												onClick={() => setDialogOpen(true)}
												className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
											>
												Change Password
											</Button>
										</div>

										<ChangePasswordDialog
											open={dialogOpen}
											onClose={() => setDialogOpen(false)}
										/>
									</CardContent>
								</Card>
							</div>
						)}

						{/* KYC Tab */}
						{activeTab === "kyc" && (
							<div className="space-y-6">
								{/* KYC Status Alert Cards */}
								{!loading && (
									<>
										{profile.requestKycUpload === true &&
											profile.adminApprovedKycUpload !== true && (
												<Card className="border-orange-500 bg-orange-50">
													<CardHeader>
														<CardTitle className="flex items-center text-orange-900">
															<AlertCircle className="h-5 w-5 mr-2" />
															KYC Update Request Pending
														</CardTitle>
														<CardDescription className="text-orange-700">
															Your request to update KYC documents is awaiting
															admin approval.
														</CardDescription>
													</CardHeader>
												</Card>
											)}

										{profile.adminApprovedKycUpload === true && (
											<Card className="border-emerald-200 bg-emerald-50">
												<CardHeader>
													<CardTitle className="flex items-center text-emerald-900">
														<CheckCircle className="h-5 w-5 mr-2" />
														KYC Update Approved
													</CardTitle>
													<CardDescription className="text-emerald-700">
														Admin has approved your request. You can now update
														your KYC documents below.
													</CardDescription>
												</CardHeader>
											</Card>
										)}

										{profile.kycApprovalStatus === "declined" &&
											profile.requestKycUpload !== true && (
												<Card className="border-red-500 bg-red-50">
													<CardHeader>
														<CardTitle className="flex items-center text-red-900">
															<XCircle className="h-5 w-5 mr-2" />
															KYC Update Request Declined
														</CardTitle>
														<CardDescription className="text-red-700">
															{profile.adminNote
																? `Reason: ${profile.adminNote}. You can submit a new request with corrections.`
																: "Your request was declined. You can submit a new request."}
														</CardDescription>
													</CardHeader>
												</Card>
											)}
									</>
								)}

								<Card>
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<FileText className="h-5 w-5" />
											<span>KYC Documents</span>
										</CardTitle>
										<CardDescription>
											View your verification details
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										{loading && <p>Loading KYC details...</p>}

										{!loading && kyc && (
											<>
												{!kyc.companyVerification?.status && (
													<div className="text-center p-4 border rounded bg-yellow-50">
														<p className="text-red-600 font-medium">
															Your company verification is incomplete. Please
															complete your KYC.
														</p>
														<Button
															className="mt-3"
															onClick={() =>
															(window.location.href =
																"/vendor/company-verification")
															}
														>
															Complete Company Verification
														</Button>
													</div>
												)}

												{!kyc.identityVerification?.status &&
													kyc.companyVerification?.status && (
														<div className="text-center p-4 border rounded bg-yellow-50">
															<p className="text-red-600 font-medium">
																Your identity verification is incomplete. Please
																complete your ID verification.
															</p>
															<Button
																className="mt-3"
																onClick={() =>
																(window.location.href =
																	"/vendor/choose-country")
																}
															>
																Complete Identity Verification
															</Button>
														</div>
													)}

												{!kyc.companyAddressVerification?.streetAddress &&
													kyc.identityVerification?.status &&
													kyc.companyVerification?.status && (
														<div className="text-center p-4 border rounded bg-yellow-50">
															<p className="text-red-600 font-medium">
																Your Proof of address is incomplete. Please
																complete your Address verification.
															</p>
															<Button
																className="mt-3"
																onClick={() =>
																(window.location.href =
																	"/vendor/company-proof-of-address")
																}
															>
																Complete Proof of Address
															</Button>
														</div>
													)}

												{kyc.companyAddressVerification &&
													renderObjectDetails(kyc.companyAddressVerification)}
												{kyc.companyVerification?.status &&
													renderObjectDetails(kyc.companyVerification)}
												{Array.isArray(kyc.keyPersonnel) &&
													kyc.keyPersonnel.length > 0 &&
													kyc.keyPersonnel.map((person, idx) => (
														<div key={idx} className="border p-3 rounded mb-2">
															{renderObjectDetails(person)}
														</div>
													))}
												{kyc.identityVerification?.status &&
													renderObjectDetails(kyc.identityVerification)}

												{/* ✅ KYC Update Request Button with States */}
												{kyc.companyAddressVerification?.status &&
													kyc.identityVerification?.status &&
													kyc.companyVerification?.status && (
														<div className="pt-4 text-center">
															{/* State 1: Request Pending */}
															{profile.requestKycUpload === true &&
																profile.adminApprovedKycUpload !== true && (
																	<div className="space-y-2">
																		<Button
																			disabled
																			className="bg-orange-500 text-white cursor-not-allowed opacity-70"
																		>
																			<AlertCircle className="h-4 w-4 mr-2" />
																			KYC Update Request Pending
																		</Button>
																		<p className="text-sm text-orange-600">
																			Your request is awaiting admin approval.
																			You'll be notified once reviewed.
																		</p>
																	</div>
																)}

															{/* State 2: Approved - Can Update KYC */}
															{profile.adminApprovedKycUpload === true && (
																<div className="space-y-2">
																	<Button
																		onClick={() => setKycUpdateModalOpen(true)}
																		className="bg-emerald-600 hover:bg-emerald-700 text-white"
																	>
																		<CheckCircle className="h-4 w-4 mr-2" />
																		Update Your KYC Documents
																	</Button>
																	<p className="text-sm text-emerald-600">
																		✓ Admin has approved your request. You can now
																		update your KYC documents.
																	</p>
																</div>
															)}

															{/* State 3: Declined - Can Request Again */}
															{profile.kycApprovalStatus === "declined" &&
																profile.requestKycUpload !== true && (
																	<div className="space-y-2">
																		<Button
																			onClick={() => setOpen(true)}
																			className="bg-red-600 hover:bg-red-700 text-white"
																		>
																			<XCircle className="h-4 w-4 mr-2" />
																			Request KYC Update Again
																		</Button>
																		<p className="text-sm text-red-600">
																			Your previous request was declined.{" "}
																			{profile.adminNote
																				? `Reason: ${profile.adminNote}`
																				: ""}
																		</p>
																	</div>
																)}

															{/* State 4: Initial State - Can Request */}
															{!profile.requestKycUpload &&
																!profile.adminApprovedKycUpload &&
																profile.kycApprovalStatus !== "declined" && (
																	<div className="space-y-2">
																		<Button
																			onClick={() => setOpen(true)}
																			className="bg-black hover:bg-black/90 text-white"
																		>
																			Request Update of KYC Details
																		</Button>
																		<p className="text-sm text-gray-500">
																			Need to update your KYC information? Request
																			admin approval first.
																		</p>
																	</div>
																)}
														</div>
													)}

												<Dialog open={open} onOpenChange={setOpen}>
													<DialogContent className="sm:max-w-md">
														<DialogHeader>
															<DialogTitle>Request KYC Update</DialogTitle>
														</DialogHeader>
														<div className="space-y-4">
															<Label htmlFor="reason">Reason for update</Label>
															<Input
																id="reason"
																value={reason}
																onChange={(e) => setReason(e.target.value)}
																placeholder="Enter your reason..."
															/>
														</div>
														<DialogFooter>
															<Button
																variant="outline"
																onClick={() => setOpen(false)}
															>
																Cancel
															</Button>
															<Button
																className="bg-black hover:bg-black/90 text-white"
																onClick={handleKycUpdateRequest}
															>
																Submit
															</Button>
														</DialogFooter>
													</DialogContent>
												</Dialog>
											</>
										)}
									</CardContent>
								</Card>
							</div>
						)}

						{/* Account Details Tab */}
						{activeTab === "account-details" && (
							<div className="space-y-6">
								{/* Wallet Balance Card */}
								<Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
									<CardHeader>
										<CardTitle className="flex items-center justify-between">
											<span className="text-xl">Wallet Balance</span>
											<div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-6 w-6 text-white"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
													/>
												</svg>
											</div>
										</CardTitle>
										<CardDescription>
											Your current available balance
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-baseline space-x-2">
												<span className="text-4xl font-bold text-gray-900">
													$
													{((kyc?.wallet as number) || 0).toLocaleString(
														"en-US",
														{
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														}
													)}
												</span>
												<span className="text-sm text-gray-500">USD</span>
											</div>

											<div className="grid grid-cols-2 gap-4 pt-4 border-t">
												<div className="space-y-1">
													<p className="text-xs text-gray-500">
														Available Balance
													</p>
													<p className="text-lg font-semibold text-emerald-600">
														$
														{((kyc?.wallet as number) || 0).toLocaleString(
															"en-US",
															{
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															}
														)}
													</p>
												</div>
												<div className="space-y-1">
													<p className="text-xs text-gray-500">Status</p>
													<div className="flex items-center space-x-1">
														<div className="h-2 w-2 rounded-full bg-emerald-500"></div>
														<p className="text-sm font-medium text-emerald-600">
															Active
														</p>
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Provider Selection - only show if no accounts exist */}
								{!hasFlutterwaveAccount && !hasStripeAccount && !selectedPayoutProvider && (
									<Card className="border-2 border-blue-100">
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<Wallet className="h-5 w-5" />
												Choose Your Payout Provider
											</CardTitle>
											<CardDescription>
												Select how you want to receive your payouts. You can choose between Flutterwave or Stripe.
											</CardDescription>
										</CardHeader>
										<CardContent>
											<RadioGroup
												value={selectedPayoutProvider || ""}
												onValueChange={(value) => setSelectedPayoutProvider(value as "flutterwave" | "stripe")}
												className="grid grid-cols-1 md:grid-cols-2 gap-4"
											>
												{/* Flutterwave Option */}
												<div className="relative">
													<RadioGroupItem
														value="flutterwave"
														id="flutterwave"
														className="peer sr-only"
													/>
													<Label
														htmlFor="flutterwave"
														className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-6 hover:bg-gray-50 peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-gray-50 cursor-pointer transition-all"
													>
														<div className="flex flex-col items-center gap-3 text-center">
															<Banknote className="h-8 w-8 text-orange-600" />
															<div>
																<div className="font-semibold text-lg">Flutterwave</div>
																<p className="text-sm text-gray-500 mt-1">
																	Popular in Africa. Supports Nigerian banks and multiple African countries.
																</p>
															</div>
														</div>
														<Badge variant="outline" className="mt-3">
															Nigeria, Ghana, Kenya, Uganda
														</Badge>
													</Label>
												</div>

												{/* Stripe Option */}
												<div className="relative">
													<RadioGroupItem
														value="stripe"
														id="stripe"
														className="peer sr-only"
													/>
													<Label
														htmlFor="stripe"
														className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-6 hover:bg-gray-50 peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-gray-50 cursor-pointer transition-all"
													>
														<div className="flex flex-col items-center gap-3 text-center">
															<svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
																<path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="#635BFF" />
															</svg>
															<div>
																<div className="font-semibold text-lg">Stripe</div>
																<p className="text-sm text-gray-500 mt-1">
																	Global payment platform. Supports international bank accounts.
																</p>
															</div>
														</div>
														<Badge variant="outline" className="mt-3">
															Global Coverage
														</Badge>
													</Label>
												</div>
											</RadioGroup>
										</CardContent>
									</Card>
								)}

								{/* Show tabs for switching between providers if both exist */}
								{hasFlutterwaveAccount && hasStripeAccount && (
									<Card>
										<CardHeader>
											<CardTitle>Your Payout Accounts</CardTitle>
											<CardDescription>
												You have both Flutterwave and Stripe accounts set up. Switch between them below.
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="flex gap-3">
												<Button
													variant={selectedPayoutProvider === "flutterwave" ? "default" : "outline"}
													onClick={() => setSelectedPayoutProvider("flutterwave")}
													className="flex-1"
												>
													<Banknote className="h-4 w-4 mr-2" />
													Flutterwave
												</Button>
												<Button
													variant={selectedPayoutProvider === "stripe" ? "default" : "outline"}
													onClick={() => setSelectedPayoutProvider("stripe")}
													className="flex-1"
												>
													<svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
														<path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="currentColor" />
													</svg>
													Stripe
												</Button>
											</div>
										</CardContent>
									</Card>
								)}

								{/* Flutterwave Subaccount (VendorDashboard) */}
								{selectedPayoutProvider === "flutterwave" && (
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Banknote className="h-5 w-5 text-orange-600" />
												<h3 className="text-lg font-semibold">Flutterwave Payout Account</h3>
											</div>
											{hasStripeAccount && !hasFlutterwaveAccount && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedPayoutProvider("stripe")}
												>
													Switch to Stripe
												</Button>
											)}
											{!hasStripeAccount && hasFlutterwaveAccount && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
													{
														setSelectedPayoutProvider("stripe");
														setHasStripeAccount(false);
													}}
												>
													Add Stripe Account
												</Button>
											)}
										</div>
										<VendorDashboard />
									</div>
								)}

								{/* Stripe Connect Account */}
								{selectedPayoutProvider === "stripe" && (
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
													<path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="#635BFF" />
												</svg>
												<h3 className="text-lg font-semibold">Stripe Payout Account</h3>
											</div>
											{hasFlutterwaveAccount && !hasStripeAccount && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedPayoutProvider("flutterwave")}
												>
													Switch to Flutterwave
												</Button>
											)}
											{!hasFlutterwaveAccount && hasStripeAccount && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
													{
														setSelectedPayoutProvider("flutterwave");
														setHasFlutterwaveAccount(false);
													}}
												>
													Add Flutterwave Account
												</Button>
											)}
										</div>
										{loading ? (
											<Card>
												<CardContent className="p-6">
													<div className="flex items-center justify-center">
														<p className="text-gray-600">
															Loading account information...
														</p>
													</div>
												</CardContent>
											</Card>
										) : tailorUID && profile.email ? (
											<StripeConnectAccount
												tailorUID={tailorUID}
												email={profile.email}
												businessName={profile.brand_name || profile.brandName}
												country="US"
												onSuccess={fetchData}
											/>
										) : hasLoadedOnce ? (
											<Card>
												<CardContent className="p-6">
													<div className="flex items-center justify-center text-red-600">
														<p>
															Unable to load Stripe Connect. Please ensure your
															profile is complete.
														</p>
													</div>
												</CardContent>
											</Card>
										) : (
											<Card>
												<CardContent className="p-6">
													<div className="flex items-center justify-center">
														<p className="text-gray-600">
															Loading account information...
														</p>
													</div>
												</CardContent>
											</Card>
										)}
									</div>
								)}
							</div>
						)}

						{/* Size Guide Tab */}
						{activeTab === "size-guide" && (
							<div className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle></CardTitle>
										<CardDescription>
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										{/* Size Guide Input Component */}
										<ImageBasedSizeGuideInput
											value={sizeGuideImages}
											onChange={setSizeGuideImages}
											tailorId={tailorUID || ""}
										/>

										{/* Info Box */}
										<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
											<h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
											<ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
												<li>Upload images of your size guide charts (e.g., measurement tables, sizing diagrams)</li>
												<li>These images will automatically appear on all your product pages</li>
												<li>Customers will see your size guide images when viewing any of your products</li>
												<li>No need to add size guides to individual products</li>
											</ul>
										</div>

										<div className="flex justify-end">
											<Button
												onClick={handleSaveSizeGuide}
												disabled={savingSizeGuide}
												className="bg-black hover:bg-gray-800"
											>
												{savingSizeGuide ? "Saving..." : "Save Size Guide"}
											</Button>
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</div>
			</main>

			{/* KYC Update Modal */}
			<KycUpdateModal
				open={kycUpdateModalOpen}
				onClose={() => setKycUpdateModalOpen(false)}
				onContinue={handleKycUpdateFlow}
			/>

			{/* Email Change Dialog */}
			<EmailChangeDialog
				open={emailChangeDialogOpen}
				onClose={() => setEmailChangeDialogOpen(false)}
				onSuccess={() =>
				{
					fetchData();
				}}
			/>
		</div>
	);
}
