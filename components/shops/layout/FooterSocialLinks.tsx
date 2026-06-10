"use client";

import React from "react";
import {
	DEFAULT_FOOTER_SOCIAL_LINKS,
	type FooterSocialLinkItem,
	type FooterSocialPlatform,
} from "./footerSocialLinksConfig";

const linkClassName =
	"text-gray-500 hover:text-black transition-colors p-2 rounded-full hover:bg-gray-100";

const iconClassName = "w-5 h-5";

/* Inline SVGs — keep viewBox 0 0 24 24 for sizing */
function SocialIcon({ platform }: { platform: FooterSocialPlatform }) {
	switch (platform) {
		case "x":
			return (
				<svg
					className={iconClassName}
					fill="currentColor"
					viewBox="0 0 24 24"
					aria-hidden
				>
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
				</svg>
			);
		case "pinterest":
			return (
				<svg
					className={iconClassName}
					fill="currentColor"
					viewBox="0 0 24 24"
					aria-hidden
				>
					<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
				</svg>
			);
		case "instagram":
			return (
				<svg
					className={iconClassName}
					fill="currentColor"
					viewBox="0 0 24 24"
					aria-hidden
				>
					<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
				</svg>
			);
		case "linkedin":
			return (
				<svg
					className={iconClassName}
					fill="currentColor"
					viewBox="0 0 24 24"
					aria-hidden
				>
					<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
				</svg>
			);
		case "tiktok":
			return (
				<svg
					className={iconClassName}
					fill="currentColor"
					viewBox="0 0 24 24"
					aria-hidden
				>
					<path d="M12.525.02c1.31-.02 2.61-.01 3.831-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48.01 2.96.02 4.44-.9-.24-1.85-.32-2.76-.12-1.12.23-2.17.84-2.85 1.78-.69.98-.84 2.2-.63 3.33.18.94.73 1.82 1.52 2.38.87.63 2.02.81 3.08.52 1.1-.29 2.05-1.03 2.65-2.03.36-.6.54-1.29.54-2v-6.4z" />
				</svg>
			);
		default: {
			const _exhaustive: never = platform;
			return _exhaustive;
		}
	}
}

export interface FooterSocialLinksProps {
	/** Override or extend in the parent; defaults to `DEFAULT_FOOTER_SOCIAL_LINKS` */
	links?: FooterSocialLinkItem[];
	className?: string;
}

export const FooterSocialLinks: React.FC<FooterSocialLinksProps> = ({
	links = DEFAULT_FOOTER_SOCIAL_LINKS,
	className,
}) => {
	return (
		<div
			className={
				className ??
				"flex justify-center sm:justify-start space-x-4"
			}
		>
			{links.map((item, index) => {
				const external =
					item.href.startsWith("http://") || item.href.startsWith("https://");
				return (
					<a
						key={`${item.platform}-${index}`}
						href={item.href}
						className={linkClassName}
						aria-label={item.label}
						{...(external
							? { target: "_blank" as const, rel: "noopener noreferrer" }
							: {})}
					>
						<SocialIcon platform={item.platform} />
					</a>
				);
			})}
		</div>
	);
};
