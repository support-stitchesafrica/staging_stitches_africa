/**
 * Storefront Layout
 * Layout wrapper for individual vendor storefronts
 *
 * Validates: Requirements 1.4, 7.1
 */

import { ReactNode } from "react";
import { StorefrontCartProvider } from "@/contexts/StorefrontCartContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { Toaster } from "sonner";

interface StorefrontLayoutProps {
	children: ReactNode;
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
	return (
		<LanguageProvider>
			<WishlistProvider>
				<StorefrontCartProvider>
					<div className="storefront-layout">{children}</div>
					<Toaster position="top-right" richColors />
				</StorefrontCartProvider>
			</WishlistProvider>
		</LanguageProvider>
	);
}
