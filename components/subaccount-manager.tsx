"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import {
	getTailorProfile,
	TailorProfile,
} from "@/vendor-services/tailorProfile";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase";

interface VendorData {
	first_name: string;
	last_name: string;
	email: string;
	is_tailor: boolean;
	userId: string;
}

interface Subaccount {
	id: number;
	account_number: string;
	account_bank: string;
	bank_name: string;
	business_name: string;
	business_email: string;
	business_contact: string;
	business_mobile: string;
	country: string;
	split_type: string;
	split_value: number;
	status?: string;
	created_at: string;
	subaccount_id: string;
}
export interface SubAccount {
	account_bank: string; // e.g., "044"
	account_id: number; // e.g., 2635939
	account_number: string; // e.g., "0690000034"
	bank_name: string; // e.g., "ACCESS BANK NIGERIA"
	business_name: string; // e.g., "Labeld"
	country: string; // e.g., "NG"
	created_at: string; // ISO datetime string
	full_name: string; // e.g., "Ade Bond"
	id: number; // e.g., 23780
	meta: Record<string, any> | null; // can be null or object
	split_ratio: number; // e.g., 1
	split_type: "percentage" | "flat" | string; // depending on API
	split_value: number; // e.g., 0.8
	subaccount_id: string; // e.g., "RS_0C7236B262F49A86D62376619B027FE5"
}

interface BankData {
	id: number;
	code: string;
	name: string;
}

interface FlutterwaveEnvelope<T> {
	status: string;
	message: string;
	data: T;
}

interface ResolvedAccountData {
	accountNumber: string;
	accountName: string;
	bankId: number;
	bankCode: string;
}

// Phone country code mapping with flags
const PHONE_COUNTRY_MAP: Record<
	string,
	{ code: string; name: string; countryCode: string; flag: string }
> = {
	"+234": { code: "NG", name: "Nigeria", countryCode: "+234", flag: "🇳🇬" },
	"+233": { code: "GH", name: "Ghana", countryCode: "+233", flag: "🇬🇭" },
	"+254": { code: "KE", name: "Kenya", countryCode: "+254", flag: "🇰🇪" },
	"+256": { code: "UG", name: "Uganda", countryCode: "+256", flag: "🇺🇬" },
};

export function SubaccountManager({ vendorData }: { vendorData: VendorData }) {
	const [subaccounts, setSubaccounts] = useState<SubAccount[]>([]);
	const [profile, setProfile] = useState<Partial<TailorProfile>>({});
	const [banks, setBanks] = useState<BankData[]>([]);
	const [loadingBanks, setLoadingBanks] = useState(false);

	const [loading, setLoading] = useState(false);
	const [creating, setCreating] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [detectedCountry, setDetectedCountry] = useState<{
		code: string;
		name: string;
	} | null>(null);
	const [selectedPhoneCountry, setSelectedPhoneCountry] =
		useState<string>("+234"); // Default to Nigeria
	const [verifyingAccount, setVerifyingAccount] = useState(false);
	const [verifiedAccountName, setVerifiedAccountName] = useState<string | null>(
		null,
	);
	const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	
	// Use vendorData.userId as the primary source
	const userId = vendorData.userId;
	const subaccountId = localStorage.getItem("subaccountid");
	const tailorUID =
		typeof window !== "undefined" ? localStorage.getItem("tailorUID") : null;
		
	// Debug logging
	useEffect(() => {
		console.log("[SubaccountManager] Component mounted with:");
		console.log("  vendorData:", vendorData);
		console.log("  userId (from vendorData):", userId);
		console.log("  subaccountId:", subaccountId);
		console.log("  tailorUID:", tailorUID);
	}, [vendorData, userId, subaccountId, tailorUID]);

	// Fetch tailor profile
	useEffect(() => {
		const fetchProfile = async () => {
			if (!tailorUID) return;
			try {
				const res = await getTailorProfile(tailorUID as string);
				if (res.success) {
					setProfile(res.data as any);
				}
			} catch (error) {
				console.error("[SubaccountManager] Error fetching profile:", error);
			}
		};

		fetchProfile();
	}, [tailorUID]);

	// Fetch from Firestore tailor document
	useEffect(() => {
		const fetchFromFirestore = async () => {
			if (!userId) {
				console.log("[SubaccountManager] No userId found, cannot fetch subaccounts");
				setLoading(false);
				return;
			}
			
			console.log("[SubaccountManager] Fetching subaccounts for userId:", userId);
			setLoading(true);
			
			try {
				const tailorRef = doc(db, "staging_tailors", userId);
				const tailorDoc = await getDoc(tailorRef);
				
				console.log("[SubaccountManager] Tailor document exists:", tailorDoc.exists());
				
				if (tailorDoc.exists()) {
					const data = tailorDoc.data();
					console.log("[SubaccountManager] Tailor data:", {
						hasSubaccount: data.hasSubaccount,
						flutterwaveSubaccount: !!data.flutterwaveSubaccount,
						keys: Object.keys(data)
					});
					
					if (data.flutterwaveSubaccount) {
						console.log(
							"[SubaccountManager] Found subaccount in Firestore:",
							data.flutterwaveSubaccount,
						);
						setSubaccounts([
							data.flutterwaveSubaccount as SubAccount,
						]);
						setShowForm(false);
					} else {
						console.log("[SubaccountManager] No flutterwaveSubaccount found in document");
						setSubaccounts([]);
					}
				} else {
					console.log("[SubaccountManager] No tailor document found for userId:", userId);
					setSubaccounts([]);
				}
			} catch (error) {
				console.error(
					"[SubaccountManager] Error fetching from Firestore:",
					error,
				);
				setSubaccounts([]);
			} finally {
				setLoading(false);
			}
		};

		fetchFromFirestore();
	}, [userId]);

	useEffect(() => {
		if (subaccountId || vendorData.email) {
			fetchSubaccounts();
		}
	}, [subaccountId, vendorData.email]);

	const fetchSubaccounts = async () => {
		setLoading(true);
		try {
			// First try fetching by ID if available
			if (subaccountId) {
				const response = await fetch(
					`/api/flutterwave/subaccounts?subaccountId=${subaccountId}`,
				);

				if (response.ok) {
					const data = await response.json();
					if (data.subaccount) {
						setSubaccounts([data.subaccount]);
						setShowForm(false);
						setLoading(false);
						return;
					}
				}
			}

			// Fallback: Fetch by email if no ID or ID fetch failed
			if (vendorData.email) {
				const response = await fetch(
					`/api/flutterwave/subaccounts?email=${encodeURIComponent(vendorData.email)}`,
				);

				if (response.ok) {
					const data = await response.json();
					if (data.subaccounts && data.subaccounts.length > 0) {
						console.log("Found subaccounts by email:", data.subaccounts);
						setSubaccounts(data.subaccounts);
						setShowForm(false);

						// Optionally save the first one as primary to local storage for next time
						if (data.subaccounts[0].id) {
							localStorage.setItem(
								"subaccountid",
								data.subaccounts[0].id.toString(),
							);
						}
					} else {
						setSubaccounts([]);
					}
				} else {
					setSubaccounts([]);
				}
			}
		} catch (error) {
			console.error("Error fetching subaccounts:", error);
			setSubaccounts([]);
		} finally {
			setLoading(false);
		}
	};

	const handlePhoneCountryChange = (
		phoneField: "contact" | "business",
		countryCode: string,
	) => {
		if (phoneField === "contact") {
			setSelectedPhoneCountry(countryCode);
		} else {
			setSelectedPhoneCountry(countryCode);
		}

		const country = PHONE_COUNTRY_MAP[countryCode];
		if (country) {
			setDetectedCountry({ code: country.code, name: country.name });
		}
	};

	useEffect(() => {
		if (detectedCountry?.code) {
			fetchBanks(detectedCountry.code);
		} else {
			// Default to Nigeria if no country detected yet
			fetchBanks("NG");
		}
	}, [detectedCountry]);

	const fetchBanks = async (countryCode: string) => {
		setLoadingBanks(true);
		try {
			// Use the existing API route instead of missing Firebase function
			const response = await fetch(`/api/flutterwave/banks?country=${countryCode}`);
			const result = await response.json();
			
			if (result.success && Array.isArray(result.banks)) {
				// Remove duplicates by code (keeping first occurrence) and sort banks alphabetically
				const uniqueBanks = result.banks
					.filter((bank: BankData, index: number, self: BankData[]) => 
						index === self.findIndex((b: BankData) => b.code === bank.code)
					)
					.sort((a: BankData, b: BankData) => a.name.localeCompare(b.name));
				
				setBanks(uniqueBanks);
			} else {
				console.error("Failed to fetch banks:", result);
				toast.error("Failed to load bank list");
				setBanks([]);
			}
		} catch (error) {
			console.error("Error fetching banks:", error);
			toast.error("Failed to load bank list");
			setBanks([]);
		} finally {
			setLoadingBanks(false);
		}
	};

	const handleVerifyAccount = async (
		accountBank: string,
		accountNumber: string,
		showToast: boolean = true,
	) => {
		if (!accountBank || !accountNumber) return null;

		setVerifyingAccount(true);
		try {
			// Use the existing API route instead of missing Firebase function
			const response = await fetch("/api/flutterwave/resolve-account", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					account_number: accountNumber,
					bank_code: accountBank,
				}),
			});

			const result = await response.json();

			if (result.success && result.account_name) {
				setVerifiedAccountName(result.account_name);
				if (showToast) {
					toast.success(`Account verified: ${result.account_name}`);
				}
				return result.account_name;
			} else {
				setVerifiedAccountName(null);
				if (showToast) {
					toast.error(result.message || "Failed to verify account");
				}
				return null;
			}
		} catch (error: any) {
			setVerifiedAccountName(null);
			if (showToast) {
				toast.error(error?.message || "Failed to verify account");
			}
			return null;
		} finally {
			setVerifyingAccount(false);
		}
	};

	const handleAccountFieldChange = useCallback(
		(accountBank: string, accountNumber: string) => {
			// Clear previous timeout
			if (verificationTimeoutRef.current) {
				clearTimeout(verificationTimeoutRef.current);
			}

			// Reset verification if either field is empty
			if (!accountBank || !accountNumber) {
				setVerifiedAccountName(null);
				return;
			}

			// Set new timeout for auto-verification (1 second delay)
			verificationTimeoutRef.current = setTimeout(() => {
				handleVerifyAccount(accountBank, accountNumber, false);
			}, 1000);
		},
		[],
	);

	const [selectedBankCode, setSelectedBankCode] = useState<string>("");

	const handleCreateSubaccount = async (
		e: React.FormEvent<HTMLFormElement>,
	) => {
		e.preventDefault();
		setCreating(true);

		const formData = new FormData(e.currentTarget);
		const accountBank = selectedBankCode;
		const accountNumber = formData.get("account_number") as string;

		if (!accountBank) {
			toast.error("Please select a bank");
			setCreating(false);
			return;
		}

		try {
			// Verify account before creating subaccount
			if (!verifiedAccountName) {
				const verifiedName = await handleVerifyAccount(
					accountBank,
					accountNumber,
					true,
				);
				if (!verifiedName) {
					toast.error("Please verify your account details first");
					setCreating(false);
					return;
				}
			}

			// Use detected country from phone number, fallback to Nigeria
			const countryCode = detectedCountry?.code || "NG";

			const subaccountData = {
				account_bank: accountBank,
				account_number: accountNumber,
				business_name: formData.get("business_name") as string,
				business_email: formData.get("business_email") as string,
				business_contact: formData.get("business_contact") as string,
				business_contact_mobile: formData.get(
					"business_contact_mobile",
				) as string,
				business_mobile: formData.get("business_mobile") as string,
				country: countryCode,
				split_type: "percentage",
				split_value: 0.8,
			};

			// Call API that saves to both Firestore (tailors collection) and Flutterwave
			const response = await fetch("/api/flutterwave/subaccounts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"user-id": userId, // Use vendorData.userId which should be more reliable
				},
				body: JSON.stringify(subaccountData),
			});

			const result = await response.json();
			
			// Log the response for debugging
			console.log("Subaccount creation response:", { 
				ok: response.ok, 
				status: response.status, 
				result 
			});

			if (response.ok) {
				// Check if the response contains a quota exceeded message
				if (result.message && result.message.includes("quota") && result.message.includes("limits")) {
					toast.info("Subaccount created but may not be reflected immediately due to system limits. Please refresh the page.");
				} else {
					toast.success("Subaccount created successfully");
				}
				
				if (result.data?.id) {
					localStorage.setItem("subaccountid", result.data.id);
				}
				setShowForm(false);
				// Refresh from Firestore to get the saved subaccount
				const tailorRef = doc(db, "staging_tailors", userId);
				const tailorDoc = await getDoc(tailorRef);
				if (tailorDoc.exists() && tailorDoc.data().flutterwaveSubaccount) {
					setSubaccounts([
						tailorDoc.data().flutterwaveSubaccount as SubAccount,
					]);
				}
			} else {
				let errorMessage = result.error || "Failed to create subaccount";
				if (result.message) {
					errorMessage = result.message;
				}
				if (result.details) {
					errorMessage += ` - ${JSON.stringify(result.details)}`;
				}
				
				// More specific error handling
				if (response.status === 500) {
					errorMessage = "Internal server error. Please try again later.";
					console.error("Subaccount creation failed with server error:", result);
				} else if (response.status === 400) {
					errorMessage = result.error || "Bad request. Please check your input.";
				} else if (response.status === 401) {
					errorMessage = "Unauthorized. Please log in and try again.";
				} else if (response.status === 503) {
					errorMessage = result.error || "Service temporarily unavailable. Please try again later.";
				}
				
				toast.error(errorMessage);
			}
		} catch (error: any) {
			toast.error(error?.message || "Failed to create subaccount");
		} finally {
			setCreating(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div></div>
				<Button
					onClick={() => setShowForm(!showForm)}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					Create Subaccount
				</Button>
			</div>

			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>Create New Subaccount</CardTitle>
						<CardDescription>
							Fill in the details to create a new Flutterwave subaccount
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleCreateSubaccount} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="business_name">Business Name</Label>
									{/* Hidden input to send the value in form submission */}
									<input
										type="hidden"
										name="business_name"
										value={profile.brand_name || ""}
									/>
									{/* Disabled display input */}
									<Input
										id="business_name"
										disabled
										value={profile.brand_name || ""}
										className="bg-gray-100 text-gray-700 cursor-not-allowed"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="business_email">Business Email</Label>
									<Input
										id="business_email"
										name="business_email"
										type="email"
										placeholder="business@example.com"
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="business_contact">Business Contact</Label>
									<Input
										id="business_contact"
										name="business_contact"
										placeholder="Contact Person"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="business_contact_mobile">
										Contact Mobile
									</Label>
									<div className="flex gap-2">
										<Select
											onValueChange={(value) =>
												handlePhoneCountryChange("contact", value)
											}
											defaultValue="+234"
										>
											<SelectTrigger className="w-32">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="+234">
													{PHONE_COUNTRY_MAP["+234"].flag}{" "}
													{PHONE_COUNTRY_MAP["+234"].countryCode}
												</SelectItem>
												<SelectItem value="+233">
													{PHONE_COUNTRY_MAP["+233"].flag}{" "}
													{PHONE_COUNTRY_MAP["+233"].countryCode}
												</SelectItem>
												<SelectItem value="+254">
													{PHONE_COUNTRY_MAP["+254"].flag}{" "}
													{PHONE_COUNTRY_MAP["+254"].countryCode}
												</SelectItem>
												<SelectItem value="+256">
													{PHONE_COUNTRY_MAP["+256"].flag}{" "}
													{PHONE_COUNTRY_MAP["+256"].countryCode}
												</SelectItem>
											</SelectContent>
										</Select>
										<Input
											id="business_contact_mobile"
											name="business_contact_mobile"
											placeholder="XXXXXXXXXX"
											required
											className="flex-1"
										/>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="business_mobile">Business Mobile</Label>
									<div className="flex gap-2">
										<Select
											onValueChange={(value) =>
												handlePhoneCountryChange("business", value)
											}
											defaultValue="+234"
										>
											<SelectTrigger className="w-32">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="+234">
													{PHONE_COUNTRY_MAP["+234"].flag}{" "}
													{PHONE_COUNTRY_MAP["+234"].countryCode}
												</SelectItem>
												<SelectItem value="+233">
													{PHONE_COUNTRY_MAP["+233"].flag}{" "}
													{PHONE_COUNTRY_MAP["+233"].countryCode}
												</SelectItem>
												<SelectItem value="+254">
													{PHONE_COUNTRY_MAP["+254"].flag}{" "}
													{PHONE_COUNTRY_MAP["+254"].countryCode}
												</SelectItem>
												<SelectItem value="+256">
													{PHONE_COUNTRY_MAP["+256"].flag}{" "}
													{PHONE_COUNTRY_MAP["+256"].countryCode}
												</SelectItem>
											</SelectContent>
										</Select>
										<Input
											id="business_mobile"
											name="business_mobile"
											placeholder="XXXXXXXXXX"
											required
											className="flex-1"
										/>
									</div>
								</div>
								<div className="space-y-2 w-full">
									<Label htmlFor="country_display">Country</Label>
									<div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed">
										<span className="text-xl">
											{PHONE_COUNTRY_MAP[
												selectedPhoneCountry as keyof typeof PHONE_COUNTRY_MAP
											]?.flag || "🇳🇬"}
										</span>
										<span>{detectedCountry?.name || "Nigeria"}</span>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="account_bank">Bank Name</Label>
									<Select
										onValueChange={(value) => {
											setSelectedBankCode(value);
											// Trigger verification if account number is present
											const accountNumberInput = document.getElementById(
												"account_number",
											) as HTMLInputElement;
											if (accountNumberInput?.value) {
												handleAccountFieldChange(
													value,
													accountNumberInput.value,
												);
											}
										}}
									>
										<SelectTrigger disabled={loadingBanks}>
											<SelectValue
												placeholder={
													loadingBanks ? "Loading banks..." : "Select Bank"
												}
											/>
										</SelectTrigger>
										<SelectContent className="max-h-[300px]">
											{banks
												// Remove duplicates by code (keeping first occurrence)
												.filter((bank, index, self) => 
													index === self.findIndex(b => b.code === bank.code)
												)
												.map((bank) => (
													<SelectItem key={`${bank.id}-${bank.code}`} value={bank.code}>
														{bank.name}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="account_number">Account Number</Label>
									<div className="relative">
										<Input
											id="account_number"
											name="account_number"
											placeholder="0690000040"
											required
											onChange={(e) => {
												handleAccountFieldChange(
													selectedBankCode,
													e.target.value,
												);
											}}
										/>
										{verifyingAccount && (
											<Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
										)}
									</div>
								</div>
							</div>

							{verifiedAccountName && (
								<div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-green-500"></div>
									<p className="text-sm text-green-800">
										Account verified: <strong>{verifiedAccountName}</strong>
									</p>
								</div>
							)}

							<div className="flex gap-4">
								<Button type="submit" disabled={creating}>
									{creating && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Create Subaccount
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setShowForm(false);
										setVerifiedAccountName(null);
									}}
								>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{loading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="h-8 w-8 animate-spin" />
				</div>
			) : (
				<div className="grid gap-4">
					{subaccounts.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-8">
								<Building className="h-12 w-12 text-muted-foreground mb-4" />
								<p className="text-muted-foreground text-center">
									No subaccounts found. Create your first subaccount to get
									started.
								</p>
							</CardContent>
						</Card>
					) : (
						subaccounts.map((subaccount) => (
							<Card
								key={subaccount.id}
								className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border-0"
							>
								{/* Header with Black Background */}
								<div className="bg-black px-6 py-3">
									<div className="flex items-center gap-3">
										<div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
											<Building className="h-5 w-5 text-white" />
										</div>
										<div>
											<h3 className="text-lg font-bold text-white">
												{subaccount.business_name}
											</h3>
											<p className="text-xs text-gray-300">
												{subaccount.bank_name}
											</p>
										</div>
									</div>
								</div>

								{/* Content */}
								<CardContent className="pt-4 pb-4">
									{/* Main Info Grid */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
										{/* Account Holder */}
										<div>
											<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
												Account Holder
											</p>
											<div className="flex items-center gap-2">
												<div className="h-7 w-7 rounded-full bg-black flex items-center justify-center">
													<span className="text-xs font-bold text-white">
														{subaccount.full_name?.charAt(0).toUpperCase()}
													</span>
												</div>
												<span className="text-sm font-medium text-gray-800">
													{subaccount.full_name}
												</span>
											</div>
										</div>

										{/* Country */}
										<div>
											<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
												Location
											</p>
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-black" />
												<span className="text-sm font-medium text-gray-800">
													{subaccount.country}
												</span>
											</div>
										</div>

										{/* Bank Account */}
										<div>
											<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
												Bank Account
											</p>
											<p className="text-sm font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">
												{subaccount.account_number}
											</p>
										</div>

										{/* Account ID */}
										<div>
											<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
												Account ID
											</p>
											<p className="text-sm font-mono text-gray-800">
												{subaccount.account_id}
											</p>
										</div>
									</div>

									{/* Split Configuration */}
									<div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
										<p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
											Payment Split
										</p>
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xl font-bold text-black">
													{subaccount.split_value * 100}%
												</p>
												<p className="text-xs text-gray-600">
													{subaccount.split_type}
												</p>
											</div>
											<div className="text-right text-xs text-gray-600">
												<p>Platform keeps</p>
												<p className="font-semibold text-gray-800">
													{100 - subaccount.split_value * 100}%
												</p>
											</div>
										</div>
									</div>

									{/* Subaccount ID Footer */}
									<div className="mt-3 pt-3 border-t border-gray-100">
										<p className="text-xs text-gray-500">
											ID:{" "}
											<span className="font-mono text-gray-700">
												{subaccount.subaccount_id}
											</span>
										</p>
										<p className="text-xs text-gray-400 mt-1">
											Created{" "}
											{new Date(subaccount.created_at).toLocaleDateString(
												"en-US",
												{
													year: "numeric",
													month: "short",
													day: "numeric",
												},
											)}
										</p>
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>
			)}
		</div>
	);
}
