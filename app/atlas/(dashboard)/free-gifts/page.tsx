"use client";

import { FreeGiftAnalytics } from "@/components/marketing/analytics/FreeGiftAnalytics";
import { RegionalAnalytics } from "@/components/atlas/free-gifts/RegionalAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FreeGiftAnalyticsPage() {
	return (
		<div className="space-y-6 page-transition">
			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="regional">Regional Analytics</TabsTrigger>
				</TabsList>
				
				<TabsContent value="overview" className="space-y-6">
					<FreeGiftAnalytics />
				</TabsContent>
				
				<TabsContent value="regional" className="space-y-6">
					<RegionalAnalytics />
				</TabsContent>
			</Tabs>
		</div>
	);
}
