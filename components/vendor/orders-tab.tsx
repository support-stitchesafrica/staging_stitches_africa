"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, ChevronDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFunctions, httpsCallable } from "firebase/functions";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPriceValue, type PriceType } from "@/lib/priceUtils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { updateOrderStatus } from "@/admin-services/useTailors";
import { toast } from "sonner";
import { app } from "@/firebase";
import { getAuth } from "firebase/auth";
import TimelineDialog from "./TimelineDialog";

// === Interfaces ===

export interface OrderPayload {
	delivery_date: string;
	delivery_type: string;
	shipping?: any; // Firestore writes here
	dhl_shipment?: DhlShipment; // what the UI prefers to use
	id: string;
	images: string[];
	order_id: string;
	order_status: string;
	price: PriceType;
	product_id: string;
	product_order_ref: string;
	quantity: number;
	shipping_fee: number;
	size: string | null;
	tailor_id: string;
	tailor_name: string;
	timestamp: FirestoreTimestamp;
	title: string;
	user_address: UserAddress;
	user_id: string;
	wear_category: string;
	dhl_events_snapshot?: Array<{
		date: string;
		time: string;
		description: string;
		typeCode: string;
		serviceArea: { code: string; description: string }[];
		signedBy?: string;
	}>;
}

export interface DhlShipment {
	documents: DhlDocument[];
	packages: DhlPackage[];
	shipmentTrackingNumber: string;
	trackingUrl: string;
	type: string;
	pickup?: DhlPickup;
}

export interface DhlPickup {
	createdAt?: any;
	status?: string;
	requestedWindow?: {
		plannedPickupDateAndTime?: string;
		closeTime?: string;
	};
	location?: string;
	locationType?: "business" | "residential";
	specialInstructions?: string[];
	packages?: Array<{
		weight: number;
		dimensions: { length: number; width: number; height: number };
	}>;
}

export interface DhlDocument {
	content: string;
	type?: string;
}

export interface DhlPackage {
	referenceNumber: number;
	trackingNumber: string;
	trackingUrl: string;
}

export interface FirestoreTimestamp {
	seconds: number;
	nanoseconds: number;
}

export interface UserAddress {
	city: string;
	country: string;
	country_code: string;
	dial_code: string;
	first_name: string;
	flat_number: string;
	last_name: string;
	phone_number: string;
	post_code: string;
	state: string;
	street_address: string;
}

interface OrderRow {
	id: string;
	customerName: string;
	customerEmail: string;
	productName: string;
	quantity: number;
	totalAmount: number;
	status: string;
	orderDate: string;
	deliveryDate?: string;
	raw: OrderPayload;
}

interface OrdersTabProps {
	orders: OrderPayload[];
	tailorData: any;
}

export function OrdersTab({ orders, tailorData }: OrdersTabProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [orderData, setOrderData] = useState<OrderPayload[]>(orders);
	const [loadingStatus, setLoadingStatus] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement | null>(null);
	const [showPickupModal, setShowPickupModal] = useState(false);
	const [loadingPickup, setLoadingPickup] = useState(false);
	const [pickupForm, setPickupForm] = useState({
		plannedPickupDateAndTime: new Date().toISOString().slice(0, 16), // Default to now
		closeTime: "18:00",
		location: "reception",
		locationType: "business" as "business" | "residential",
		specialInstructions: "",
	});
	const [trackingData, setTrackingData] = useState<any>(null);
	const [loadingTracking, setLoadingTracking] = useState(false);
	const [showTrackingModal, setShowTrackingModal] = useState(false);

	const rowsPerPage = 5;

	// Normalize shipping data from DB to UI format
	const normalizeShippingData = (order: OrderPayload): OrderPayload => {
		const shippingData = order.shipping ?? order.dhl_shipment;

		if (!shippingData) {
			return order;
		}

		const normalizedDhlShipment: DhlShipment = {
			type: shippingData.type ?? "",
			shipmentTrackingNumber: shippingData.shipmentTrackingNumber ?? "",
			trackingUrl: shippingData.trackingUrl ?? "",
			packages: Array.isArray(shippingData.packages)
				? shippingData.packages
				: [],
			documents: Array.isArray(shippingData.documents)
				? shippingData.documents.map((d: any) => ({
						content: d?.url ?? d?.content ?? "", // prefer url, fallback to content
						type: d?.typeCode ?? d?.type,
				  }))
				: [],
		};

		return {
			...order,
			dhl_shipment: normalizedDhlShipment,
		};
	};

	// Print access token globally
	useEffect(() => {
		const printAccessToken = async () => {
			const auth = getAuth(app);
			const currentUser = auth.currentUser;

			if (currentUser) {
				try {
					const accessToken = await currentUser.getIdToken(true);
					console.log("🔑 Global Access Token:", accessToken);
				} catch (error) {
					console.log("❌ Failed to get access token:", error);
				}
			} else {
				console.log("❌ No user signed in");
			}
		};

		printAccessToken();
	}, []); // Run once on component mount

	// Normalize orders on mount and when orders prop changes
	useEffect(() => {
		const normalizedOrders = orders.map(normalizeShippingData);
		setOrderData(normalizedOrders);

		// Quick sanity logs
		const firstOrderWithShipping = normalizedOrders.find(
			(o) => o.dhl_shipment?.shipmentTrackingNumber
		);
		if (firstOrderWithShipping) {
			console.log("🔍 Normalization Debug:", {
				orderId: firstOrderWithShipping.id,
				hadShipping: !!firstOrderWithShipping.shipping,
				hasDhlShipment: !!firstOrderWithShipping.dhl_shipment,
				shippingData: firstOrderWithShipping.shipping,
				normalizedDhlShipment: firstOrderWithShipping.dhl_shipment,
			});
		}
	}, [orders]);

	// Reset pickup form when dialog closes
	useEffect(() => {
		if (!isDialogOpen) {
			setShowPickupModal(false);
			setShowTrackingModal(false);
			setTrackingData(null);
			setPickupForm({
				plannedPickupDateAndTime: new Date().toISOString().slice(0, 16),
				closeTime: "18:00",
				location: "reception",
				locationType: "business",
				specialInstructions: "",
			});
		}
	}, [isDialogOpen]);

	// Close dropdown on outside click
	useEffect(() => {
		function onDocClick(e: MouseEvent) {
			if (!dropdownRef.current) return;
			if (!dropdownRef.current.contains(e.target as Node))
				setDropdownOpen(false);
		}
		if (dropdownOpen) document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, [dropdownOpen]);

	const mappedOrders: OrderRow[] = orderData.map((o) => {
		const firstName = o.user_address?.first_name ?? "Unknown";
		const lastName = o.user_address?.last_name ?? "User";

		return {
			id: o.id,
			customerName: `${firstName} ${lastName}`,
			customerEmail: "",
			productName: o.title,
			quantity: o.quantity,
			totalAmount: getPriceValue(o.price) + o.shipping_fee,
			status: o.order_status,
			orderDate: new Date(o.timestamp?.seconds * 1000).toLocaleDateString(),
			deliveryDate: o.delivery_date,
			raw: o,
		};
	});

	const filteredOrders = mappedOrders.filter(
		(order) =>
			order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.id.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
	const paginatedOrders = filteredOrders.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "Picked from vendor":
				return <Badge className="bg-yellow-100 text-yellow-800">Picked</Badge>;
			case "Processing":
				return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
			case "Ready for shipment":
				return <Badge className="bg-purple-100 text-purple-800">Ready</Badge>;
			case "Pickup scheduled":
				return (
					<Badge className="bg-green-100 text-green-800">
						Pickup Scheduled
					</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	const handleStatusUpdate = async (order: OrderRow, newStatus: string) => {
		try {
			setLoadingStatus(true);
			const userId = order.raw.user_id;
			const orderId = order.raw.id;
			if (!userId || !orderId) throw new Error("Missing userId or orderId");

			console.log(userId, orderId);

			// If moving to "Ready for shipment", create DHL shipment first
			// Guard rail: Skip duplicate generation
			if (
				newStatus === "Ready for shipment" &&
				!order.raw.dhl_shipment?.shipmentTrackingNumber
			) {
				const result = await generateDhlShipmentForOrder(userId, orderId);
				if (!result?.ok) {
					throw new Error("DHL shipment failed to create");
				}

				// Update local order with returned shipment (UI-only update)
				const uiShipment = toDhlShipmentUI(result.shipment);
				setOrderData((prev) =>
					prev.map((o) =>
						o.id === orderId ? { ...o, dhl_shipment: uiShipment } : o
					)
				);

				toast.success("📦 DHL shipment created");
			}

			// Now persist the status change in Firestore
			await updateOrderStatus(userId, orderId, newStatus);

			// Update local state for status
			setOrderData((prev) =>
				prev.map((o) =>
					o.id === orderId ? { ...o, order_status: newStatus } : o
				)
			);

			toast.success(`✅ Order ${orderId} updated to ${newStatus}`);

			// Close UI
			setLoadingStatus(false);
			setIsDialogOpen(false);
			setSelectedOrder(null);
			setDropdownOpen(false);
		} catch (err: any) {
			console.error(err);
			toast.error(err?.message || "❌ Failed to update status");
			setLoadingStatus(false);
			setDropdownOpen(false);
		}
	};

	const statusFlow = [
		"Picked from vendor",
		"Processing",
		"Ready for shipment",
		"Pickup scheduled",
	];
	const REGION = "europe-west1"; // <-- your functions region

	async function generateDhlShipmentForOrder(userId: string, orderId: string) {
		const auth = getAuth(app);
		const accessToken = await auth.currentUser?.getIdToken(
			/* forceRefresh? */ true
		);
		if (!accessToken)
			throw new Error("No Firebase ID token (user not signed in)");
		console.log(accessToken);

		const fn = httpsCallable(
			getFunctions(app, REGION),
			"adminGenerateDhlShipmentForOrderV2"
		);
		const res: any = await fn({
			userId,
			orderId,
			accessToken,
			useFulfillmentAddress: true,
		}); // <-- send token
		return res?.data;
	}

	// Optional: adapt callable response to your local OrderPayload shape
	function toDhlShipmentUI(shipment: any): DhlShipment {
		return {
			type: shipment?.type ?? "",
			shipmentTrackingNumber: shipment?.shipmentTrackingNumber ?? "",
			trackingUrl: shipment?.trackingUrl ?? "",
			packages: Array.isArray(shipment?.packages) ? shipment.packages : [],
			// we store label URL in `content` to keep your UI type happy
			documents: Array.isArray(shipment?.documents)
				? shipment.documents.map((d: any) => ({
						content: d?.url ?? d?.content ?? "", // prefer url, fallback to content
						type: d?.typeCode ?? d?.type,
				  }))
				: [],
		};
	}

	// DHL Pickup scheduling function
	async function scheduleDhlPickup(order: OrderRow) {
		try {
			setLoadingPickup(true);

			const auth = getAuth(app);
			const currentUser = auth.currentUser;

			if (!currentUser) {
				toast.error("Not signed in");
				return;
			}

			const accessToken = await currentUser.getIdToken(true);

			if (!accessToken) {
				toast.error("No Firebase ID token (user not signed in)");
				return;
			}

			// Validate required fields
			if (
				!pickupForm.plannedPickupDateAndTime ||
				!pickupForm.closeTime ||
				!pickupForm.location
			) {
				toast.error("Please fill in all required fields");
				return;
			}

			const fn = httpsCallable(
				getFunctions(app, REGION),
				"adminScheduleDhlPickupForOrder"
			);

			const payload: any = {
				userId: order.raw.user_id,
				orderId: order.raw.id,
				plannedPickupDateAndTime: pickupForm.plannedPickupDateAndTime,
				closeTime: pickupForm.closeTime,
				location: pickupForm.location,
				accessToken,
				useFulfillmentAddress: true,
			};

			// Add locationType for domestic orders only
			if (order.raw.dhl_shipment?.type === "domestic") {
				payload.locationType = pickupForm.locationType;
			}

			// Add special instructions if provided
			if (pickupForm.specialInstructions.trim()) {
				payload.specialInstructions = pickupForm.specialInstructions.trim();
			}

			const res: any = await fn(payload);

			if (res?.data?.ok) {
				toast.success("🚚 Pickup scheduled");

				// Update order status to "Pickup scheduled"
				await updateOrderStatus(
					order.raw.user_id,
					order.raw.id,
					"Pickup scheduled"
				);

				// Update local state
				setOrderData((prev) =>
					prev.map((o) =>
						o.id === order.raw.id
							? { ...o, order_status: "Pickup scheduled" }
							: o
					)
				);

				// Close modal and reset form
				setShowPickupModal(false);
				setPickupForm({
					plannedPickupDateAndTime: new Date().toISOString().slice(0, 16),
					closeTime: "18:00",
					location: "reception",
					locationType: "business",
					specialInstructions: "",
				});
				setDropdownOpen(false);
			} else {
				throw new Error("Failed to schedule pickup");
			}
		} catch (err: any) {
			console.error("Pickup scheduling error:", err);
			toast.error(err?.message || "❌ Failed to schedule pickup");
		} finally {
			setLoadingPickup(false);
		}
	}

	// DHL Tracking function
	async function trackDhlShipment(order: OrderRow) {
		try {
			setLoadingTracking(true);

			const auth = getAuth(app);
			const currentUser = auth.currentUser;

			if (!currentUser) {
				toast.error("Not signed in");
				return;
			}

			const accessToken = await currentUser.getIdToken(true);

			if (!accessToken) {
				toast.error("No Firebase ID token (user not signed in)");
				return;
			}

			console.log("🔑 Access Token:", accessToken);

			// Get the tracking number from the order's shipping data
			const trackingNumber =
				order.raw.shipping?.shipmentTrackingNumber ||
				order.raw.dhl_shipment?.shipmentTrackingNumber;

			if (!trackingNumber) {
				toast.error("No tracking number found for this order");
				return;
			}

			const fn = httpsCallable(
				getFunctions(app, "us-central1"), // Note: tracking function is in us-central1
				"trackDhlShipment"
			);

			const res: any = await fn({
				trackingNumber,
				accessToken,
			});

			if (res?.data) {
				setTrackingData(res.data);
				setShowTrackingModal(true);
				toast.success("📦 Tracking data retrieved");
			} else {
				throw new Error("No tracking data received");
			}
		} catch (err: any) {
			console.error("Tracking error:", err);
			toast.error(err?.message || "❌ Failed to track shipment");
		} finally {
			setLoadingTracking(false);
		}
	}

	console.log(paginatedOrders, "paginatedOrders");

	return (
		<Card>
			<CardHeader className="flex flex-col gap-2">
				<div className="flex justify-between items-center">
					<div>
						<CardTitle>Order History</CardTitle>
						<CardDescription>All orders for this vendor</CardDescription>
					</div>
					<div className="flex items-center space-x-2">
						<Input
							placeholder="Search orders..."
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
							className="max-w-sm"
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Order ID</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Product</TableHead>
							<TableHead>Quantity</TableHead>
							<TableHead>Total Amount</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Order Date</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedOrders.map((order) => (
							<TableRow key={order.id}>
								<TableCell className="font-medium">{order.id}</TableCell>
								<TableCell>{order.customerName}</TableCell>
								<TableCell>{order.productName}</TableCell>
								<TableCell>{order.quantity}</TableCell>
								<TableCell>${order.totalAmount.toFixed(2)}</TableCell>
								<TableCell>{getStatusBadge(order.status)}</TableCell>
								<TableCell>{order.orderDate}</TableCell>
								<TableCell>
									<TimelineDialog
										events={order.raw.dhl_events_snapshot ?? []}
									/>
									<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
										<DialogTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setSelectedOrder(order);
													setPreviewImage(order.raw.images[0] || null);
													setIsDialogOpen(true);
													console.log("Order Payload:", order.raw);
												}}
											>
												<Eye className="h-4 w-4 mr-2" />
												View
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
											{selectedOrder && (
												<div className="space-y-6">
													{/* Images Preview */}
													{selectedOrder.raw.images?.length > 0 && (
														<div className="flex flex-col items-center">
															<img
																src={previewImage!}
																alt="Preview"
																className="w-64 h-64 object-cover rounded-md border mb-4"
															/>
															<div className="flex space-x-2 overflow-x-auto">
																{selectedOrder.raw.images.map((img, idx) => (
																	<img
																		key={idx}
																		src={img}
																		alt={`Thumbnail ${idx + 1}`}
																		className={`w-16 h-16 object-cover rounded-md border cursor-pointer ${
																			previewImage === img
																				? "border-blue-500"
																				: "border-gray-200"
																		}`}
																		onClick={() => setPreviewImage(img)}
																	/>
																))}
															</div>
														</div>
													)}

													{/* Order Details Grid */}
													<div className="grid grid-cols-2 gap-4 mt-4">
														<div>
															<p className="font-semibold">Order ID</p>
															<p>{selectedOrder.id}</p>
														</div>
														<div>
															<p className="font-semibold">Customer</p>
															<p>{selectedOrder.customerName}</p>
														</div>
														<div>
															<p className="font-semibold">Email</p>
															<p>{selectedOrder.customerEmail || "N/A"}</p>
														</div>
														<div>
															<p className="font-semibold">Product</p>
															<p>{selectedOrder.productName}</p>
														</div>
														<div>
															<p className="font-semibold">Quantity</p>
															<p>{selectedOrder.quantity}</p>
														</div>
														<div>
															<p className="font-semibold">Total Amount</p>
															<p>${selectedOrder.totalAmount.toFixed(2)}</p>
														</div>
														<div>
															<p className="font-semibold">Status</p>
															<p>{selectedOrder.status}</p>
														</div>
														<div>
															<p className="font-semibold">Order Date</p>
															<p>{selectedOrder.orderDate}</p>
														</div>
														{selectedOrder.deliveryDate && (
															<div>
																<p className="font-semibold">Delivery Date</p>
																<p>{selectedOrder.deliveryDate}</p>
															</div>
														)}
														{selectedOrder.raw.delivery_type && (
															<div>
																<p className="font-semibold">Delivery Type</p>
																<p>{selectedOrder.raw.delivery_type}</p>
															</div>
														)}
														{selectedOrder.raw.size && (
															<div>
																<p className="font-semibold">Size</p>
																<p>{selectedOrder.raw.size}</p>
															</div>
														)}
														<div>
															<p className="font-semibold">Shipping Fee</p>
															<p>${selectedOrder.raw.shipping_fee}</p>
														</div>
													</div>

													{/* Tracking Information */}
													{selectedOrder?.raw?.dhl_shipment && (
														<div className="mt-4 space-y-2">
															<div className="flex items-center justify-between">
																<p className="font-semibold">Tracking</p>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() =>
																		trackDhlShipment(selectedOrder)
																	}
																	disabled={loadingTracking}
																>
																	<Package className="h-4 w-4 mr-2" />
																	{loadingTracking
																		? "Tracking..."
																		: "Track Shipment"}
																</Button>
															</div>
															<a
																href={
																	selectedOrder.raw.dhl_shipment.trackingUrl
																}
																target="_blank"
																rel="noreferrer"
																className="text-blue-600 dark:text-blue-400 underline"
															>
																{
																	selectedOrder.raw.dhl_shipment
																		.shipmentTrackingNumber
																}
															</a>

															{selectedOrder.raw.dhl_shipment.documents
																?.length > 0 && (
																<div className="space-y-1">
																	<p className="font-semibold">Labels</p>
																	{selectedOrder.raw.dhl_shipment.documents.map(
																		(d, i) => (
																			<a
																				key={i}
																				href={d.content} // signed URL
																				target="_blank"
																				rel="noreferrer"
																				className="block text-blue-600 dark:text-blue-400 underline"
																			>
																				Label {i + 1} ({d.type || "label"})
																			</a>
																		)
																	)}
																</div>
															)}
														</div>
													)}

													{/* Status Dropdown */}
													<div
														ref={dropdownRef}
														className="mt-6 relative inline-block text-left"
													>
														<button
															disabled={loadingStatus}
															className="
    inline-flex justify-center w-full rounded-md border px-4 py-2 text-sm font-medium
    bg-white text-gray-700 border-gray-300 hover:bg-gray-50
    disabled:opacity-50
    dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800
  "
															onClick={() => setDropdownOpen((prev) => !prev)}
														>
															{loadingStatus ? "Updating..." : "Update Status"}
															<ChevronDown className="ml-2 w-4 h-4" />
														</button>

														{dropdownOpen && (
															<ul
																className="
    absolute mt-2 w-56 rounded-md shadow-lg ring-1 ring-black/5 z-50
    bg-white text-gray-900
    dark:bg-neutral-900 dark:text-neutral-100 dark:ring-white/10
  "
															>
																{statusFlow.map((status) => {
																	const currentIndex = statusFlow.indexOf(
																		selectedOrder.status
																	);
																	const statusIndex =
																		statusFlow.indexOf(status);
																	let disabled =
																		statusIndex > currentIndex + 1 ||
																		loadingStatus;

																	// No special validation for "Pickup scheduled" - let backend handle it

																	return (
																		<li
																			key={status}
																			className={`
    block px-4 py-2 text-sm cursor-pointer
    ${
			disabled
				? "text-gray-400 dark:text-neutral-500 cursor-not-allowed"
				: "hover:bg-gray-100 dark:hover:bg-neutral-800"
		}
  `}
																			onClick={() => {
																				if (disabled) return;

																				if (status === "Pickup scheduled") {
																					// Open pickup modal instead of updating status directly
																					setShowPickupModal(true);
																					setDropdownOpen(false);
																				} else {
																					handleStatusUpdate(
																						selectedOrder,
																						status
																					);
																				}
																			}}
																		>
																			{status}
																		</li>
																	);
																})}
															</ul>
														)}
													</div>

													{/* Pickup Scheduling Modal */}
													{showPickupModal && selectedOrder && (
														<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
															<div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
																<div className="flex justify-between items-center mb-4">
																	<h3 className="text-lg font-semibold">
																		Schedule DHL Pickup
																	</h3>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => {
																			setShowPickupModal(false);
																			setPickupForm({
																				plannedPickupDateAndTime: new Date()
																					.toISOString()
																					.slice(0, 16),
																				closeTime: "18:00",
																				location: "reception",
																				locationType: "business",
																				specialInstructions: "",
																			});
																		}}
																	>
																		×
																	</Button>
																</div>

																<div className="space-y-4">
																	{/* Pickup Date and Time */}
																	<div className="grid grid-cols-2 gap-4">
																		<div>
																			<Label htmlFor="pickupDateTime">
																				Pickup Date & Time *
																			</Label>
																			<Input
																				id="pickupDateTime"
																				type="datetime-local"
																				value={
																					pickupForm.plannedPickupDateAndTime
																				}
																				onChange={(e) =>
																					setPickupForm((prev) => ({
																						...prev,
																						plannedPickupDateAndTime:
																							e.target.value,
																					}))
																				}
																				disabled={loadingPickup}
																			/>
																			<p className="text-xs text-gray-500 mt-1">
																				Local time
																			</p>
																		</div>
																		<div>
																			<Label htmlFor="closeTime">
																				Close Time *
																			</Label>
																			<Input
																				id="closeTime"
																				type="time"
																				value={pickupForm.closeTime}
																				onChange={(e) =>
																					setPickupForm((prev) => ({
																						...prev,
																						closeTime: e.target.value,
																					}))
																				}
																				disabled={loadingPickup}
																			/>
																		</div>
																	</div>

																	{/* Location */}
																	<div>
																		<Label htmlFor="location">
																			Pickup Location *
																		</Label>
																		<Input
																			id="location"
																			placeholder="e.g., Reception / Front desk"
																			value={pickupForm.location}
																			onChange={(e) =>
																				setPickupForm((prev) => ({
																					...prev,
																					location: e.target.value,
																				}))
																			}
																			disabled={loadingPickup}
																		/>
																	</div>

																	{/* Location Type - only for domestic orders */}
																	{selectedOrder.raw.dhl_shipment?.type ===
																		"domestic" && (
																		<div>
																			<Label htmlFor="locationType">
																				Location Type *
																			</Label>
																			<Select
																				value={pickupForm.locationType}
																				onValueChange={(
																					value: "business" | "residential"
																				) =>
																					setPickupForm((prev) => ({
																						...prev,
																						locationType: value,
																					}))
																				}
																				disabled={loadingPickup}
																			>
																				<SelectTrigger>
																					<SelectValue />
																				</SelectTrigger>
																				<SelectContent>
																					<SelectItem value="business">
																						Business
																					</SelectItem>
																					<SelectItem value="residential">
																						Residential
																					</SelectItem>
																				</SelectContent>
																			</Select>
																		</div>
																	)}

																	{/* Special Instructions */}
																	<div>
																		<Label htmlFor="specialInstructions">
																			Special Instructions
																		</Label>
																		<Textarea
																			id="specialInstructions"
																			placeholder="Any special pickup instructions..."
																			value={pickupForm.specialInstructions}
																			onChange={(e) =>
																				setPickupForm((prev) => ({
																					...prev,
																					specialInstructions: e.target.value,
																				}))
																			}
																			disabled={loadingPickup}
																			rows={3}
																		/>
																	</div>

																	{/* Action Buttons */}
																	<div className="flex justify-end space-x-3 pt-4">
																		<Button
																			variant="outline"
																			onClick={() => {
																				setShowPickupModal(false);
																				setPickupForm({
																					plannedPickupDateAndTime: new Date()
																						.toISOString()
																						.slice(0, 16),
																					closeTime: "18:00",
																					location: "reception",
																					locationType: "business",
																					specialInstructions: "",
																				});
																			}}
																			disabled={loadingPickup}
																		>
																			Cancel
																		</Button>
																		<Button
																			onClick={() =>
																				scheduleDhlPickup(selectedOrder)
																			}
																			disabled={loadingPickup}
																		>
																			{loadingPickup
																				? "Scheduling..."
																				: "Schedule Pickup"}
																		</Button>
																	</div>
																</div>
															</div>
														</div>
													)}

													{/* Tracking Results Modal */}
													{showTrackingModal && trackingData && (
														<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
															<div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
																<div className="flex justify-between items-center mb-4">
																	<h3 className="text-lg font-semibold">
																		Shipment Tracking Details
																	</h3>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => {
																			setShowTrackingModal(false);
																			setTrackingData(null);
																		}}
																	>
																		×
																	</Button>
																</div>

																<div className="space-y-4">
																	{/* Display tracking data */}
																	<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
																		<pre className="text-sm overflow-auto whitespace-pre-wrap">
																			{JSON.stringify(trackingData, null, 2)}
																		</pre>
																	</div>

																	{/* Action Buttons */}
																	<div className="flex justify-end space-x-3 pt-4">
																		<Button
																			variant="outline"
																			onClick={() => {
																				setShowTrackingModal(false);
																				setTrackingData(null);
																			}}
																		>
																			Close
																		</Button>
																	</div>
																</div>
															</div>
														</div>
													)}
												</div>
											)}
										</DialogContent>
									</Dialog>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				{/* Pagination */}
				{totalPages > 1 && (
					<Pagination className="mt-4">
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
								/>
							</PaginationItem>
							{Array.from({ length: totalPages }, (_, i) => (
								<PaginationItem
									key={i}
									className={`cursor-pointer ${
										currentPage === i + 1 ? "font-bold" : ""
									}`}
									onClick={() => setCurrentPage(i + 1)}
								>
									{i + 1}
								</PaginationItem>
							))}
							<PaginationItem>
								<PaginationNext
									onClick={() =>
										setCurrentPage((p) => Math.min(p + 1, totalPages))
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				)}
			</CardContent>
		</Card>
	);
}
