"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, BookOpen, Calendar, User, Tag } from "lucide-react";
import { format } from "date-fns";
import MarketingAuthGuard from "@/components/marketing/MarketingAuthGuard";
import { useMarketingAuth } from "@/contexts/MarketingAuthContext";
import { TailorStoryboardService } from "@/lib/marketing/tailor-storyboard-service";
import { TailorStoryboard } from "@/types/tailor-storyboard";
import { toast } from "sonner";

export default function TailorStoryboardsPage() {
	return (
		<MarketingAuthGuard>
			<TailorStoryboardsContent />
		</MarketingAuthGuard>
	);
}

function TailorStoryboardsContent() {
	const router = useRouter();
	const { marketingUser } = useMarketingAuth();
	const [storyboards, setStoryboards] = useState<TailorStoryboard[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch storyboards
	useEffect(() => {
		const loadStoryboards = async () => {
			try {
				setLoading(true);
				const data = await TailorStoryboardService.getAllStoryboards();
				setStoryboards(data);
			} catch (err) {
				console.error("Error loading storyboards:", err);
				setError("Failed to load tailor storyboards.");
				toast.error("Failed to load data");
			} finally {
				setLoading(false);
			}
		};

		loadStoryboards();
	}, []);

	const handleCreateNew = () => {
		router.push("/marketing/tailor-storyboards/create");
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="w-8 h-8 animate-spin text-gray-500" />
			</div>
		);
	}

	return (
		<div className="p-6 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
						<BookOpen className="w-6 h-6 text-gray-700" />
						Tailor Storyboards
					</h1>
					<p className="text-gray-600 mt-1">
						Create and manage promotional storyboards for specific tailors.
					</p>
				</div>
				<button
					onClick={handleCreateNew}
					className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
				>
					<Plus className="w-4 h-4" />
					Create New Storyboard
				</button>
			</div>

			{/* Error State */}
			{error && (
				<div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6">
					{error}
				</div>
			)}

			{/* Empty State */}
			{!error && storyboards.length === 0 && (
				<div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
						<BookOpen className="w-8 h-8 text-gray-400" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						No storyboards yet
					</h3>
					<p className="text-gray-500 mb-6 max-w-sm mx-auto">
						Start by creating a storyboard to highlight a tailor's collection.
					</p>
					<button
						onClick={handleCreateNew}
						className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
					>
						Create First Storyboard
					</button>
				</div>
			)}

			{/* Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{storyboards.map((storyboard) => (
					<div
						key={storyboard.id}
						className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
						onClick={() =>
							router.push(`/marketing/tailor-storyboards/${storyboard.id}`)
						}
					>
						{/* Thumbnail */}
						<div className="relative h-48 bg-gray-100 overflow-hidden">
							{storyboard.previewImage ? (
								<div
									className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
									style={{
										backgroundImage: `url(${storyboard.previewImage})`,
									}}
								/>
							) : (
								<div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
									<BookOpen className="w-12 h-12 opacity-20" />
								</div>
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

							{/* Active badge */}
							<div className="absolute top-4 right-4">
								<span
									className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md ${
										storyboard.active
											? "bg-green-500/20 text-green-100 border border-green-500/30"
											: "bg-gray-500/20 text-gray-100 border border-gray-500/30"
									}`}
								>
									{storyboard.active ? "Active" : "Inactive"}
								</span>
							</div>

							<div className="absolute bottom-4 left-4 right-4 text-white">
								<h3 className="font-bold text-lg leading-tight truncate">
									{storyboard.title}
								</h3>
								<div className="flex items-center gap-2 mt-1 text-white/80 text-sm">
									<User className="w-3.5 h-3.5" />
									<span className="truncate">{storyboard.tailorName}</span>
								</div>
							</div>
						</div>

						{/* Details */}
						<div className="p-4">
							<div className="flex items-center justify-between text-sm text-gray-500">
								<div className="flex items-center gap-1.5">
									<Tag className="w-4 h-4" />
									<span>
										{storyboard.productsCount ||
											storyboard.productIds.length ||
											0}{" "}
										Products
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<Calendar className="w-4 h-4" />
									<span>
										{storyboard.createdAt
											? format(storyboard.createdAt.toDate(), "MMM d, yyyy")
											: "N/A"}
									</span>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
