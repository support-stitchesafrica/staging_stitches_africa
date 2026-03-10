"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export type MetricFormat = "number" | "currency" | "percentage" | "duration";
export type TrendDirection = "up" | "down" | "neutral";

export interface MetricCardGAProps {
	label: string;
	value: string | number;
	change?: number;
	trend?: TrendDirection;
	sparklineData?: number[];
	icon?: React.ReactNode;
	format?: MetricFormat;
	className?: string;
	isLoading?: boolean;
	onClick?: () => void;
}

const formatValue = (
	value: string | number,
	format: MetricFormat = "number"
): string => {
	if (typeof value === "string") return value;

	switch (format) {
		case "currency":
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(value);
		case "percentage":
			return `${value.toFixed(1)}%`;
		case "duration":
			// Assume value is in seconds
			if (value < 60) return `${value}s`;
			if (value < 3600) return `${Math.floor(value / 60)}m ${value % 60}s`;
			return `${Math.floor(value / 3600)}h ${Math.floor((value % 3600) / 60)}m`;
		case "number":
		default:
			return new Intl.NumberFormat("en-US").format(value);
	}
};

const getTrendColor = (trend?: TrendDirection): string => {
	switch (trend) {
		case "up":
			return "text-ga-green";
		case "down":
			return "text-ga-red";
		case "neutral":
		default:
			return "text-ga-secondary";
	}
};

const getTrendIcon = (trend?: TrendDirection) => {
	switch (trend) {
		case "up":
			return <TrendingUp className="w-4 h-4" />;
		case "down":
			return <TrendingDown className="w-4 h-4" />;
		case "neutral":
		default:
			return <Minus className="w-4 h-4" />;
	}
};

export const MetricCardGA: React.FC<MetricCardGAProps> = ({
	label,
	value,
	change,
	trend,
	sparklineData,
	icon,
	format = "number",
	className = "",
	isLoading = false,
	onClick,
}) => {
	const formattedValue = formatValue(value, format);
	const trendColor = getTrendColor(trend);
	const trendIcon = getTrendIcon(trend);

	// Prepare sparkline data for Recharts
	const chartData =
		sparklineData?.map((val, idx) => ({ value: val, index: idx })) || [];

	if (isLoading) {
		return (
			<div
				className={`
            bg-ga-background border border-ga rounded-lg p-4 sm:p-6
            shadow-ga-card
            transition-ga-base transition-shadow
            animate-pulse
            ${onClick ? 'cursor-pointer hover:shadow-ga-card-hover' : ''}
            ${className}
          `}
				onClick={onClick}
			>
				<div className="flex items-start justify-between mb-3 sm:mb-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							{icon && (
								<div className="text-ga-secondary flex-shrink-0 opacity-50">
									{icon}
								</div>
							)}
							<div className="h-4 bg-ga-surface rounded w-32"></div>
						</div>
						<div className="h-8 bg-ga-surface rounded w-24 mt-2"></div>
					</div>
				</div>
				<div className="flex items-center justify-between flex-wrap gap-2">
					<div className="h-4 bg-ga-surface rounded w-16"></div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`
        bg-ga-background border border-ga rounded-lg p-4 sm:p-6
        shadow-ga-card ga-card-hover theme-transition
        ${onClick ? 'cursor-pointer hover:shadow-ga-card-hover' : ''}
        ${className}
      `}
			onClick={onClick}
		>
			<div className="flex items-start justify-between mb-3 sm:mb-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						{icon && (
							<div className="text-ga-secondary flex-shrink-0">{icon}</div>
						)}
						<p className="text-xs sm:text-sm font-medium text-ga-secondary truncate">
							{label}
						</p>
					</div>
					<p className="text-2xl sm:text-3xl font-bold text-ga-primary font-ga tabular-nums break-all">
						{formattedValue}
					</p>
				</div>
			</div>

			<div className="flex items-center justify-between flex-wrap gap-2">
				{/* Trend indicator */}
				{(change !== undefined || trend) && (
					<div
						className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${trendColor} flex-shrink-0`}
					>
						{trendIcon}
						{change !== undefined && (
							<span className="tabular-nums">
								{change > 0 ? "+" : ""}
								{change.toFixed(1)}%
							</span>
						)}
					</div>
				)}

				{/* Sparkline chart */}
				{sparklineData && sparklineData.length > 0 && (
					<div className="w-16 sm:w-24 h-6 sm:h-8 ml-auto flex-shrink-0">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={chartData}>
								<Line
									type="monotone"
									dataKey="value"
									stroke={
										trend === "down"
											? "rgb(var(--ga-error-red))"
											: "rgb(var(--ga-primary-blue))"
									}
									strokeWidth={2}
									dot={false}
									isAnimationActive={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				)}
			</div>
		</div>
	);
};
