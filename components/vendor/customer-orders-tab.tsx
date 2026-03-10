"use client";

import { useState, useEffect } from "react";
import { Eye, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { type PriceType } from "@/lib/priceUtils";
import { formatUSD } from "@/lib/utils/currency";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { getOrdersByUserId } from "@/admin-services/userService";

// === Interfaces ===
export interface OrderPayload {
	delivery_date: string;
	delivery_type: string;
	dhl_shipment: DhlShipment;
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
}

export interface DhlShipment {
	documents: DhlDocument[];
	packages: DhlPackage[];
	shipmentTrackingNumber: string;
	trackingUrl: string;
	type: string;
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

// === UI Table Row Type ===
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
	userId: string;
}


export function CustomerOrdersTab({ userId }: OrdersTabProps) {
	const [orders, setOrders] = useState<OrderPayload[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const rowsPerPage = 5;

	console.log(orders);

	useEffect(() => {
		async function fetchOrders() {
			try {
				setLoading(true);
				const data = await getOrdersByUserId(userId); // Firestore query
				setOrders(data || []);
			} catch (err: any) {
				setError(err.message || "Failed to fetch orders");
			} finally {
				setLoading(false);
			}
		}
		if (userId) {
			fetchOrders();
		}
	}, [userId]);

	function getNumericPrice(price: PriceType): number {
	if (typeof price === "number") {
		return price;
	}

	if (typeof price === "object" && price !== null) {
		const base = price.base ?? 0;
		const discount = price.discount ?? 0;
		return base - discount;
	}

	return 0;
}


	// Map API payload into UI table rows
	const mappedOrders: OrderRow[] = orders.map((o) => ({
	id: o.id,
	customerName: `${o.user_address.first_name} ${o.user_address.last_name}`,
	customerEmail: "",
	productName: o.title,
	quantity: o.quantity,
	totalAmount: getNumericPrice(o.price) + o.shipping_fee,
	status: o.order_status,
	orderDate: new Date(o.timestamp.seconds * 1000).toLocaleDateString(),
	deliveryDate: o.delivery_date,
	raw: o,
}));


	// Search filter
	const filteredOrders = mappedOrders.filter(
		(order) =>
			order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.id.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Pagination slice
	const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
	const paginatedOrders = filteredOrders.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "completed":
				return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
			case "processing":
				return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
			case "shipped":
				return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>;
			case "cancelled":
				return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
			default:
				return <Badge>{status}</Badge>;
		}
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Order History</CardTitle>
					<CardDescription>Loading orders...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Order History</CardTitle>
					<CardDescription className="text-red-500">{error}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Order History</CardTitle>
				<CardDescription>All orders for this customer</CardDescription>
				<div className="flex items-center space-x-2">
					<Search className="h-4 w-4 text-muted-foreground" />
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
								<TableCell>{formatUSD(order.totalAmount)}</TableCell>
								<TableCell>{getStatusBadge(order.status)}</TableCell>
								<TableCell>{order.orderDate}</TableCell>
								<TableCell>
									<Dialog>
										<DialogTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setSelectedOrder(order)}
											>
												<Eye className="h-4 w-4 mr-2" />
												View
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-3xl">
											<DialogHeader>
												<DialogTitle>Order Details</DialogTitle>
												<DialogDescription>
													Detailed information for order {selectedOrder?.id}
												</DialogDescription>
											</DialogHeader>
											{selectedOrder && (
												<div className="space-y-6">
													<div className="grid grid-cols-2 gap-4">
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
															<p>{formatUSD(selectedOrder.totalAmount)}</p>
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
													</div>

													{selectedOrder.raw.images.length > 0 && (
														<div>
															<p className="font-semibold mb-2">
																Product Images
															</p>
															<div className="grid grid-cols-2 gap-4">
																{selectedOrder.raw.images.map((img, idx) => (
																	<img
																		key={idx}
																		src={img}
																		alt={`Order ${selectedOrder.id} Image ${
																			idx + 1
																		}`}
																		className="w-32 h-32 object-cover rounded-md border"
																	/>
																))}
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
