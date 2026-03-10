"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Users,
	Calendar,
	Package,
	ArrowRight,
	Loader2,
	CheckCircle,
} from "lucide-react";
import { CollectionWaitlist } from "@/types/vendor-waitlist";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function CollectionWaitlists() {
	const [collections, setCollections] = useState<CollectionWaitlist[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadCollections();
	}, []);

	const loadCollections = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/collection-waitlists");

			if (response.ok) {
				const data = await response.json();
				setCollections(data.collections || []);
			}
		} catch (error) {
			console.error("Error loading collections:", error);
		} finally {
			setLoading(false);
		}
	};

	const getProgressPercentage = (current: number, target: number) => {
		return Math.min((current / target) * 100, 100);
	};

	const formatDate = (timestamp: any) => {
		if (!timestamp) return "N/A";

		try {
			let date: Date;

			if (timestamp.toDate && typeof timestamp.toDate === "function") {
				date = timestamp.toDate();
			} else if (timestamp.seconds) {
				date = new Date(timestamp.seconds * 1000);
			} else if (timestamp instanceof Date) {
				date = timestamp;
			} else if (
				typeof timestamp === "string" ||
				typeof timestamp === "number"
			) {
				date = new Date(timestamp);
			} else {
				return "N/A";
			}

			if (isNaN(date.getTime())) {
				return "N/A";
			}

			return formatDistanceToNow(date, { addSuffix: true });
		} catch (error) {
			console.error("Error formatting date:", error);
			return "N/A";
		}
	};

	if (loading) {
		return (
			<section className="py-16 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Upcoming Collections
						</h2>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Be the first to access exclusive collections from our talented
							designers
						</p>
					</div>

					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
					</div>
				</div>
			</section>
		);
	}

	if (collections.length === 0) {
		return null; // Don't show section if no collections
	}

	return (
		<section className="py-16 bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						Upcoming Collections
					</h2>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Be the first to access exclusive collections from our talented
						designers. Join the waitlist and get notified when they launch.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{collections.map((collection) => (
						<Card
							key={collection.id}
							className="hover:shadow-lg transition-shadow group"
						>
							<CardHeader className="pb-3">
								<div className="aspect-video rounded-lg overflow-hidden mb-4">
									<img
										src={collection.imageUrl}
										alt={collection.name}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>

								<CardTitle className="text-lg font-semibold line-clamp-2 mb-2">
									{collection.name}
								</CardTitle>

								<p className="text-sm text-gray-600 line-clamp-3 mb-3">
									{collection.description}
								</p>

								<div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
									{collection.publishedAt && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											<span>{formatDate(collection.publishedAt)}</span>
										</div>
									)}
									<div className="flex items-center gap-1">
										<Package className="h-3 w-3" />
										<span>
											{collection.pairedProducts.length +
												(collection.featuredProducts?.length || 0)}{" "}
											items
										</span>
									</div>
								</div>
							</CardHeader>

							<CardContent className="space-y-4">
								{/* Progress */}
								<div className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600 flex items-center gap-1">
											<Users className="h-4 w-4" />
											Waitlist Progress
										</span>
										<span className="font-medium">
											{collection.currentSubscribers} /{" "}
											{collection.minSubscribers}
										</span>
									</div>

									<Progress
										value={getProgressPercentage(
											collection.currentSubscribers,
											collection.minSubscribers,
										)}
										className="h-2"
									/>

									<div className="flex items-center justify-between text-xs">
										<span className="text-gray-500">
											{getProgressPercentage(
												collection.currentSubscribers,
												collection.minSubscribers,
											).toFixed(1)}
											% complete
										</span>
										{collection.currentSubscribers >=
											collection.minSubscribers && (
											<Badge className="bg-green-100 text-green-800 text-xs">
												<CheckCircle className="h-3 w-3 mr-1" />
												Ready to Launch!
											</Badge>
										)}
									</div>
								</div>

								{/* CTA Button */}
								<Link href={`/collection-waitlists/${collection.slug}`}>
									<Button className="w-full group">
										Join Waitlist
										<ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
									</Button>
								</Link>
							</CardContent>
						</Card>
					))}
				</div>

				{collections.length >= 6 && (
					<div className="text-center mt-12">
						<Link href="/collection-waitlists">
							<Button variant="outline" size="lg">
								View All Collections
								<ArrowRight className="h-4 w-4 ml-2" />
							</Button>
						</Link>
					</div>
				)}
			</div>
		</section>
	);
}
