"use client";

/**
 * AI Theme Generator Component
 * Provides interface for AI-powered theme generation based on brand assets
 *
 * **Feature: merchant-storefront-upgrade, Property 3: AI Theme Generation Pipeline**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React, { useState, useCallback } from "react";
import { Upload, Wand2, Palette, Eye, Save, RefreshCw } from "lucide-react";
import { ThemeConfiguration } from "@/types/storefront";
import {
	GeneratedTheme,
	ThemeGenerationRequest,
} from "@/lib/ai/theme-generator";

interface AIThemeGeneratorProps {
	onThemeGenerated: (theme: ThemeConfiguration, templateId: string) => void;
	onSaveTheme?: (
		theme: ThemeConfiguration,
		templateId: string
	) => Promise<void>;
	className?: string;
}

interface UploadedAsset {
	file: File;
	url: string;
	type: "logo" | "image";
	description?: string;
}

export default function AIThemeGenerator({
	onThemeGenerated,
	onSaveTheme,
	className = "",
}: AIThemeGeneratorProps) {
	const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedTheme, setGeneratedTheme] = useState<GeneratedTheme | null>(
		null
	);
	const [selectedAlternative, setSelectedAlternative] = useState<number | null>(
		null
	);
	const [businessInfo, setBusinessInfo] = useState({
		name: "",
		category: "",
		description: "",
	});
	const [preferences, setPreferences] = useState({
		style: "" as any,
		colors: [] as string[],
	});
	const [error, setError] = useState<string | null>(null);

	/**
	 * Handles file upload for brand assets
	 */
	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = event.target.files;
			if (!files) return;

			Array.from(files).forEach((file) => {
				if (file.type.startsWith("image/")) {
					const url = URL.createObjectURL(file);
					const asset: UploadedAsset = {
						file,
						url,
						type: "logo", // Default to logo, user can change
					};

					setUploadedAssets((prev) => [...prev, asset]);
				}
			});
		},
		[]
	);

	/**
	 * Removes an uploaded asset
	 */
	const removeAsset = useCallback((index: number) => {
		setUploadedAssets((prev) => {
			const newAssets = [...prev];
			URL.revokeObjectURL(newAssets[index].url);
			newAssets.splice(index, 1);
			return newAssets;
		});
	}, []);

	/**
	 * Updates asset type
	 */
	const updateAssetType = useCallback(
		(index: number, type: "logo" | "image") => {
			setUploadedAssets((prev) => {
				const newAssets = [...prev];
				newAssets[index].type = type;
				return newAssets;
			});
		},
		[]
	);

	/**
	 * Converts file to data URL for OpenAI processing
	 */
	const fileToDataUrl = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	/**
	 * Generates theme using AI
	 */
	const generateTheme = useCallback(async () => {
		if (uploadedAssets.length === 0) {
			setError("Please upload at least one brand asset");
			return;
		}

		setIsGenerating(true);
		setError(null);

		try {
			// Convert files to data URLs for OpenAI processing
			const brandAssets = await Promise.all(
				uploadedAssets.map(async (asset) => ({
					type: asset.type,
					url: await fileToDataUrl(asset.file),
					description: asset.description || `${asset.type} asset`,
				}))
			);

			const request: ThemeGenerationRequest = {
				brandAssets,
				preferences: {
					style: preferences.style || undefined,
					colors:
						preferences.colors.length > 0 ? preferences.colors : undefined,
				},
				businessInfo: businessInfo.name ? businessInfo : undefined,
			};

			const response = await fetch("/api/storefront/ai-theme", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to generate theme");
			}

			setGeneratedTheme(data.data);
			setSelectedAlternative(null);

			// Apply the generated theme
			onThemeGenerated(data.data.theme, data.data.templateId);

			// Show success message
			setError(null);
		} catch (error) {
			console.error("Theme generation failed:", error);

			let errorMessage = "Failed to generate theme";
			if (error instanceof Error) {
				if (error.message.includes("invalid_image_url")) {
					errorMessage =
						"Unable to analyze the uploaded image. Please try with a different image or use the manual theme customization.";
				} else if (error.message.includes("AI service is not configured")) {
					errorMessage =
						"AI theme generation is currently unavailable. Please use the manual theme customization below.";
				} else {
					errorMessage = error.message;
				}
			}

			setError(errorMessage);
		} finally {
			setIsGenerating(false);
		}
	}, [uploadedAssets, preferences, businessInfo, onThemeGenerated]);

	/**
	 * Applies an alternative theme
	 */
	const applyAlternative = useCallback(
		(index: number) => {
			if (!generatedTheme || !generatedTheme.alternatives[index]) return;

			const alternative = generatedTheme.alternatives[index];
			setSelectedAlternative(index);
			onThemeGenerated(alternative.theme, alternative.templateId);
		},
		[generatedTheme, onThemeGenerated]
	);

	/**
	 * Generates theme without image analysis (fallback mode)
	 */
	const generateThemeWithoutImages = useCallback(async () => {
		setIsGenerating(true);
		setError(null);

		try {
			const request: ThemeGenerationRequest = {
				brandAssets: [], // No assets, will use fallback
				preferences: {
					style: preferences.style || undefined,
					colors:
						preferences.colors.length > 0 ? preferences.colors : undefined,
				},
				businessInfo: businessInfo.name ? businessInfo : undefined,
			};

			const response = await fetch("/api/storefront/ai-theme", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to generate theme");
			}

			setGeneratedTheme(data.data);
			setSelectedAlternative(null);

			// Apply the generated theme
			onThemeGenerated(data.data.theme, data.data.templateId);

			// Show success message
			setError(null);
		} catch (error) {
			console.error("Theme generation failed:", error);
			setError(
				error instanceof Error ? error.message : "Failed to generate theme"
			);
		} finally {
			setIsGenerating(false);
		}
	}, [preferences, businessInfo, onThemeGenerated]);

	/**
	 * Saves the current theme
	 */
	const saveCurrentTheme = useCallback(async () => {
		if (!generatedTheme || !onSaveTheme) return;

		const themeToSave =
			selectedAlternative !== null
				? generatedTheme.alternatives[selectedAlternative].theme
				: generatedTheme.theme;

		const templateId =
			selectedAlternative !== null
				? generatedTheme.alternatives[selectedAlternative].templateId
				: generatedTheme.templateId;

		try {
			await onSaveTheme(themeToSave, templateId);
		} catch (error) {
			setError("Failed to save theme");
		}
	}, [generatedTheme, selectedAlternative, onSaveTheme]);

	return (
		<div
			className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
		>
			{/* <div className="flex items-center gap-3 mb-6">
        <Wand2 className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-900">AI Theme Generator</h3>
      </div> */}

			{/* Upload Section */}
			<div className="mb-6">
				<h4 className="text-lg font-medium text-gray-900 mb-3">
					Upload Brand Assets
				</h4>

				<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
					<Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
					<p className="text-gray-600 mb-2">Upload your logo or brand images</p>
					<input
						type="file"
						multiple
						accept="image/*"
						onChange={handleFileUpload}
						className="hidden"
						id="asset-upload"
					/>
					<label
						htmlFor="asset-upload"
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
					>
						Choose Files
					</label>
				</div>

				{/* Uploaded Assets */}
				{uploadedAssets.length > 0 && (
					<div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
						{uploadedAssets.map((asset, index) => (
							<div
								key={index}
								className="relative border border-gray-200 rounded-lg p-3"
							>
								<img
									src={asset.url}
									alt={`Asset ${index + 1}`}
									className="w-full h-24 object-cover rounded mb-2"
								/>
								<select
									value={asset.type}
									onChange={(e) =>
										updateAssetType(index, e.target.value as "logo" | "image")
									}
									className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-2"
								>
									<option value="logo">Logo</option>
									<option value="image">Brand Image</option>
								</select>
								<button
									onClick={() => removeAsset(index)}
									className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
								>
									×
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Business Info Section */}
			<div className="mb-6">
				<h4 className="text-lg font-medium text-gray-900 mb-3">
					Business Information (Optional)
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<input
						type="text"
						placeholder="Business Name"
						value={businessInfo.name}
						onChange={(e) =>
							setBusinessInfo((prev) => ({ ...prev, name: e.target.value }))
						}
						className="border border-gray-300 rounded-md px-3 py-2"
					/>
					<input
						type="text"
						placeholder="Category (e.g., Fashion, Jewelry)"
						value={businessInfo.category}
						onChange={(e) =>
							setBusinessInfo((prev) => ({ ...prev, category: e.target.value }))
						}
						className="border border-gray-300 rounded-md px-3 py-2"
					/>
				</div>
				<textarea
					placeholder="Brief description of your business"
					value={businessInfo.description}
					onChange={(e) =>
						setBusinessInfo((prev) => ({
							...prev,
							description: e.target.value,
						}))
					}
					className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2"
					rows={2}
				/>
			</div>

			{/* Preferences Section */}
			{/* <div className="mb-6">
				<h4 className="text-lg font-medium text-gray-900 mb-3">
					Style Preferences (Optional)
				</h4>
				<select
					value={preferences.style}
					onChange={(e) =>
						setPreferences((prev) => ({ ...prev, style: e.target.value }))
					}
					className="w-full border border-gray-300 rounded-md px-3 py-2"
				>
					<option value="">Auto-detect style</option>
					<option value="luxury">Luxury</option>
					<option value="modern">Modern</option>
					<option value="artisan">Artisan</option>
					<option value="minimal">Minimal</option>
					<option value="bold">Bold</option>
					<option value="classic">Classic</option>
				</select>
			</div> */}

			{/* Generate Buttons */}
			{/* <div className="space-y-3">
				<button
					onClick={generateTheme}
					disabled={isGenerating || uploadedAssets.length === 0}
					className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{isGenerating ? (
						<>
							<RefreshCw className="w-4 h-4 animate-spin" />
							Generating Theme...
						</>
					) : (
						<>
							<Wand2 className="w-4 h-4" />
							Generate AI Theme from Images
						</>
					)}
				</button>

				<button
					onClick={generateThemeWithoutImages}
					disabled={isGenerating}
					className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					<Palette className="w-4 h-4" />
					Generate Theme from Preferences
				</button>
			</div> */}

			{/* Error Display */}
			{error && (
				<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-700 text-sm">{error}</p>
				</div>
			)}

			{/* Generated Theme Results */}
			{generatedTheme && (
				<div className="mt-6 border-t border-gray-200 pt-6">
					<div className="flex items-center justify-between mb-4">
						<h4 className="text-lg font-medium text-gray-900">
							Generated Theme
						</h4>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<Eye className="w-4 h-4" />
							Confidence: {Math.round(generatedTheme.confidence * 100)}%
						</div>
					</div>

					{/* Primary Theme */}
					<div className="mb-4 p-4 border border-gray-200 rounded-lg">
						<div className="flex items-center justify-between mb-3">
							<h5 className="font-medium text-gray-900">
								Primary Recommendation
							</h5>
							{onSaveTheme && (
								<button
									onClick={saveCurrentTheme}
									className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
								>
									<Save className="w-3 h-3" />
									Save
								</button>
							)}
						</div>

						<div className="flex items-center gap-4 mb-3">
							<div className="flex gap-1">
								{Object.entries(generatedTheme.theme.colors).map(
									([key, color]) => (
										<div
											key={key}
											className="w-8 h-8 rounded border border-gray-300"
											style={{ backgroundColor: color }}
											title={`${key}: ${color}`}
										/>
									)
								)}
							</div>
							<div className="text-sm text-gray-600">
								<p>
									<strong>Template:</strong> {generatedTheme.templateId}
								</p>
								<p>
									<strong>Style:</strong>{" "}
									{generatedTheme.analysis.style.category}
								</p>
							</div>
						</div>

						<div className="text-sm text-gray-600">
							<p>
								<strong>Mood:</strong>{" "}
								{generatedTheme.analysis.style.mood.join(", ")}
							</p>
							<p>
								<strong>Typography:</strong>{" "}
								{generatedTheme.analysis.typography.headingFont} /{" "}
								{generatedTheme.analysis.typography.bodyFont}
							</p>
						</div>
					</div>

					{/* Alternative Themes */}
					{generatedTheme.alternatives.length > 0 && (
						<div>
							<h5 className="font-medium text-gray-900 mb-3">
								Alternative Options
							</h5>
							<div className="space-y-3">
								{generatedTheme.alternatives.map((alternative, index) => (
									<div
										key={index}
										className={`p-3 border rounded-lg cursor-pointer transition-colors ${
											selectedAlternative === index
												? "border-blue-500 bg-blue-50"
												: "border-gray-200 hover:border-gray-300"
										}`}
										onClick={() => applyAlternative(index)}
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex gap-1">
												{Object.entries(alternative.theme.colors).map(
													([key, color]) => (
														<div
															key={key}
															className="w-6 h-6 rounded border border-gray-300"
															style={{ backgroundColor: color }}
														/>
													)
												)}
											</div>
											<span className="text-xs text-gray-500">
												{alternative.templateId}
											</span>
										</div>
										<p className="text-sm text-gray-600">
											{alternative.reasoning}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
