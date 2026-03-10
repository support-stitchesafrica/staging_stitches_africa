"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2, Banknote, Building2, Globe2 } from "lucide-react";

function VendorSubaccountForm({
	tailorUID,
	profile,
	onSuccess,
}: {
	tailorUID: string;
	profile: any;
	onSuccess?: () => void;
}) {
	const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedBank, setSelectedBank] = useState<{
		name: string;
		code: string;
	} | null>(null);
	const [accountNumber, setAccountNumber] = useState("");
	const [accountName, setAccountName] = useState("");
	const [currency, setCurrency] = useState("NGN");
	const [loading, setLoading] = useState(false);
	const [fetchingBanks, setFetchingBanks] = useState(false);
	const [verifyingAccount, setVerifyingAccount] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	// Fetch banks
	useEffect(() => {
		const fetchBanks = async () => {
			try {
				setFetchingBanks(true);
				const res = await fetch("/api/flutterwave/banks");
				const data = await res.json();
				if (data.success) setBanks(data.banks);
				else toast.error("Failed to load banks");
			} catch {
				toast.error("Error loading banks");
			} finally {
				setFetchingBanks(false);
			}
		};
		fetchBanks();
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setShowDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const filteredBanks = banks.filter((bank) =>
		bank.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleSelectBank = (bank: { name: string; code: string }) => {
		setSelectedBank(bank);
		setSearchTerm(bank.name);
		setShowDropdown(false);
		setAccountName("");
	};

	// Verify account automatically
	useEffect(() => {
		const verifyAccount = async () => {
			if (accountNumber.length === 10 && selectedBank) {
				try {
					setVerifyingAccount(true);
					const res = await fetch("/api/flutterwave/resolve-account", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							account_number: accountNumber,
							bank_code: selectedBank.code,
						}),
					});
					const data = await res.json();
					if (data.success) {
						setAccountName(data.account_name);
						toast.success(`Account resolved: ${data.account_name}`);
					} else {
						setAccountName("");
						toast.error(data.message || "Unable to resolve account");
					}
				} catch {
					toast.error("Failed to verify account");
				} finally {
					setVerifyingAccount(false);
				}
			}
		};
		verifyAccount();
	}, [accountNumber, selectedBank]);

	const handleCreateSubaccount = async () => {
		if (!selectedBank || !accountNumber || !accountName || !currency) {
			toast.error("Please complete all fields");
			return;
		}

		try {
			setLoading(true);
			const res = await fetch("/api/vendors/create-subaccount", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					business_name: profile.brand_name || "Vendor Business",
					bank_code: selectedBank.code,
					account_number: accountNumber,
					account_name: accountName,
					email: profile.email,
					tailorUID,
					currency,
				}),
			});

			const data = await res.json();
			
			// Log the response for debugging
			console.log("Subaccount creation response:", { 
				ok: res.ok, 
				status: res.status, 
				data 
			});
			
			if (data.success) {
				toast.success(data.message || "Subaccount created successfully!");
				// Refresh parent data to show VendorSubaccountDetails
				if (onSuccess) {
					setTimeout(() => onSuccess(), 1000); // Small delay for toast to show
				}
			} else {
				let errorMessage = data.message || "Failed to create subaccount";
				
				// More specific error handling
				if (res.status === 500) {
					errorMessage = "Internal server error. Please try again later.";
					console.error("Subaccount creation failed with server error:", data);
				} else if (res.status === 400) {
					errorMessage = data.message || "Bad request. Please check your input.";
				} else if (res.status === 401) {
					errorMessage = "Unauthorized. Please log in and try again.";
				} else if (res.status === 503) {
					errorMessage = data.message || "Service temporarily unavailable. Please try again later.";
				}
				
				toast.error(errorMessage);
			}
		} catch (error: any) {
			console.error("Subaccount creation error:", error);
			toast.error("Something went wrong. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white border rounded-2xl shadow-md p-8 max-w-2xl mx-auto space-y-6">
			<div className="space-y-2 text-center">
				<h3 className="text-2xl font-semibold text-gray-900">
					Payout Account Setup
				</h3>
				<p className="text-gray-500 text-sm">
					Add your payout account to receive your vendor earnings automatically.
				</p>
			</div>

			{/* Currency */}
			<div className="space-y-2">
				<Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
					<Globe2 className="w-4 h-4 text-gray-500" /> Currency
				</Label>
				<Select value={currency} onValueChange={setCurrency}>
					<SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-black/30">
						<SelectValue placeholder="Select currency" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="NGN">🇳🇬 NGN - Nigerian Naira</SelectItem>
						<SelectItem value="GHS">🇬🇭 GHS - Ghanaian Cedi</SelectItem>
						<SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
						<SelectItem value="KES">🇰🇪 KES - Kenyan Shilling</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Bank selection */}
			<div className="space-y-2 relative" ref={dropdownRef}>
				<Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
					<Building2 className="w-4 h-4 text-gray-500" /> Select Bank
				</Label>
				<div className="relative">
					<Input
						placeholder="Search or select your bank"
						value={searchTerm}
						onChange={(e) => {
							setSearchTerm(e.target.value);
							setShowDropdown(true);
						}}
						onFocus={() => setShowDropdown(true)}
						className="border-gray-300 focus:ring-2 focus:ring-black/30"
					/>

					{showDropdown && (
						<div className="absolute z-50 w-full bg-white border rounded-md max-h-60 overflow-y-auto shadow-lg mt-1">
							{fetchingBanks ? (
								<p className="text-sm text-gray-500 p-2">Loading banks...</p>
							) : filteredBanks.length > 0 ? (
								filteredBanks.map((bank) => (
									<div
										key={bank.code}
										onClick={() => handleSelectBank(bank)}
										className={`p-2 cursor-pointer text-sm hover:bg-gray-100 transition ${
											selectedBank?.code === bank.code ? "bg-gray-200" : ""
										}`}
									>
										{bank.name}
									</div>
								))
							) : (
								<p className="p-2 text-sm text-gray-500">No banks found</p>
							)}
						</div>
					)}
				</div>

				{selectedBank && (
					<p className="text-sm text-green-600 mt-1">
						Selected Bank: {selectedBank.name} ({selectedBank.code})
					</p>
				)}
			</div>

			{/* Account Number */}
			<div className="space-y-2">
				<Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
					<Banknote className="w-4 h-4 text-gray-500" /> Account Number
				</Label>
				<Input
					placeholder="e.g. 0123456789"
					value={accountNumber}
					onChange={(e) => setAccountNumber(e.target.value)}
					maxLength={10}
					className="border-gray-300 focus:ring-2 focus:ring-black/30"
				/>
				{verifyingAccount && (
					<p className="text-xs text-gray-500 mt-1 animate-pulse">
						Verifying account...
					</p>
				)}
				{accountName && (
					<p className="text-sm text-green-700 font-medium mt-1">
						✅ Account Name: {accountName}
					</p>
				)}
			</div>

			<Button
				onClick={handleCreateSubaccount}
				disabled={loading}
				className="bg-black hover:bg-gray-900 transition-all w-full py-5 text-base font-medium rounded-xl"
			>
				{loading ? (
					<span className="flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" /> Creating...
					</span>
				) : (
					"Create Flutterwave Subaccount"
				)}
			</Button>
		</div>
	);
}

export default VendorSubaccountForm;
