"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	CheckCircle2,
	Mail,
	Phone,
	Building2,
	Tag,
	Clock,
	Copy,
	ExternalLink,
	Loader2,
	LayoutGrid,
	Table2,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import SidebarLayout from "@/components/layout/SidebarLayout";

interface PreRegistration {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	businessName?: string;
	category?: string;
	brand_logo?: string;
	status: "pending" | "approved" | "rejected";
	createdAt: any;
	approvedAt?: any;
	approvalToken?: string;
}

export default function VendorApprovalsPage() {
	const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>(
		[]
	);
	const [loading, setLoading] = useState(true);
	const [approving, setApproving] = useState<string | null>(null);
	const [showApprovalDialog, setShowApprovalDialog] = useState(false);
	const [selectedVendor, setSelectedVendor] = useState<PreRegistration | null>(
		null
	);
	const [approvalNotes, setApprovalNotes] = useState("");
	const [signupLink, setSignupLink] = useState("");
	const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">(
		"pending"
	);
	const [viewMode, setViewMode] = useState<"card" | "table">("card");

	const fetchPreRegistrations = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/vendor-pre-registrations");
			const data = await res.json();
			setPreRegistrations(data);
		} catch (error) {
			console.error("Error fetching pre-registrations:", error);
			toast.error("Failed to load applications");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPreRegistrations();
	}, []);

	const handleApprove = async () => {
		if (!selectedVendor) return;

		setApproving(selectedVendor.id);
		try {
			const res = await fetch("/api/admin/approve-vendor", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					preRegId: selectedVendor.id,
					notes: approvalNotes,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Approval failed");
			}

			toast.success("Vendor approved successfully!");
			setSignupLink(data.signupLink);

			// Refresh list
			await fetchPreRegistrations();
		} catch (error: any) {
			console.error("Approval error:", error);
			toast.error(error.message || "Failed to approve vendor");
		} finally {
			setApproving(null);
		}
	};

	const openApprovalDialog = (vendor: PreRegistration) => {
		setSelectedVendor(vendor);
		setApprovalNotes("");
		setSignupLink("");
		setShowApprovalDialog(true);
	};

	const closeApprovalDialog = () => {
		setShowApprovalDialog(false);
		setSelectedVendor(null);
		setApprovalNotes("");
		setSignupLink("");
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	};

	const formatDate = (timestamp: any) => {
		if (!timestamp) return "N/A";
		try {
			const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			return "N/A";
		}
	};

	const filteredRegistrations = preRegistrations.filter((reg) => {
		if (activeTab === "all") return true;
		return reg.status === activeTab;
	});

	const pendingCount = preRegistrations.filter(
		(r) => r.status === "pending"
	).length;
	const approvedCount = preRegistrations.filter(
		(r) => r.status === "approved"
	).length;

	return (
		<SidebarLayout
			pageTitle="Vendor Approvals"
			pageDescription="Review and approve vendor pre-registrations"
		>
			<div className="space-y-6">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardHeader className="pb-3">
							<CardDescription>Total Applications</CardDescription>
							<CardTitle className="text-3xl">
								{preRegistrations.length}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardDescription>Pending Review</CardDescription>
							<CardTitle className="text-3xl text-amber-600">
								{pendingCount}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-3">
							<CardDescription>Approved</CardDescription>
							<CardTitle className="text-3xl text-green-600">
								{approvedCount}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>

				{/* Tabs and View Toggle */}
				<Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
						<TabsList>
							<TabsTrigger value="pending">
								Pending {pendingCount > 0 && `(${pendingCount})`}
							</TabsTrigger>
							<TabsTrigger value="approved">
								Approved {approvedCount > 0 && `(${approvedCount})`}
							</TabsTrigger>
							<TabsTrigger value="all">All</TabsTrigger>
						</TabsList>

						{/* View Toggle */}
						<div className="flex items-center gap-2 border rounded-md p-1">
							<Button
								variant={viewMode === "card" ? "default" : "ghost"}
								size="sm"
								onClick={() => setViewMode("card")}
								className="h-8 px-2 sm:px-3"
							>
								<LayoutGrid className="h-4 w-4 sm:mr-2" />
								<span className="hidden sm:inline">Card</span>
							</Button>
							<Button
								variant={viewMode === "table" ? "default" : "ghost"}
								size="sm"
								onClick={() => setViewMode("table")}
								className="h-8 px-2 sm:px-3"
							>
								<Table2 className="h-4 w-4 sm:mr-2" />
								<span className="hidden sm:inline">Table</span>
							</Button>
						</div>
					</div>

					<TabsContent value={activeTab} className="mt-6">
						{/* Loading State */}
						{loading && (
							<div className="flex justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
							</div>
						)}

						{/* Empty State */}
						{!loading && filteredRegistrations.length === 0 && (
							<Card>
								<CardContent className="py-12">
									<p className="text-center text-gray-500">
										No applications found
									</p>
								</CardContent>
							</Card>
						)}

						{/* Card View */}
						{!loading &&
							filteredRegistrations.length > 0 &&
							viewMode === "card" && (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{filteredRegistrations.map((reg) => (
										<Card
											key={reg.id}
											className="hover:shadow-md transition-shadow"
										>
											<CardHeader>
												<div className="flex justify-between items-start">
													<div className="space-y-1">
														<CardTitle className="text-lg">
															{reg.fullName}
														</CardTitle>
														{reg.businessName && (
															<CardDescription>
																{reg.businessName}
															</CardDescription>
														)}
													</div>
													<Badge
														variant={
															reg.status === "approved"
																? "default"
																: "secondary"
														}
														className={
															reg.status === "approved"
																? "bg-green-600 hover:bg-green-700"
																: "bg-amber-500 hover:bg-amber-600"
														}
													>
														{reg.status}
													</Badge>
												</div>
											</CardHeader>

											<CardContent className="space-y-3">
												<div className="flex items-center gap-2 text-sm text-gray-600">
													<Mail className="h-4 w-4 shrink-0" />
													<span className="truncate">{reg.email}</span>
												</div>

												<div className="flex items-center gap-2 text-sm text-gray-600">
													<Phone className="h-4 w-4 shrink-0" />
													<span>{reg.phone}</span>
												</div>

												{reg.businessName && (
													<div className="flex items-center gap-2 text-sm text-gray-600">
														<Building2 className="h-4 w-4 shrink-0" />
														<span className="truncate">{reg.businessName}</span>
													</div>
												)}

												{reg.category && (
													<div className="flex items-center gap-2 text-sm text-gray-600">
														<Tag className="h-4 w-4 shrink-0" />
														<span className="truncate">{reg.category}</span>
													</div>
												)}

												<div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
													<Clock className="h-4 w-4 shrink-0" />
													<span className="text-xs">
														{formatDate(reg.createdAt)}
													</span>
												</div>

												{reg.status === "pending" && (
													<Button
														onClick={() => openApprovalDialog(reg)}
														className="w-full bg-green-600 hover:bg-green-700 mt-3"
														disabled={approving === reg.id}
													>
														{approving === reg.id ? (
															<>
																<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																Approving...
															</>
														) : (
															<>
																<CheckCircle2 className="h-4 w-4 mr-2" />
																Approve
															</>
														)}
													</Button>
												)}

												{reg.status === "approved" && reg.approvalToken && (
													<Button
														variant="outline"
														onClick={() =>
															copyToClipboard(
																`${window.location.origin}/vendor/signup?token=${reg.approvalToken}`
															)
														}
														className="w-full mt-3"
													>
														<Copy className="h-4 w-4 mr-2" />
														Copy Signup Link
													</Button>
												)}
											</CardContent>
										</Card>
									))}
								</div>
							)}

						{/* Table View */}
						{!loading &&
							filteredRegistrations.length > 0 &&
							viewMode === "table" && (
								<Card>
									<CardContent className="p-0">
										<div className="overflow-x-auto">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Name</TableHead>
														<TableHead>Email</TableHead>
														<TableHead>Phone</TableHead>
														<TableHead className="hidden md:table-cell">
															Business
														</TableHead>
														<TableHead className="hidden lg:table-cell">
															Category
														</TableHead>
														<TableHead>Status</TableHead>
														<TableHead className="hidden md:table-cell">
															Date
														</TableHead>
														<TableHead className="text-right">
															Actions
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filteredRegistrations.map((reg) => (
														<TableRow key={reg.id}>
															<TableCell className="font-medium">
																<div>
																	<div>{reg.fullName}</div>
																	{reg.businessName && (
																		<div className="text-xs text-gray-500 md:hidden">
																			{reg.businessName}
																		</div>
																	)}
																</div>
															</TableCell>
															<TableCell>
																<div className="flex items-center gap-2">
																	<Mail className="h-3 w-3 text-gray-400 shrink-0" />
																	<span className="truncate max-w-[200px]">
																		{reg.email}
																	</span>
																</div>
															</TableCell>
															<TableCell>
																<div className="flex items-center gap-2">
																	<Phone className="h-3 w-3 text-gray-400 shrink-0" />
																	<span>{reg.phone}</span>
																</div>
															</TableCell>
															<TableCell className="hidden md:table-cell">
																{reg.businessName || "N/A"}
															</TableCell>
															<TableCell className="hidden lg:table-cell">
																{reg.category ? (
																	<div className="flex items-center gap-2">
																		<Tag className="h-3 w-3 text-gray-400 shrink-0" />
																		<span>{reg.category}</span>
																	</div>
																) : (
																	"N/A"
																)}
															</TableCell>
															<TableCell>
																<Badge
																	variant={
																		reg.status === "approved"
																			? "default"
																			: "secondary"
																	}
																	className={
																		reg.status === "approved"
																			? "bg-green-600 hover:bg-green-700"
																			: "bg-amber-500 hover:bg-amber-600"
																	}
																>
																	{reg.status}
																</Badge>
															</TableCell>
															<TableCell className="hidden md:table-cell text-sm text-gray-500">
																<div className="flex items-center gap-2">
																	<Clock className="h-3 w-3 shrink-0" />
																	<span>{formatDate(reg.createdAt)}</span>
																</div>
															</TableCell>
															<TableCell className="text-right">
																<div className="flex items-center justify-end gap-2">
																	{reg.status === "pending" && (
																		<Button
																			onClick={() => openApprovalDialog(reg)}
																			size="sm"
																			className="bg-green-600 hover:bg-green-700"
																			disabled={approving === reg.id}
																		>
																			{approving === reg.id ? (
																				<Loader2 className="h-3 w-3 animate-spin" />
																			) : (
																				<>
																					<CheckCircle2 className="h-3 w-3 mr-1" />
																					<span className="hidden sm:inline">
																						Approve
																					</span>
																				</>
																			)}
																		</Button>
																	)}
																	{reg.status === "approved" &&
																		reg.approvalToken && (
																			<Button
																				variant="outline"
																				size="sm"
																				onClick={() =>
																					copyToClipboard(
																						`${window.location.origin}/vendor/signup?token=${reg.approvalToken}`
																					)
																				}
																			>
																				<Copy className="h-3 w-3" />
																			</Button>
																		)}
																</div>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							)}
					</TabsContent>
				</Tabs>
			</div>

			{/* Approval Dialog */}
			<Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{signupLink ? "Vendor Approved!" : "Approve Vendor Application"}
						</DialogTitle>
						<DialogDescription>
							{signupLink
								? "The vendor has been approved. Share the signup link below."
								: `Review ${selectedVendor?.fullName}'s application`}
						</DialogDescription>
					</DialogHeader>

					{!signupLink ? (
						<div className="space-y-4">
							<Card>
								<CardContent className="pt-6 space-y-3">
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="font-semibold">Name:</span>{" "}
											{selectedVendor?.fullName}
										</div>
										<div>
											<span className="font-semibold">Email:</span>{" "}
											{selectedVendor?.email}
										</div>
										<div>
											<span className="font-semibold">Phone:</span>{" "}
											{selectedVendor?.phone}
										</div>
										{selectedVendor?.businessName && (
											<div>
												<span className="font-semibold">Business:</span>{" "}
												{selectedVendor?.businessName}
											</div>
										)}
										{selectedVendor?.category && (
											<div className="col-span-2">
												<span className="font-semibold">Category:</span>{" "}
												{selectedVendor?.category}
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							<div>
								<Label htmlFor="notes">Notes (Optional)</Label>
								<Textarea
									id="notes"
									placeholder="Add any notes about this approval..."
									value={approvalNotes}
									onChange={(e) => setApprovalNotes(e.target.value)}
									rows={3}
									className="mt-1"
								/>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div className="bg-green-50 border border-green-200 p-4 rounded-lg">
								<div className="flex items-center gap-2 text-green-800 mb-2">
									<CheckCircle2 className="h-5 w-5" />
									<span className="font-semibold">
										Application Approved Successfully
									</span>
								</div>
								<p className="text-sm text-green-700">
									The vendor can now complete their registration using the link
									below.
								</p>
							</div>

							<div>
								<Label>Personalized Signup Link</Label>
								<div className="flex gap-2 mt-1">
									<input
										type="text"
										value={signupLink}
										readOnly
										className="flex-1 px-3 py-2 border rounded-md text-black bg-gray-50 text-sm"
									/>
									<Button
										variant="outline"
										size="icon"
										onClick={() => copyToClipboard(signupLink)}
									>
										<Copy className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										onClick={() => window.open(signupLink, "_blank")}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								</div>
								<p className="text-xs text-gray-500 mt-2">
									📧 An approval email has been sent to {selectedVendor?.email}
								</p>
							</div>
						</div>
					)}

					<DialogFooter>
						{!signupLink ? (
							<>
								<Button variant="outline" onClick={closeApprovalDialog}>
									Cancel
								</Button>
								<Button
									onClick={handleApprove}
									disabled={!!approving}
									className="bg-green-600 hover:bg-green-700"
								>
									{approving ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Approving...
										</>
									) : (
										"Approve Vendor"
									)}
								</Button>
							</>
						) : (
							<Button onClick={closeApprovalDialog}>Done</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</SidebarLayout>
	);
}
