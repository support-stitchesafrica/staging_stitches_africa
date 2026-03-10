"use client";

import { useState, useEffect } from "react";
import {
	getFreeGiftStats,
	getRecentFreeGiftClaims,
	type FreeGiftStats,
} from "@/services/freeGiftAnalytics";
import { FreeGiftClaim } from "@/types"; // Ensure this type exists in your types/index.ts
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Gift, Truck, MapPin, Eye, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "date-fns";
import { useRouter } from "next/navigation";

export function FreeGiftAnalytics() {
	const router = useRouter();
	const [stats, setStats] = useState<FreeGiftStats>({
		totalRequested: 0,
		totalDelivered: 0,
		byCountry: {},
		byState: {},
	});
	const [recentClaims, setRecentClaims] = useState<FreeGiftClaim[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const [statsData, claimsData] = await Promise.all([
					getFreeGiftStats(),
					getRecentFreeGiftClaims(10),
				]);
				setStats(statsData);
				setRecentClaims(claimsData);
			} catch (error) {
				console.error("Failed to load free gift analytics:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// Prepare data for the location chart (Top 5 States)
	const locationData = Object.entries(stats.byState)
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value)
		.slice(0, 5);

	const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#F59E0B"];
	const countryColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

	// Prepare data for the country chart
	const countryData = Object.entries(stats.byCountry)
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value)
		.slice(0, 5);

	// Handle chart clicks
	const handleLocationClick = (data: any) => {
		if (data && data.activePayload && data.activePayload[0]) {
			const stateName = data.activePayload[0].payload.name;
			router.push(`/atlas/free-gifts/claims?state=${encodeURIComponent(stateName)}`);
		}
	};

	const handleCountryClick = (data: any) => {
		if (data && data.activePayload && data.activePayload[0]) {
			const countryName = data.activePayload[0].payload.name;
			router.push(`/atlas/free-gifts/claims?country=${encodeURIComponent(countryName)}`);
		}
	};

	return (
		<div className="space-y-6 mb-8">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
						<Gift className="w-6 h-6 text-pink-500" />
						Free Gift Analytics
					</h2>
					<p className="text-gray-500 text-sm mt-1">
						Tracking campaign performance and fulfillment
					</p>
				</div>
			</div>

			{/* Metrics Row */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
				<MetricCardGA
					label="Total Requested"
					value={stats.totalRequested}
					change={0}
					trend="neutral"
					icon={<Gift className="w-5 h-5" />}
					isLoading={loading}
					format="number"
				/>
				<MetricCardGA
					label="Total Delivered"
					value={stats.totalDelivered}
					change={0}
					trend="neutral"
					icon={<Truck className="w-5 h-5" />}
					isLoading={loading}
					format="number"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Location Chart */}
				<div className="lg:col-span-1">
					<ChartCard title="Claims by Location (Top 5 States)" height={400}>
						{loading ? (
							<div className="h-full flex items-center justify-center text-gray-400">
								Loading...
							</div>
						) : locationData.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={locationData}
									layout="vertical"
									margin={{ left: 40 }}
									onClick={handleLocationClick}
									style={{ cursor: 'pointer' }}
								>
									<CartesianGrid strokeDasharray="3 3" horizontal={false} />
									<XAxis type="number" hide />
									<YAxis
										dataKey="name"
										type="category"
										width={100}
										tick={{ fontSize: 12 }}
									/>
									<Tooltip
										cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
										contentStyle={{
											borderRadius: "8px",
											border: "none",
											boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
										}}
										content={({ active, payload, label }) => {
											if (active && payload && payload.length) {
												return (
													<div className="bg-white p-3 border rounded-lg shadow-lg">
														<p className="font-medium">{label}</p>
														<p className="text-blue-600">
															Claims: {payload[0].value}
														</p>
														<p className="text-xs text-gray-500 mt-1">
															Click to view details
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
									<Bar dataKey="value" radius={[0, 4, 4, 0]}>
										{locationData.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={colors[index % colors.length]}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="h-full flex items-center justify-center text-gray-400">
								No location data available
							</div>
						)}
					</ChartCard>
				</div>

				{/* Country Chart */}
				<div className="lg:col-span-1">
					<ChartCard title="Claims by Country" height={400}>
						{loading ? (
							<div className="h-full flex items-center justify-center text-gray-400">
								Loading...
							</div>
						) : countryData.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={countryData}
									layout="vertical"
									margin={{ left: 40 }}
									onClick={handleCountryClick}
									style={{ cursor: 'pointer' }}
								>
									<CartesianGrid strokeDasharray="3 3" horizontal={false} />
									<XAxis type="number" hide />
									<YAxis
										dataKey="name"
										type="category"
										width={100}
										tick={{ fontSize: 12 }}
									/>
									<Tooltip
										cursor={{ fill: "rgba(16, 185, 129, 0.1)" }}
										contentStyle={{
											borderRadius: "8px",
											border: "none",
											boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
										}}
										content={({ active, payload, label }) => {
											if (active && payload && payload.length) {
												return (
													<div className="bg-white p-3 border rounded-lg shadow-lg">
														<p className="font-medium">{label}</p>
														<p className="text-green-600">
															Claims: {payload[0].value}
														</p>
														<p className="text-xs text-gray-500 mt-1">
															Click to view details
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
									<Bar dataKey="value" radius={[0, 4, 4, 0]}>
										{countryData.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={countryColors[index % countryColors.length]}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="h-full flex items-center justify-center text-gray-400">
								No country data available
							</div>
						)}
					</ChartCard>
				</div>

				{/* Recent Claims Table */}
				<div className="lg:col-span-1">
					<div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
						<div className="p-6 border-b flex justify-between items-center">
							<h3 className="font-semibold text-gray-900">Recent Claims</h3>
							<Button
								variant="ghost"
								size="sm"
								className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
								onClick={() => router.push("/atlas/free-gifts/claims")}
							>
								View All <ArrowRight className="w-4 h-4 ml-1" />
							</Button>
						</div>

						<div className="p-0 overflow-auto flex-1">
							<Table>
								<TableHeader>
									<TableRow className="bg-gray-50/50">
										<TableHead>User</TableHead>
										<TableHead>Location</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-center py-8 text-gray-500"
											>
												Loading claims...
											</TableCell>
										</TableRow>
									) : recentClaims.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-center py-8 text-gray-500"
											>
												No claims found
											</TableCell>
										</TableRow>
									) : (
										recentClaims.map((claim) => (
											<TableRow key={claim.id || Math.random()}>
												<TableCell>
													<div className="font-medium text-gray-900">
														{claim.firstName} {claim.lastName}
													</div>
													<div className="text-xs text-gray-500">
														{claim.email}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1 text-sm text-gray-600">
														<MapPin className="w-3 h-3 text-gray-400" />
														{claim.city}, {claim.state}
													</div>
												</TableCell>
												<TableCell className="text-sm text-gray-600">
													{claim.createdAt
														? formatDate(
																new Date(claim.createdAt),
																"MMM d, yyyy"
														  )
														: "N/A"}
												</TableCell>
												<TableCell>
													<Badge
														variant="secondary"
														className={
															claim.status === "shipped"
																? "bg-green-100 text-green-700 hover:bg-green-200 border-transparent"
																: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-transparent"
														}
													>
														{claim.status === "shipped"
															? "Delivered"
															: "Requested"}
													</Badge>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
