"use client";

// VendorDetailPage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import
	{
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import VendorSidebarLayout from "@/components/layout/VendorSidebarLayout";
import
	{
		ArrowLeft,
		CheckCircle,
		XCircle,
		AlertCircle,
		Trash2,
	} from "lucide-react";
import { UsersTab } from "@/components/vendor/users-tab";
import { ProductsTab } from "@/components/vendor/products-tab";
import { OrdersTab } from "@/components/vendor/orders-tab";
import { TransactionsTab } from "@/components/vendor/transactions-tab";
import { useTailorById } from "@/admin-services/useTailors";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Tailor } from "@/admin-services/useTailors";
import
	{
		Dialog,
		DialogContent,
		DialogTrigger,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter,
	} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import
	{
		handleKycApproval,
		hasPendingKycRequest,
	} from "@/admin-services/kycApproval";
import { toast } from "sonner";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth } from "@/firebase";

const VendorDetailPage: React.FC = () =>
{
	const params = useParams();
	const router = useRouter();
	const vendorId = params?.id as string;

	const { tailor, loading, error } = useTailorById(vendorId);
	const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
	const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [adminNote, setAdminNote] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);

	console.log(tailor);

	const handleApprove = async () =>
	{
		setIsProcessing(true);
		try
		{
			const result = await handleKycApproval(vendorId, true, adminNote);
			if (result.success)
			{
				toast.success(result.message);

				// Send approval email to vendor
				try
				{
					const user = auth.currentUser;
					if (user && tailor)
					{
						const accessToken = await user.getIdToken();
						const functions = getFunctions(app, "europe-west1");
						const sendDecisionEmail = httpsCallable(
							functions,
							"sendKycDecisionEmail"
						);

						await sendDecisionEmail({
							to: tailor.tailor_registered_info?.email || "",
							vendorName: tailor.brandName || tailor.brand_name || "Vendor",
							fullName:
								tailor.identity_verification?.fullName ||
								tailor.brandName ||
								tailor.brand_name ||
								"Vendor",
							vendorId: vendorId,
							requestReason:
								(tailor as any).kycUpdateReason || "No reason provided",
							requestDate: new Date().toISOString(),
							decision: "approved",
							reviewedBy: user.email || "Admin",
							adminFeedback:
								adminNote || "Your KYC update request has been approved.",
							decisionDate: new Date().toISOString(),
							logoUrl:
								tailor.brand_logo ||
								"https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
							accessToken: accessToken,
						});

						console.log("✅ Approval email sent to vendor");
					}
				} catch (emailError: any)
				{
					console.error("❌ Failed to send approval email:", emailError);
					// Don't block the approval process if email fails
				}

				setIsApprovalDialogOpen(false);
				setAdminNote("");
				// Refresh the page to update data
				router.refresh();
				window.location.reload();
			} else
			{
				toast.error(result.message);
			}
		} catch (error: any)
		{
			toast.error(error.message || "Failed to approve KYC request");
		} finally
		{
			setIsProcessing(false);
		}
	};

	const handleDecline = async () =>
	{
		if (!adminNote.trim())
		{
			toast.error("Please provide a reason for declining");
			return;
		}
		setIsProcessing(true);
		try
		{
			const result = await handleKycApproval(vendorId, false, adminNote);
			if (result.success)
			{
				toast.success(result.message);

				// Send rejection email to vendor
				try
				{
					const user = auth.currentUser;
					if (user && tailor)
					{
						const accessToken = await user.getIdToken();
						const functions = getFunctions(app, "europe-west1");
						const sendDecisionEmail = httpsCallable(
							functions,
							"sendKycDecisionEmail"
						);

						await sendDecisionEmail({
							to: tailor.tailor_registered_info?.email || "",
							vendorName: tailor.brandName || "Vendor",
							fullName:
								tailor.identity_verification?.fullName ||
								tailor.brandName ||
								"Vendor",
							vendorId: vendorId,
							requestReason:
								(tailor as any).kycUpdateReason || "No reason provided",
							requestDate: new Date().toISOString(),
							decision: "rejected",
							reviewedBy: user.email || "Admin",
							adminFeedback: adminNote, // Feedback is required for rejection
							decisionDate: new Date().toISOString(),
							logoUrl:
								tailor.brand_logo ||
								"https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
							accessToken: accessToken,
						});

						console.log("✅ Rejection email sent to vendor");
					}
				} catch (emailError: any)
				{
					console.error("❌ Failed to send rejection email:", emailError);
					// Don't block the decline process if email fails
				}

				setIsDeclineDialogOpen(false);
				setAdminNote("");
				// Refresh the page to update data
				router.refresh();
				window.location.reload();
			} else
			{
				toast.error(result.message);
			}
		} catch (error: any)
		{
			toast.error(error.message || "Failed to decline KYC request");
		} finally
		{
			setIsProcessing(false);
		}
	};

	const handleDelete = async () =>
	{
		setIsProcessing(true);
		try
		{
			const functions = getFunctions(app, "europe-west1");
			const adminDeleteTailorData = httpsCallable(
				functions,
				"adminDeleteTailorData"
			);

			const result = await adminDeleteTailorData({ tailorId: vendorId });

			toast.success(
				(result.data as any)?.message || "Vendor deleted successfully"
			);
			setIsDeleteDialogOpen(false);

			// Navigate back to vendors list
			router.push("/admin/vendor");
		} catch (error: any)
		{
			console.error("Delete error:", error);
			toast.error(error.message || "Failed to delete vendor");
		} finally
		{
			setIsProcessing(false);
		}
	};

	const getStatusBadge = (status?: string | null) =>
	{
		if (!status || status.toLowerCase() === "null")
		{
			return (
				<Badge
					variant="outline"
					className="border-gray-300 text-gray-600 bg-gray-50"
				>
					Inactive
				</Badge>
			);
		}

		switch (status.toLowerCase())
		{
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

	if (loading)
	{
		return (
			<VendorSidebarLayout
				pageTitle="Vendor Dashboard"
				pageDescription="Loading vendor details..."
			>
				<p>Loading...</p>
			</VendorSidebarLayout>
		);
	}

	if (error)
	{
		return (
			<VendorSidebarLayout
				pageTitle="Vendor Dashboard"
				pageDescription="Error loading vendor details"
			>
				<p className="text-red-500">{error}</p>
			</VendorSidebarLayout>
		);
	}

	if (!tailor)
	{
		return (
			<VendorSidebarLayout
				pageTitle="Vendor Dashboard"
				pageDescription="Vendor not found"
			>
				<p>No vendor found with this ID.</p>
			</VendorSidebarLayout>
		);
	}

	return (
		<VendorSidebarLayout
			pageTitle="Vendor Dashboard"
			pageDescription="Manage your product inventory, stock levels, and alerts"
		>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-2">
					<Button variant="outline" size="sm" asChild>
						<Link href="/admin/vendor">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Vendors
						</Link>
					</Button>
					<h2 className="text-3xl font-bold tracking-tight">
						{tailor.identity_verification?.fullName ||
							tailor.brandName ||
							"Unnamed Vendor"}
					</h2>
				</div>
				<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="destructive" size="sm">
							<Trash2 className="h-4 w-4 mr-2" />
							Delete Vendor
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Vendor</DialogTitle>
							<DialogDescription>
								Are you sure you want to permanently delete this vendor? This
								action cannot be undone and will remove all associated data
								including products, orders, and transactions.
							</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<p className="text-sm font-medium mb-2">Vendor Information:</p>
							<div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded space-y-1">
								<p>
									<strong>Name:</strong>{" "}
									{tailor.identity_verification?.fullName ||
										tailor.brandName ||
										"Unnamed Vendor"}
								</p>
								<p>
									<strong>Email:</strong>{" "}
									{tailor.tailor_registered_info?.email || "N/A"}
								</p>
								<p>
									<strong>ID:</strong> {tailor.id}
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDeleteDialogOpen(false)}
								disabled={isProcessing}
							>
								Cancel
							</Button>
							<Button
								onClick={handleDelete}
								disabled={isProcessing}
								variant="destructive"
							>
								{isProcessing ? "Deleting..." : "Delete Permanently"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* KYC Request Alert */}
			{hasPendingKycRequest(tailor) && (
				<Card className="border-blue-200 bg-blue-50/50">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 rounded-full">
									<AlertCircle className="h-5 w-5 text-blue-700" />
								</div>
								<div>
									<CardTitle className="text-blue-900 text-lg">
										KYC Update Request Pending
									</CardTitle>
									<CardDescription className="text-blue-700">
										This vendor has requested permission to update their KYC
										documents
									</CardDescription>
								</div>
							</div>
							<div className="flex gap-2">
								<Dialog
									open={isApprovalDialogOpen}
									onOpenChange={setIsApprovalDialogOpen}
								>
									<DialogTrigger asChild>
										<Button
											variant="default"
											className="bg-emerald-600 hover:bg-emerald-700"
										>
											<CheckCircle className="h-4 w-4 mr-2" />
											Approve
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Approve KYC Update Request</DialogTitle>
											<DialogDescription>
												Are you sure you want to approve this vendor's KYC
												update request?
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<div>
												<p className="text-sm font-medium mb-2">
													Vendor's Reason:
												</p>
												<p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
													{(tailor as any).kycUpdateReason ||
														"No reason provided"}
												</p>
											</div>
											<div>
												<label className="text-sm font-medium">
													Admin Note (Optional)
												</label>
												<Textarea
													placeholder="Add any notes about this approval..."
													value={adminNote}
													onChange={(e) => setAdminNote(e.target.value)}
													className="mt-2"
												/>
											</div>
										</div>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => setIsApprovalDialogOpen(false)}
											>
												Cancel
											</Button>
											<Button
												onClick={handleApprove}
												disabled={isProcessing}
												className="bg-emerald-600 hover:bg-emerald-700"
											>
												{isProcessing ? "Processing..." : "Approve Request"}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>

								<Dialog
									open={isDeclineDialogOpen}
									onOpenChange={setIsDeclineDialogOpen}
								>
									<DialogTrigger asChild>
										<Button variant="destructive">
											<XCircle className="h-4 w-4 mr-2" />
											Decline
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Decline KYC Update Request</DialogTitle>
											<DialogDescription>
												Please provide a reason for declining this request. The
												vendor will be notified.
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<div>
												<p className="text-sm font-medium mb-2">
													Vendor's Reason:
												</p>
												<p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
													{(tailor as any).kycUpdateReason ||
														"No reason provided"}
												</p>
											</div>
											<div>
												<label className="text-sm font-medium">
													Reason for Decline *
												</label>
												<Textarea
													placeholder="Explain why you're declining this request..."
													value={adminNote}
													onChange={(e) => setAdminNote(e.target.value)}
													className="mt-2"
													required
												/>
											</div>
										</div>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => setIsDeclineDialogOpen(false)}
											>
												Cancel
											</Button>
											<Button
												onClick={handleDecline}
												disabled={isProcessing || !adminNote.trim()}
												variant="destructive"
											>
												{isProcessing ? "Processing..." : "Decline Request"}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
						</div>
					</CardHeader>
				</Card>
			)}

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>
								{tailor.identity_verification?.fullName ||
									tailor.brandName ||
									"Unnamed Vendor"}
							</CardTitle>
							<CardDescription>Vendor ID: {tailor.id}</CardDescription>
						</div>
						{getStatusBadge(tailor["company-verification"]?.status)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p>
								<strong>Email:</strong>{" "}
								{tailor.tailor_registered_info?.email || "N/A"}
							</p>
							<p>
								<strong>Vendor Logo:</strong>{" "}
								{tailor.brand_logo ? (
									<Dialog>
										<DialogTrigger asChild>
											<img
												src={tailor.brand_logo}
												alt="Vendor Logo"
												className="w-20 h-20 rounded-md cursor-pointer hover:opacity-80 transition"
											/>
										</DialogTrigger>
										<DialogContent className="max-w-3xl p-4">
											<img
												src={tailor.brand_logo}
												alt="Vendor Logo Full"
												className="w-full h-auto rounded-lg"
											/>
										</DialogContent>
									</Dialog>
								) : (
									"N/A"
								)}
							</p>

							<p>
								<strong>Wallet:</strong> ${tailor.wallet ?? 0}
							</p>
							<p>
								<strong>Total Users:</strong> {tailor.totalUsers ?? 0}
							</p>
						</div>
						<div>
							<p>
								<strong>Wear Specialization:</strong> {tailor.type || "N/A"}
							</p>
							<p>
								<strong>Total Products:</strong> {tailor.totalProducts ?? 0}
							</p>
							<p>
								<strong>Total Orders:</strong> {tailor.totalOrders ?? 0}
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p>
								<strong>KYC Upload:</strong>{" "}
								{tailor["company-verification"]?.documentImageUrl ? (
									<Dialog>
										<DialogTrigger asChild>
											<img
												src={tailor["company-verification"].documentImageUrl}
												alt="KYC Document"
												className="w-20 h-20 rounded-md cursor-pointer hover:opacity-80 transition"
											/>
										</DialogTrigger>
										<DialogContent className="max-w-4xl p-4">
											<img
												src={tailor["company-verification"].documentImageUrl}
												alt="KYC Document Full"
												className="w-full h-auto rounded-lg"
											/>
										</DialogContent>
									</Dialog>
								) : (
									"N/A"
								)}
							</p>
						</div>
						<div></div>
					</div>
				</CardContent>
			</Card>

			<Tabs defaultValue="users" className="space-y-4 mt-4">
				<TabsList>
					<TabsTrigger value="users">Users</TabsTrigger>
					<TabsTrigger value="products">Products</TabsTrigger>
					<TabsTrigger value="orders">Order History</TabsTrigger>
					<TabsTrigger value="transactions">Transactions</TabsTrigger>
				</TabsList>

				<TabsContent value="users">
					<UsersTab users={(tailor.users as any) ?? []} />
				</TabsContent>

				<TabsContent value="products">
					<ProductsTab products={(tailor.products as any) ?? []} />
				</TabsContent>

				<TabsContent value="orders">
					<OrdersTab
						orders={(tailor.orders as any) ?? []}
						tailorData={tailor as any}
					/>
				</TabsContent>

				<TabsContent value="transactions">
					<TransactionsTab vendorId={vendorId} />
				</TabsContent>
			</Tabs>
		</VendorSidebarLayout>
	);
};

export default VendorDetailPage;
