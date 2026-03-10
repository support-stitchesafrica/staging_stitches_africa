"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Check, X, Globe } from "lucide-react";

export const LanguageSelector = () => {
	const { language, setLanguage } = useLanguage();
	const { userCountry, userCurrency, setUserCurrency, getSupportedCurrencies } =
		useCurrency();
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"language" | "currency">(
		"language",
	);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Helper to get flag emoji from country code
	const getFlagEmoji = (countryCode: string) => {
		if (!countryCode) return null;
		const codePoints = countryCode
			.toUpperCase()
			.split("")
			.map((char) => 127397 + char.charCodeAt(0));
		return String.fromCodePoint(...codePoints);
	};

	const languages = [
		{ code: "en", label: "English (American)", native: "English (US)" },
		{ code: "fr", label: "French", native: "Français" },
		{ code: "zh", label: "Chinese (Simplified)", native: "中文 (简体)" },
		{ code: "de", label: "German", native: "Deutsch" },
		{
			code: "es",
			label: "Spanish (Latin American)",
			native: "Español (latinoamericano)",
		},
	];

	const currencies = [
		{ code: "USD", symbol: "$", name: "United States Dollar" },
		{ code: "NGN", symbol: "₦", name: "Nigerian Naira" },
		// Add more common currencies if needed or fetch from context if dynamic
	];

	return (
		<div className="relative z-50" ref={dropdownRef}>
			{/* Trigger Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 p-2 !bg-white !border-none rounded-full hover:bg-gray-100 transition-colors duration-200"
				aria-label="Select Language"
			>
				{/* Flag Circle */}
				<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg border border-gray-200 overflow-hidden">
					{userCountry ? (
						<span className="leading-none flex items-center justify-center h-full w-full pt-1">
							{getFlagEmoji(userCountry)}
						</span>
					) : (
						<Globe size={18} className="text-gray-600" />
					)}
				</div>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="fixed top-[60px] left-1/2 -translate-x-1/2 w-[95vw] max-w-[360px] sm:absolute sm:top-full sm:left-auto sm:right-0 sm:translate-x-0 sm:mt-3 sm:w-[320px] bg-white rounded-lg sm:rounded-none shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-100 origin-top bg-white z-[100]">
					{/* Header Tabs */}
					<div className="flex border-b border-gray-100">
						<button
							onClick={() => setActiveTab("language")}
							className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-colors ${
								activeTab === "language"
									? "text-black border-b-2 border-black"
									: "text-gray-400 hover:text-gray-600"
							}`}
						>
							Language
						</button>
						<button
							onClick={() => setActiveTab("currency")}
							className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-colors ${
								activeTab === "currency"
									? "text-black border-b-2 border-black"
									: "text-gray-400 hover:text-gray-600"
							}`}
						>
							Currency
						</button>
						<button
							onClick={() => setIsOpen(false)}
							className="absolute top-2 right-2 p-1 text-gray-400 hover:text-black transition-colors"
						>
							<X size={16} />
						</button>
					</div>

					{/* Content */}
					<div className="p-4">
						<p className="text-sm text-gray-500 mb-4 font-light">
							{activeTab === "language"
								? "Choose the language you'd like to browse the site in"
								: "Choose your preferred currency for browsing and checkout"}
						</p>

						<div className="space-y-1">
							{activeTab === "language"
								? languages.map((lang) => (
										<button
											key={lang.code}
											onClick={() => {
												setLanguage(lang.code as any);
												setIsOpen(false);
											}}
											className={`w-full text-left px-3 py-3 !bg-white !border-none flex items-start justify-between group transition-colors ${
												language === lang.code
													? "bg-gray-50"
													: "hover:bg-gray-50"
											}`}
										>
											<div className="flex flex-col">
												<span
													className={`text-sm font-medium ${language === lang.code ? "text-black" : "text-gray-900"}`}
												>
													{lang.native}
												</span>
												<span className="text-xs text-gray-500 mt-0.5 font-light">
													{lang.label}
												</span>
											</div>

											{language === lang.code && (
												<Check size={16} className="text-black mt-1" />
											)}
										</button>
									))
								: currencies.map((curr) => (
										<button
											key={curr.code}
											onClick={() => {
												setUserCurrency(curr.code);
												setIsOpen(false);
											}}
											className={`w-full text-left px-3 py-3 !bg-white !border-none flex items-center justify-between group transition-colors ${
												userCurrency === curr.code
													? "bg-gray-50"
													: "hover:bg-gray-50"
											}`}
										>
											<div className="flex items-center gap-3">
												<span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
													{curr.symbol}
												</span>
												<div className="flex flex-col">
													<span
														className={`text-sm font-medium ${userCurrency === curr.code ? "text-black" : "text-gray-900"}`}
													>
														{curr.code}
													</span>
													<span className="text-xs text-gray-500 mt-0.5 font-light">
														{curr.name}
													</span>
												</div>
											</div>

											{userCurrency === curr.code && (
												<Check size={16} className="text-black" />
											)}
										</button>
									))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
