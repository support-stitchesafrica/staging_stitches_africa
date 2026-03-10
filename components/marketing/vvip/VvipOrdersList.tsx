"use client";

import { useState, useEffect } from "react";
import {
	ShoppingCart,
	Clock,
	CheckCircle,
	XCircle,
	Eye,
	FileText,
	Calendar,
	DollarSign,
	User,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMarketingAuth } from "@/contexts/MarketingAuthContext";
import {
	sendOrderPlacedVendorEmail,
	getTailorEmail,
} from "@/vendor-services/emailService";

const LOGO_URL =
	"https://firebasestorage.googleapis.com/v0/b/stitches-africa.firebasestorage.app/o/brand-assets%2Flogo_black_clean.png?alt=media&token=cba67c83-049e-4e4b-972d-20d046927da0";

interface VvipOrder {
	orderId: string;
	userId: string;
	customerName: string;
	customerEmail: string;
	payment_method: "manual_transfer";
	isVvip: true;
	payment_status: "pending_verification" | "approved" | "rejected";
	payment_proof_url: string;
	amount_paid: number;
	payment_reference?: string;
	payment_date: string;
	order_status: "pending" | "processing" | "payment_failed";
	admin_note?: string;
	created_at: string;
	items: Array<{
		name: string;
		quantity: number;
		price: number;
	}>;
}

/**
 * VVIP Orders List Component
 *
 * Displays and manages VVIP orders with payment verification capabilities.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 10.4
 */
export default function VvipOrdersList() {
	const { firebaseUser, marketingUser } = useMarketingAuth();
	const [orders, setOrders] = useState<VvipOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
	const [selectedOrder, setSelectedOrder] = useState<VvipOrder | null>(null);
	const [adminNote, setAdminNote] = useState("");
	const [processing, setProcessing] = useState(false);
	const [userPermissions, setUserPermissions] = useState({
		canApprovePayment: false,
		userRole: "none" as string,
	});

	// Helper function to get authenticated headers
	const getAuthHeaders = async () => {
		if (!firebaseUser) {
			throw new Error("User not authenticated");
		}

		const idToken = await firebaseUser.getIdToken(true);
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${idToken}`,
		};
	};

	// Load orders and permissions
	useEffect(() => {
		if (firebaseUser && marketingUser) {
			loadOrders();
			loadPermissions();
		}
	}, [firebaseUser, marketingUser, paymentStatusFilter]);

	const loadPermissions = async () => {
		try {
			const headers = await getAuthHeaders();
			const response = await fetch("/api/marketing/vvip/permissions", {
				headers,
			});

			if (response.ok) {
				const data = await response.json();
				setUserPermissions(data);
			} else {
				console.error("Failed to load permissions:", response.status);
				if (response.status === 401) {
					toast.error("Authentication required. Please log in again.");
				}
			}
		} catch (error) {
			console.error("Failed to load permissions:", error);
			toast.error("Failed to load permissions");
		}
	};

	const loadOrders = async () => {
		if (!firebaseUser || !marketingUser) return;

		setLoading(true);
		try {
			const headers = await getAuthHeaders();
			const params = new URLSearchParams();
			if (paymentStatusFilter && paymentStatusFilter !== "all") {
				params.append("payment_status", paymentStatusFilter);
			}

			console.log("Loading VVIP orders with filter:", paymentStatusFilter);
			const response = await fetch(
				`/api/marketing/vvip/orders?${params.toString()}`,
				{ headers },
			);

			if (response.ok) {
				const data = await response.json();
				console.log("Orders loaded:", data.orders?.length || 0);
				setOrders(data.orders || []);
			} else {
				console.error("Failed to load orders:", response.status);
				if (response.status === 401) {
					toast.error("Authentication required. Please log in again.");
				} else {
					toast.error("Failed to load VVIP orders");
				}
			}
		} catch (error) {
			console.error("Error loading orders:", error);
			toast.error("Failed to load VVIP orders");
		} finally {
			setLoading(false);
		}
	};

	// Handle filter changes
	const handleFilterChange = (value: string) => {
		setPaymentStatusFilter(value);
	};

	// Handle payment approval
	const handleApprovePayment = async (orderId: string) => {
		setProcessing(true);
		try {
			const headers = await getAuthHeaders();
			const response = await fetch("/api/marketing/vvip/orders/approve", {
				method: "POST",
				headers,
				body: JSON.stringify({
					orderId,
					adminNote: adminNote.trim() || undefined,
				}),
			});

			if (response.ok) {
				toast.success("Payment approved successfully");

				// Trigger generic email or specific vendor email
				// We need to fetch the full order to get items and vendor info
				const order = orders.find((o) => o.orderId === orderId);
				if (order) {
					// Process notifications asynchronously
					(async () => {
						try {
							// Group items by vendor to send one email per vendor (if multiple vendors involved)
							// Assumption: Items have vendor/tailor info attached. checking for vendor.id or tailor_id
							const vendorItemsMap = new Map<
								string,
								{
									items: typeof order.items;
									vendorName: string;
									email?: string;
								}
							>();

							for (const item of order.items) {
								// Safe cast to access potential vendor fields not strictly typed in VvipOrder interface
								const itemAny = item as any;
								const vendorId =
									itemAny.vendor?.id ||
									itemAny.vendor?.email ||
									itemAny.tailor_id ||
									itemAny.tailor?.id;
								const vendorName =
									itemAny.vendor?.name ||
									itemAny.tailor?.name ||
									itemAny.tailor ||
									"Vendor";

								// If we can't identify vendor, we can't send email.
								// Often VVIP orders might be one vendor.
								if (vendorId) {
									if (!vendorItemsMap.has(vendorId)) {
										vendorItemsMap.set(vendorId, { items: [], vendorName });
									}
									vendorItemsMap.get(vendorId)?.items.push(item);
								}
							}

							// Send email for each identified vendor
							for (const [vendorId, data] of vendorItemsMap) {
								try {
									const vendorEmail = await getTailorEmail(vendorId);
									if (vendorEmail) {
										await sendOrderPlacedVendorEmail({
											to: vendorEmail,
											vendorName: data.vendorName,
											orderId: order.orderId,
											customerName: order.customerName,
											productName: data.items.map((i) => i.name).join(", "),
											quantity: data.items.reduce(
												(acc, i) => acc + i.quantity,
												0,
											),
											totalAmount: data.items.reduce(
												(acc, i) => acc + i.price * i.quantity,
												0,
											),
											customerEmail: order.customerEmail,
											logoUrl: LOGO_URL,
											// Optional fields
											// customerPhone: order.customerPhone,
											// deliveryAddress: order.shipping_address,
										});
										toast.success(`Notification sent to ${data.vendorName}`);
									}
								} catch (err) {
									console.error(`Failed to notify vendor ${vendorId}:`, err);
								}
							}
						} catch (emailError) {
							console.error("Error sending vendor notifications:", emailError);
						}
					})();
				}

				setSelectedOrder(null);
				setAdminNote("");
				loadOrders(); // Reload the list
			} else {
				const errorData = await response.json();
				toast.error(errorData.message || "Failed to approve payment");
			}
		} catch (error) {
			console.error("Error approving payment:", error);
			toast.error("Failed to approve payment");
		} finally {
			setProcessing(false);
		}
	};

	// Handle payment rejection
	const handleRejectPayment = async (orderId: string) => {
		if (!adminNote.trim()) {
			toast.error("Please provide a reason for rejection");
			return;
		}

		setProcessing(true);
		try {
			const headers = await getAuthHeaders();
			const response = await fetch("/api/marketing/vvip/orders/reject", {
				method: "POST",
				headers,
				body: JSON.stringify({
					orderId,
					adminNote: adminNote.trim(),
				}),
			});

			if (response.ok) {
				toast.success("Payment rejected successfully");
				setSelectedOrder(null);
				setAdminNote("");
				loadOrders(); // Reload the list
			} else {
				const errorData = await response.json();
				toast.error(errorData.message || "Failed to reject payment");
			}
		} catch (error) {
			console.error("Error rejecting payment:", error);
			toast.error("Failed to reject payment");
		} finally {
			setProcessing(false);
		}
	};

	// Get status badge color
	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case "pending_verification":
				return "default";
			case "approved":
				return "default";
			case "rejected":
				return "destructive";
			default:
				return "secondary";
		}
	};

	// Get status icon
	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending_verification":
				return <Clock className="w-3 h-3" />;
			case "approved":
				return <CheckCircle className="w-3 h-3" />;
			case "rejected":
				return <XCircle className="w-3 h-3" />;
			default:
				return <Clock className="w-3 h-3" />;
		}
	};

	return (
		<div className="space-y-6">
			{/* Show loading if not authenticated */}
			{(!firebaseUser || !marketingUser) && (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading authentication...</p>
				</div>
			)}

			{/* Show content only when authenticated */}
			{firebaseUser && marketingUser && (
				<>
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold text-gray-900">VVIP Orders</h2>
							<p className="text-gray-600 mt-1">
								Review and manage VVIP payment submissions
							</p>
						</div>
						<div className="text-sm text-gray-500">
							{orders.length} total orders
						</div>
					</div>

					{/* Filters */}
					<Card>
						<CardHeader>
							<CardTitle>Filter Orders</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex gap-4">
								<div className="w-64">
									<Label>Payment Status</Label>
									<Select
										value={paymentStatusFilter}
										onValueChange={handleFilterChange}
									>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="All statuses" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All statuses</SelectItem>
											<SelectItem value="pending_verification">
												Pending Verification
											</SelectItem>
											<SelectItem value="approved">Approved</SelectItem>
											<SelectItem value="rejected">Rejected</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Orders List */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShoppingCart className="w-5 h-5" />
								VVIP Orders ({orders.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{loading ? (
								<div className="space-y-3">
									{[...Array(5)].map((_, i) => (
										<div key={i} className="animate-pulse">
											<div className="flex items-center gap-4 p-4 border rounded-lg">
												<div className="w-10 h-10 bg-gray-200 rounded-full"></div>
												<div className="flex-1">
													<div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
													<div className="h-3 bg-gray-200 rounded w-1/2"></div>
												</div>
												<div className="w-20 h-8 bg-gray-200 rounded"></div>
											</div>
										</div>
									))}
								</div>
							) : orders.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
									<p>No VVIP orders found</p>
									<p className="text-sm">
										Orders will appear here when VVIP customers make purchases
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{orders.map((order) => (
										<div
											key={order.orderId}
											className="border rounded-lg p-4 hover:bg-gray-50"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="bg-blue-100 rounded-full p-2">
														<ShoppingCart className="w-4 h-4 text-blue-600" />
													</div>
													<div>
														<div className="font-medium flex items-center gap-2">
															Order #{order.orderId}
															<Badge
																variant={getStatusBadgeVariant(
																	order.payment_status,
																)}
																className="flex items-center gap-1"
															>
																{getStatusIcon(order.payment_status)}
																{order.payment_status.replace("_", " ")}
															</Badge>
														</div>
														<div className="text-sm text-gray-600 flex items-center gap-4">
															<span className="flex items-center gap-1">
																<User className="w-3 h-3" />
																{order.customerName} ({order.customerEmail})
															</span>
															<span className="flex items-center gap-1">
																<DollarSign className="w-3 h-3" />$
																{order.amount_paid.toFixed(2)}
															</span>
															<span className="flex items-center gap-1">
																<Calendar className="w-3 h-3" />
																{new Date(
																	order.created_at,
																).toLocaleDateString()}
															</span>
															{order.payment_reference && (
																<span className="text-xs bg-gray-100 px-2 py-1 rounded">
																	Ref: {order.payment_reference}
																</span>
															)}
														</div>
													</div>
												</div>

												<div className="flex items-center gap-2">
													{/* View Details Button */}
													<Dialog>
														<DialogTrigger asChild>
															<Button
																size="sm"
																variant="outline"
																className="flex items-center gap-1"
															>
																<Eye className="w-3 h-3" />
																View Details
															</Button>
														</DialogTrigger>
														<DialogContent className="max-w-2xl">
															<DialogHeader>
																<DialogTitle>
																	Order Details - #{order.orderId}
																</DialogTitle>
																<DialogDescription>
																	Review payment proof and order information
																</DialogDescription>
															</DialogHeader>

															<div className="space-y-4">
																{/* Customer Info */}
																<div>
																	<h4 className="font-medium mb-2">
																		Customer Information
																	</h4>
																	<div className="bg-gray-50 p-3 rounded-lg">
																		<p>
																			<strong>Name:</strong>{" "}
																			{order.customerName}
																		</p>
																		<p>
																			<strong>Email:</strong>{" "}
																			{order.customerEmail}
																		</p>
																	</div>
																</div>

																{/* Payment Info */}
																<div>
																	<h4 className="font-medium mb-2">
																		Payment Information
																	</h4>
																	<div className="bg-gray-50 p-3 rounded-lg">
																		<p>
																			<strong>Amount Paid:</strong> $
																			{order.amount_paid.toFixed(2)}
																		</p>
																		<p>
																			<strong>Payment Date:</strong>{" "}
																			{new Date(
																				order.payment_date,
																			).toLocaleDateString()}
																		</p>
																		{order.payment_reference && (
																			<p>
																				<strong>Reference:</strong>{" "}
																				{order.payment_reference}
																			</p>
																		)}
																		<p>
																			<strong>Status:</strong>
																			<Badge
																				variant={getStatusBadgeVariant(
																					order.payment_status,
																				)}
																				className="ml-2"
																			>
																				{order.payment_status.replace("_", " ")}
																			</Badge>
																		</p>
																	</div>
																</div>

																{/* Payment Proof */}
																<div>
																	<h4 className="font-medium mb-2">
																		Payment Proof
																	</h4>
																	<div className="border rounded-lg p-3">
																		{order.payment_proof_url ? (
																			<div className="text-center">
																				<img
																					src={order.payment_proof_url}
																					alt="Payment Proof"
																					className="max-w-full max-h-64 mx-auto rounded"
																					onError={(e) => {
																						(
																							e.target as HTMLImageElement
																						).style.display = "none";
																						(
																							e.target as HTMLImageElement
																						).nextElementSibling!.classList.remove(
																							"hidden",
																						);
																					}}
																				/>
																				<div className="hidden">
																					<FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
																					<p className="text-sm text-gray-600">
																						Payment proof document
																					</p>
																					<Button
																						size="sm"
																						variant="outline"
																						asChild
																						className="mt-2"
																					>
																						<a
																							href={order.payment_proof_url}
																							target="_blank"
																							rel="noopener noreferrer"
																						>
																							View Document
																						</a>
																					</Button>
																				</div>
																			</div>
																		) : (
																			<p className="text-gray-500 text-center">
																				No payment proof uploaded
																			</p>
																		)}
																	</div>
																</div>

																{/* Order Items */}
																<div>
																	<h4 className="font-medium mb-2">
																		Order Items
																	</h4>
																	<div className="space-y-2">
																		{order.items.map((item, index) => (
																			<div
																				key={index}
																				className="flex justify-between items-center p-2 bg-gray-50 rounded"
																			>
																				<span>
																					{item.name} (x{item.quantity})
																				</span>
																				<span>
																					$
																					{(item.price * item.quantity).toFixed(
																						2,
																					)}
																				</span>
																			</div>
																		))}
																	</div>
																</div>

																{/* Admin Note */}
																{order.admin_note && (
																	<div>
																		<h4 className="font-medium mb-2">
																			Admin Note
																		</h4>
																		<div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
																			<p className="text-sm">
																				{order.admin_note}
																			</p>
																		</div>
																	</div>
																)}
															</div>
														</DialogContent>
													</Dialog>

													{/* Action Buttons for Pending Orders */}
													{order.payment_status === "pending_verification" &&
														userPermissions.canApprovePayment && (
															<Dialog>
																<DialogTrigger asChild>
																	<Button
																		size="sm"
																		className="flex items-center gap-1"
																		onClick={() => {
																			setSelectedOrder(order);
																			setAdminNote("");
																		}}
																	>
																		Review Payment
																	</Button>
																</DialogTrigger>
																<DialogContent>
																	<DialogHeader>
																		<DialogTitle>
																			Review Payment - Order #{order.orderId}
																		</DialogTitle>
																		<DialogDescription>
																			Approve or reject this payment submission
																		</DialogDescription>
																	</DialogHeader>

																	<div className="space-y-4">
																		{/* Payment Summary */}
																		<div className="bg-gray-50 p-3 rounded-lg">
																			<p>
																				<strong>Customer:</strong>{" "}
																				{order.customerName}
																			</p>
																			<p>
																				<strong>Amount:</strong> $
																				{order.amount_paid.toFixed(2)}
																			</p>
																			<p>
																				<strong>Reference:</strong>{" "}
																				{order.payment_reference || "N/A"}
																			</p>
																		</div>

																		{/* Admin Note */}
																		<div>
																			<Label htmlFor="adminNote">
																				Admin Note (optional for approval,
																				required for rejection)
																			</Label>
																			<Textarea
																				id="adminNote"
																				placeholder="Add a note about this payment verification..."
																				value={adminNote}
																				onChange={(e) =>
																					setAdminNote(e.target.value)
																				}
																				className="mt-1"
																			/>
																		</div>

																		{/* Action Buttons */}
																		<div className="flex gap-3">
																			<Button
																				onClick={() =>
																					handleApprovePayment(order.orderId)
																				}
																				disabled={processing}
																				className="flex items-center gap-1"
																			>
																				<CheckCircle className="w-4 h-4" />
																				{processing
																					? "Processing..."
																					: "Approve Payment"}
																			</Button>
																			<Button
																				variant="destructive"
																				onClick={() =>
																					handleRejectPayment(order.orderId)
																				}
																				disabled={
																					processing || !adminNote.trim()
																				}
																				className="flex items-center gap-1"
																			>
																				<XCircle className="w-4 h-4" />
																				{processing
																					? "Processing..."
																					: "Reject Payment"}
																			</Button>
																		</div>
																	</div>
																</DialogContent>
															</Dialog>
														)}

													{/* Read-only for team members */}
													{userPermissions.userRole === "team_member" && (
														<span className="text-sm text-gray-500">
															View Only
														</span>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Summary Stats */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-4">
								<div className="text-2xl font-bold">{orders.length}</div>
								<div className="text-sm text-gray-600">Total Orders</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-2xl font-bold text-yellow-600">
									{
										orders.filter(
											(o) => o.payment_status === "pending_verification",
										).length
									}
								</div>
								<div className="text-sm text-gray-600">Pending Review</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-2xl font-bold text-green-600">
									{orders.filter((o) => o.payment_status === "approved").length}
								</div>
								<div className="text-sm text-gray-600">Approved</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-2xl font-bold text-red-600">
									{orders.filter((o) => o.payment_status === "rejected").length}
								</div>
								<div className="text-sm text-gray-600">Rejected</div>
							</CardContent>
						</Card>
					</div>
				</>
			)}
		</div>
	);
}
