"use client";

import { LocationData } from "@/types/vendor-analytics";
import { MapPin } from "lucide-react";
import { formatUSD } from "@/lib/utils/currency";

interface LocationHeatmapProps {
	locations: LocationData[];
	showDetails?: boolean;
}

export function LocationHeatmap({ locations, showDetails = false }: LocationHeatmapProps) {
	if (locations.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
				<p>No location data available</p>
			</div>
		);
	}

	const maxRevenue = Math.max(...locations.map(l => l.revenue));

	const getBarWidth = (revenue: number) => {
		return (revenue / maxRevenue) * 100;
	};

	const getBarColor = (percentage: number) => {
		if (percentage >= 75) return 'bg-emerald-500';
		if (percentage >= 50) return 'bg-blue-500';
		if (percentage >= 25) return 'bg-amber-500';
		return 'bg-gray-400';
	};

	return (
		<div className="space-y-4">
			{showDetails ? (
				// Detailed view with full information
				<div className="space-y-3">
					{locations.map((location, index) => {
						const barWidth = getBarWidth(location.revenue);
						const barColor = getBarColor(barWidth);

						return (
							<div key={`${location.city}-${location.state}-${index}`} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<MapPin className="h-4 w-4 text-gray-400" />
										<span className="font-medium text-gray-900">
											{location.city}, {location.state}
										</span>
									</div>
									<div className="text-right">
										<p className="text-sm font-semibold text-gray-900">
											{formatUSD(location.revenue)}
										</p>
										<p className="text-xs text-gray-500">
											{location.customerCount} customer{location.customerCount !== 1 ? 's' : ''}
										</p>
									</div>
								</div>
								<div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
									<div
										className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-500 flex items-center justify-end pr-3`}
										style={{ width: `${barWidth}%` }}
									>
										<span className="text-xs font-medium text-white">
											{location.percentage.toFixed(1)}%
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				// Compact view for overview
				<div className="space-y-2">
					{locations.map((location, index) => {
						const barWidth = getBarWidth(location.revenue);
						const barColor = getBarColor(barWidth);

						return (
							<div key={`${location.city}-${location.state}-${index}`} className="flex items-center space-x-3">
								<div className="w-32 flex-shrink-0">
									<p className="text-sm font-medium text-gray-900 truncate">
										{location.city}
									</p>
									<p className="text-xs text-gray-500">{location.state}</p>
								</div>
								<div className="flex-1">
									<div className="relative h-6 bg-gray-100 rounded overflow-hidden">
										<div
											className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-500`}
											style={{ width: `${barWidth}%` }}
										/>
									</div>
								</div>
								<div className="w-24 flex-shrink-0 text-right">
									<p className="text-sm font-medium text-gray-900">
										{formatUSD(location.revenue)}
									</p>
									<p className="text-xs text-gray-500">
										{location.customerCount} cust.
									</p>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Legend */}
			<div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200">
				<div className="flex items-center space-x-2">
					<div className="w-4 h-4 bg-emerald-500 rounded" />
					<span className="text-xs text-gray-600">High (75%+)</span>
				</div>
				<div className="flex items-center space-x-2">
					<div className="w-4 h-4 bg-blue-500 rounded" />
					<span className="text-xs text-gray-600">Medium (50-75%)</span>
				</div>
				<div className="flex items-center space-x-2">
					<div className="w-4 h-4 bg-amber-500 rounded" />
					<span className="text-xs text-gray-600">Low (25-50%)</span>
				</div>
				<div className="flex items-center space-x-2">
					<div className="w-4 h-4 bg-gray-400 rounded" />
					<span className="text-xs text-gray-600">Minimal (&lt;25%)</span>
				</div>
			</div>
		</div>
	);
}
