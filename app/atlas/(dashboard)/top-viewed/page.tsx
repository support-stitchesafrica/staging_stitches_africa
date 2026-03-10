"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { useDateRange } from "@/contexts/DateRangeContext";
import { ChartCard } from "@/components/analytics/ChartCard";
import { getTopViewedProducts, type ProductViewData } from "@/services/productAnalytics";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

interface ProductWithVendor extends ProductViewData {
	vendorBrandName?: string;
}

const TopViewedPage = () => {
	const router = useRouter();
	const { dateRange, setDateRange, setComparisonEnabled } = useDateRange();
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [topProducts, setTopProducts] = useState<ProductWithVendor[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				// Fetch all products (use a large limit like 1000)
				const products = await getTopViewedProducts(
					1000,
					dateRange.start,
					dateRange.end
				);

				// Fetch tailor brand names for each product
				const productsWithVendors = await Promise.all(
					products.map(async (product) => {
						if (!product.tailor_id) {
							return { ...product, vendorBrandName: product.vendor_name || "N/A" };
						}

						try {
							const tailorDoc = await getDoc(doc(db, "tailors", product.tailor_id));
							if (tailorDoc.exists()) {
								const tailorData = tailorDoc.data();
								const brandName = tailorData.brandName || tailorData.brand_name || product.vendor_name || "N/A";
								return { ...product, vendorBrandName: brandName };
							}
						} catch (error) {
							console.error(`Error fetching tailor ${product.tailor_id}:`, error);
						}

						return { ...product, vendorBrandName: product.vendor_name || "N/A" };
					})
				);

				setTopProducts(productsWithVendors);
			} catch (error) {
				console.error("Error fetching top viewed products:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, [dateRange]);

	const handleLogout = () => {
		router.push("/atlas/auth");
	};

	return (
		<div className="space-y-6 page-transition">
			<AnalyticsHeader
				title="Top Viewed Items"
				subtitle="All products sorted by view count"
				dateRange={dateRange}
				onDateRangeClick={() => setShowDatePicker(!showDatePicker)}
				onLogout={handleLogout}
			/>

			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.push("/atlas")}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Dashboard
				</Button>
			</div>

			{showDatePicker && (
				<div className="flex justify-end">
					<DateRangePicker
						value={dateRange}
						onChange={(range) => {
							setDateRange(range);
							setShowDatePicker(false);
						}}
						showComparison={true}
						onComparisonToggle={setComparisonEnabled}
					/>
				</div>
			)}

			<ChartCard title={`All Viewed Items (${topProducts.length})`}>
				<div className="space-y-2 max-h-[600px] overflow-y-auto">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
							<span className="ml-2 text-muted-foreground">
								Loading products...
							</span>
						</div>
					) : topProducts.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<p className="text-muted-foreground">No product views yet</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="text-left p-3 text-sm font-semibold text-ga-primary">
											#
										</th>
										<th className="text-left p-3 text-sm font-semibold text-ga-primary">
											Product Title
										</th>
										<th className="text-left p-3 text-sm font-semibold text-ga-primary hidden md:table-cell">
											Vendor
										</th>
										<th className="text-left p-3 text-sm font-semibold text-ga-primary hidden lg:table-cell">
											Category
										</th>
										<th className="text-right p-3 text-sm font-semibold text-ga-primary">
											Total Views
										</th>
									</tr>
								</thead>
								<tbody>
									{topProducts.map((item, index) => (
										<tr
											key={item.product_id}
											className={`
                        border-b transition-colors hover:bg-ga-surface
                        ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
                      `}
										>
											<td className="p-3 text-sm text-ga-secondary font-medium">
												{index + 1}
											</td>
											<td className="p-3">
												<div className="flex-1 min-w-0">
													<span className="text-sm font-medium text-ga-primary block truncate">
														{item.product_title}
													</span>
													{item.vendorBrandName && (
														<span className="text-xs text-muted-foreground md:hidden">
															{item.vendorBrandName}
														</span>
													)}
												</div>
											</td>
											<td className="p-3 text-sm text-ga-secondary hidden md:table-cell">
												{item.vendorBrandName || "N/A"}
											</td>
											<td className="p-3 text-sm text-ga-secondary hidden lg:table-cell">
												{item.category || "N/A"}
											</td>
											<td className="p-3 text-sm text-ga-secondary font-semibold text-right">
												{item.total_views.toLocaleString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</ChartCard>
		</div>
	);
};

export default TopViewedPage;

