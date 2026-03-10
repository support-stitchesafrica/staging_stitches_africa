"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { CustomerLifetimeValue } from "@/components/vendor/customers/CustomerLifetimeValue";
import { ArrowLeft, Users, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CustomerInsightsService } from "@/lib/vendor/customer-insights-service";
import { CustomerSegment, AnonymizedCustomer, DateRange } from "@/types/vendor-analytics";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function SegmentDetailPage() {
	const router = useRouter();
	const params = useParams();
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [segment, setSegment] = useState<CustomerSegment | null>(null);
	const [customers, setCustomers] = useState<AnonymizedCustomer[]>([]);

	const customerInsightsService = new CustomerInsightsService();
	const segmentType = params.segment as CustomerSegment['type'];

	useEffect(() => {
		if (user?.uid) {
			fetchSegmentData();
		}
	}, [user, segmentType]);

	const fetchSegmentData = async () => {
		if (!user?.uid) return;

		setLoading(true);
		try {
			const dateRange: DateRange = {
				start: new Date(new Date().setDate(new Date().getDate() - 30)),
				end: new Date(),
				preset: '30days'
			};

			const [segmentsResult, customersResult] = await Promise.all([
				customerInsightsService.segmentCustomers(user.uid, dateRange),
				customerInsightsService.getAnonymizedCustomers(user.uid, dateRange)
			]);

			if (segmentsResult.success && segmentsResult.data) {
				const foundSegment = segmentsResult.data.find(s => s.type === segmentType);
				if (foundSegment) {
					setSegment(foundSegment);
				}
			}

			if (customersResult.success && customersResult.data) {
				const filteredCustomers = customersResult.data.filter(c => c.segment === segmentType);
				setCustomers(filteredCustomers);
			}
		} catch (error) {
			console.error('Error fetching segment data:', error);
			toast.error('Failed to load segment data');
		} finally {
			setLoading(false);
		}
	};

	const getSegmentDescription = (type: CustomerSegment['type']) => {
		switch (type) {
			case 'new':
				return 'Customers who have made their first purchase';
			case 'returning':
				return 'Customers who have made 2-4 purchases';
			case 'frequent':
				return 'Customers who have made 5 or more purchases';
			case 'high-value':
				return 'Top 20% of customers by revenue';
			default:
				return '';
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<ModernNavbar />

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<Button
						variant="ghost"
						onClick={() => router.push('/vendor/customers')}
						className="mb-4"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Customer Insights
					</Button>

					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">
								{segmentType} Customers
							</h1>
							<p className="text-gray-600 text-lg">
								{getSegmentDescription(segmentType)}
							</p>
						</div>
					</div>
				</div>

				{loading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						{Array.from({ length: 4 }).map((_, i) => (
							<Card key={i} className="animate-pulse">
								<CardHeader>
									<div className="h-4 bg-gray-200 rounded w-1/2" />
								</CardHeader>
								<CardContent>
									<div className="h-8 bg-gray-200 rounded" />
								</CardContent>
							</Card>
						))}
					</div>
				) : segment ? (
					<>
						{/* Summary Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
							<Card className="border-gray-200">
								<CardHeader className="pb-3">
									<CardDescription className="flex items-center text-gray-600">
										<Users className="h-4 w-4 mr-2" />
										Total Customers
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-gray-900">
										{segment.count.toLocaleString()}
									</div>
									<p className="text-sm text-gray-500 mt-1">
										{segment.percentage.toFixed(1)}% of all customers
									</p>
								</CardContent>
							</Card>

							<Card className="border-gray-200">
								<CardHeader className="pb-3">
									<CardDescription className="flex items-center text-gray-600">
										<DollarSign className="h-4 w-4 mr-2" />
										Total Revenue
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-gray-900">
										${segment.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
									</div>
									<p className="text-sm text-gray-500 mt-1">
										From this segment
									</p>
								</CardContent>
							</Card>

							<Card className="border-gray-200">
								<CardHeader className="pb-3">
									<CardDescription className="flex items-center text-gray-600">
										<ShoppingBag className="h-4 w-4 mr-2" />
										Avg Order Value
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-gray-900">
										${segment.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
									</div>
									<p className="text-sm text-gray-500 mt-1">
										Per order
									</p>
								</CardContent>
							</Card>

							<Card className="border-gray-200">
								<CardHeader className="pb-3">
									<CardDescription className="flex items-center text-gray-600">
										<TrendingUp className="h-4 w-4 mr-2" />
										Purchase Frequency
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-gray-900">
										{segment.averagePurchaseFrequency.toFixed(1)}
									</div>
									<p className="text-sm text-gray-500 mt-1">
										Orders per customer
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Customer Lifetime Value Analysis */}
						<Card className="border-gray-200">
							<CardHeader>
								<CardTitle>Customer Lifetime Value Analysis</CardTitle>
								<CardDescription>
									Detailed breakdown of customer value in this segment
								</CardDescription>
							</CardHeader>
							<CardContent>
								<CustomerLifetimeValue
									segment={segment}
									customers={customers}
								/>
							</CardContent>
						</Card>

						{/* Customer List */}
						<Card className="border-gray-200 mt-6">
							<CardHeader>
								<CardTitle>Customers in this Segment</CardTitle>
								<CardDescription>
									Anonymized customer data (showing first 50)
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-gray-200">
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer ID</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Location</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Orders</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Lifetime Value</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Avg Order</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Purchase</th>
											</tr>
										</thead>
										<tbody>
											{customers.slice(0, 50).map((customer) => (
												<tr key={customer.customerId} className="border-b border-gray-100 hover:bg-gray-50">
													<td className="py-3 px-4 text-sm text-gray-900 font-mono">
														{customer.customerId.substring(0, 8)}...
													</td>
													<td className="py-3 px-4 text-sm text-gray-600">
														{customer.location.city}, {customer.location.state}
													</td>
													<td className="py-3 px-4 text-sm text-gray-900 text-right">
														{customer.orderCount}
													</td>
													<td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
														${customer.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
													</td>
													<td className="py-3 px-4 text-sm text-gray-600 text-right">
														${customer.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
													</td>
													<td className="py-3 px-4 text-sm text-gray-600">
														{new Date(customer.lastPurchaseDate).toLocaleDateString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
									{customers.length === 0 && (
										<div className="text-center py-12 text-gray-500">
											No customers in this segment yet
										</div>
									)}
									{customers.length > 50 && (
										<div className="text-center py-4 text-sm text-gray-500">
											Showing 50 of {customers.length} customers
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</>
				) : (
					<Card className="border-gray-200">
						<CardContent className="p-12 text-center">
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Segment not found
							</h3>
							<p className="text-gray-600 mb-6">
								The requested customer segment could not be found
							</p>
							<Button onClick={() => router.push('/vendor/customers')}>
								Back to Customer Insights
							</Button>
						</CardContent>
					</Card>
				)}
			</main>
		</div>
	);
}
