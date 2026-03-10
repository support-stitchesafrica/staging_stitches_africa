"use client";

import React, { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Save,
	Eye,
	EyeOff,
	ExternalLink,
	AlertCircle,
	CheckCircle,
	Copy,
	Check,
} from "lucide-react";
import { toast } from "sonner";
import HandleInput from "./HandleInput";
import { StorefrontConfig } from "@/types/storefront";
import {
	saveStorefrontConfig,
	generatePreviewUrl,
} from "@/lib/storefront/client-storefront-service";

interface StorefrontSettingsProps {
	vendorId: string;
	initialConfig?: StorefrontConfig | null;
	onConfigUpdate?: (config: StorefrontConfig) => void;
}

export default function StorefrontSettings({
	vendorId,
	initialConfig,
	onConfigUpdate,
}: StorefrontSettingsProps) {
	const [handle, setHandle] = useState(initialConfig?.handle || "");
	const [isPublic, setIsPublic] = useState(initialConfig?.isPublic ?? true);
	const [isHandleValid, setIsHandleValid] = useState(false);
	const [isHandleAvailable, setIsHandleAvailable] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isCopied, setIsCopied] = useState(false);

	// Track changes
	useEffect(() => {
		const hasChanges =
			handle !== (initialConfig?.handle || "") ||
			isPublic !== (initialConfig?.isPublic ?? true);

		setHasUnsavedChanges(hasChanges);
	}, [handle, isPublic, initialConfig]);

	// Handle validation change
	const handleValidationChange = (isValid: boolean, isAvailable: boolean) => {
		setIsHandleValid(isValid);
		setIsHandleAvailable(isAvailable);
	};

	// Copy URL to clipboard
	const handleCopyUrl = () => {
		if (!initialConfig?.handle) return;

		const url = generatePreviewUrl(initialConfig.handle);
		navigator.clipboard.writeText(url);
		setIsCopied(true);
		toast.success("Storefront URL copied to clipboard");

		setTimeout(() => {
			setIsCopied(false);
		}, 2000);
	};

	// Save storefront configuration
	const handleSave = async () => {
		if (!isHandleValid || !isHandleAvailable) {
			toast.error("Please fix handle validation errors before saving");
			return;
		}

		if (!handle.trim()) {
			toast.error("Handle is required");
			return;
		}

		setIsSaving(true);

		try {
			const response = await saveStorefrontConfig({
				vendorId,
				handle: handle.trim(),
				isPublic,
				templateId: initialConfig?.templateId || "default",
				theme: initialConfig?.theme,
			});

			if (response.success && response.data) {
				toast.success("Storefront settings saved successfully!");
				setHasUnsavedChanges(false);

				// Update parent component with new config
				if (onConfigUpdate) {
					onConfigUpdate(response.data);
				}
			} else {
				toast.error(response.error || "Failed to save settings");
			}
		} catch (error) {
			console.error("Error saving storefront settings:", error);
			toast.error("Failed to save settings. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	// Generate preview URL
	const previewUrl =
		handle && isHandleValid && isHandleAvailable
			? generatePreviewUrl(handle)
			: null;

	const canSave =
		isHandleValid && isHandleAvailable && hasUnsavedChanges && !isSaving;
	const savedUrl = initialConfig?.handle
		? generatePreviewUrl(initialConfig.handle)
		: null;

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<h1 className="text-2xl font-bold">Storefront Settings</h1>
				<p className="text-gray-600">
					Configure your storefront URL and visibility settings
				</p>
			</div>

			{/* Main Settings Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Basic Configuration
						{hasUnsavedChanges && (
							<Badge variant="secondary" className="text-xs">
								Unsaved Changes
							</Badge>
						)}
					</CardTitle>
					<CardDescription>
						Set up your storefront handle and visibility preferences
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Active Storefront URL Display - Only show if current config has a handle */}
					{savedUrl && (
						<div className="space-y-2">
							<Label className="text-sm font-medium">Your Storefront URL</Label>
							<div className="flex gap-2">
								<div className="flex-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-700 truncate font-mono">
									{savedUrl}
								</div>
								<Button
									variant="outline"
									size="icon"
									onClick={handleCopyUrl}
									className="shrink-0"
									title="Copy URL"
								>
									{isCopied ? (
										<Check className="h-4 w-4 text-green-600" />
									) : (
										<Copy className="h-4 w-4 text-gray-500" />
									)}
								</Button>
								<Button
									variant="outline"
									size="icon"
									onClick={() => window.open(savedUrl, "_blank")}
									className="shrink-0"
									title="Open in new tab"
								>
									<ExternalLink className="h-4 w-4 text-gray-500" />
								</Button>
							</div>
							<p className="text-xs text-gray-500">
								Share this link with your customers to direct them to your
								store.
							</p>
						</div>
					)}

					{savedUrl && <Separator />}

					{/* Handle Input */}
					<HandleInput
						value={handle}
						onChange={setHandle}
						onValidationChange={handleValidationChange}
						disabled={isSaving}
					/>

					<Separator />

					{/* Visibility Settings */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label className="text-sm font-medium">
								Storefront Visibility
							</Label>
							<p className="text-sm text-gray-600">
								Control who can access your storefront
							</p>
						</div>

						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									{isPublic ? (
										<Eye className="h-4 w-4 text-green-600" />
									) : (
										<EyeOff className="h-4 w-4 text-gray-600" />
									)}
									<Label htmlFor="visibility-toggle" className="font-medium">
										{isPublic ? "Public Storefront" : "Private Storefront"}
									</Label>
								</div>
								<p className="text-sm text-gray-600">
									{isPublic
										? "Anyone can visit your storefront"
										: "Only you can access your storefront"}
								</p>
							</div>
							<Switch
								id="visibility-toggle"
								checked={isPublic}
								onCheckedChange={setIsPublic}
								disabled={isSaving}
							/>
						</div>
					</div>

					{/* Preview Section - Only show if DIFFERENT from saved URL */}
					{previewUrl &&
						(!initialConfig?.handle || previewUrl !== savedUrl) && (
							<>
								<Separator />
								<div className="space-y-3">
									<Label className="text-sm font-medium">Preview New URL</Label>
									<div className="p-4 bg-gray-50 rounded-lg space-y-2">
										<p className="text-sm text-gray-600">
											Your storefront will be available at:
										</p>
										<div className="flex items-center gap-2">
											<code className="px-2 py-1 bg-white border rounded text-sm font-mono">
												{previewUrl}
											</code>
											<Button
												variant="outline"
												size="sm"
												onClick={() => window.open(previewUrl, "_blank")}
												className="flex items-center gap-1"
											>
												<ExternalLink className="h-3 w-3" />
												Visit
											</Button>
										</div>
									</div>
								</div>
							</>
						)}
				</CardContent>
			</Card>

			{/* Status Alert */}
			{!isPublic && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Your storefront is currently private. Customers won't be able to
						access it until you make it public.
					</AlertDescription>
				</Alert>
			)}

			{/* Action Buttons */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-sm text-gray-600">
					{hasUnsavedChanges ? (
						<>
							<AlertCircle className="h-4 w-4 text-amber-500" />
							You have unsaved changes
						</>
					) : (
						<>
							<CheckCircle className="h-4 w-4 text-green-500" />
							All changes saved
						</>
					)}
				</div>

				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						onClick={() => {
							setHandle(initialConfig?.handle || "");
							setIsPublic(initialConfig?.isPublic ?? true);
						}}
						disabled={!hasUnsavedChanges || isSaving}
					>
						Reset
					</Button>
					<Button
						onClick={handleSave}
						disabled={!canSave}
						className="flex items-center gap-2"
					>
						{isSaving ? (
							<>
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								Saving...
							</>
						) : (
							<>
								<Save className="h-4 w-4" />
								Save Settings
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
