"use client";

import type React from "react";
import { Toaster } from "sonner";
import { VendorQueryProvider } from "@/lib/vendor/QueryProvider";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { VendorSLAWrapper } from "@/components/vendor/VendorSLAWrapper";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<VendorQueryProvider>
				<Toaster />
				<VendorSLAWrapper>{children}</VendorSLAWrapper>
			</VendorQueryProvider>
		</>
	);
}
