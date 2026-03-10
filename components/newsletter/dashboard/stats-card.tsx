import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
	title: string;
	value: string | number;
	change?: {
		value: string;
		trend: "up" | "down";
	};
	icon: LucideIcon;
	description?: string;
}

export function StatsCard({
	title,
	value,
	change,
	icon: Icon,
	description,
}: StatsCardProps) {
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<p className="text-sm font-medium text-muted-foreground">{title}</p>
						<p className="mt-2 text-3xl font-serif font-medium text-foreground">
							{value}
						</p>
						{change && (
							<p className="mt-2 flex items-center gap-1 text-sm">
								<span
									className={cn(
										"font-medium",
										change.trend === "up" ? "text-green-600" : "text-red-600",
									)}
								>
									{change.value}
								</span>
								<span className="text-muted-foreground">vs last month</span>
							</p>
						)}
						{description && (
							<p className="mt-1 text-xs text-muted-foreground">
								{description}
							</p>
						)}
					</div>
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
						<Icon className="h-6 w-6 text-primary" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export const MemoizedStatsCard = memo(StatsCard);
