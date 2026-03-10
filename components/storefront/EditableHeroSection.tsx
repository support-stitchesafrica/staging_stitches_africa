"use client";

import React, { useState, useEffect } from "react";
import { StorefrontConfig } from "@/types/storefront";

interface HeroContent {
	title: string;
	subtitle: string;
	buttonText: string;
}

interface EditableHeroSectionProps {
	storefront: StorefrontConfig;
	isEditable?: boolean;
	onSave?: (content: HeroContent) => Promise<void>;
	heroContent?: {
		title?: string;
		subtitle?: string;
		description?: string;
		ctaText?: string;
		ctaLink?: string;
		backgroundImage?: string;
		backgroundVideo?: string;
	};
	businessInfo?: {
		businessName?: string;
		description?: string;
		handle?: string;
		slogan?: string;
	};
}

export default function EditableHeroSection({
	storefront,
	isEditable = false,
	onSave,
	heroContent,
	businessInfo,
}: EditableHeroSectionProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [content, setContent] = useState<HeroContent>({
		title:
			heroContent?.title ||
			businessInfo?.businessName ||
			storefront.branding?.businessName ||
			`Welcome to ${storefront.handle}`,
		subtitle:
			heroContent?.subtitle ||
			businessInfo?.slogan ||
			"Discover our amazing collection",
		buttonText: heroContent?.ctaText || "Shop Now",
	});
	const [originalContent, setOriginalContent] = useState<HeroContent>(content);
	const [isSaving, setIsSaving] = useState(false);

	// Update content when props change
	useEffect(() => {
		const newContent = {
			title:
				heroContent?.title ||
				businessInfo?.businessName ||
				storefront.branding?.businessName ||
				`Welcome to ${storefront.handle}`,
			subtitle:
				heroContent?.subtitle ||
				businessInfo?.slogan ||
				"Discover our amazing collection",
			buttonText: heroContent?.ctaText || "Shop Now",
		};
		setContent(newContent);
		setOriginalContent(newContent);
	}, [heroContent, businessInfo, storefront.handle, storefront.branding]);

	const handleEdit = () => {
		setIsEditing(true);
		setOriginalContent(content);
	};

	const handleCancel = () => {
		setContent(originalContent);
		setIsEditing(false);
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);

			if (onSave) {
				await onSave(content);
			} else {
				// Default save implementation
				const response = await fetch("/api/storefront/hero", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						// Note: In a real implementation, you'd get the auth token here
					},
					body: JSON.stringify({
						vendorId: "current-vendor-id", // This should come from auth context
						content,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to save hero content");
				}
			}

			setOriginalContent(content);
			setIsEditing(false);
			alert("Hero content saved successfully!");
		} catch (error) {
			console.error("Error saving hero content:", error);
			alert("Failed to save changes. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const scrollToProducts = () => {
		document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<>
			{storefront.theme.media?.bannerUrl ? (
				<section className="relative min-h-screen overflow-hidden">
					<img
						src={storefront.theme.media.bannerUrl}
						alt="Store Banner"
						className="w-full h-full object-cover absolute inset-0"
						onError={(e) => {
							e.currentTarget.style.display = "none";
						}}
					/>

					{/* Sophisticated Overlay */}
					<div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
					<div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"></div>

					{/* Main Content */}
					<div className="relative z-10 min-h-screen flex items-center justify-center">
						<div className="text-center text-white px-4 max-w-6xl mx-auto">
							{isEditing ? (
								<div className="space-y-6">
									<input
										type="text"
										value={content.title}
										onChange={(e) =>
											setContent({ ...content, title: e.target.value })
										}
										className="w-full text-4xl md:text-6xl font-light mb-6 drop-shadow-lg bg-transparent border-b-2 border-white/50 text-center text-white placeholder-white/70 focus:outline-none focus:border-white tracking-wide"
										placeholder="Brand Name"
										style={{
											fontFamily: storefront.theme.typography.headingFont,
											letterSpacing: "0.05em",
										}}
									/>
									<input
										type="text"
										value={content.subtitle}
										onChange={(e) =>
											setContent({ ...content, subtitle: e.target.value })
										}
										className="w-full text-xl md:text-2xl mb-8 drop-shadow-md bg-transparent border-b border-white/50 text-center text-white placeholder-white/70 focus:outline-none focus:border-white font-light tracking-widest uppercase"
										placeholder="Tagline"
										style={{
											fontFamily: storefront.theme.typography.bodyFont,
											letterSpacing: "0.2em",
										}}
									/>
									<input
										type="text"
										value={content.buttonText}
										onChange={(e) =>
											setContent({ ...content, buttonText: e.target.value })
										}
										className="w-40 px-6 py-3 bg-transparent border-2 border-white/50 text-center text-white placeholder-white/70 focus:outline-none focus:border-white uppercase tracking-wider font-medium"
										placeholder="CTA Text"
										style={{
											fontFamily: storefront.theme.typography.bodyFont,
											letterSpacing: "0.1em",
										}}
									/>
									<div className="flex gap-3 justify-center mt-8">
										<button
											onClick={handleSave}
											disabled={isSaving}
											className="px-6 py-3 bg-white text-black uppercase tracking-wider font-medium hover:bg-gray-100 disabled:opacity-50 transition-all duration-300"
										>
											{isSaving ? "Saving..." : "Save"}
										</button>
										<button
											onClick={handleCancel}
											className="px-6 py-3 bg-black/50 text-white border border-white/30 uppercase tracking-wider font-medium hover:bg-black/70 transition-all duration-300"
										>
											Cancel
										</button>
									</div>
								</div>
							) : (
								<>
									{/* Brand Name */}
									<h1
										className="text-4xl md:text-6xl lg:text-7xl font-light mb-6 drop-shadow-2xl tracking-wide"
										style={{
											fontFamily: storefront.theme.typography.headingFont,
											letterSpacing: "0.05em",
										}}
									>
										{content.title}
									</h1>

									{/* Elegant Divider */}
									<div className="flex items-center justify-center mb-6">
										<div className="h-px w-16 bg-white/40"></div>
										<div className="w-2 h-2 mx-4 rotate-45 bg-white/50"></div>
										<div className="h-px w-16 bg-white/40"></div>
									</div>

									{/* Tagline */}
									<p
										className="text-xl md:text-2xl mb-12 drop-shadow-lg font-light tracking-widest uppercase opacity-90"
										style={{
											fontFamily: storefront.theme.typography.bodyFont,
											letterSpacing: "0.2em",
										}}
									>
										{content.subtitle}
									</p>

									{/* CTA Buttons */}
									<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
										<button
											onClick={scrollToProducts}
											className="group relative px-12 py-4 border-2 border-white font-medium uppercase tracking-widest transition-all duration-500 hover:shadow-2xl overflow-hidden backdrop-blur-sm"
											style={{
												fontFamily: storefront.theme.typography.bodyFont,
												letterSpacing: "0.1em",
											}}
										>
											<span className="relative z-10 transition-colors duration-500 group-hover:text-black">
												{content.buttonText}
											</span>
											<div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
										</button>

										{isEditable && (
											<button
												onClick={handleEdit}
												className="px-6 py-4 bg-white/10 text-white border border-white/30 hover:bg-white/20 transition-all duration-300 uppercase tracking-wider font-medium backdrop-blur-sm"
											>
												✏️ Edit
											</button>
										)}
									</div>

									{/* Fashion Elements */}
									<div className="mt-16 flex justify-center items-center space-x-8 opacity-60">
										<div className="text-xs uppercase tracking-widest">
											Luxury
										</div>
										<div className="w-px h-8 bg-white/40"></div>
										<div className="text-xs uppercase tracking-widest">
											Fashion
										</div>
										<div className="w-px h-8 bg-white/40"></div>
										<div className="text-xs uppercase tracking-widest">
											Style
										</div>
									</div>
								</>
							)}
						</div>
					</div>

					{/* Scroll Indicator */}
					<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
						<div className="flex flex-col items-center text-white">
							<div className="text-xs uppercase tracking-widest mb-2 opacity-70">
								Scroll
							</div>
							<div className="w-px h-8 bg-white/50"></div>
						</div>
					</div>
				</section>
			) : (
				<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
					{/* Fashion Background Pattern */}
					<div className="absolute inset-0 opacity-5">
						<div
							className="absolute inset-0"
							style={{
								backgroundImage: `
                radial-gradient(circle at 25% 25%, ${storefront.theme.colors.primary} 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, ${storefront.theme.colors.primary} 1px, transparent 1px)
              `,
								backgroundSize: "50px 50px",
							}}
						></div>
					</div>

					{/* Gradient Overlay */}
					<div
						className="absolute inset-0"
						style={{
							background: `linear-gradient(135deg, 
                ${storefront.theme.colors.background} 0%, 
                ${storefront.theme.colors.primary}08 35%, 
                ${
									storefront.theme.colors.secondary ||
									storefront.theme.colors.primary
								}05 65%, 
                ${storefront.theme.colors.background} 100%)`,
						}}
					></div>

					{/* Main Content */}
					<div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
						{isEditing ? (
							<div className="space-y-6">
								<input
									type="text"
									value={content.title}
									onChange={(e) =>
										setContent({ ...content, title: e.target.value })
									}
									className="w-full text-5xl md:text-7xl font-light mb-6 bg-transparent border-b-2 text-center focus:outline-none tracking-wide"
									placeholder="Brand Name"
									style={{
										color: storefront.theme.colors.primary,
										fontFamily: storefront.theme.typography.headingFont,
										borderColor: storefront.theme.colors.primary + "30",
										letterSpacing: "0.05em",
									}}
								/>
								<input
									type="text"
									value={content.subtitle}
									onChange={(e) =>
										setContent({ ...content, subtitle: e.target.value })
									}
									className="w-full text-xl md:text-2xl mb-8 bg-transparent border-b text-center focus:outline-none font-light tracking-widest uppercase"
									placeholder="Tagline"
									style={{
										color: storefront.theme.colors.text,
										fontFamily: storefront.theme.typography.bodyFont,
										borderColor: storefront.theme.colors.primary + "20",
										letterSpacing: "0.2em",
									}}
								/>
								<input
									type="text"
									value={content.buttonText}
									onChange={(e) =>
										setContent({ ...content, buttonText: e.target.value })
									}
									className="w-40 px-6 py-3 bg-transparent border-2 text-center focus:outline-none uppercase tracking-wider font-medium"
									placeholder="CTA Text"
									style={{
										color: storefront.theme.colors.text,
										fontFamily: storefront.theme.typography.bodyFont,
										borderColor: storefront.theme.colors.primary,
										letterSpacing: "0.1em",
									}}
								/>
								<div className="flex gap-3 justify-center mt-8">
									<button
										onClick={handleSave}
										disabled={isSaving}
										className="px-6 py-3 text-white uppercase tracking-wider font-medium hover:opacity-90 disabled:opacity-50 transition-all duration-300"
										style={{ backgroundColor: storefront.theme.colors.primary }}
									>
										{isSaving ? "Saving..." : "Save"}
									</button>
									<button
										onClick={handleCancel}
										className="px-6 py-3 bg-gray-600 text-white uppercase tracking-wider font-medium hover:bg-gray-700 transition-all duration-300"
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<>
								{/* Brand Name */}
								<h1
									className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 tracking-wide"
									style={{
										color: storefront.theme.colors.primary,
										fontFamily: storefront.theme.typography.headingFont,
										letterSpacing: "0.05em",
									}}
								>
									{content.title}
								</h1>

								{/* Elegant Divider */}
								<div className="flex items-center justify-center mb-6">
									<div
										className="h-px w-16 opacity-30"
										style={{ backgroundColor: storefront.theme.colors.primary }}
									></div>
									<div
										className="w-2 h-2 mx-4 rotate-45 opacity-40"
										style={{ backgroundColor: storefront.theme.colors.primary }}
									></div>
									<div
										className="h-px w-16 opacity-30"
										style={{ backgroundColor: storefront.theme.colors.primary }}
									></div>
								</div>

								{/* Tagline */}
								<p
									className="text-xl md:text-2xl mb-12 font-light tracking-widest uppercase opacity-80"
									style={{
										color: storefront.theme.colors.text,
										fontFamily: storefront.theme.typography.bodyFont,
										letterSpacing: "0.2em",
									}}
								>
									{content.subtitle}
								</p>

								{/* CTA Buttons */}
								<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
									<button
										onClick={scrollToProducts}
										className="group relative px-12 py-4 border-2 font-medium uppercase tracking-widest transition-all duration-500 hover:shadow-2xl overflow-hidden"
										style={{
											borderColor: storefront.theme.colors.primary,
											color: storefront.theme.colors.primary,
											fontFamily: storefront.theme.typography.bodyFont,
											letterSpacing: "0.1em",
										}}
									>
										<span className="relative z-10 transition-colors duration-500 group-hover:text-white">
											{content.buttonText}
										</span>
										<div
											className="absolute inset-0 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"
											style={{
												backgroundColor: storefront.theme.colors.primary,
											}}
										></div>
									</button>

									{isEditable && (
										<button
											onClick={handleEdit}
											className="px-6 py-4 border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-300 uppercase tracking-wider font-medium"
										>
											✏️ Edit
										</button>
									)}
								</div>

								{/* Fashion Elements */}
								<div className="mt-16 flex justify-center items-center space-x-8 opacity-40">
									<div
										className="text-xs uppercase tracking-widest"
										style={{ color: storefront.theme.colors.text }}
									>
										Luxury
									</div>
									<div
										className="w-px h-8"
										style={{ backgroundColor: storefront.theme.colors.primary }}
									></div>
									<div
										className="text-xs uppercase tracking-widest"
										style={{ color: storefront.theme.colors.text }}
									>
										Fashion
									</div>
									<div
										className="w-px h-8"
										style={{ backgroundColor: storefront.theme.colors.primary }}
									></div>
									<div
										className="text-xs uppercase tracking-widest"
										style={{ color: storefront.theme.colors.text }}
									>
										Style
									</div>
								</div>
							</>
						)}
					</div>

					{/* Scroll Indicator */}
					<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
						<div className="flex flex-col items-center">
							<div
								className="text-xs uppercase tracking-widest mb-2 opacity-60"
								style={{ color: storefront.theme.colors.text }}
							>
								Scroll
							</div>
							<div
								className="w-px h-8 opacity-40"
								style={{ backgroundColor: storefront.theme.colors.primary }}
							></div>
						</div>
					</div>
				</section>
			)}
		</>
	);
}
