"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Loader2, ShoppingCart, Filter } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { TailorStoryboardService } from "@/lib/marketing/tailor-storyboard-service";
import { productRepository } from "@/lib/firestore";
import { TailorStoryboard } from "@/types/tailor-storyboard";
import { Product } from "@/types";
import { CollectionProductsGrid } from "@/components/collections/CollectionProductsGrid";
import { useCart } from "@/contexts/CartContext";

type CategoryFilter = "all" | "Men" | "Women" | "Unisex" | "Kids" | "Others";

export default function TailorStoryboardPage() {
	const params = useParams();
	const router = useRouter();
	const { itemCount } = useCart();
	const storyboardId = params.id as string;

	const [storyboard, setStoryboard] = useState<TailorStoryboard | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
	const [availableCategories, setAvailableCategories] = useState<
		Record<string, Product>
	>({});

	useEffect(() => {
		loadData();
	}, [storyboardId]);

	useEffect(() => {
		if (products.length > 0) {
			filterProducts(activeFilter);
		}
	}, [activeFilter, products]);

	const loadData = async () => {
		try {
			setLoading(true);
			setError(null);

			// 1. Fetch Storyboard
			const storyboardData = await TailorStoryboardService.getStoryboardById(
				storyboardId
			);

			if (!storyboardData) {
				setError("Storyboard not found");
				setLoading(false);
				return;
			}
			setStoryboard(storyboardData);

			// 2. Fetch Products
			if (storyboardData.tailorId) {
				const tailorProducts =
					await productRepository.getByTailorIdWithTailorInfo(
						storyboardData.tailorId
					);
				setProducts(tailorProducts);

				// 3. Analyze Categories for Filter Cards
				const categories: Record<string, Product> = {};

				// Helper to find a representative product for a category
				const findCategoryProduct = (filter: CategoryFilter) => {
					const categoryProducts = tailorProducts.filter((p) =>
						isCategoryMatch(p, filter)
					);
					const productWithImage = categoryProducts.find(
						(p) => p.images && p.images.length > 0
					);
					if (categoryProducts.length > 0 && productWithImage) {
						categories[filter as string] = productWithImage;
					}
				};

				findCategoryProduct("Men");
				findCategoryProduct("Women");
				findCategoryProduct("Unisex");
				findCategoryProduct("Kids");

				// Check for Others
				const otherProducts = tailorProducts.filter(
					(p) =>
						!isCategoryMatch(p, "Men") &&
						!isCategoryMatch(p, "Women") &&
						!isCategoryMatch(p, "Unisex") &&
						!isCategoryMatch(p, "Kids")
				);
				const otherProductWithImage = otherProducts.find(
					(p) => p.images && p.images.length > 0
				);
				if (otherProducts.length > 0 && otherProductWithImage) {
					categories["Others"] = otherProductWithImage;
				}

				setAvailableCategories(categories);
				setFilteredProducts(tailorProducts); // Default show all
			}
		} catch (err) {
			console.error("Error loading storyboard data:", err);
			setError("Failed to load content");
		} finally {
			setLoading(false);
		}
	};

	const isCategoryMatch = (
		product: Product,
		filter: CategoryFilter
	): boolean => {
		const category = (product.category || "").toLowerCase();
		const tags = (product.tags || []).map((t) => t.toLowerCase());

		const matchesKeyword = (text: string) => {
			if (filter === "Men") {
				return (
					text === "man" ||
					text === "men" ||
					text === "male" ||
					text === "gents" ||
					text.includes(" men") ||
					text.startsWith("men") ||
					text.includes("man's")
				);
			}
			if (filter === "Women") {
				return (
					text === "woman" ||
					text === "women" ||
					text === "female" ||
					text === "ladies" ||
					text.includes("women")
				);
			}
			if (filter === "Unisex") {
				return text === "unisex" || text.includes("unisex");
			}
			if (filter === "Kids") {
				return (
					text === "kid" ||
					text === "kids" ||
					text === "child" ||
					text === "children" ||
					text === "boy" ||
					text === "girl" ||
					text.includes("kid")
				);
			}
			return false;
		};

		return matchesKeyword(category) || tags.some((t) => matchesKeyword(t));
	};

	const filterProducts = (filter: CategoryFilter) => {
		if (filter === "all") {
			setFilteredProducts(products);
			return;
		}

		if (filter === "Others") {
			setFilteredProducts(
				products.filter(
					(p) =>
						!isCategoryMatch(p, "Men") &&
						!isCategoryMatch(p, "Women") &&
						!isCategoryMatch(p, "Unisex") &&
						!isCategoryMatch(p, "Kids")
				)
			);
		} else {
			setFilteredProducts(products.filter((p) => isCategoryMatch(p, filter)));
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-12 h-12 animate-spin text-black" />
			</div>
		);
	}

	if (error || !storyboard) {
		return (
			<div className="min-h-screen flex items-center justify-center flex-col gap-4">
				<h2 className="text-2xl font-bold text-gray-900">
					{error || "Not Found"}
				</h2>
				<button
					onClick={() => router.push("/")}
					className="text-blue-600 hover:underline"
				>
					Return Home
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header Section - Matches Collection Page Style */}
			<div className="relative bg-gray-900 text-white min-h-[50vh] flex flex-col justify-end">
				{/* Background Image */}
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
					style={{
						backgroundImage: `url(${
							storyboard.bannerImage || storyboard.previewImage
						})`,
					}}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

				<div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
					{/* Navigation Bar */}
					<div className="flex items-center justify-between mb-8">
						<button
							onClick={() => router.back()}
							className="flex items-center gap-2 text-white/90 hover:text-white backdrop-blur-md bg-black/20 px-4 py-2 rounded-full transition-all hover:bg-black/30"
						>
							<ArrowLeft className="w-4 h-4" />
							Back
						</button>

						<div
							onClick={() => router.push("/shops/cart")}
							className="relative cursor-pointer"
						>
							<div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md hover:bg-black/30 rounded-full transition-colors">
								<ShoppingCart className="w-5 h-5" />
								<span className="font-medium">Cart</span>
							</div>
							{itemCount > 0 && (
								<span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
									{itemCount}
								</span>
							)}
						</div>
					</div>

					{/* Storyboard Info */}
					<div className="space-y-4 max-w-3xl">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/10">
							Featured Collection
						</div>
						<h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg leading-tight">
							{storyboard.title}
						</h1>
						<div className="flex items-center gap-2 text-xl text-white/90 font-medium">
							<span>By {storyboard.tailorName}</span>
						</div>
						{storyboard.tailorDescription && (
							<Dialog>
								<div className="max-w-2xl">
									<p className="text-lg text-white/80 leading-relaxed line-clamp-2">
										{storyboard.tailorDescription}
									</p>
									<DialogTrigger asChild>
										<button className="text-white font-bold hover:text-white/80 mt-1 flex items-center gap-1 transition-colors">
											More
										</button>
									</DialogTrigger>
								</div>

								<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] rounded-xl">
									<DialogHeader>
										<DialogTitle className="text-2xl font-bold text-gray-900">
											About the Tailor
										</DialogTitle>
									</DialogHeader>

									<div className="space-y-6 py-2">
										{/* Banner Image */}
										<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
											<Image
												src={
													storyboard.bannerImage ||
													storyboard.previewImage ||
													"/images/placeholder.jpg"
												}
												alt={storyboard.tailorName}
												fill
												className="object-cover"
											/>
										</div>

										{/* Full Description */}
										<div className="prose prose-lg max-w-none">
											<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
												{storyboard.tailorDescription}
											</p>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						)}
					</div>
				</div>
			</div>

			{/* Filter Cards Section - Horizontal Scroll on Mobile, Grid on Desktop */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-30">
				{Object.keys(availableCategories).length > 0 && (
					// Container with horizontal scroll on mobile
					<div className="flex sm:justify-center overflow-x-auto pb-6 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
						<div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 min-w-max sm:min-w-0 sm:w-full max-w-5xl">
							{["Men", "Women", "Unisex", "Kids", "Others"].map((category) => {
								const product = availableCategories[category];
								if (!product) return null; // Only show if products exist

								const isActive = activeFilter === category;

								return (
									<div
										key={category}
										onClick={() =>
											setActiveFilter(
												isActive ? "all" : (category as CategoryFilter)
											)
										}
										className={`
											relative flex-shrink-0 w-28 sm:w-auto aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group shadow-lg transition-all duration-500 snap-start
											${
												isActive
													? "ring-2 sm:ring-4 ring-black ring-offset-2 sm:ring-offset-4 transform scale-105"
													: "hover:-translate-y-2 hover:shadow-2xl"
											}
										`}
									>
										{/* Card Image - First product of category */}
										<Image
											src={product.images[0] || "/images/placeholder.jpg"}
											alt={category}
											fill
											className={`object-cover transition-transform duration-700 ${
												isActive ? "scale-110" : "group-hover:scale-110"
											}`}
											sizes="(max-width: 640px) 112px, (max-width: 1024px) 33vw, 25vw"
										/>

										{/* Overlay */}
										<div
											className={`absolute inset-0 transition-all duration-300 ${
												isActive
													? "bg-black/40 backdrop-blur-[1px]"
													: "bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:bg-black/40"
											}`}
										/>

										{/* Text Content */}
										<div className="absolute inset-0 flex flex-col items-center justify-end sm:justify-center p-3 sm:p-6 text-center pb-4 sm:pb-6">
											<h3 className="text-sm sm:text-2xl font-black text-white uppercase tracking-widest mb-1 sm:mb-2 drop-shadow-lg">
												{category === "Others" ? "More" : category}
											</h3>

											{/* Subtitle/State - Hidden on mobile to save space, visible on desktop */}
											<div
												className={`
												hidden sm:block overflow-hidden transition-all duration-300
												${
													isActive
														? "max-h-10 opacity-100"
														: "max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100"
												}
											`}
											>
												<span className="inline-block px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full uppercase tracking-wider">
													{isActive ? "Selected" : "View"}
												</span>
											</div>

											{/* Mobile Selected Dot */}
											{isActive && (
												<div className="sm:hidden w-1.5 h-1.5 bg-white rounded-full mt-1" />
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Filtered Products Grid */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-2xl font-bold text-gray-900">
						{activeFilter === "all"
							? "All Products"
							: `${activeFilter}'s Collection`}
					</h2>
					<span className="text-gray-500">
						{filteredProducts.length} Products
					</span>
				</div>

				<CollectionProductsGrid
					products={filteredProducts}
					collectionId={storyboard.id} // Using ID for keying, not strictly a collection ID
					collectionName={storyboard.title}
				/>
			</div>
		</div>
	);
}
