"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import
{
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
	ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import
{
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import
{
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import
{
	getAllOrdersForTailor,
	UserOrder,
	GroupedOrder,
} from "@/vendor-services/TailorOrders";
import { getTailorOrders, TailorOrder } from "@/vendor-services/TailorOrderService";
import { getVendorOrderPaymentStatuses, OrderPaymentStatus } from "@/vendor-services/getVendorOrderPaymentStatuses";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

const getStatusConfig = (status: string) =>
{
	const normalizedStatus = status?.toLowerCase().replace(/[_\s]/g, "");

	switch (normalizedStatus)
	{
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
const getProductImage = (order: UserOrder) =>
{
	// Use actual product image if available
	if (order.images && order.images.length > 0)
	{
		return order.images[0];
	}

	// Fallback to category-based placeholder images
	const categoryImages: { [key: string]: string } = {
		dress:
			"https://ik.imagekit.io/mztf7lvnc/stitches/pexels-alpha-paul-696966661-20009925.jpg?updatedAt=1780843426872",
		suit: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
		blazer:
			"https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
		gown: "https://images.unsplash.com/photo-1566479179817-c0ae8e4b4b3d?w=400&h=400&fit=crop",
		agbada:
			"https://ik.imagekit.io/mztf7lvnc/stitches/pexels-biola-visuals-415017893-20455702.jpg?updatedAt=1780843426809",
		shirt:
			"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop",
		trouser:
			"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop",
		bags:
			"https://ik.imagekit.io/mztf7lvnc/stitches/irene-kredenets-tcVH_BwHtrc-unsplash.jpg",
		footwear:
			"https://ik.imagekit.io/mztf7lvnc/stitches/laura-chouette-sl963NLr3bI-unsplash.jpg",
		accessories:
			"https://ik.imagekit.io/mztf7lvnc/stitches/nischal-kanishk-S7a1XZ7a2vw-unsplash.jpg",
		other:
			"https://ik.imagekit.io/mztf7lvnc/stitches/nischal-kanishk-S7a1XZ7a2vw-unsplash.jpg",
	};

	const category = order.wear_category?.toLowerCase() || "dress";
	return categoryImages[category] || categoryImages["dress"];
};

const getItemLineTotal = (item: UserOrder, isNGN: boolean): number =>
{
	if (isNGN)
	{
		return (item.source_original_price ?? (item.original_price ?? item.price) * 1500) * item.quantity;
	}
	return (item.original_price ?? item.price) * item.quantity;
};

const getOrderDisplayAmount = (order: GroupedOrder, isNGN: boolean): number =>
{
	if (isNGN)
	{
		return order.items.reduce((sum, item) => sum + getItemLineTotal(item, isNGN), 0);
	}
	return order.total_amount;
};

const formatAmount = (amount: number, isNGN: boolean): string =>
{
	return isNGN
		? `\u20a6${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
		: `$${amount.toFixed(2)}`;
};

const getItemDetailId = (item: UserOrder, orderId: string): string =>
	item.doc_id || orderId;

const getMultiItemTitle = (order: GroupedOrder): string =>
{
	const first = order.items[0]?.title ?? "Order";
	if (order.items.length === 2) return `${first} + 1 more`;
	return `${first} + ${order.items.length - 1} more`;
};

export default function FarfetchOrders()
{
	const [orders, setOrders] = useState<GroupedOrder[]>([]);
	const [tailorOrders, setTailorOrders] = useState<TailorOrder[]>([]);
	const [userOrderStatuses, setUserOrderStatuses] = useState<OrderPaymentStatus[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
	const [viewMode, setViewMode] = useState<"grid" | "list">("list");
	const [tailorId, setTailorId] = useState<string | null>(null);

	const router = useRouter();

	// Get current user and fetch orders
	useEffect(() =>
	{
		const unsubscribe = onAuthStateChanged(auth, async (user) =>
		{
			if (user)
			{
				setTailorId(user.uid);
				try
				{
					setLoading(true);
					const [tailorGroupedOrders, subcollectionOrders, paymentStatuses] = await Promise.all([
						getAllOrdersForTailor(user.uid),
						getTailorOrders(user.uid),
						getVendorOrderPaymentStatuses(user.uid),
					]);
					setOrders(tailorGroupedOrders);
					setTailorOrders(subcollectionOrders);
					setUserOrderStatuses(paymentStatuses);

					console.log("[vendor/orders] grouped orders (GroupedOrder[])", tailorGroupedOrders);
					console.log("[vendor/orders] tailor subcollection (TailorOrder[])", subcollectionOrders);
					console.log("[vendor/orders] payment statuses", paymentStatuses);
					if (tailorGroupedOrders.length > 0)
					{
						console.log("[vendor/orders] sample grouped order", tailorGroupedOrders[0]);
						console.log("[vendor/orders] sample line items", tailorGroupedOrders[0].items);
					}
				} catch (error)
				{
					console.error("Error fetching orders:", error);
					toast.error("Failed to load orders");
				} finally
				{
					setLoading(false);
				}
			} else
			{
				router.push("/vendor");
			}
		});

		return () => unsubscribe();
	}, [router]);

	// Filter and sort orders
	const filteredOrders = orders
		.filter((order) =>
		{
			const titleMatch = order.items.some((item) =>
				item.title.toLowerCase().includes(searchTerm.toLowerCase())
			);
			const matchesSearch =
				order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
				`${order.user_address.first_name} ${order.user_address.last_name}`
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				titleMatch;

			const matchesStatus =
				statusFilter === "all" ||
				order.order_status.toLowerCase().replace(/[_\s]/g, "") ===
				statusFilter.toLowerCase().replace(/[_\s]/g, "");

			return matchesSearch && matchesStatus;
		})
		.sort((a, b) =>
		{
			switch (sortBy)
			{
				case "newest":
				case "date": {
					const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
					const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
					return dateB - dateA;
				}
				case "oldest": {
					const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
					const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
					return dateA - dateB;
				}
				case "amount":
					return b.total_amount - a.total_amount;
				case "customer":
					return `${a.user_address.first_name} ${a.user_address.last_name}`.localeCompare(
						`${b.user_address.first_name} ${b.user_address.last_name}`,
					);
				default:
					return 0;
			}
		});

	// Prefer payment_status from users_orders (written by marketing portal),
	// fall back to tailors/{id}/orders subcollection
	const getPaymentStatus = (orderId: string): "unpaid" | "paid" =>
	{
		const fromUserOrders = userOrderStatuses.find((o) => o.order_id === orderId);
		if (fromUserOrders) return fromUserOrders.payment_status;
		// VVIP mirror rows use `{masterOrderId}_{lineIndex}` while the list groups by master id
		const fromVvipLine = userOrderStatuses.find(
			(o) => o.order_id.startsWith(`${orderId}_`) || o.doc_id.startsWith(`${orderId}_`),
		);
		if (fromVvipLine) return fromVvipLine.payment_status;
		const fromTailorOrders = tailorOrders.find((o) => o.order_id === orderId);
		return fromTailorOrders?.payment_status ?? "unpaid";
	};

	const PaymentBadge = ({ orderId }: { orderId: string }) =>
	{
		const status = getPaymentStatus(orderId);
		return status === "paid"
			? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ Paid</span>
			: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Unpaid</span>;
	};

	const OrderItemBreakdown = ({
		order,
		isNGN,
		className,
	}: {
		order: GroupedOrder;
		isNGN: boolean;
		className?: string;
	}) => (
		<div
			className={cn("w-full space-y-1 border-t border-gray-100 pt-3", className)}
			onClick={(e) => e.stopPropagation()}
		>
			{order.items.map((item) =>
			{
				const itemDetailId = getItemDetailId(item, order.order_id);
				return (
					<div
						key={item.doc_id || `${item.product_id}-${item.size ?? ""}-${item.color ?? ""}`}
						role="button"
						tabIndex={0}
						onClick={(e) =>
						{
							e.stopPropagation();
							router.push(`/vendor/orders/${itemDetailId}`);
						}}
						onKeyDown={(e) =>
						{
							if (e.key === "Enter" || e.key === " ")
							{
								e.preventDefault();
								e.stopPropagation();
								router.push(`/vendor/orders/${itemDetailId}`);
							}
						}}
						className="flex w-full items-center justify-between gap-3 py-2 cursor-pointer transition-colors hover:opacity-80"
					>
						<div className="flex items-center gap-3 min-w-0 flex-1">
							<img
								src={getProductImage(item)}
								alt={item.title}
								className="w-10 h-10 rounded object-cover shrink-0"
							/>
							<div className="min-w-0">
								<p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
								<p className="text-xs text-gray-500">Qty: {item.quantity}</p>
							</div>
						</div>
						<span className="text-sm font-medium text-gray-900 shrink-0">
							{formatAmount(getItemLineTotal(item, isNGN), isNGN)}
						</span>
					</div>
				);
			})}
		</div>
	);

	const OrderListItem = ({ order }: { order: GroupedOrder }) =>
	{
		const [expanded, setExpanded] = useState(false);
		const statusConfig = getStatusConfig(order.order_status);
		const isNGN = order.source_currency === "NGN" || order.currency === "NGN";
		const firstItem = order.items[0];
		const isMultiItem = order.items.length > 1;
		const detailId = getItemDetailId(firstItem, order.order_id);
		const displayAmount = getOrderDisplayAmount(order, isNGN);
		const formattedAmount = formatAmount(displayAmount, isNGN);
		const titleText = isMultiItem ? getMultiItemTitle(order) : firstItem.title;

		const handleRowClick = () =>
		{
			if (isMultiItem) setExpanded((prev) => !prev);
			else router.push(`/vendor/orders/${detailId}`);
		};

		const orderActionsMenu = (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/vendor/orders/${detailId}`); }}>
						<Eye className="mr-2 h-4 w-4" />View Details
					</DropdownMenuItem>
					<DropdownMenuItem onClick={(e) => e.stopPropagation()}>
						<MessageSquare className="mr-2 h-4 w-4" />Contact Customer
					</DropdownMenuItem>
					<DropdownMenuItem onClick={(e) => e.stopPropagation()}>
						<Download className="mr-2 h-4 w-4" />Download Invoice
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={(e) => e.stopPropagation()}>Update Status</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);

		return (
			<div
				key={order.order_id}
				className="group border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer"
				onClick={handleRowClick}
			>
				<div className="px-4 sm:px-6 py-4 sm:py-5">
					{/* Mobile Layout */}
					<div className="flex flex-col sm:hidden w-full space-y-3">
						<div className="flex items-start space-x-3 w-full">
							<div className="relative shrink-0">
								<img src={getProductImage(firstItem)} alt={firstItem.title} className="w-16 h-16 object-cover rounded-lg" />
								<div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusConfig.dotColor}`} />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between mb-1">
									<span className="text-xs font-medium text-gray-500 truncate">{order.order_id}</span>
									<div className="flex items-center gap-1">
										<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
											{statusConfig.label}
										</span>
										<PaymentBadge orderId={order.order_id} />
									</div>
								</div>
								<h3 className="text-sm font-medium text-gray-900 mb-0.5 line-clamp-2">
									{titleText}
									{isMultiItem && (
										<ChevronRight
											className={cn(
												"inline-block h-4 w-4 ml-0.5 -mt-0.5 align-middle text-green-600 transition-transform",
												expanded && "rotate-90",
											)}
										/>
									)}
								</h3>
								<p className="text-xs text-gray-500">
									{order.items.length} item{order.items.length !== 1 ? "s" : ""} · qty: {order.items.reduce((s, i) => s + i.quantity, 0)}
								</p>
							</div>
						</div>
						{isMultiItem && expanded && (
							<OrderItemBreakdown order={order} isNGN={isNGN} />
						)}
						<div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 w-full">
							<span>{new Date(order.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
							<span className="font-semibold text-gray-900 text-sm">{formattedAmount}</span>
						</div>
					</div>

					{/* Desktop Layout */}
					<div className="hidden sm:flex flex-col w-full">
						<div className="flex items-center justify-between w-full">
							<div className="flex items-center space-x-4 flex-1 min-w-0">
								<img src={getProductImage(firstItem)} alt={firstItem.title} className="w-16 h-16 object-cover rounded-lg shrink-0" />
								<div className="flex-1 min-w-0">
									<div className="flex items-center space-x-3 mb-1">
										<span className="text-xs font-medium text-gray-500 tracking-wide">{order.order_id}</span>
										<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
											{statusConfig.label}
										</span>
										<PaymentBadge orderId={order.order_id} />
										{isMultiItem && (
											<span className="text-xs text-gray-500">{order.items.length} items</span>
										)}
									</div>
									<p className="text-gray-900 font-medium mb-1 line-clamp-2">
										{titleText}
										{isMultiItem && (
											<ChevronRight
												className={cn(
													"inline-block h-4 w-4 ml-0.5 -mt-0.5 align-middle text-green-600 transition-transform",
													expanded && "rotate-90",
												)}
											/>
										)}
									</p>
									<div className="flex items-center space-x-3 text-sm text-gray-500">
										<span>{new Date(order.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
										<span>•</span>
										<span>Qty: {order.items.reduce((s, i) => s + i.quantity, 0)}</span>
									</div>
									{firstItem.dhl_shipment?.trackingUrl && (
										<div className="flex items-center space-x-2 mt-1">
											<Truck className="h-3 w-3 text-blue-500" />
											<a href={firstItem.dhl_shipment.trackingUrl} target="_blank" rel="noopener noreferrer"
												className="text-xs text-blue-600 hover:text-blue-800 underline" onClick={(e) => e.stopPropagation()}>
												Track Package
											</a>
										</div>
									)}
								</div>
							</div>
							<div className="flex items-center space-x-6 shrink-0">
								<div className="text-right">
									<p className="text-base font-semibold text-gray-900">{formattedAmount}</p>
									<p className="text-sm text-gray-500">
										Due {new Date(order.delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
									</p>
								</div>
								{orderActionsMenu}
							</div>
						</div>
						{isMultiItem && expanded && (
							<OrderItemBreakdown order={order} isNGN={isNGN} className="mt-3" />
						)}
					</div>
				</div>
			</div>
		);
	};
const OrderGridItem = ({ order }: { order: GroupedOrder }) =>
{
	const [expanded, setExpanded] = useState(false);
	const statusConfig = getStatusConfig(order.order_status);
	const isNGN = order.source_currency === "NGN" || order.currency === "NGN";
	const firstItem = order.items[0];
	const isMultiItem = order.items.length > 1;
	const detailId = getItemDetailId(firstItem, order.order_id);
	const displayAmount = getOrderDisplayAmount(order, isNGN);
	const formattedAmount = formatAmount(displayAmount, isNGN);
	const customerName = `${order.user_address.first_name} ${order.user_address.last_name}`;
	const titleText = isMultiItem ? getMultiItemTitle(order) : firstItem.title;

	return (
		<Card
			className="group hover:shadow-lg transition-all duration-300 border-gray-200 overflow-hidden cursor-pointer"
			onClick={() =>
			{
				if (isMultiItem) setExpanded((prev) => !prev);
				else router.push(`/vendor/orders/${detailId}`);
			}}
		>
			<div className="relative">
				<img src={getProductImage(firstItem)} alt={firstItem.title} className="w-full h-48 object-cover" />
				<div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${statusConfig.dotColor}`} />
				{isMultiItem && (
					<span className="absolute top-3 left-3 bg-white/90 text-gray-700 border border-gray-200 text-xs rounded-full px-2 py-0.5 font-medium">
						{order.items.length} items
					</span>
				)}
			</div>
			<CardContent className="p-4">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-gray-600 truncate">{order.order_id}</span>
					<div className="flex items-center gap-1">
						<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
							{statusConfig.label}
						</span>
						<PaymentBadge orderId={order.order_id} />
					</div>
				</div>
				<h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
					{titleText}
					{isMultiItem && (
						<ChevronRight
							className={cn(
								"inline-block h-4 w-4 ml-0.5 -mt-0.5 align-middle text-green-600 transition-transform",
								expanded && "rotate-90",
							)}
						/>
					)}
				</h3>
				<p className="text-sm text-gray-600 mb-1">{customerName}</p>
				<p className="text-xs text-gray-500 mb-2">{order.items.length} item{order.items.length !== 1 ? "s" : ""} · qty: {order.items.reduce((s, i) => s + i.quantity, 0)}</p>
				{isMultiItem && expanded && (
					<OrderItemBreakdown order={order} isNGN={isNGN} className="mb-3" />
				)}
				<div className="flex items-center justify-between">
					<span className="text-lg font-semibold text-gray-900">{formattedAmount}</span>
					<Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={(e) => { e.stopPropagation(); router.push(`/vendor/orders/${detailId}`); }}>
						<Eye className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

if (loading)
{
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
							onClick={() =>
							{
								// Refresh orders
								if (tailorId)
								{
									setLoading(true);
									Promise.all([
										getAllOrdersForTailor(tailorId),
										getTailorOrders(tailorId),
										getVendorOrderPaymentStatuses(tailorId),
									])
										.then(([grouped, subcollection, paymentStatuses]) =>
										{
											setOrders(grouped);
											setTailorOrders(subcollection);
											setUserOrderStatuses(paymentStatuses);
										})
										.catch((error) =>
										{
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
								<SelectItem value="newest">Newest First</SelectItem>
								<SelectItem value="oldest">Oldest First</SelectItem>
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
