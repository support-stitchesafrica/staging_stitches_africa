"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import {
	Search,
	MoreHorizontal,
	Package,
	Clock,
	CheckCircle,
	XCircle,
	AlertCircle,
	Eye,
	MessageSquare,
	Download,
	RefreshCw,
	Grid3X3,
	List,
	ArrowUpDown,
	Loader2,
	Truck,
	MapPin,
	Phone,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getAllOrdersForTailor,
	UserOrder,
} from "@/vendor-services/TailorOrders";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

const getStatusConfig = (status: string) => {
	const normalizedStatus = status?.toLowerCase().replace(/[_\s]/g, "");

	switch (normalizedStatus) {
		case "pending":
		case "orderplaced":
			return {
				label: "Pending",
				color: "text-amber-600",
				bgColor: "bg-amber-50",
				dotColor: "bg-amber-400",
			};
		case "inprogress":
		case "processing":
		case "confirmed":
			return {
				label: "In Progress",
				color: "text-blue-600",
				bgColor: "bg-blue-50",
				dotColor: "bg-blue-400",
			};
		case "shipped":
		case "intransit":
			return {
				label: "Shipped",
				color: "text-purple-600",
				bgColor: "bg-purple-50",
				dotColor: "bg-purple-400",
			};
		case "delivered":
		case "completed":
			return {
				label: "Delivered",
				color: "text-emerald-600",
				bgColor: "bg-emerald-50",
				dotColor: "bg-emerald-400",
			};
		case "cancelled":
		case "canceled":
			return {
				label: "Cancelled",
				color: "text-red-600",
				bgColor: "bg-red-50",
				dotColor: "bg-red-400",
			};
		default:
			return {
				label: status || "Unknown",
				color: "text-gray-600",
				bgColor: "bg-gray-50",
				dotColor: "bg-gray-400",
			};
	}
};

// Get product image with fallback to category images
const getProductImage = (order: UserOrder) => {
	// Use actual product image if available
	if (order.images && order.images.length > 0) {
		return order.images[0];
	}

	// Fallback to category-based placeholder images
	const categoryImages: { [key: string]: string } = {
		dress:
			"https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=400&fit=crop",
		suit: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
		blazer:
			"https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
		gown: "https://images.unsplash.com/photo-1566479179817-c0ae8e4b4b3d?w=400&h=400&fit=crop",
		agbada:
			"https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400&h=400&fit=crop",
		shirt:
			"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop",
		trouser:
			"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop",
		skirt:
			"https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=400&h=400&fit=crop",
	};

	const category = order.wear_category?.toLowerCase() || "dress";
	return categoryImages[category] || categoryImages["dress"];
};

export default function FarfetchOrders() {
	const [orders, setOrders] = useState<UserOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("date");
	const [viewMode, setViewMode] = useState<"grid" | "list">("list");
	const [tailorId, setTailorId] = useState<string | null>(null);

	const router = useRouter();

	// Get current user and fetch orders
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				setTailorId(user.uid);
				try {
					setLoading(true);
					const tailorOrders = await getAllOrdersForTailor(user.uid);
					setOrders(tailorOrders);
				} catch (error) {
					console.error("Error fetching orders:", error);
					toast.error("Failed to load orders");
				} finally {
					setLoading(false);
				}
			} else {
				router.push("/vendor");
			}
		});

		return () => unsubscribe();
	}, [router]);

	// Filter and sort orders
	const filteredOrders = orders
		.filter((order) => {
			const matchesSearch =
				order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
				`${order.user_address.first_name} ${order.user_address.last_name}`
					.toLowerCase()
					.includes(searchTerm.toLowerCase());

			const matchesStatus =
				statusFilter === "all" ||
				order.order_status.toLowerCase().replace(/[_\s]/g, "") ===
					statusFilter.toLowerCase().replace(/[_\s]/g, "");

			return matchesSearch && matchesStatus;
		})
		.sort((a, b) => {
			switch (sortBy) {
				case "date":
					return (
						new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
					);
				case "amount":
					return (
						(b.original_price ?? b.price) * b.quantity +
						b.shipping_fee -
						((a.original_price ?? a.price) * a.quantity + a.shipping_fee)
					);
				case "customer":
					return `${a.user_address.first_name} ${a.user_address.last_name}`.localeCompare(
						`${b.user_address.first_name} ${b.user_address.last_name}`,
					);
				default:
					return 0;
			}
		});

	const OrderListItem = ({ order }: { order: UserOrder }) => {
		const statusConfig = getStatusConfig(order.order_status);
		const price = order.original_price ?? order.price;
		const totalAmount = price * order.quantity + order.shipping_fee;
		const customerName = `${order.user_address.first_name} ${order.user_address.last_name}`;

		return (
			<div
				className="group border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer"
				onClick={() => router.push(`/vendor/orders/${order.order_id}`)}
			>
				<div className="px-4 sm:px-6 py-4 sm:py-6">
					{/* Mobile Layout */}
					<div className="flex flex-col sm:hidden space-y-3">
						<div className="flex items-start space-x-3">
							<div className="relative flex-shrink-0">
								<img
									src={getProductImage(order)}
									alt={order.title}
									className="w-20 h-20 object-cover rounded-lg"
								/>
								<div
									className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusConfig.dotColor}`}
								/>
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between mb-1">
									<span className="text-xs font-medium text-gray-600 truncate">
										{order.order_id}
									</span>
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
									>
										{statusConfig.label}
									</span>
								</div>
								<h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
									{order.title}
								</h3>
								<div className="flex items-center space-x-2 text-xs text-gray-500">
									{order.color && <span>Color: {order.color}</span>}
									{order.size && (
										<>
											<span>•</span>
											<span>Size: {order.size}</span>
										</>
									)}
								</div>
							</div>
						</div>

						<div className="flex items-center justify-between text-sm">
							{/* <div className="flex items-center space-x-2 text-gray-600">
								<User className="h-3 w-3" />
								<span className="text-xs">{customerName}</span>
							</div> */}
							<div className="text-right">
								<p className="text-base font-semibold text-gray-900">
									${totalAmount.toFixed(2)}
								</p>
								<p className="text-xs text-gray-500">Qty: {order.quantity}</p>
							</div>
						</div>

						<div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
							<span>
								{new Date(order.timestamp).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</span>
							<span>
								Due{" "}
								{new Date(order.delivery_date).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								})}
							</span>
						</div>
					</div>

					{/* Desktop Layout */}
					<div className="hidden sm:flex items-center justify-between">
						{/* Left section - Product info */}
						<div className="flex items-center space-x-4 flex-1">
							<div className="relative">
								<img
									src={getProductImage(order)}
									alt={order.title}
									className="w-20 h-20 object-cover rounded-lg"
								/>
								<div
									className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusConfig.dotColor}`}
								/>
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center space-x-3 mb-1">
									<h3 className="font-medium text-gray-900 text-sm tracking-wide">
										{order.order_id}
									</h3>
									<span
										className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
									>
										{statusConfig.label}
									</span>
								</div>

								<p className="text-gray-900 font-medium mb-1">{order.title}</p>

								<div className="flex items-center space-x-4 text-sm text-gray-500">
									{/* <span className="flex items-center">
										<User className="h-3 w-3 mr-1" />
										{customerName}
									</span> */}
									{/* <span>•</span> */}
									<span>
										{new Date(order.timestamp).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</span>
									<span>•</span>
									<span>Qty: {order.quantity}</span>
									{order.color && (
										<>
											<span>•</span>
											<span>Color: {order.color}</span>
										</>
									)}
									{order.size && (
										<>
											<span>•</span>
											<span>Size: {order.size}</span>
										</>
									)}
								</div>

								{/* Shipping info */}
								{order.dhl_shipment?.trackingUrl && (
									<div className="flex items-center space-x-2 mt-2">
										<Truck className="h-3 w-3 text-blue-500" />
										<a
											href={order.dhl_shipment.trackingUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-blue-600 hover:text-blue-800 underline"
											onClick={(e) => e.stopPropagation()}
										>
											Track Package
										</a>
									</div>
								)}
							</div>
						</div>

						{/* Right section - Price and actions */}
						<div className="flex items-center space-x-6">
							<div className="text-right">
								<p className="text-lg font-semibold text-gray-900">
									${totalAmount.toFixed(2)}
								</p>
								<p className="text-sm text-gray-500">
									Due{" "}
									{new Date(order.delivery_date).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})}
								</p>
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											router.push(`/vendor/orders/${order.order_id}`);
										}}
									>
										<Eye className="mr-2 h-4 w-4" />
										View Details
									</DropdownMenuItem>
									<DropdownMenuItem onClick={(e) => e.stopPropagation()}>
										<MessageSquare className="mr-2 h-4 w-4" />
										Contact Customer
									</DropdownMenuItem>
									<DropdownMenuItem onClick={(e) => e.stopPropagation()}>
										<Download className="mr-2 h-4 w-4" />
										Download Invoice
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={(e) => e.stopPropagation()}>
										Update Status
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{/* Customer Address - Desktop only */}
					{/* <div className="hidden sm:block mt-3 pl-24">
						<div className="flex items-center text-sm text-gray-500">
							<MapPin className="h-3 w-3 mr-1" />
							<span>
								{order.user_address.street_address}, {order.user_address.city},{" "}
								{order.user_address.state}, {order.user_address.country}
							</span>
						</div>
						<div className="flex items-center text-sm text-gray-500 mt-1">
							<Phone className="h-3 w-3 mr-1" />
							<span>
								{order.user_address.dial_code} {order.user_address.phone_number}
							</span>
						</div>
					</div> */}
				</div>
			</div>
		);
	};

	const OrderGridItem = ({ order }: { order: UserOrder }) => {
		const statusConfig = getStatusConfig(order.order_status);
		const price = order.original_price ?? order.price;
		const totalAmount = price * order.quantity + order.shipping_fee;
		const customerName = `${order.user_address.first_name} ${order.user_address.last_name}`;

		return (
			<Card
				className="group hover:shadow-lg transition-all duration-300 border-gray-200 overflow-hidden cursor-pointer"
				onClick={() => router.push(`/vendor/orders/${order.order_id}`)}
			>
				<div className="relative">
					<img
						src={getProductImage(order)}
						alt={order.title}
						className="w-full h-48 object-cover"
					/>
					<div
						className={`absolute top-3 right-3 w-3 h-3 rounded-full ${statusConfig.dotColor}`}
					/>

					<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
				</div>

				<CardContent className="p-4">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-gray-600 truncate">
							{order.order_id}
						</span>
						<span
							className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
						>
							{statusConfig.label}
						</span>
					</div>

					<h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
						{order.title}
					</h3>

					<p className="text-sm text-gray-600 mb-1">{customerName}</p>
					<div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
						<span>Qty: {order.quantity}</span>
						{order.color && (
							<>
								<span>•</span>
								<span>Color: {order.color}</span>
							</>
						)}
						{order.size && (
							<>
								<span>•</span>
								<span>Size: {order.size}</span>
							</>
						)}
					</div>

					<div className="flex items-center justify-between">
						<span className="text-lg font-semibold text-gray-900">
							${totalAmount.toFixed(2)}
						</span>

						<Button
							variant="ghost"
							size="sm"
							className="opacity-0 group-hover:opacity-100 transition-opacity"
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/vendor/orders/${order.order_id}`);
							}}
						>
							<Eye className="h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-white">
				<ModernNavbar />
				<div className="flex items-center justify-center h-96">
					<div className="flex items-center space-x-2">
						<Loader2 className="h-6 w-6 animate-spin text-gray-600" />
						<span className="text-gray-600">Loading orders...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<ModernNavbar />

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="py-6 sm:py-8 border-b border-gray-100">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-light text-gray-900 tracking-wide mb-2">
								Orders
							</h1>
							<p className="text-gray-600">
								{filteredOrders.length}{" "}
								{filteredOrders.length === 1 ? "order" : "orders"}
							</p>
						</div>

						<div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
							<Button
								variant="outline"
								size="sm"
								className="border-gray-300 text-gray-700 flex-shrink-0"
								onClick={() => {
									// Refresh orders
									if (tailorId) {
										setLoading(true);
										getAllOrdersForTailor(tailorId)
											.then(setOrders)
											.catch((error) => {
												console.error("Error refreshing orders:", error);
												toast.error("Failed to refresh orders");
											})
											.finally(() => setLoading(false));
									}
								}}
							>
								<RefreshCw className="h-4 w-4 sm:mr-2" />
								<span className="hidden sm:inline">Refresh</span>
							</Button>

							<Button
								variant="outline"
								size="sm"
								className="border-gray-300 text-gray-700 flex-shrink-0"
							>
								<Download className="h-4 w-4 sm:mr-2" />
								<span className="hidden sm:inline">Export</span>
							</Button>

							<div className="flex items-center border border-gray-300 rounded-md flex-shrink-0">
								<Button
									variant={viewMode === "list" ? "default" : "ghost"}
									size="sm"
									onClick={() => setViewMode("list")}
									className="rounded-r-none border-0"
								>
									<List className="h-4 w-4" />
								</Button>
								<Button
									variant={viewMode === "grid" ? "default" : "ghost"}
									size="sm"
									onClick={() => setViewMode("grid")}
									className="rounded-l-none border-0"
								>
									<Grid3X3 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="py-4 sm:py-6 border-b border-gray-100">
					<div className="flex flex-col gap-4">
						{/* Search */}
						<div className="w-full">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									placeholder="Search orders..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 border-gray-300 focus:border-gray-400 focus:ring-0"
								/>
							</div>
						</div>

						{/* Filters */}
						<div className="flex items-center gap-3">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="flex-1 sm:w-40 border-gray-300">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="inprogress">In Progress</SelectItem>
									<SelectItem value="shipped">Shipped</SelectItem>
									<SelectItem value="delivered">Delivered</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
								</SelectContent>
							</Select>

							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger className="flex-1 sm:w-40 border-gray-300">
									<ArrowUpDown className="h-4 w-4 mr-2" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="date">Date</SelectItem>
									<SelectItem value="amount">Amount</SelectItem>
									<SelectItem value="customer">Customer</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Orders */}
				<div className="py-6">
					{filteredOrders.length > 0 ? (
						viewMode === "list" ? (
							<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
								{filteredOrders.map((order) => (
									<OrderListItem key={order.order_id} order={order} />
								))}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
								{filteredOrders.map((order) => (
									<OrderGridItem key={order.order_id} order={order} />
								))}
							</div>
						)
					) : (
						<div className="text-center py-12">
							<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Package className="h-8 w-8 text-gray-400" />
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No orders found
							</h3>
							<p className="text-gray-600">
								{searchTerm || statusFilter !== "all"
									? "Try adjusting your search or filters"
									: "You don't have any orders yet"}
							</p>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
