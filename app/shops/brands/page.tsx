"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productRepository } from "@/lib/firestore";
import { useCachedData } from "@/lib/utils/cache-utils";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Brand {
	id: string;
	name: string;
	logo?: string;
	productCount: number;
}

// Brand Card Component
const BrandCard = ({ brand }: { brand: Brand }) => {
	const router = useRouter();

	return (
		<div
			className="group cursor-pointer border border-gray-200 hover:border-gray-300 transition-all duration-200"
			onClick={() =>
				router.push(`/shops/brands/${encodeURIComponent(brand.id)}`)
			}
		>
			<div className="aspect-square bg-white flex items-center justify-center p-8">
				{brand.logo ? (
					<Image
						src={brand.logo}
						alt={brand.name}
						width={120}
						height={120}
						className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform duration-200"
					/>
				) : (
					<div className="w-full h-full bg-gray-100 flex items-center justify-center">
						<span className="text-2xl font-light text-gray-600 text-center">
							{brand.name}
						</span>
					</div>
				)}
			</div>
			<div className="p-4 bg-white border-t border-gray-100">
				<h3 className="font-medium text-gray-900 text-center">{brand.name}</h3>
				<p className="text-sm text-gray-500 text-center mt-1">
					{brand.productCount} {brand.productCount === 1 ? "item" : "items"}
				</p>
			</div>
		</div>
	);
};

// Alphabet Filter Component
const AlphabetFilter = ({
	selectedLetter,
	onLetterSelect,
}: {
	selectedLetter: string;
	onLetterSelect: (letter: string) => void;
}) => {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0-9".split("");

	return (
		<div className="border-b border-gray-200 py-4">
			<div className="container mx-auto px-4">
				<div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
					<span
						onClick={() => onLetterSelect("ALL")}
						className={`px-3 py-1 text-nd  rounded-md font-medium transition-colors ${
							selectedLetter === "ALL"
								? "text-black bg-blue-200 border-b-2 border-white"
								: "text-gray-500 hover:text-gray-900"
						}`}
					>
						All
					</span>
					{alphabet.map((letter) => (
						<span
							key={letter}
							onClick={() => onLetterSelect(letter)}
							className={`px-3 py-1 text-nd  rounded-md font-medium transition-colors ${
								selectedLetter === letter
									? "text-black bg-blue-200 border-b-2 border-white"
									: "text-gray-500 hover:text-gray-900"
							}`}
						>
							{letter}
						</span>
					))}
				</div>
			</div>
		</div>
	);
};

export default function BrandsPage() {
	const { t } = useLanguage();
	const [selectedLetter, setSelectedLetter] = useState("ALL");
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch brands data
	const { data: brandsRaw = [], loading: brandsLoading } = useCachedData(
		"brands-list",
		() => productRepository.getVendors(),
		10 * 60 * 1000, // 10 minutes cache
	);

	const brands = Array.isArray(brandsRaw) ? brandsRaw : [];

	// Filter brands based on selected letter and search query
	const filteredBrands = brands.filter((brand) => {
		const matchesLetter =
			selectedLetter === "ALL" ||
			brand.name.charAt(0).toUpperCase() === selectedLetter ||
			(selectedLetter === "0-9" && /^[0-9]/.test(brand.name));

		const matchesSearch =
			!searchQuery ||
			brand.name.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesLetter && matchesSearch;
	});

	// Group brands by first letter for display
	const groupedBrands = filteredBrands.reduce(
		(acc, brand) => {
			const firstLetter = brand.name.charAt(0).toUpperCase();
			const key = /^[0-9]/.test(firstLetter) ? "0-9" : firstLetter;

			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(brand);
			return acc;
		},
		{} as Record<string, Brand[]>,
	);

	// Sort groups alphabetically
	const sortedGroups = Object.keys(groupedBrands).sort((a, b) => {
		if (a === "0-9") return 1;
		if (b === "0-9") return -1;
		return a.localeCompare(b);
	});

	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<div className="border-b border-gray-200 py-8">
				<div className="container mx-auto px-4">
					<h1 className="text-3xl font-light text-center mb-4">
						{t.brandPage.title}
					</h1>
					<p className="text-gray-600 text-center max-w-2xl mx-auto">
						{t.brandPage.subtitle}
					</p>
				</div>
			</div>

			{/* Search Bar */}
			<div className="border-b border-gray-200 py-6">
				<div className="container mx-auto px-4">
					<div className="max-w-md mx-auto relative">
						<input
							type="text"
							placeholder={t.brandPage.searchPlaceholder}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
						/>
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={20}
						/>
					</div>
				</div>
			</div>

			{/* Alphabet Filter */}
			<AlphabetFilter
				selectedLetter={selectedLetter}
				onLetterSelect={setSelectedLetter}
			/>

			{/* Brands Grid */}
			<div className="py-8">
				<div className="container mx-auto px-4">
					{brandsLoading ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{Array.from({ length: 20 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : filteredBrands.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg">
								{searchQuery
									? `${t.brandPage.noBrandsFound} "${searchQuery}"`
									: `${t.brandPage.noBrandsFound} "${selectedLetter}"`}
							</p>
						</div>
					) : (
						<div className="space-y-12">
							{sortedGroups.map((letter) => (
								<div key={letter}>
									<h2 className="text-2xl font-light mb-6 text-gray-900 border-b border-gray-200 pb-2">
										{letter}
									</h2>
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
										{groupedBrands[letter].map((brand) => (
											<BrandCard key={brand.id} brand={brand} />
										))}
									</div>
								</div>
							))}
						</div>
					)}

					{/* Stats */}
					{!brandsLoading && filteredBrands.length > 0 && (
						<div className="mt-12 text-center">
							<p className="text-gray-500">
								Showing {filteredBrands.length} of {brands.length} brands
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
