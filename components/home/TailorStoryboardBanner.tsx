"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { TailorStoryboard } from "@/types/tailor-storyboard";
import { TailorStoryboardService } from "@/lib/marketing/tailor-storyboard-service";
import { productRepository } from "@/lib/firestore";
import { formatPrice, calculateDiscountedPrice } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";

export const TailorStoryboardBanner: React.FC = () => {
	const [storyboards, setStoryboards] = useState<TailorStoryboard[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	const router = useRouter();
	const { t } = useLanguage();

	const currentStoryboard =
		storyboards.length > 0 ? storyboards[currentIndex] : undefined;
	const translatedTitle = useTranslatedText(currentStoryboard?.title);
	const translatedTailorName = useTranslatedText(currentStoryboard?.tailorName);
	const translatedDesc = useTranslatedText(
		currentStoryboard?.tailorDescription,
	);

	useEffect(() => {
		loadActiveStoryboards();
	}, []);

	const loadActiveStoryboards = async () => {
		try {
			setLoading(true);
			const activeStoryboards =
				await TailorStoryboardService.getActiveStoryboards();

			// Filter out storyboards without a preview image as it's critical for this design
			const validStoryboards = activeStoryboards.filter(
				(s) => s.previewImage && s.previewImage.trim() !== "",
			);

			if (validStoryboards.length > 0) {
				setStoryboards(validStoryboards);
			}
		} catch (error) {
			console.error("Error loading tailor storyboards:", error);
			// Fail silently or show minimal UI, as this is a banner
		} finally {
			setLoading(false);
		}
	};

	const handleShopNow = () => {
		if (currentStoryboard) {
			router.push(`/shops/storyboards/${currentStoryboard.id}`);
		}
	};

	const handlePrevious = () => {
		setCurrentIndex((prev) => (prev === 0 ? storyboards.length - 1 : prev - 1));
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev === storyboards.length - 1 ? 0 : prev + 1));
	};

	if (loading) {
		return null; // Or a skeleton loader
	}

	if (storyboards.length === 0 || !currentStoryboard) {
		return null;
	}

	return (
		<section className="relative py-12 md:py-16 bg-white overflow-hidden">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
				{/* Hero Section - Split View */}
				<div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
					{/* Left Side - Image (Preview) */}
					{/* User asked for left or right - putting image on left for this design */}
					<div className="relative group order-first">
						<div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 -z-10"></div>
						<div className="relative aspect-[3/4] md:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
							{currentStoryboard.previewImage && (
								<Image
									src={currentStoryboard.previewImage}
									alt={translatedTitle || "Tailor Storyboard"}
									fill
									className="object-cover transition-transform duration-700 group-hover:scale-105"
									priority
								/>
							)}
							{/* Navigation Buttons Overlay */}
							{storyboards.length > 1 && (
								<>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handlePrevious();
										}}
										className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-lg transition-all hover:scale-110"
										aria-label="Previous"
									>
										<ChevronLeft className="w-5 h-5 text-gray-900" />
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleNext();
										}}
										className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-lg transition-all hover:scale-110"
										aria-label="Next"
									>
										<ChevronRight className="w-5 h-5 text-gray-900" />
									</button>
								</>
							)}
						</div>
					</div>

					{/* Right Side - Info */}
					<div className="flex flex-col justify-center space-y-6">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-purple-600 font-semibold tracking-wide uppercase text-sm">
								<Sparkles className="w-4 h-4 animate-pulse" />
								<span>{t.tailor.featured}</span>
							</div>
							<h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
								{translatedTailorName}
							</h2>
							<h3 className="text-2xl md:text-3xl font-medium text-gray-500">
								{translatedTitle}
							</h3>
						</div>

						{translatedDesc && (
							<p className="text-lg text-gray-600 leading-relaxed line-clamp-4">
								{translatedDesc}
							</p>
						)}

						<div className="pt-4">
							<button
								onClick={handleShopNow}
								className="group relative inline-flex items-center justify-center px-8 py-4 bg-black text-white text-lg font-bold rounded-xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
							>
								<span className="relative z-10 flex items-center gap-2">
									{t.tailor.shopNow}
									<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
								</span>
								<div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							</button>
						</div>

						{/* Slide Indicators */}
						{storyboards.length > 1 && (
							<div className="flex gap-2 pt-8">
								{storyboards.map((_, idx) => (
									<button
										key={idx}
										onClick={() => setCurrentIndex(idx)}
										className={`h-1.5 rounded-full transition-all duration-300 ${
											idx === currentIndex ? "w-8 bg-black" : "w-4 bg-gray-300"
										}`}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};
