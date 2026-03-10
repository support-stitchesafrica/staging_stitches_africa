"use client";

import VendorSidebarLayout from "@/components/layout/VendorSidebarLayout";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useTailorsPaginated } from "@/admin-services/useTailorsPaginated";
import { ArrowLeft, Eye, Search, AlertCircle, Loader2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { hasPendingKycRequest } from "@/admin-services/kycApproval";

const VendorPages = () => {
	const { tailors, loading, error, hasMore, totalCount, loadMore, loadAll } =
		useTailorsPaginated();
	const [searchTerm, setSearchTerm] = useState("");

	const search = searchTerm.toLowerCase();

	// Memoize filtered vendors to avoid recalculating on every render
	const filteredVendors = useMemo(() => {
		if (!searchTerm) return tailors;

		return (tailors || []).filter((vendor) => {
			return (
				(vendor.brand_name &&
					vendor.brand_name.toLowerCase().includes(search)) ||
				(vendor.tailor_registered_info?.email &&
					vendor.tailor_registered_info.email.toLowerCase().includes(search)) ||
				(vendor.id && vendor.id.toLowerCase().includes(search))
			);
		});
	}, [tailors, searchTerm, search]);

	// Optional: Map it to something like a badge color
	const getStatusBadge = (status?: string | null) => {
		if (!status || status.toLowerCase() === "null") {
			return (
				<Badge
					variant="outline"
					className="border-gray-300 text-gray-600 bg-gray-50"
				>
					Inactive
				</Badge>
			);
		}

		switch (status.toLowerCase()) {
			case "approved":
				return (
					<Badge
						variant="outline"
						className="border-emerald-200 text-emerald-700 bg-emerald-50"
					>
						Approved
					</Badge>
				);
			case "pending":
				return (
					<Badge
						variant="outline"
						className="border-amber-200 text-amber-700 bg-amber-50"
					>
						Pending
					</Badge>
				);
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	return (
		<VendorSidebarLayout
			pageTitle="Vendor Dashboard"
			pageDescription="Manage your product inventory, stock levels, and alerts"
		>
			<div className="flex items-center justify-between space-y-2 mb-3">
				<div className="flex items-center space-x-2">
					<Button variant="outline" size="sm" asChild>
						<Link href="/admin/vendor">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to dashboard
						</Link>
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Vendors</CardTitle>
					<CardDescription>
						Manage and view all vendors in your system
					</CardDescription>
					<div className="flex items-center space-x-2">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search vendors..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="max-w-sm"
						/>
					</div>
				</CardHeader>

				<CardContent>
					{error && <p className="text-red-500 mb-4">{error}</p>}

					{/* Show total count */}
					<div className="text-sm text-muted-foreground mb-4">
						Showing {filteredVendors.length} of {totalCount} vendors
						{searchTerm && " (filtered)"}
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Vendor ID</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>KYC Request</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading && tailors.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-8">
										<Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
										<p>Loading vendors...</p>
									</TableCell>
								</TableRow>
							) : (
								<>
									{filteredVendors.map((vendor) => {
										const hasKycRequest = hasPendingKycRequest(vendor);

										return (
											<TableRow
												key={vendor.id}
												className={
													hasKycRequest
														? "bg-blue-50/30 hover:bg-blue-50/50"
														: ""
												}
											>
												<TableCell className="font-medium">
													{vendor.id.substring(0, 8)}...
												</TableCell>
												<TableCell>
													{vendor?.brand_name || vendor?.brandName || "—"}
												</TableCell>
												<TableCell>
													{vendor.tailor_registered_info?.email || "—"}
												</TableCell>

												<TableCell>
													{getStatusBadge(
														vendor["company-verification"]?.status ||
															vendor["company_verification"]?.status
													)}
												</TableCell>

												<TableCell>
													{hasKycRequest ? (
														<Badge
															variant="outline"
															className="border-blue-200 text-blue-700 bg-blue-50 flex items-center gap-1 w-fit"
														>
															<AlertCircle className="h-3 w-3" />
															<span className="text-xs">Action Required</span>
														</Badge>
													) : (
														<span className="text-xs text-muted-foreground">
															—
														</span>
													)}
												</TableCell>

												<TableCell>
													<Button asChild variant="outline" size="sm">
														<Link
															href={`/admin/vendor/all-vendors/${vendor.id}`}
														>
															<Eye className="h-4 w-4 mr-2" />
															View
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										);
									})}

									{filteredVendors.length === 0 && !loading && (
										<TableRow>
											<TableCell colSpan={6} className="text-center py-8">
												{searchTerm
													? "No vendors match your search"
													: "No vendors found"}
											</TableCell>
										</TableRow>
									)}
								</>
							)}
						</TableBody>
					</Table>

					{/* Load More and Load All buttons */}
					{!searchTerm && hasMore && (
						<div className="flex justify-center items-center gap-3 mt-6">
							<Button variant="outline" onClick={loadMore} disabled={loading}>
								{loading ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Loading...
									</>
								) : (
									<>Load More (10)</>
								)}
							</Button>

							<span className="text-sm text-muted-foreground">or</span>

							<Button
								variant="secondary"
								onClick={() => {
									if (totalCount > 50) {
										if (
											confirm(
												`This will load all ${totalCount} vendors. This may take a moment. Continue?`
											)
										) {
											loadAll();
										}
									} else {
										loadAll();
									}
								}}
								disabled={loading}
							>
								{loading ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Loading...
									</>
								) : (
									<>Load All ({totalCount})</>
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</VendorSidebarLayout>
	);
};

export default VendorPages;
