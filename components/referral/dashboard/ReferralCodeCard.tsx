/**
 * Referral Code Card Component
 * Displays referral code and link with copy and share functionality
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

"use client";

import React, { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Copy,
	Check,
	Share2,
	Facebook,
	Twitter,
	MessageCircle,
	Linkedin,
} from "lucide-react";
import { toast } from "sonner";

interface ReferralCodeCardProps {
	referralCode: string;
	baseUrl?: string;
}

/**
 * ReferralCodeCard Component
 * Displays the user's referral code and link with copy and share functionality
 */
export const ReferralCodeCard: React.FC<ReferralCodeCardProps> = ({
	referralCode,
	baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}) => {
	const [codeCopied, setCodeCopied] = useState(false);
	const [linkCopied, setLinkCopied] = useState(false);

	// Generate the full referral link
	// Requirement: use /invite/[code] route for better sharing experience
	const referralLink = `${baseUrl}/invite/${referralCode}`;

	/**
	 * Copy referral code to clipboard
	 * Requirement: 3.3
	 */
	const handleCopyCode = async () => {
		try {
			await navigator.clipboard.writeText(referralCode);
			setCodeCopied(true);
			toast.success("Code copied!", {
				description: "Referral code copied to clipboard",
				duration: 2000,
			});

			// Reset icon after 2 seconds
			setTimeout(() => setCodeCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy code:", error);
			toast.error("Failed to copy", {
				description: "Could not copy code to clipboard",
				duration: 3000,
			});
		}
	};

	/**
	 * Copy referral link to clipboard
	 * Requirement: 3.4
	 */
	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(referralLink);
			setLinkCopied(true);
			toast.success("Link copied!", {
				description: "Referral link copied to clipboard",
				duration: 2000,
			});

			// Reset icon after 2 seconds
			setTimeout(() => setLinkCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy link:", error);
			toast.error("Failed to copy", {
				description: "Could not copy link to clipboard",
				duration: 3000,
			});
		}
	};

	/**
	 * Share to social media platforms
	 * Requirement: 3.5
	 */
	const handleSocialShare = (
		platform: "facebook" | "twitter" | "whatsapp" | "linkedin"
	) => {
		const shareText = `Join me on this amazing platform! Use my referral code: ${referralCode}`;
		const encodedText = encodeURIComponent(shareText);
		const encodedUrl = encodeURIComponent(referralLink);

		let shareUrl = "";

		switch (platform) {
			case "facebook":
				shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
				break;
			case "twitter":
				shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
				break;
			case "whatsapp":
				shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
				break;
			case "linkedin":
				shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
				break;
		}

		// Open share URL in new window
		window.open(shareUrl, "_blank", "width=600,height=400");

		toast.success("Opening share dialog", {
			description: `Sharing to ${
				platform.charAt(0).toUpperCase() + platform.slice(1)
			}`,
			duration: 2000,
		});
	};

	return (
		<Card className="w-full bg-white border-gray-200 shadow-lg">
			<CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 px-4 sm:px-6 py-4 sm:py-6">
				<CardTitle className="flex items-center gap-2 sm:gap-3 text-gray-900 text-base sm:text-lg">
					<div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
						<Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
					</div>
					<span className="truncate">Your Referral Code</span>
				</CardTitle>
				<CardDescription className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">
					Share your unique code or link to start earning rewards
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
				{/* Referral Code Section - Requirement: 3.1, 3.3 */}
				<div className="space-y-2 sm:space-y-3">
					<label className="text-xs sm:text-sm font-semibold text-gray-700">
						Referral Code
					</label>
					<div className="flex items-center gap-2 sm:gap-3">
						<div className="flex-1 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 px-3 sm:px-5 py-3 sm:py-4 font-mono text-lg sm:text-xl md:text-2xl font-bold tracking-wider text-gray-900 shadow-sm break-all sm:break-normal">
							{referralCode}
						</div>
						<Button
							variant="default"
							size="icon"
							onClick={handleCopyCode}
							className="h-[50px] w-[50px] sm:h-[60px] sm:w-[60px] bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md flex-shrink-0"
							aria-label="Copy referral code"
						>
							{codeCopied ? (
								<Check className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
							) : (
								<Copy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
							)}
						</Button>
					</div>
				</div>

				{/* Referral Link and Social Share Section - In one line */}
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
					{/* Referral Link Section - Requirement: 3.2, 3.4 */}
					<div className="flex-1 space-y-2 sm:space-y-3">
						<label className="text-xs sm:text-sm font-semibold text-gray-700">
							Referral Link
						</label>
						<div className="flex items-center gap-2 sm:gap-3">
							<div className="flex-1 overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 px-3 sm:px-5 py-3 sm:py-4 shadow-sm min-w-0">
								<p className="truncate text-xs sm:text-sm font-medium text-gray-700">
									{referralLink}
								</p>
							</div>
							<Button
								variant="outline"
								size="icon"
								onClick={handleCopyLink}
								className="h-[50px] w-[50px] sm:h-[60px] sm:w-[60px] border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 shadow-sm flex-shrink-0"
								aria-label="Copy referral link"
							>
								{linkCopied ? (
									<Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
								) : (
									<Copy className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
								)}
							</Button>
						</div>
					</div>

					{/* Social Share Buttons - Requirement: 3.5 - On the same line */}
					<div className="flex items-end">
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								onClick={() => handleSocialShare("facebook")}
								className="flex items-center h-10 px-3 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 font-medium shadow-sm text-xs"
								aria-label="Share on Facebook"
							>
								<Facebook className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								onClick={() => handleSocialShare("twitter")}
								className="flex items-center h-10 px-3 border-2 border-sky-200 hover:bg-sky-50 hover:border-sky-300 text-sky-600 font-medium shadow-sm text-xs"
								aria-label="Share on Twitter"
							>
								<Twitter className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								onClick={() => handleSocialShare("whatsapp")}
								className="flex items-center h-10 px-3 border-2 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-600 font-medium shadow-sm text-xs"
								aria-label="Share on WhatsApp"
							>
								<MessageCircle className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								onClick={() => handleSocialShare("linkedin")}
								className="flex items-center h-10 px-3 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700 font-medium shadow-sm text-xs"
								aria-label="Share on LinkedIn"
							>
								<Linkedin className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
