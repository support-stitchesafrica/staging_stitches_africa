import type { Metadata } from "next";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import { ConditionalLayout } from "@/components/shops/layout/ConditionalLayout";
import { Toaster } from "sonner";
import { ChatWidget } from "@/components/ai-assistant/ChatWidget";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ConsultationWidgetProvider } from "@/contexts/ConsultationWidgetContext";

import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
	title: "Stitches Africa - Premium Fashion & Bespoke Tailoring",
	description:
		"Discover luxury African fashion with our curated collection of bespoke and ready-to-wear pieces from the continent's finest designers and tailors.",
};

export default function ShopsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<LanguageProvider>
			<WishlistProvider>
				<ConsultationWidgetProvider>
					<MobileMenuProvider>
						<ConditionalLayout>{children}</ConditionalLayout>
					</MobileMenuProvider>
					<ChatWidget />
					<Toaster position="top-right" richColors />
				</ConsultationWidgetProvider>
			</WishlistProvider>
		</LanguageProvider>
	);
}
