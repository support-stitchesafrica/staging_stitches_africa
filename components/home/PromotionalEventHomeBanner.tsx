"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CustomerPromotionalService } from "@/lib/promotionals/customer-service";
import { PromotionalEvent } from "@/types/promotionals";
import { CountdownTimer } from "@/components/promotions/CountdownTimer";
import { Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { toDate } from "@/lib/utils/timestamp-helpers";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";

export function PromotionalEventHomeBanner() {
	const [events, setEvents] = useState<PromotionalEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);
	const router = useRouter();
	const { t } = useLanguage();

	const event = events.length > 0 ? events[currentIndex] : undefined;
	const translatedTitle = useTranslatedText(
		event?.banner?.title || event?.name,
	);
	const translatedDesc = useTranslatedText(event?.banner?.description);

	useEffect(() => {
		loadActiveEvents();
	}, []);

	// Auto-slide every 15 seconds
	useEffect(() => {
		if (events.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
		}, 15000); // 15 seconds

		return () => clearInterval(interval);
	}, [events.length]);

	const loadActiveEvents = async () => {
		try {
			setLoading(true);

			// Add timeout to prevent hanging (10 seconds)
			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Request timeout")), 10000),
			);

			const activeEvents = await Promise.race([
				CustomerPromotionalService.getActivePromotionalEvents(),
				timeoutPromise,
			]);

			// Filter events with banners
			const eventsWithBanners = activeEvents.filter((e) => e.banner?.imageUrl);
			setEvents(eventsWithBanners);
		} catch (error) {
			console.error("Error loading promotional events:", error);
		} finally {
			setLoading(false);
		}
	};

	const handlePrevious = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === 0 ? events.length - 1 : prevIndex - 1,
		);
	};

	const handleNext = () => {
		setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
	};

	// Derived event is calculated at top, checking loading/existence here for render
	if (loading || events.length === 0 || !event || !event.banner?.imageUrl) {
		return null;
	}

	const handleShopNow = () => {
		router.push(`/promotions/${event.id}`);
	};

	return (
		<section className="py-8 md:py-12 bg-gray-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
				{/* Responsive: Single column on mobile, two columns on desktop */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 relative">
					{/* Left side - Image */}
					<div className="relative rounded-xl overflow-hidden shadow-lg aspect-[4/5] lg:aspect-[3/4]">
						<Image
							src={event.banner.imageUrl}
							alt={translatedTitle || "Event"}
							fill
							className="object-cover transition-opacity duration-500"
							priority
							sizes="(max-width: 768px) 100vw, 50vw"
						/>

						{/* Navigation Buttons - Only show if multiple events */}
						{events.length > 1 && (
							<>
								<button
									onClick={handlePrevious}
									className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
									aria-label="Previous event"
								>
									<ChevronLeft className="w-6 h-6 text-gray-800" />
								</button>
								<button
									onClick={handleNext}
									className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
									aria-label="Next event"
								>
									<ChevronRight className="w-6 h-6 text-gray-800" />
								</button>
							</>
						)}
					</div>

					{/* Right side - Content */}
					<div className="flex flex-col justify-center px-4 lg:px-8 space-y-6">
						{event.banner?.displayPercentage && (
							<div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full font-bold text-sm w-fit">
								<Tag className="w-4 h-4" />
								Up to {event.banner.displayPercentage}% OFF
							</div>
						)}

						<h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-black leading-tight">
							{translatedTitle}
						</h2>

						{translatedDesc && (
							<p className="text-lg lg:text-xl text-gray-700 leading-relaxed">
								{translatedDesc}
							</p>
						)}

						{/* Countdown Timer */}
						<div className="pt-2">
							<CountdownTimer endDate={toDate(event.endDate)} size="md" />
						</div>

						{/* Shop Now Button */}
						<div className="pt-4">
							<button
								onClick={handleShopNow}
								className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors shadow-lg text-lg"
							>
								{t.promotion.shopNow}
							</button>
						</div>

						{/* Slide Indicators - Only show if multiple events */}
						{events.length > 1 && (
							<div className="flex gap-2 pt-4">
								{events.map((_, index) => (
									<button
										key={index}
										onClick={() => setCurrentIndex(index)}
										className={`h-2 rounded-full transition-all ${
											index === currentIndex
												? "w-8 bg-black"
												: "w-2 bg-gray-300 hover:bg-gray-400"
										}`}
										aria-label={`Go to slide ${index + 1}`}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
