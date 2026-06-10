
export type FooterSocialPlatform =
	| "x"
	| "pinterest"
	| "instagram"
	| "linkedin"
	| "tiktok";

export interface FooterSocialLinkItem {
	href: string;
	/** Visible to screen readers */
	label: string;
	platform: FooterSocialPlatform;
}

export const DEFAULT_FOOTER_SOCIAL_LINKS: FooterSocialLinkItem[] = [
	{ href: "https://x.com/stitchesafrica?s=21", label: "X (Twitter)", platform: "x" },
	{ href: "https://www.pinterest.com/mystitchesafrica/", label: "Pinterest", platform: "pinterest" },
	{ href: "https://www.instagram.com/mystitchesafrica?igsh=MTJlbThuc2luNzlnZw%3D%3D&utm_source=qr", label: "Instagram", platform: "instagram" },
	{ href: "https://www.linkedin.com/company/stitches-africa/", label: "LinkedIn", platform: "linkedin" },
	{ href: "https://www.tiktok.com/@stitchesafrica?_r=1&_t=ZS-95aR1eDHapY", label: "TikTok", platform: "tiktok" },
];
