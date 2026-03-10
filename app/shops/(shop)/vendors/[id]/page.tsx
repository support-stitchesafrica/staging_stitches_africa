"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Product, Tailor } from "@/types";
import { productRepository, tailorRepository } from "@/lib/firestore";
import { ProductGrid } from "@/components/shops/products/ProductGrid";
import Image from "next/image";
import {
	generateBlurDataURL,
	RESPONSIVE_SIZES,
	IMAGE_DIMENSIONS,
} from "@/lib/utils/image-utils";
import { getActivityTracker } from "@/lib/analytics/activity-tracker";

export default function VendorDetailPage() {
	const params = useParams();
	const vendorId = params.id as string;

	const [products, setProducts] = useState<Product[]>([]);
	const [vendor, setVendor] = useState<Tailor | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadVendorData();
	}, [vendorId]);

	const loadVendorData = async () => {
		try {
			setLoading(true);

			// Fetch products by tailor_id from tailor_works collection with enriched tailor info
			const vendorProducts =
				await productRepository.getByTailorIdWithTailorInfo(vendorId);
			setProducts(vendorProducts);

			// Try to fetch vendor information from tailors collection
			let vendorInfo = null;
			try {
				vendorInfo = await tailorRepository.getById(vendorId);
			} catch (error) {
				console.log(
					"Vendor not found in tailors collection, will use product data"
				);
			}

			// If vendor info not found in tailors collection, create from product data
			if (!vendorInfo && vendorProducts.length > 0) {
				const firstProduct = vendorProducts[0];
				vendorInfo = {
					id: vendorId,
					brandName: firstProduct.tailor || "Unknown Tailor",
					brand_logo: "",
					first_name: "",
					last_name: "",
					email: "",
					phoneNumber: "",
					address: "",
					city: "",
					state: "",
					country: "",
					ratings: 0,
					yearsOfExperience: 0,
					type: [],
					featured_works: [],
					status: "active",
				};
			}

			setVendor(vendorInfo);

			// Track vendor view if vendor info is loaded
			if (vendorInfo) {
				const activityTracker = getActivityTracker();
				activityTracker.trackVendorView(vendorId, vendorInfo.brandName);
			}
		} catch (error) {
			console.error("Error loading vendor data:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-6 sm:py-8">
					<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
						<div className="animate-pulse">
							{/* Mobile Loading */}
							<div className="block sm:hidden text-center">
								<div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
								<div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
								<div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-1"></div>
								<div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div>
							</div>

							{/* Desktop Loading */}
							<div className="hidden sm:flex items-center mb-6">
								<div className="w-20 h-20 bg-gray-200 rounded-full mr-6 flex-shrink-0"></div>
								<div>
									<div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
									<div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
									<div className="h-4 bg-gray-200 rounded w-28"></div>
								</div>
							</div>

							{/* Stats Loading */}
							<div className="grid grid-cols-3 gap-3 sm:gap-6 bg-gray-50 p-4 sm:p-6 rounded-lg">
								<div className="text-center">
									<div className="h-6 sm:h-8 bg-gray-200 rounded w-8 mx-auto mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
								</div>
								<div className="text-center">
									<div className="h-6 sm:h-8 bg-gray-200 rounded w-8 mx-auto mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
								</div>
								<div className="text-center">
									<div className="h-6 sm:h-8 bg-gray-200 rounded w-8 mx-auto mb-2"></div>
									<div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
						<div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
						<ProductGrid
							initialProducts={[]}
							showFilters={false}
							loadAllIfEmpty={false}
						/>
					</div>
				</div>
			</div>
		);
	}

	if (!vendor) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center max-w-md mx-4">
					<div className="text-6xl mb-4">🏪</div>
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
						Vendor Not Found
					</h1>
					<p className="text-gray-600 mb-6">
						This vendor doesn't exist or is not available.
					</p>
					<Link href="/shops/vendors">
						<button className="px-6 py-3 rounded-lg font-medium transition-colors">
							Browse All Vendors
						</button>
					</Link>
				</div>
			</div>
		);
	}

	const categories = Array.from(new Set(products.map((p) => p.category)));
	const bespokeCount = products.filter((p) => p.type === "bespoke").length;
	const rtwCount = products.filter((p) => p.type === "ready-to-wear").length;

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-6 sm:py-8">
				{/* Vendor Header */}
				<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
					{/* Mobile Layout */}
					<div className="block sm:hidden">
						{/* Logo and Basic Info */}
						<div className="text-center mb-6">
							{vendor.brand_logo && (
								<div className="relative w-20 h-20 mx-auto mb-4">
									<Image
										src={vendor.brand_logo}
										alt={`${vendor.brandName} logo`}
										fill
										className="rounded-full object-cover border-2 border-gray-200"
										sizes={RESPONSIVE_SIZES.thumbnail}
										placeholder="blur"
										blurDataURL={generateBlurDataURL(
											IMAGE_DIMENSIONS.productThumbnail.width,
											IMAGE_DIMENSIONS.productThumbnail.height
										)}
									/>
								</div>
							)}
							<h1 className="text-2xl font-bold text-gray-900 mb-2">
								{vendor.brandName}
							</h1>
							{(vendor.first_name || vendor.last_name) && (
								<p className="text-gray-600 mb-1">
									{vendor.first_name} {vendor.last_name}
								</p>
							)}
							{(vendor.city || vendor.state) && (
								<p className="text-gray-600 mb-1">
									📍 {vendor.city}
									{vendor.city && vendor.state && ", "}
									{vendor.state}
								</p>
							)}
							{vendor.ratings > 0 && (
								<p className="text-gray-600 mb-1">
									⭐ {vendor.ratings.toFixed(1)}
								</p>
							)}
							{vendor.yearsOfExperience > 0 && (
								<p className="text-sm text-gray-500">
									{vendor.yearsOfExperience} years of experience
								</p>
							)}
						</div>
					</div>

					{/* Desktop/Tablet Layout */}
					<div className="hidden sm:block">
						<div className="flex flex-col sm:flex-row sm:items-start mb-6">
							{vendor.brand_logo && (
								<div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mr-0 sm:mr-6 mb-4 sm:mb-0 flex-shrink-0 mx-auto sm:mx-0">
									<Image
										src={vendor.brand_logo}
										alt={`${vendor.brandName} logo`}
										fill
										className="rounded-full object-cover border-2 border-gray-200"
										sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
										placeholder="blur"
										blurDataURL={generateBlurDataURL(96, 96)}
									/>
								</div>
							)}
							<div className="text-center sm:text-left">
								<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
									{vendor.brandName}
								</h1>
								<div className="flex flex-col sm:flex-row sm:items-center text-gray-600 space-y-1 sm:space-y-0 sm:space-x-4">
									{(vendor.first_name || vendor.last_name) && (
										<span className="text-sm sm:text-base">
											{vendor.first_name} {vendor.last_name}
										</span>
									)}
									{(vendor.city || vendor.state) && (
										<span className="text-sm sm:text-base">
											📍 {vendor.city}
											{vendor.city && vendor.state && ", "}
											{vendor.state}
										</span>
									)}
									{vendor.ratings > 0 && (
										<span className="flex items-center justify-center sm:justify-start text-sm sm:text-base">
											⭐ {vendor.ratings.toFixed(1)}
										</span>
									)}
								</div>
								{vendor.yearsOfExperience > 0 && (
									<div className="mt-2 text-sm text-gray-500">
										{vendor.yearsOfExperience} years of experience
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-3 gap-3 sm:gap-6 bg-gray-50 p-4 sm:p-6 rounded-lg mb-6">
						<div className="text-center">
							<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">
								{products.length}
							</div>
							<div className="text-xs sm:text-sm text-gray-600">
								Total Products
							</div>
						</div>
						<div className="text-center">
							<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">
								{bespokeCount}
							</div>
							<div className="text-xs sm:text-sm text-gray-600">
								Bespoke Items
							</div>
						</div>
						<div className="text-center">
							<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">
								{rtwCount}
							</div>
							<div className="text-xs sm:text-sm text-gray-600">
								Ready-to-Wear
							</div>
						</div>
					</div>

					{/* Vendor Specialties */}
					{vendor.type && vendor.type.length > 0 && (
						<div className="mb-6">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
								Specialties
							</h3>
							<div className="flex flex-wrap gap-2">
								{vendor.type.map((specialty, index) => (
									<span
										key={index}
										className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full"
									>
										{specialty}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Product Categories */}
					{categories.length > 0 && (
						<div>
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
								Product Categories
							</h3>
							<div className="flex flex-wrap gap-2">
								{categories.map((category) => (
									<span
										key={category}
										className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 text-xs sm:text-sm rounded-full capitalize"
									>
										{category}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Products Section */}
				{products.length > 0 ? (
					<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
						<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
							Products
						</h2>
						<ProductGrid
							initialProducts={products}
							showFilters={true}
							loadAllIfEmpty={false}
						/>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
						<div className="text-6xl mb-4">📦</div>
						<h2 className="text-xl font-semibold text-gray-900 mb-2">
							No Products Available
						</h2>
						<p className="text-gray-600">
							This vendor hasn't added any products yet.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
