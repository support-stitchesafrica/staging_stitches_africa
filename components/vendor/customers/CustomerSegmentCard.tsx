"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CustomerSegment } from "@/types/vendor-analytics";
import { Users, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatUSD } from "@/lib/utils/currency";

interface CustomerSegmentCardProps {
	segment: CustomerSegment;
}

export function CustomerSegmentCard({ segment }: CustomerSegmentCardProps) {
	const router = useRouter();

	const getSegmentColor = (type: CustomerSegment['type']) => {
		switch (type) {
			case 'new':
				return 'bg-blue-50 border-blue-200 hover:border-blue-300';
			case 'returning':
				return 'bg-green-50 border-green-200 hover:border-green-300';
			case 'frequent':
				return 'bg-purple-50 border-purple-200 hover:border-purple-300';
			case 'high-value':
				return 'bg-amber-50 border-amber-200 hover:border-amber-300';
			default:
				return 'bg-gray-50 border-gray-200 hover:border-gray-300';
		}
	};

	const getSegmentIcon = (type: CustomerSegment['type']) => {
		switch (type) {
			case 'new':
				return <Users className="h-5 w-5 text-blue-600" />;
			case 'returning':
				return <TrendingUp className="h-5 w-5 text-green-600" />;
			case 'frequent':
				return <ShoppingBag className="h-5 w-5 text-purple-600" />;
			case 'high-value':
				return <DollarSign className="h-5 w-5 text-amber-600" />;
			default:
				return <Users className="h-5 w-5 text-gray-600" />;
		}
	};

	const getSegmentTextColor = (type: CustomerSegment['type']) => {
		switch (type) {
			case 'new':
				return 'text-blue-900';
			case 'returning':
				return 'text-green-900';
			case 'frequent':
				return 'text-purple-900';
			case 'high-value':
				return 'text-amber-900';
			default:
				return 'text-gray-900';
		}
	};

	return (
		<Card
			className={`${getSegmentColor(segment.type)} cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95`}
			onClick={() => router.push(`/vendor/customers/segments/${segment.type}`)}
		>
			<CardContent className="p-4 sm:p-6">
				<div className="flex items-start justify-between mb-3 sm:mb-4">
					<div className="flex items-center space-x-2 sm:space-x-3">
						{getSegmentIcon(segment.type)}
						<div>
							<h3 className={`text-sm sm:text-base font-semibold capitalize ${getSegmentTextColor(segment.type)}`}>
								{segment.type}
							</h3>
							<p className="text-xs sm:text-sm text-gray-600">
								{segment.percentage.toFixed(1)}% of total
							</p>
						</div>
					</div>
				</div>

				<div className="space-y-2 sm:space-y-3">
					<div>
						<p className="text-xl sm:text-2xl font-bold text-gray-900">
							{segment.count.toLocaleString()}
						</p>
						<p className="text-xs text-gray-600">Customers</p>
					</div>

					<div className="pt-2 sm:pt-3 border-t border-gray-200 space-y-1.5 sm:space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-xs text-gray-600">Total Revenue</span>
							<span className="text-xs sm:text-sm font-semibold text-gray-900">
								{formatUSD(segment.totalRevenue)}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-xs text-gray-600">Avg Order Value</span>
							<span className="text-xs sm:text-sm font-medium text-gray-700">
								{formatUSD(segment.averageOrderValue)}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-xs text-gray-600">Purchase Frequency</span>
							<span className="text-xs sm:text-sm font-medium text-gray-700">
								{segment.averagePurchaseFrequency.toFixed(1)}x
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
