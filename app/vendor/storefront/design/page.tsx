"use client";

import { useState, useEffect } from "react";
import { TemplateSelector } from "@/components/vendor/storefront/TemplateSelector";
import { ThemeCustomizer } from "@/components/vendor/storefront/ThemeCustomizer";
import { ThemeVariants } from "@/components/vendor/storefront/ThemeVariants";
import { LivePreview } from "@/components/vendor/storefront/LivePreview";
import MediaUploader from "@/components/vendor/storefront/MediaUploader";
import AIThemeGenerator from "@/components/vendor/storefront/AIThemeGenerator";
import HeroSectionEditor from "@/components/vendor/storefront/HeroSectionEditor";

import { getStorefrontConfig } from "@/lib/storefront/client-storefront-service";
import { StorefrontTemplate, ThemeConfiguration } from "@/types/storefront";
import {
	saveThemeConfiguration,
	getThemeConfiguration,
} from "@/lib/storefront/theme-service";
import {
	realTimeSyncService,
	type HeroContent,
	type BusinessInfo,
} from "@/lib/storefront/real-time-sync";

// Default theme configuration - Modern and appealing
const defaultTheme: ThemeConfiguration = {
	colors: {
		primary: "#6366F1", // Modern indigo
		secondary: "#8B5CF6", // Complementary purple
		accent: "#F59E0B", // Warm amber accent
		background: "#FFFFFF",
		text: "#1F2937",
		surface: "#F9FAFB",
		border: "#E5E7EB",
	},
	typography: {
		headingFont: "Montserrat", // More distinctive heading font
		bodyFont: "Inter", // Clean body font
		sizes: {
			xs: "0.75rem",
			sm: "0.875rem",
			base: "1rem",
			lg: "1.125rem",
			xl: "1.25rem",
			"2xl": "1.5rem",
			"3xl": "1.875rem",
			"4xl": "2.25rem",
		},
	},
	layout: {
		headerStyle: "modern-clean",
		productCardStyle: "elegant",
		borderRadius: "medium",
		shadows: "subtle",
		spacing: {
			xs: "0.25rem",
			sm: "0.5rem",
			md: "1rem",
			lg: "1.5rem",
			xl: "2rem",
			"2xl": "3rem",
		},
	},
	variants: {
		buttonStyle: "filled",
		cardStyle: "elevated",
		animationLevel: "moderate",
	},
	media: {},
};

export default function StorefrontDesignPage() {
	const [selectedTemplate, setSelectedTemplate] =
		useState<StorefrontTemplate | null>(null);
	const [currentTheme, setCurrentTheme] =
		useState<ThemeConfiguration>(defaultTheme);
	const [themeUpdateKey, setThemeUpdateKey] = useState(0);
	const [isPreviewMode, setIsPreviewMode] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [saveMessage, setSaveMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	// Hero content and business info state
	const [heroContent, setHeroContent] = useState<HeroContent>({
		title: "",
		subtitle: "",
		description: "",
		ctaText: "Shop Now",
		ctaLink: "/products",
	});

	const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
		businessName: "",
		description: "",
		handle: "",
		slogan: "",
	});

	// Mock vendor ID - in real implementation, this would come from auth context
	const vendorId =
		typeof window !== "undefined" ? localStorage.getItem("tailorUID") : null;

	const handleTemplateSelect = (template: StorefrontTemplate) => {
		setSelectedTemplate(template);
		// Merge template theme with current media to preserve uploaded assets
		const newTheme = {
			...template.defaultTheme,
			media: currentTheme.media, // Keep existing media uploads
		};
		setCurrentTheme(newTheme);
		setThemeUpdateKey((prev) => prev + 1);

		// Real-time sync template change
		if (vendorId) {
			realTimeSyncService.syncTheme(vendorId, template.id, newTheme);
		}
	};

	const handleThemeChange = (newTheme: ThemeConfiguration) => {
		setCurrentTheme(newTheme);
		setThemeUpdateKey((prev) => prev + 1); // Trigger preview update

		// Real-time sync to live storefront
		if (vendorId && selectedTemplate) {
			realTimeSyncService.syncTheme(vendorId, selectedTemplate.id, newTheme);
		}
	};

	const handleHeroContentChange = (newHeroContent: HeroContent) => {
		setHeroContent(newHeroContent);
		setThemeUpdateKey((prev) => prev + 1); // Trigger preview update

		// Real-time sync to live storefront
		if (vendorId) {
			realTimeSyncService.syncHeroContent(vendorId, newHeroContent);
		}
	};

	const handleBusinessInfoChange = (newBusinessInfo: BusinessInfo) => {
		setBusinessInfo(newBusinessInfo);
		setThemeUpdateKey((prev) => prev + 1); // Trigger preview update

		// Real-time sync to live storefront
		if (vendorId) {
			realTimeSyncService.syncBusinessInfo(vendorId, newBusinessInfo);
		}
	};

	// Load existing theme configuration on component mount
	useEffect(() => {
		const loadThemeConfiguration = async () => {
			if (!vendorId) {
				setIsLoading(false);
				setSaveMessage({
					type: "error",
					text: "Vendor ID not found. Please log in again.",
				});
				return;
			}

			try {
				setIsLoading(true);

				// Fetch both theme config and Storefront config (for robust business info)
				const [themeResponse, storefrontConfigRes] = await Promise.all([
					getThemeConfiguration(vendorId),
					getStorefrontConfig(vendorId),
				]);

				if (themeResponse.success && themeResponse.data) {
					setCurrentTheme(themeResponse.data.theme);

					// Load hero content
					if (themeResponse.data.heroContent) {
						setHeroContent({
							title: themeResponse.data.heroContent.title || "",
							subtitle: themeResponse.data.heroContent.subtitle || "",
							description: themeResponse.data.heroContent.description || "",
							ctaText: themeResponse.data.heroContent.ctaText || "Shop Now",
							ctaLink: themeResponse.data.heroContent.ctaLink || "/products",
						});
					}

					// Load business info
					const fetchedBusinessInfo = {
						businessName: themeResponse.data.businessInfo?.businessName || "",
						description: themeResponse.data.businessInfo?.description || "",
						handle: themeResponse.data.businessInfo?.handle || "",
						slogan: themeResponse.data.businessInfo?.slogan || "",
					};

					// Fallback/Enhancement with StorefrontConfig
					if (storefrontConfigRes.success && storefrontConfigRes.data) {
						if (!fetchedBusinessInfo.businessName) {
							fetchedBusinessInfo.businessName =
								storefrontConfigRes.data.businessInfo?.businessName ||
								storefrontConfigRes.data.branding?.businessName ||
								"";
						}
						if (!fetchedBusinessInfo.handle) {
							fetchedBusinessInfo.handle = storefrontConfigRes.data.handle;
						}
					}

					setBusinessInfo(fetchedBusinessInfo);

					// Find and set the selected template based on templateId
					// This would normally come from a template service
					// For now, we'll match against our mock templates
					const templates = [
						{
							id: "minimal",
							name: "Minimal",
							description: "Clean and simple design focused on products",
							category: "minimal" as const,
							previewImage: "/templates/minimal-preview.jpg",
							features: [
								"Clean layout",
								"Product focus",
								"Fast loading",
								"Mobile optimized",
							],
							isActive: true,
							createdAt: new Date(),
							updatedAt: new Date(),
							defaultTheme: currentTheme,
						},
						{
							id: "modern",
							name: "Modern",
							description: "Contemporary design with bold colors and gradients",
							category: "modern" as const,
							previewImage: "/templates/modern-preview.jpg",
							features: [
								"Bold colors",
								"Gradient effects",
								"Interactive elements",
								"Modern typography",
							],
							isActive: true,
							createdAt: new Date(),
							updatedAt: new Date(),
							defaultTheme: currentTheme,
						},
						{
							id: "classic",
							name: "Classic",
							description:
								"Timeless design with elegant typography and warm colors",
							category: "classic" as const,
							previewImage: "/templates/classic-preview.jpg",
							features: [
								"Elegant typography",
								"Warm colors",
								"Traditional layout",
								"Professional look",
							],
							isActive: true,
							createdAt: new Date(),
							updatedAt: new Date(),
							defaultTheme: currentTheme,
						},
					];

					const template = templates.find(
						(t) => t.id === themeResponse.data!.templateId
					);
					if (template) {
						setSelectedTemplate(template);
					}
				}
			} catch (error) {
				console.error("Error loading theme configuration:", error);
				setSaveMessage({
					type: "error",
					text: "Failed to load existing configuration",
				});
			} finally {
				setIsLoading(false);
			}
		};

		loadThemeConfiguration();
	}, [vendorId]);

	// Real-time sync subscription for live updates
	useEffect(() => {
		if (!vendorId) return;

		const unsubscribe = realTimeSyncService.subscribe(vendorId, (update) => {
			console.log("Received real-time update:", update);

			if (update.theme) {
				setCurrentTheme((prev) => ({ ...prev, ...update.theme }));
				setThemeUpdateKey((prev) => prev + 1);
			}

			if (update.heroContent) {
				setHeroContent((prev) => ({
					title: update.heroContent?.title ?? prev.title,
					subtitle: update.heroContent?.subtitle ?? prev.subtitle,
					description: update.heroContent?.description ?? prev.description,
					ctaText: update.heroContent?.ctaText ?? prev.ctaText,
					ctaLink: update.heroContent?.ctaLink ?? prev.ctaLink,
				}));
			}

			if (update.businessInfo) {
				setBusinessInfo((prev) => ({
					businessName: update.businessInfo?.businessName ?? prev.businessName,
					description: update.businessInfo?.description ?? prev.description,
					handle: update.businessInfo?.handle ?? prev.handle,
					slogan: update.businessInfo?.slogan ?? prev.slogan,
				}));
			}
		});

		return unsubscribe;
	}, [vendorId]);

	const handleSaveConfiguration = async () => {
		if (!selectedTemplate) {
			setSaveMessage({ type: "error", text: "Please select a template first" });
			return;
		}

		if (!vendorId) {
			setSaveMessage({
				type: "error",
				text: "Vendor ID not found. Please log in again.",
			});
			return;
		}

		try {
			setIsSaving(true);
			setSaveMessage(null);

			const response = await saveThemeConfiguration({
				vendorId,
				templateId: selectedTemplate.id,
				theme: currentTheme,
				heroContent,
				businessInfo,
			});

			if (response.success) {
				setSaveMessage({
					type: "success",
					text: "Theme configuration saved successfully!",
				});
			} else {
				setSaveMessage({
					type: "error",
					text: response.error || "Failed to save configuration",
				});
			}
		} catch (error) {
			console.error("Error saving configuration:", error);
			setSaveMessage({
				type: "error",
				text: "Failed to save configuration. Please try again.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	// Clear save message after 5 seconds
	useEffect(() => {
		if (saveMessage) {
			const timer = setTimeout(() => {
				setSaveMessage(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [saveMessage]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading theme configuration...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Storefront Design
					</h1>
					<p className="mt-2 text-gray-600">
						Choose a template and customize your storefront appearance
					</p>

					{/* Save Message */}
					{saveMessage && (
						<div
							className={`mt-4 p-4 rounded-md ${
								saveMessage.type === "success"
									? "bg-green-50 border border-green-200 text-green-800"
									: "bg-red-50 border border-red-200 text-red-800"
							}`}
						>
							<div className="flex">
								<div className="flex-shrink-0">
									{saveMessage.type === "success" ? (
										<svg
											className="h-5 w-5 text-green-400"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clipRule="evenodd"
											/>
										</svg>
									) : (
										<svg
											className="h-5 w-5 text-red-400"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clipRule="evenodd"
											/>
										</svg>
									)}
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium">{saveMessage.text}</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* AI Theme Generator and Template Selection */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-lg shadow-sm border p-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4">
								Choose Template Manually
							</h2>
							<TemplateSelector
								selectedTemplate={selectedTemplate}
								onTemplateSelect={handleTemplateSelect}
							/>
						</div>

						{/* Theme Customization */}
						{selectedTemplate && (
							<div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Customize Theme
								</h2>
								<ThemeCustomizer
									theme={currentTheme}
									onThemeChange={handleThemeChange}
								/>
							</div>
						)}

						{/* Theme Variants */}
						{selectedTemplate && (
							<div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Style Variants
								</h2>
								<ThemeVariants
									theme={currentTheme}
									onThemeChange={handleThemeChange}
								/>
							</div>
						)}

						{/* Hero Section Editor */}
						{selectedTemplate && vendorId && (
							<div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
								<HeroSectionEditor
									vendorId={vendorId}
									theme={currentTheme}
									heroContent={heroContent}
									businessInfo={businessInfo}
									onContentChange={handleHeroContentChange}
									onBusinessInfoChange={handleBusinessInfoChange}
									onSave={async (content, business) => {
										try {
											setIsSaving(true);
											// Force immediate sync
											await realTimeSyncService.forceSyncNow({
												vendorId,
												heroContent: content,
												businessInfo: business,
												timestamp: Date.now(),
											});
											setSaveMessage({
												type: "success",
												text: "Hero section saved successfully!",
											});
										} catch (error) {
											console.error("Error saving hero section:", error);
											setSaveMessage({
												type: "error",
												text: "Failed to save hero section",
											});
										} finally {
											setIsSaving(false);
										}
									}}
								/>
							</div>
						)}

						{/* Media Upload */}
						{selectedTemplate && vendorId && (
							<div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Brand Assets
								</h2>
								<div className="space-y-6">
									<div>
										<h3 className="text-sm font-medium text-gray-900 mb-2">
											Logo
										</h3>
										<MediaUploader
											vendorId={vendorId}
											uploadType="logo"
											currentUrl={currentTheme.media?.logoUrl}
											onUploadComplete={(url) => {
												const newTheme = {
													...currentTheme,
													media: { ...currentTheme.media, logoUrl: url },
												};
												setCurrentTheme(newTheme);
												// Real-time sync media update
												if (vendorId) {
													realTimeSyncService.syncMedia(vendorId, newTheme);
												}
											}}
											onUploadError={(error) => {
												setSaveMessage({ type: "error", text: error });
											}}
											onDelete={() => {
												setCurrentTheme((prev) => ({
													...prev,
													media: { ...prev.media, logoUrl: undefined },
												}));
											}}
										/>
									</div>

									<div>
										<h3 className="text-sm font-medium text-gray-900 mb-2">
											Banner
										</h3>
										<MediaUploader
											vendorId={vendorId}
											uploadType="banner"
											currentUrl={currentTheme.media?.bannerUrl}
											onUploadComplete={(url) => {
												const newTheme = {
													...currentTheme,
													media: { ...currentTheme.media, bannerUrl: url },
												};
												setCurrentTheme(newTheme);
												// Force re-render by updating key
												setThemeUpdateKey((prev) => prev + 1);
												// Real-time sync media update
												if (vendorId) {
													realTimeSyncService.syncMedia(vendorId, newTheme);
												}
											}}
											onUploadError={(error) => {
												setSaveMessage({ type: "error", text: error });
											}}
											onDelete={() => {
												setCurrentTheme((prev) => ({
													...prev,
													media: { ...prev.media, bannerUrl: undefined },
												}));
											}}
										/>
									</div>

									<div>
										<h3 className="text-sm font-medium text-gray-900 mb-2">
											Video Banner
										</h3>
										<MediaUploader
											vendorId={vendorId}
											uploadType="video"
											currentUrl={currentTheme.media?.videoUrl}
											onUploadComplete={(url) => {
												const newTheme = {
													...currentTheme,
													media: { ...currentTheme.media, videoUrl: url },
												};
												setCurrentTheme(newTheme);
												// Real-time sync media update
												if (vendorId) {
													realTimeSyncService.syncMedia(vendorId, newTheme);
												}
											}}
											onUploadError={(error) => {
												setSaveMessage({ type: "error", text: error });
											}}
											onDelete={() => {
												setCurrentTheme((prev) => ({
													...prev,
													media: { ...prev.media, videoUrl: undefined },
												}));
											}}
										/>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Live Preview */}
					<div className="lg:col-span-2">
						<div className="sticky top-8">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold text-gray-900">
									Live Preview
								</h2>
								<div className="flex space-x-2">
									<div className="text-sm text-gray-500 flex items-center">
										<span
											className={`w-2 h-2 rounded-full mr-2 ${
												isSaving ? "bg-yellow-400" : "bg-green-400"
											}`}
										></span>
										{isSaving ? "Saving..." : "All changes saved"}
									</div>
									<button
										onClick={handleSaveConfiguration}
										disabled={isSaving}
										className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
									>
										{isSaving ? "Saving..." : "Save Changes"}
									</button>
								</div>
							</div>

							<div className="bg-white rounded-lg shadow-lg border overflow-hidden">
								<div className="bg-gray-100 p-2 border-b flex items-center space-x-2">
									<div className="w-3 h-3 rounded-full bg-red-400"></div>
									<div className="w-3 h-3 rounded-full bg-yellow-400"></div>
									<div className="w-3 h-3 rounded-full bg-green-400"></div>
									<div className="flex-1 text-center">
										<div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500 inline-block">
											{businessInfo.handle
												? `${businessInfo.handle}.stitches.africa`
												: "your-store.stitches.africa"}
										</div>
									</div>
								</div>

								{/* Key prop forces re-render when components update */}
								<LivePreview
									key={themeUpdateKey}
									template={selectedTemplate}
									theme={currentTheme}
									vendorId={vendorId || undefined}
									heroContent={heroContent}
									businessInfo={businessInfo}
								/>
							</div>

							<div className="mt-4 flex justify-between text-sm text-gray-500">
								<p>Preview updates automatically as you make changes</p>
								<button
									onClick={() => setIsPreviewMode(true)}
									disabled={!selectedTemplate}
									className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									View Full Screen
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Full Screen Preview Modal */}
			{isPreviewMode && selectedTemplate && (
				<LivePreview
					template={selectedTemplate}
					theme={currentTheme}
					isFullscreen={true}
					vendorId={vendorId || undefined}
					heroContent={heroContent}
					businessInfo={businessInfo}
				/>
			)}
		</div>
	);
}
