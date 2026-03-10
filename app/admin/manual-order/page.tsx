"use client";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { ManualOrderProcessor } from "@/components/admin/ManualOrderProcessor";

export default function ManualOrderPage() {
	return (
		<SidebarLayout
			pageTitle="Manual Order Processing"
			pageDescription="Admin tool to manually retry or create orders."
		>
			<div className="max-w-5xl mx-auto py-8">
				<ManualOrderProcessor />
			</div>
		</SidebarLayout>
	);
}
