"use client";

import React, {  useMemo, useState, useEffect , memo } from "react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { Package, TrendingUp, Weight, Scale } from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
	getWeightAnalytics,
	getShipmentsByRegion,
	getTopDestinations,
	formatWeight,
	type WeightAnalytics,
	type ShipmentByRegion,
	type TopDestination,
} from "@/services/logisticsAnalytics";

const LogisticsDashboard = () => {
	const { dateRange } = useDateRange();
	const [loading, setLoading] = useState(true);
	const [weightAnalytics, setWeightAnalytics] = useState<WeightAnalytics>({
		totalWeight: 0,
		averageWeight: 0,
		largestWeight: 0,
		smallestWeight: 0,
		shipmentsWithWeight: 0,
		totalShipments: 0,
	});
	const [shipmentsByRegion, setShipmentsByRegion] = useState<
		ShipmentByRegion[]
	>([]);
	const [topDestinationsData, setTopDestinationsData] = useState<
		TopDestination[]
	>([]);

	// Fetch logistics analytics from Firebase
	useEffect(() => {
		const fetchAnalytics = async () => {
			setLoading(true);
			try {
				// Fetch all analytics data in parallel
				const [weights, regions, destinations] = await Promise.all([
					getWeightAnalytics(dateRange.start, dateRange.end),
					getShipmentsByRegion(dateRange.start, dateRange.end),
					getTopDestinations(10, true, dateRange.start, dateRange.end), // Only delivered orders
				]);

				setWeightAnalytics(weights);
				setShipmentsByRegion(regions);
				setTopDestinationsData(destinations);
			} catch (error) {
				console.error("Error fetching logistics analytics:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchAnalytics();
	}, [dateRange]); // Re-fetch when date range changes

	// Calculate number of days in the selected range
	const daysDiff = useMemo(() => {
		return (
			Math.ceil(
				(dateRange.end.getTime() - dateRange.start.getTime()) /
					(1000 * 60 * 60 * 24)
			) + 1
		);
	}, [dateRange]);

	// Generate data based on the selected date range
	const activeUsersData = useMemo(() => {
		return Array.from({ length: daysDiff }, (_, i) => ({
			day: i + 1,
			users: Math.floor(50 + i * 4 + Math.random() * 15),
		}));
	}, [daysDiff]);

	// Transform shipments data for bar chart
	const shipmentData = useMemo(() => {
		return shipmentsByRegion.map((region) => ({
			region: region.country,
			count: region.shipment_count,
		}));
	}, [shipmentsByRegion]);

	// Transform top destinations for list
	const topDestinations = useMemo(() => {
		return topDestinationsData.map((dest) => ({
			name: dest.location,
			value: dest.shipment_count.toString(),
			weight: dest.total_weight,
		}));
	}, [topDestinationsData]);

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Metrics Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				<MetricCardGA
					label="Total Weight Shipped"
					value={
						loading ? "Loading..." : formatWeight(weightAnalytics.totalWeight)
					}
					change={12.5}
					trend="up"
					icon={<Package className="w-5 h-5" />}
					isLoading={loading}
				/>
				<MetricCardGA
					label="Largest Weight (Single Shipping)"
					value={
						loading ? "Loading..." : formatWeight(weightAnalytics.largestWeight)
					}
					change={5.2}
					trend="up"
					icon={<TrendingUp className="w-5 h-5" />}
					isLoading={loading}
				/>
				<MetricCardGA
					label="Smallest Weight (Single Shipping)"
					value={
						loading
							? "Loading..."
							: formatWeight(weightAnalytics.smallestWeight)
					}
					change={-2.1}
					trend="down"
					icon={<Scale className="w-5 h-5" />}
					isLoading={loading}
				/>
				<MetricCardGA
					label="Average Weight"
					value={
						loading ? "Loading..." : formatWeight(weightAnalytics.averageWeight)
					}
					change={3.4}
					trend="up"
					icon={<Weight className="w-5 h-5" />}
					isLoading={loading}
				/>
			</div>

			{/* Charts Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Active Users Chart */}
				<ChartCard
					title="Active Users (Daily)"
					subtitle="Daily active user trends over the last 30 days"
					height={320}
				>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={activeUsersData}>
							<defs>
								<linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="rgb(var(--ga-primary-blue))"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="rgb(var(--ga-primary-blue))"
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="hsl(var(--ga-border))"
							/>
							<XAxis
								dataKey="day"
								stroke="hsl(var(--ga-text-secondary))"
								style={{ fontSize: "12px" }}
							/>
							<YAxis
								stroke="hsl(var(--ga-text-secondary))"
								style={{ fontSize: "12px" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--ga-background))",
									border: "1px solid hsl(var(--ga-border))",
									borderRadius: "8px",
									boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
								}}
								labelStyle={{ color: "hsl(var(--ga-text-primary))" }}
							/>
							<Line
								type="monotone"
								dataKey="users"
								stroke="rgb(var(--ga-primary-blue))"
								strokeWidth={2}
								dot={false}
								fill="url(#colorUsers)"
								fillOpacity={1}
							/>
						</LineChart>
					</ResponsiveContainer>
				</ChartCard>

				{/* Shipment Count by Region Chart */}
				<ChartCard
					title="Shipment Count by Region"
					subtitle="Distribution of delivered shipments across regions"
					height={320}
				>
					{loading || shipmentData.length === 0 ? (
						<div className="h-full flex items-center justify-center">
							<p className="text-muted-foreground">
								{loading
									? "Loading shipment data..."
									: "No shipment data available"}
							</p>
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={shipmentData}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="hsl(var(--ga-border))"
								/>
								<XAxis
									dataKey="region"
									stroke="hsl(var(--ga-text-secondary))"
									angle={-45}
									textAnchor="end"
									height={100}
									style={{ fontSize: "11px" }}
								/>
								<YAxis
									stroke="hsl(var(--ga-text-secondary))"
									style={{ fontSize: "12px" }}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "hsl(var(--ga-background))",
										border: "1px solid hsl(var(--ga-border))",
										borderRadius: "8px",
										boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
									}}
									labelStyle={{ color: "hsl(var(--ga-text-primary))" }}
								/>
								<Bar
									dataKey="count"
									fill="rgb(var(--ga-primary-blue))"
									radius={[8, 8, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					)}
				</ChartCard>
			</div>

			{/* Top Destinations Card */}
			<ChartCard
				title="Top Destinations"
				subtitle="Most popular shipping destinations"
			>
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<p className="text-muted-foreground">Loading destinations...</p>
					</div>
				) : topDestinations.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<p className="text-muted-foreground">
							No destination data available
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{topDestinations.map((destination, index) => (
							<div
								key={destination.name}
								className="flex items-center justify-between p-3 rounded-lg hover:bg-ga-surface transition-ga-base"
							>
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<span className="text-sm font-semibold text-ga-secondary w-6 flex-shrink-0">
										{index + 1}
									</span>
									<span
										className="text-sm font-medium text-ga-primary truncate"
										title={destination.name}
									>
										{destination.name}
									</span>
								</div>
								<div className="flex flex-col items-end flex-shrink-0 ml-2">
									<span className="text-sm font-semibold text-ga-primary tabular-nums whitespace-nowrap">
										{destination.value} shipments
									</span>
									{destination.weight > 0 && (
										<span className="text-xs text-muted-foreground">
											{formatWeight(destination.weight)}
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</ChartCard>
		</div>
	);
};

export default memo(LogisticsDashboard);
