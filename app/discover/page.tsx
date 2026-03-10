"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";
import { Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth-simple";
import {
	Star,
	Newspaper,
	UserPlus,
	BracketsIcon,
	CompassIcon,
	User,
	Settings,
	Package,
	LogOut,
} from "lucide-react";
import { AuthSelectionDialog } from "@/components/common/AuthSelectionDialog";

// Add this import at the top with other imports
import { OfficialDisclaimerDialog } from "@/components/OfficialDisclaimerDialog";

// Lazy load below-the-fold components for better initial load performance
const PromotionalEventHomeBanner = lazy(() =>
	import("@/components/home/PromotionalEventHomeBanner").then((mod) => ({
		default: mod.PromotionalEventHomeBanner,
	}))
);
const CollectionBanner = lazy(() =>
	import("@/components/home/CollectionBanner").then((mod) => ({
		default: mod.CollectionBanner,
	}))
);
const BOGOPromotionBanner = lazy(() =>
	import("@/components/home/BOGOPromotionBanner").then((mod) => ({
		default: mod.BOGOPromotionBanner,
	}))
);
const FeaturedProducts = lazy(() =>
	import("@/components/home/FeaturedProducts").then((mod) => ({
		default: mod.FeaturedProducts,
	}))
);
const ReferAndEarnBanner = lazy(() =>
	import("@/components/ReferAndEarnBanner").then((mod) => ({
		default: mod.default,
	}))
);
const FeaturedVendors = lazy(() =>
	import("@/components/home/FeaturedVendors").then((mod) => ({
		default: mod.FeaturedVendors,
	}))
);
const AboutSection = lazy(() =>
	import("@/components/about-section").then((mod) => ({
		default: mod.AboutSection,
	}))
);
const StatsSection = lazy(() =>
	import("@/components/stats-section").then((mod) => ({
		default: mod.StatsSection,
	}))
);
const CTASection = lazy(() =>
	import("@/components/cta-section").then((mod) => ({
		default: mod.default,
	}))
);
const FeaturesSections = lazy(() =>
	import("@/components/vendor/FeaturesSection").then((mod) => ({
		default: mod.default,
	}))
);
const ProcessSection = lazy(() =>
	import("@/components/process-section").then((mod) => ({
		default: mod.ProcessSection,
	}))
);
const BrandSlider = lazy(() =>
	import("@/components/BrandSlider").then((mod) => ({
		default: mod.default,
	}))
);
const BlogSection = lazy(() =>
	import("@/components/blog-section").then((mod) => ({
		default: mod.BlogSection,
	}))
);
const NewsletterSection = lazy(() =>
	import("@/components/newsletter-section").then((mod) => ({
		default: mod.NewsletterSection,
	}))
);
const CTASection2 = lazy(() =>
	import("@/components/cta-section copy").then((mod) => ({
		default: mod.CTASection2,
	}))
);
const AIRecommendedProducts = lazy(() =>
	import("@/components/home/AIRecommendedProducts").then((mod) => ({
		default: mod.AIRecommendedProducts,
	}))
);
const Footer = lazy(() =>
	import("@/components/footer").then((mod) => ({
		default: mod.default,
	}))
);
const ReferralDialog = lazy(() =>
	import("@/components/referral/ReferralDialog").then((mod) => ({
		default: mod.default,
	}))
);

// Loading skeleton component
const SectionSkeleton = () => (
	<div className="py-12 bg-white animate-pulse">
		<div className="container mx-auto px-4">
			<div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
			<div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
			<div className="flex gap-4 overflow-x-auto pb-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="flex-shrink-0 w-64 bg-gray-200 rounded-lg h-64"
					></div>
				))}
			</div>
		</div>
	</div>
);

// Intersection Observer hook for lazy loading
function useIntersectionObserver(
	ref: React.RefObject<HTMLElement | null>,
	options: IntersectionObserverInit = {}
) {
	const [isIntersecting, setIsIntersecting] = useState(false);

	useEffect(() => {
		if (!ref.current) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsIntersecting(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1, ...options }
		);

		observer.observe(ref.current);

		return () => {
			observer.disconnect();
		};
	}, [ref, options]);

	return isIntersecting;
}

// Lazy-loaded section wrapper component
function LazySection({
	children,
	fallback = <SectionSkeleton />,
}: {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const isIntersecting = useIntersectionObserver(ref, { rootMargin: "100px" });

	return (
		<div ref={ref}>
			{isIntersecting ? (
				<Suspense fallback={fallback}>{children}</Suspense>
			) : (
				fallback
			)}
		</div>
	);
}

export default function HomePage() {
	const router = useRouter();
	const { user, userProfile, loading } = useAuth();
	const [showSignupDialog, setShowSignupDialog] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

	// Show loader if user exists but profile is still loading or we don't have profile data yet
	const shouldShowLoader = user && (loading || !userProfile);

	// Only show user menu if user is authenticated and is NOT a tailor
	const shouldShowUserMenu =
		user &&
		(userProfile?.is_tailor === false || !userProfile?.is_tailor) &&
		!loading;

	const handleLogout = async () => {
		await logout();
		setIsUserMenuOpen(false);
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Add the disclaimer dialog here, right at the beginning of the JSX */}
			{/* <OfficialDisclaimerDialog /> */}

			{/* Header */}
			<header className="hidden md:flex items-center justify-between px-8 border-b border-gray-200">
				<Link href="/" className="flex items-center space-x-2 flex-shrink-0">
					<Image
						src="/Stitches-Africa-Logo-06.png"
						alt="Stitches Africa"
						width={120}
						height={60}
						className=""
						priority
					/>
				</Link>

				<nav className="flex items-center space-x-8">
					<Link
						href="/"
						className="text-gray-700 hover:text-black transition-colors"
					>
						Home
					</Link>
					<Link
						href="/featured"
						className="text-gray-700 hover:text-black transition-colors"
					>
						Featured
					</Link>
					<Link
						href="/brand"
						className="text-gray-700 hover:text-black transition-colors font-semibold"
					>
						Brands
					</Link>
					<Link
						href="/contact"
						className="text-gray-700 hover:text-black transition-colors"
					>
						Contact Us
					</Link>
					<Link
						href="/news"
						className="text-gray-700 hover:text-black transition-colors"
					>
						News
					</Link>

					{/* User Menu - Show on desktop */}
					<div className="relative">
						{shouldShowLoader ? (
							// Show loading skeleton while profile is loading
							<div className="flex items-center space-x-1 p-1">
								<div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
								<div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
							</div>
						) : shouldShowUserMenu ? (
							<>
								<span
									onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
									className="flex items-center space-x-2 p-1 text-gray-700 hover:text-black cursor-pointer transition-colors"
								>
									<User size={20} />
									<span className="text-sm font-medium">
										{user.displayName || user.email?.split("@")[0]}
									</span>
								</span>

								{/* Dropdown Menu */}
								{isUserMenuOpen && (
									<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
										<Link href="/shops/account">
											<button
												onClick={() => setIsUserMenuOpen(false)}
												className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 bg-transparent border-none"
											>
												<Settings size={16} />
												<span>Account Settings</span>
											</button>
										</Link>
										<Link href="/shops/account/orders">
											<button
												onClick={() => setIsUserMenuOpen(false)}
												className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 bg-transparent border-none"
											>
												<Package size={16} />
												<span>My Orders</span>
											</button>
										</Link>
										<Link href="/shops/measurements?from=account">
											<button
												onClick={() => setIsUserMenuOpen(false)}
												className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 bg-transparent border-none"
											>
												<User size={16} />
												<span>Measurements</span>
											</button>
										</Link>
										<hr className="my-2" />
										<button
											onClick={handleLogout}
											className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 bg-transparent border-none"
										>
											<LogOut size={16} />
											<span>Sign Out</span>
										</button>
									</div>
								)}
							</>
						) : (
							<button
								onClick={() => setShowSignupDialog(true)}
								className="text-gray-700 hover:text-black transition-colors"
							>
								Sign up
							</button>
						)}
					</div>
				</nav>
			</header>

			{/* Mobile Bottom Nav */}
			<nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md md:hidden">
				<div className="flex justify-around items-center py-2">
					<Link
						href="/"
						className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
					>
						<Image
							src="/Stitches-Africa-Logo-06.png"
							alt="logo"
							width={40}
							height={40}
							className="w-10 h-10"
							priority
						/>
					</Link>
					<Link
						href="/about"
						className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
					>
						<CompassIcon className="h-5 w-5" />
						<span className="text-xs mt-1">About</span>
					</Link>
					<Link
						href="/featured"
						className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
					>
						<Star className="h-5 w-5" />
						<span className="text-xs mt-1">Featured</span>
					</Link>
					<Link
						href="/brand"
						className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
					>
						<BracketsIcon className="h-5 w-5" />
						<span className="text-xs mt-1">Brands</span>
					</Link>
					<Link
						href="/news"
						className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
					>
						<Newspaper className="h-5 w-5" />
						<span className="text-xs mt-1">News</span>
					</Link>
					{shouldShowLoader ? (
						// Show loading skeleton while profile is loading
						<div className="flex flex-col items-center text-gray-700">
							<div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
							<div className="w-8 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
						</div>
					) : shouldShowUserMenu ? (
						<button
							onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
							className="flex flex-col items-center text-gray-700 hover:text-black transition-colors relative"
						>
							<User className="h-5 w-5" />
							<span className="text-xs mt-1">Account</span>

							{/* Mobile User Menu Dropdown */}
							{isUserMenuOpen && (
								<div className="absolute bottom-12 right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
									<Link href="/shops/account">
										<button
											onClick={() => setIsUserMenuOpen(false)}
											className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 bg-transparent border-none"
										>
											<Settings size={16} />
											<span>Account Settings</span>
										</button>
									</Link>
									<Link href="/shops/account/orders">
										<button
											onClick={() => setIsUserMenuOpen(false)}
											className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 bg-transparent border-none"
										>
											<Package size={16} />
											<span>My Orders</span>
										</button>
									</Link>
									<Link href="/shops/measurements?from=account">
										<button
											onClick={() => setIsUserMenuOpen(false)}
											className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 bg-transparent border-none"
										>
											<User size={16} />
											<span>Measurements</span>
										</button>
									</Link>
									<hr className="my-2" />
									<button
										onClick={handleLogout}
										className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 bg-transparent border-none"
									>
										<LogOut size={16} />
										<span>Sign Out</span>
									</button>
								</div>
							)}
						</button>
					) : (
						<button
							onClick={() => setShowSignupDialog(true)}
							className="flex flex-col items-center text-gray-700 hover:text-black transition-colors"
						>
							<UserPlus className="h-5 w-5" />
							<span className="text-xs mt-1">Sign Up</span>
						</button>
					)}
				</div>
			</nav>

			{/* Main Content */}
			<main className="flex flex-col md:flex-row h-auto">
				{/* Right Side - Image Gallery */}
				<div className="flex-1 p-4 md:p-8 order-1 md:order-2">
					<div className="flex gap-4 justify-center md:justify-end overflow-hidden">
						{[
							["african-fashion", "african-fashion-2", "african-fashion-3"],
							["african-fashion-4", "african-fashion-5", "african-fashion-6"],
							["african-fashion-7", "african-fashion-8", "african-fashion-9"],
						].map((imgs, i) => (
							<div
								key={i}
								className={`relative flex flex-col gap-4 w-[100px] sm:w-[140px] md:w-[200px] lg:w-[240px]
        h-[600px] overflow-hidden ${
					i % 2 === 0 ? "animate-scroll-up" : "animate-scroll-down"
				}`}
							>
								<div className="flex flex-col gap-4 absolute top-0 left-0 w-full">
									{[...imgs, ...imgs].map((img, idx) => (
										<div
											key={idx}
											className="h-[200px] bg-white rounded-xl overflow-hidden shadow-md border border-gray-100"
										>
											<Image
												src={`/images/${img}.png`}
												alt="African fashion"
												width={240}
												height={200}
												className="w-full h-full object-cover"
												loading="lazy"
												sizes="(max-width: 640px) 100px, (max-width: 768px) 140px, (max-width: 1024px) 200px, 240px"
											/>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Left Side - Hero Content */}
				<div className="flex-1 flex items-center justify-center px-4 md:px-8 py-8 order-2 md:order-1 relative">
					<div className="max-w-lg text-center md:text-left">
						<h1 className="text-3xl md:text-5xl font-bold text-black mb-6 leading-tight">
							Discover Your Unique Style with Stitches Africa
						</h1>
						<p className="text-gray-600 text-base md:text-lg mb-8">
							Fashion Community. Start your journey towards exceptional style
							today.
						</p>

						{/* App Download Buttons */}
						<div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 justify-center md:justify-start">
							<Button
								variant="outline"
								onClick={(e) => {
									e.preventDefault();
									window.open(
										"https://apps.apple.com/app/stitches-africa/id6753875161",
										"_blank",
										"noopener"
									);
								}}
								className="flex items-center bg-black text-white space-x-2 px-5 py-3 border-2 border-gray-300 hover:bg-gray-50"
							>
								<Image
									src="/images/apple-logo.png"
									alt="apple-store"
									width={48}
									height={48}
									className="w-5 md:w-12 h-5"
									priority
								/>
								<span>Apple Store</span>
							</Button>
							<Button
								variant="outline"
								onClick={(e) => {
									e.preventDefault();
									window.open(
										"https://play.google.com/store/apps/details?id=com.stitchesAfricaLimited.app&pcampaignid=web_share",
										"_blank",
										"noopener"
									);
								}}
								className="flex items-center bg-black text-white space-x-2 px-5 py-3 border-2 border-gray-300 hover:bg-gray-50"
							>
								<Image
									src="/images/playstore-log.png"
									alt="play-store"
									width={20}
									height={20}
									className="w-5 h-5"
									priority
								/>
								<span>Google Play</span>
							</Button>
						</div>
					</div>

					<div className="absolute bottom-0 left-0 opacity-10 hidden md:block">
						<Image
							src="/images/Untitled_design__21_-removebg-preview-2.png"
							alt=""
							width={400}
							height={400}
							className="max-h-[300px] md:max-h-[400px] w-auto"
							loading="lazy"
						/>
					</div>
				</div>
			</main>

			{/* Promotional Events Banner Section - Lazy loaded */}
			<LazySection>
				<PromotionalEventHomeBanner />
			</LazySection>

			{/* BOGO Promotion Banner Section - Lazy loaded */}
			<LazySection>
				<BOGOPromotionBanner />
			</LazySection>

			{/* Collection Banner Section - Lazy loaded */}
			<LazySection>
				<CollectionBanner />
			</LazySection>

			{/* Featured Products Section - Lazy loaded */}
			<LazySection>
				<FeaturedProducts
					title="Featured Products"
					subtitle="Discover our curated collection from top designers"
				/>
			</LazySection>

			{/* AI Shopping Experience Section */}
			<section className="py-16 bg-gradient-to-r from-purple-50 to-indigo-50">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Experience Smarter Shopping with AI
						</h2>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Our AI assistant helps you discover the perfect products tailored
							to your style and preferences. Get personalized recommendations
							and elevate your shopping experience.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
						{/* Feature 1 */}
						<div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
							<div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 mx-auto">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6 text-purple-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
								Personalized Recommendations
							</h3>
							<p className="text-gray-600 text-center">
								Get product suggestions tailored to your style, preferences, and
								browsing history.
							</p>
						</div>

						{/* Feature 2 */}
						<div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
							<div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4 mx-auto">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6 text-indigo-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
								Smart Discovery
							</h3>
							<p className="text-gray-600 text-center">
								Discover new brands and products you might have missed with our
								intelligent search.
							</p>
						</div>

						{/* Feature 3 */}
						<div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
							<div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-4 mx-auto">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6 text-pink-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
								Style Assistant
							</h3>
							<p className="text-gray-600 text-center">
								Get styling advice and outfit recommendations from our AI
								fashion expert.
							</p>
						</div>
					</div>

					<div className="text-center mt-12">
						<Link href="/shops/ai-recommended">
							<button className="px-8 py-3 bg-black text-white font-medium rounded-lg  transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
								Explore AI Recommendations
							</button>
						</Link>
						<p className="text-gray-500 text-sm mt-4">
							Start chatting with our AI assistant to get personalized
							recommendations
						</p>
					</div>
				</div>
			</section>

			<LazySection>
				<ReferAndEarnBanner />
			</LazySection>

			{/* AI Recommended Products Section - Lazy loaded */}
			<LazySection>
				<AIRecommendedProducts
					title="AI Recommended For You"
					subtitle="Products recommended by our AI shopping assistant based on your preferences"
				/>
			</LazySection>

			{/* Featured Vendors Section - Lazy loaded */}
			<LazySection>
				<FeaturedVendors
					title="Featured Vendors"
					subtitle="Discover our talented tailors and designers"
				/>
			</LazySection>

			{/* Additional Sections - All lazy loaded */}
			<LazySection>
				<AboutSection />
			</LazySection>
			<LazySection>
				<StatsSection />
			</LazySection>
			<LazySection>
				<CTASection />
			</LazySection>
			<LazySection>
				<FeaturesSections />
			</LazySection>
			<LazySection>
				<ProcessSection />
			</LazySection>
			<LazySection>
				<BrandSlider />
			</LazySection>
			<LazySection>
				<BlogSection />
			</LazySection>
			<LazySection>
				<NewsletterSection />
			</LazySection>
			<LazySection>
				<CTASection2 />
			</LazySection>
			<LazySection>
				<Footer />
			</LazySection>

			{/* Signup Selection Dialog */}
			<AuthSelectionDialog
				open={showSignupDialog}
				onOpenChange={setShowSignupDialog}
			/>

			{/* Overlay for user menu */}
			{isUserMenuOpen && (
				<div
					className="fixed inset-0 z-30"
					onClick={() => setIsUserMenuOpen(false)}
				/>
			)}
		</div>
	);
}
