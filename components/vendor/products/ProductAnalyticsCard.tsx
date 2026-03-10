"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductAnalytics } from "@/types/vendor-analytics";
import {
	Eye,
	ShoppingCart,
	TrendingUp,
	Star,
	Package,
	AlertTriangle,
	ArrowUpRight,
	ArrowDownRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatUSD } from "@/lib/utils/currency";

interface ProductAnalyticsCardProps {
	product: ProductAnalytics;
}

export function ProductAnalyticsCard({ product }: ProductAnalyticsCardProps) {
	const router = useRouter();

	const formatPercentage = (value: number) => {
		return `${value.toFixed(1)}%`;
	};

	const getTrendIcon = (change: number) => {
		if (change > 0) return <ArrowUpRight className="h-3 w-3" />;
		if (change < 0) return <ArrowDownRight className="h-3 w-3" />;
		return null;
	};

	const getTrendColor = (change: number) => {
		if (change > 0) return "text-emerald-600";
		if (change < 0) return "text-red-600";
		return "text-gray-600";
	};

	const getStockStatus = () => {
		if (product.stockLevel === 0) {
			return {
				label: "Out of Stock",
				color: "bg-red-50 text-red-700 border-red-200",
			};
		}
		if (product.stockLevel < 10) {
			return {
				label: "Low Stock",
				color: "bg-amber-50 text-amber-700 border-amber-200",
			};
		}
		return {
			label: "In Stock",
			color: "bg-emerald-50 text-emerald-700 border-emerald-200",
		};
	};

	const stockStatus = getStockStatus();

	function truncateWords(text: string, count: number) {
		return text.split(" ").slice(0, count).join(" ");
	}

	return (
		<Card className="border-gray-200 hover:shadow-lg transition-all duration-200 group">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<CardTitle className="text-base font-semibold text-gray-900 truncate mb-2">
							{truncateWords(product.title, 6)}
						</CardTitle>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline" className="text-xs">
								{product.category}
							</Badge>
							<Badge className={stockStatus.color}>{stockStatus.label}</Badge>
							{product.isTrending && (
								<Badge className="bg-purple-50 text-purple-700 border-purple-200">
									<TrendingUp className="h-3 w-3 mr-1" />
									Trending
								</Badge>
							)}
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push(`/vendor/products/${product.productId}`)}
						className="opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<Eye className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Key Metrics Grid */}
				<div className="grid grid-cols-2 gap-3">
					{/* Views */}
					<div className="p-3 bg-gray-50 rounded-lg">
						<div className="flex items-center gap-2 mb-1">
							<Eye className="h-4 w-4 text-gray-600" />
							<span className="text-xs text-gray-600">Views</span>
						</div>
						<div className="flex items-baseline gap-2">
							<p className="text-lg font-bold text-gray-900">
								{product.views.toLocaleString()}
							</p>
							{product.viewsChange !== 0 && (
								<div
									className={`flex items-center text-xs ${getTrendColor(
										product.viewsChange
									)}`}
								>
									{getTrendIcon(product.viewsChange)}
									<span>{Math.abs(product.viewsChange).toFixed(0)}%</span>
								</div>
							)}
						</div>
					</div>

					{/* Sales */}
					<div className="p-3 bg-gray-50 rounded-lg">
						<div className="flex items-center gap-2 mb-1">
							<ShoppingCart className="h-4 w-4 text-gray-600" />
							<span className="text-xs text-gray-600">Sales</span>
						</div>
						<p className="text-lg font-bold text-gray-900">
							{product.salesCount.toLocaleString()}
						</p>
					</div>

					{/* Add to Cart Rate */}
					<div className="p-3 bg-gray-50 rounded-lg">
						<div className="flex items-center gap-2 mb-1">
							<Package className="h-4 w-4 text-gray-600" />
							<span className="text-xs text-gray-600">Add to Cart</span>
						</div>
						<p className="text-lg font-bold text-gray-900">
							{formatPercentage(product.addToCartRate * 100)}
						</p>
					</div>

					{/* Conversion Rate */}
					<div className="p-3 bg-gray-50 rounded-lg">
						<div className="flex items-center gap-2 mb-1">
							<TrendingUp className="h-4 w-4 text-gray-600" />
							<span className="text-xs text-gray-600">Conversion</span>
						</div>
						<p className="text-lg font-bold text-gray-900">
							{formatPercentage(product.conversionRate * 100)}
						</p>
					</div>
				</div>

				{/* Revenue and Rating */}
				<div className="flex items-center justify-between pt-3 border-t border-gray-200">
					<div>
						<p className="text-xs text-gray-600 mb-1">Revenue</p>
						<p className="text-xl font-bold text-emerald-600">
							{formatUSD(product.revenue)}
						</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-gray-600 mb-1">Rating</p>
						<div className="flex items-center gap-1">
							<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
							<span className="text-lg font-bold text-gray-900">
								{product.averageRating.toFixed(1)}
							</span>
							<span className="text-xs text-gray-600">
								({product.reviewCount})
							</span>
						</div>
					</div>
				</div>

				{/* Stock Level */}
				<div className="flex items-center justify-between pt-3 border-t border-gray-200">
					<div className="flex items-center gap-2">
						<Package className="h-4 w-4 text-gray-600" />
						<span className="text-sm text-gray-600">Stock Level</span>
					</div>
					<div className="flex items-center gap-2">
						{product.stockLevel < 10 && product.stockLevel > 0 && (
							<AlertTriangle className="h-4 w-4 text-amber-600" />
						)}
						<span className="text-sm font-semibold text-gray-900">
							{product.stockLevel} units
						</span>
					</div>
				</div>

				{/* View Details Button */}
				<Button
					variant="outline"
					className="w-full"
					onClick={() =>
						router.push(`/vendor/products/${product.productId}/analytics`)
					}
				>
					View Full Analytics
				</Button>
			</CardContent>
		</Card>
	);
}
