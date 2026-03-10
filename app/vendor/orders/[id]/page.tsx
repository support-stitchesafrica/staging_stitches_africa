"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

import {
	ArrowLeft,
	Package,
	User,
	MapPin,
	Phone,
	Calendar,
	Truck,
	Download,
	MessageSquare,
	Edit,
	Clock,
	CheckCircle,
	XCircle,
	AlertCircle,
	RefreshCw,
	ExternalLink,
	Mail,
	Copy,
	Share2,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getTailorOrderById, UserOrder } from "@/vendor-services/TailorOrders";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { updateOrderStatus } from "@/vendor-services/orderStatus";

const getStatusConfig = (status: string) => {
	const normalizedStatus = status?.toLowerCase().replace(/[_\s]/g, "");

	switch (normalizedStatus) {
		case "pending":
		case "orderplaced":
			return {
				label: "Pending",
				color: "text-amber-700",
				bgColor: "bg-amber-50",
				borderColor: "border-amber-200",
				icon: Clock,
				dotColor: "bg-amber-400",
			};
		case "inprogress":
		case "processing":
		case "confirmed":
			return {
				label: "In Progress",
				color: "text-blue-700",
				bgColor: "bg-blue-50",
				borderColor: "border-blue-200",
				icon: RefreshCw,
				dotColor: "bg-blue-400",
			};
		case "shipped":
		case "intransit":
			return {
				label: "Shipped",
				color: "text-purple-700",
				bgColor: "bg-purple-50",
				borderColor: "border-purple-200",
				icon: Truck,
				dotColor: "bg-purple-400",
			};
		case "delivered":
		case "completed":
			return {
				label: "Delivered",
				color: "text-emerald-700",
				bgColor: "bg-emerald-50",
				borderColor: "border-emerald-200",
				icon: CheckCircle,
				dotColor: "bg-emerald-400",
			};
		case "cancelled":
		case "canceled":
			return {
				label: "Cancelled",
				color: "text-red-700",
				bgColor: "bg-red-50",
				borderColor: "border-red-200",
				icon: XCircle,
				dotColor: "bg-red-400",
			};
		default:
			return {
				label: status || "Unknown",
				color: "text-gray-700",
				bgColor: "bg-gray-50",
				borderColor: "border-gray-200",
				icon: AlertCircle,
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
			"https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&h=800&fit=crop",
		suit: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
		blazer:
			"https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=800&fit=crop",
		gown: "https://images.unsplash.com/photo-1566479179817-c0ae8e4b4b3d?w=800&h=800&fit=crop",
		agbada:
			"https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&h=800&fit=crop",
		shirt:
			"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=800&fit=crop",
		trouser:
			"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop",
		skirt:
			"https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=800&h=800&fit=crop",
	};

	const category = order.wear_category?.toLowerCase() || "dress";
	return categoryImages[category] || categoryImages["dress"];
};

export default function OrderDetailsPage() {
	const [order, setOrder] = useState<UserOrder | null>(null);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [tailorId, setTailorId] = useState<string | null>(null);

	const router = useRouter();
	const params = useParams();
	const orderId = params.id as string;

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				setTailorId(user.uid);
				try {
					setLoading(true);
					const orderData = await getTailorOrderById(user.uid, orderId);
					if (orderData) {
						setOrder(orderData);
					} else {
						toast.error("Order not found");
						router.push("/vendor/orders");
					}
				} catch (error) {
					console.error("Error fetching order:", error);
					toast.error("Failed to load order details");
					router.push("/vendor/orders");
				} finally {
					setLoading(false);
				}
			} else {
				router.push("/vendor");
			}
		});

		return () => unsubscribe();
	}, [orderId, router]);

	const handleConfirmUpdateStatus = async () => {
		if (!order) return;

		setIsDialogOpen(false);

		try {
			const res = await updateOrderStatus(
				"Processed for Pickup",
				order.user_id,
				order.order_id,
			);

			if (res.success) {
				setOrder((prev) =>
					prev ? { ...prev, order_status: "Processed for Pickup" } : prev,
				);

				await fetch("/api/order-ready-notification", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						customerName: `${order.user_address.first_name} ${order.user_address.last_name}`,
						orderId: order.order_id,
						item: order.title,
						quantity: order.quantity,
						price: order.price,
						pickupDate: new Date(order.delivery_date).toLocaleDateString(),
						token: localStorage.getItem("tailorToken"),
					}),
				});
			} else {
				alert(res.message || "Failed to update order status");
			}
		} catch (error) {
			console.error(error);
			alert("Something went wrong while updating order status");
		}
	};

	const copyOrderId = () => {
		navigator.clipboard.writeText(order?.order_id || "");
		toast.success("Order ID copied to clipboard");
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<ModernNavbar />
				<div className="flex items-center justify-center h-96">
					<div className="flex items-center space-x-3">
						<RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
						<span className="text-gray-600 font-light">
							Loading order details...
						</span>
					</div>
				</div>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="min-h-screen bg-gray-50">
				<ModernNavbar />
				<div className="flex items-center justify-center h-96">
					<div className="text-center">
						<Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
						<h3 className="text-lg font-light text-gray-900 mb-2">
							Order not found
						</h3>
						<p className="text-gray-500 mb-6 max-w-md">
							The order you're looking for doesn't exist or you don't have
							access to it.
						</p>
						<Button
							onClick={() => router.push("/vendor/orders")}
							variant="outline"
							className="border-gray-300"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Orders
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const statusConfig = getStatusConfig(order.order_status);
	const StatusIcon = statusConfig.icon;
	const price = order.original_price ?? order.price;
	const totalAmount = price * order.quantity + order.shipping_fee;
	const customerName = `${order.user_address.first_name} ${order.user_address.last_name}`;

	return (
		<div className="min-h-screen bg-gray-50">
			<ModernNavbar />

			{/* Hero Section */}
			<div className="bg-white border-b border-gray-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
					{/* Mobile Layout */}
					<div className="sm:hidden space-y-4">
						<Button
							variant="ghost"
							onClick={() => router.push("/vendor/orders")}
							className="text-gray-500 hover:text-gray-900 -ml-2"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Orders
						</Button>

						<div>
							<div className="flex items-center justify-between mb-2">
								<h1 className="text-lg font-light text-gray-900 tracking-wide">
									Order #{order.order_id}
								</h1>
								<Button
									variant="ghost"
									size="sm"
									onClick={copyOrderId}
									className="text-gray-400 hover:text-gray-600 p-1"
								>
									<Copy className="h-3 w-3" />
								</Button>
							</div>
							<p className="text-xs text-gray-500 mb-3">
								Placed{" "}
								{new Date(order.timestamp).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</p>
							<Badge
								className={`${statusConfig.bgColor} ${statusConfig.color} border-0 px-3 py-1.5 font-medium`}
							>
								<div
									className={`w-2 h-2 rounded-full ${statusConfig.dotColor} mr-2`}
								></div>
								{statusConfig.label}
							</Badge>
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								className="border-gray-300 text-gray-700 flex-1"
							>
								<Share2 className="h-4 w-4 mr-2" />
								Share
							</Button>

							<Button
								variant="outline"
								size="sm"
								className="border-gray-300 text-gray-700 flex-1"
							>
								<Download className="h-4 w-4 mr-2" />
								Invoice
							</Button>
						</div>
					</div>

					{/* Desktop Layout */}
					<div className="hidden sm:flex items-center justify-between">
						<div className="flex items-center space-x-6">
							<Button
								variant="ghost"
								onClick={() => router.push("/vendor/orders")}
								className="text-gray-500 hover:text-gray-900 -ml-2"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Orders
							</Button>

							<div className="h-8 w-px bg-gray-200"></div>

							<div>
								<div className="flex items-center space-x-3 mb-1">
									<h1 className="text-2xl font-light text-gray-900 tracking-wide">
										Order #{order.order_id}
									</h1>
									<Button
										variant="ghost"
										size="sm"
										onClick={copyOrderId}
										className="text-gray-400 hover:text-gray-600 p-1"
									>
										<Copy className="h-3 w-3" />
									</Button>
								</div>
								<p className="text-sm text-gray-500">
									Placed{" "}
									{new Date(order.timestamp).toLocaleDateString("en-US", {
										weekday: "long",
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							<Badge
								className={`${statusConfig.bgColor} ${statusConfig.color} border-0 px-3 py-1.5 font-medium`}
							>
								<div
									className={`w-2 h-2 rounded-full ${statusConfig.dotColor} mr-2`}
								></div>
								{statusConfig.label}
							</Badge>

							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									className="border-gray-300 text-gray-700"
								>
									<Share2 className="h-4 w-4 mr-2" />
									Share
								</Button>

								<Button
									variant="outline"
									size="sm"
									className="border-gray-300 text-gray-700"
								>
									<Download className="h-4 w-4 mr-2" />
									Invoice
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12">
					{/* Left Column - Main Content */}
					<div className="lg:col-span-8 space-y-6 sm:space-y-8">
						{/* Product Section */}
						<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
							<div className="p-4 sm:p-8">
								<div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-8">
									<div className="w-full sm:w-auto flex-shrink-0">
										<div className="relative group">
											<img
												src={getProductImage(order)}
												alt={order.title}
												className="w-full sm:w-48 h-48 object-cover rounded-xl border border-gray-100"
											/>
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-xl"></div>
										</div>
									</div>

									<div className="flex-1 space-y-6">
										<div>
											<h2 className="text-2xl font-light text-gray-900 mb-2">
												{order.title}
											</h2>
											<p className="text-gray-500 uppercase text-xs tracking-wider font-medium">
												{order.wear_category}
											</p>
										</div>

										{order.description && (
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
													Description
												</dt>
												<dd className="text-sm text-gray-700 leading-relaxed">
													{order.description}
												</dd>
											</div>
										)}

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
											<div className="space-y-4">
												<div>
													<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
														Quantity
													</dt>
													<dd className="text-gray-900">{order.quantity}</dd>
												</div>
												{order.size && (
													<div>
														<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
															Size
														</dt>
														<dd className="text-gray-900">{order.size}</dd>
													</div>
												)}
												{order.color && (
													<div>
														<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
															Color
														</dt>
														<dd className="text-gray-900">{order.color}</dd>
													</div>
												)}
											</div>
											<div className="space-y-4">
												<div>
													<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
														Unit Price
													</dt>
													<dd className="text-gray-900">
														${(order.original_price ?? order.price).toFixed(2)}
													</dd>
												</div>
												<div>
													<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
														Delivery
													</dt>
													<dd className="text-gray-900 capitalize">
														{order.delivery_type}
													</dd>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Customer Information */}
						{/* <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
							<div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50">
								<h3 className="text-lg font-light text-gray-900">
									Customer Information
								</h3>
							</div>
							<div className="p-4 sm:p-8">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
									<div className="space-y-6">
										<div className="flex items-start space-x-4">
											<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
												<User className="h-4 w-4 text-gray-600" />
											</div>
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Customer
												</dt>
												<dd className="text-gray-900 font-medium">
													{customerName}
												</dd>
											</div>
										</div>

										<div className="flex items-start space-x-4">
											<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
												<Phone className="h-4 w-4 text-gray-600" />
											</div>
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Phone
												</dt>
												<dd className="text-gray-900">
													{order.user_address.dial_code}{" "}
													{order.user_address.phone_number}
												</dd>
											</div>
										</div>

										{order.user_address.user_email && (
											<div className="flex items-start space-x-4">
												<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
													<Mail className="h-4 w-4 text-gray-600" />
												</div>
												<div>
													<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
														Email
													</dt>
													<dd className="text-gray-900">
														{order.user_address.user_email}
													</dd>
												</div>
											</div>
										)}
									</div>

									<div>
										<div className="flex items-start space-x-4">
											<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
												<MapPin className="h-4 w-4 text-gray-600" />
											</div>
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Delivery Address
												</dt>
												<dd className="text-gray-900 leading-relaxed">
													{order.user_address.flat_number &&
														`${order.user_address.flat_number}, `}
													{order.user_address.street_address}
													<br />
													{order.user_address.city}, {order.user_address.state}{" "}
													{order.user_address.post_code}
													<br />
													{order.user_address.country}
												</dd>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div> */}

						{/* Shipping Information */}
						{order.dhl_shipment && (
							<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
								<div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50">
									<h3 className="text-lg font-light text-gray-900">
										Shipping & Tracking
									</h3>
								</div>
								<div className="p-4 sm:p-8">
									{order.dhl_shipment?.trackingUrl && (
										<div className="bg-blue-50 rounded-xl p-6 mb-6">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-4">
													<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
														<Truck className="h-5 w-5 text-blue-600" />
													</div>
													<div>
														<h4 className="font-medium text-blue-900 mb-1">
															Package in Transit
														</h4>
														<p className="text-sm text-blue-700">
															Tracking:{" "}
															{order.dhl_shipment.shipmentTrackingNumber ||
																"Available"}
														</p>
													</div>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														window.open(
															order.dhl_shipment?.trackingUrl,
															"_blank",
														)
													}
													className="border-blue-200 text-blue-700 hover:bg-blue-50"
												>
													<ExternalLink className="h-4 w-4 mr-2" />
													Track
												</Button>
											</div>
										</div>
									)}

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
										<div>
											<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
												Carrier
											</dt>
											<dd className="text-gray-900">
												{order.dhl_shipment?.carrier || "DHL"}
											</dd>
										</div>
										<div>
											<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
												Status
											</dt>
											<dd className="text-gray-900">
												{order.dhl_shipment?.status || "Processing"}
											</dd>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* User Measurements - For Bespoke Items */}
						{order.user_measurement &&
							Object.keys(order.user_measurement).length > 0 && (
								<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
									<div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50">
										<h3 className="text-lg font-light text-gray-900">
											Custom Measurements
										</h3>
									</div>
									<div className="p-4 sm:p-8">
										<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
											{Object.entries(order.user_measurement).map(
												([key, value]) => (
													<div key={key}>
														<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
															{key
																.replace(/_/g, " ")
																.replace(/\b\w/g, (l) => l.toUpperCase())}
														</dt>
														<dd className="text-gray-900">
															{typeof value === "object"
																? JSON.stringify(value)
																: value?.toString() || "N/A"}
														</dd>
													</div>
												),
											)}
										</div>
									</div>
								</div>
							)}

						{/* Order Shipping Info */}
						{order.shipping && (
							<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
								<div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-50">
									<h3 className="text-lg font-light text-gray-900">
										Delivery Information
									</h3>
								</div>
								<div className="p-4 sm:p-8">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
										{order.shipping.courier_name && (
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Courier
												</dt>
												<dd className="text-gray-900">
													{order.shipping.courier_name}
												</dd>
											</div>
										)}
										{order.shipping.delivery_date && (
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Expected Delivery
												</dt>
												<dd className="text-gray-900">
													{new Date(
														order.shipping.delivery_date,
													).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric",
													})}
												</dd>
											</div>
										)}
										{order.shipping.package_weight && (
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Package Weight
												</dt>
												<dd className="text-gray-900">
													{order.shipping.package_weight} kg
												</dd>
											</div>
										)}
										{order.shipping.package_dimensions && (
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Package Dimensions
												</dt>
												<dd className="text-gray-900">
													{order.shipping.package_dimensions.length} ×{" "}
													{order.shipping.package_dimensions.width} ×{" "}
													{order.shipping.package_dimensions.height} cm
												</dd>
											</div>
										)}
										{order.shipping.amount && (
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Shipping Cost
												</dt>
												<dd className="text-gray-900">
													{typeof order.shipping_fee === "number"
														? `$${order.shipping_fee.toFixed(2)}`
														: order.shipping_fee}
												</dd>
											</div>
										)}
										{order.shipping.base_shipping_fee && (
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Base Shipping Fee
												</dt>
												<dd className="text-gray-900">
													${order.shipping_fee.toFixed(2)}
												</dd>
											</div>
										)}
										{order.shipping.total_quantity && (
											<div>
												<dt className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
													Total Quantity
												</dt>
												<dd className="text-gray-900">
													{order.shipping.total_quantity}
												</dd>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Right Column - Sidebar */}
					<div className="lg:col-span-4 space-y-6 sm:space-y-8">
						{/* Order Summary */}
						<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-8">
							<div className="px-6 py-5 border-b border-gray-50">
								<h3 className="text-lg font-light text-gray-900">
									Order Summary
								</h3>
							</div>
							<div className="p-6">
								<div className="space-y-4 mb-6">
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">
											Subtotal ({order.quantity} item
											{order.quantity > 1 ? "s" : ""})
										</span>
										<span className="text-gray-900">
											$
											{(
												(order.original_price ?? order.price) * order.quantity
											).toFixed(2)}
										</span>
									</div>

									<div className="flex justify-between text-sm">
										<span className="text-gray-600">Shipping</span>
										<span className="text-gray-900">
											${order.shipping_fee.toFixed(2)}
										</span>
									</div>

									<div className="border-t border-gray-100 pt-4">
										<div className="flex justify-between items-center">
											<span className="text-lg font-light text-gray-900">
												Total
											</span>
											<span className="text-xl font-medium text-gray-900">
												${totalAmount.toFixed(2)}
											</span>
										</div>
									</div>
								</div>

								<div className="space-y-3">
									<Button
										onClick={() => setIsDialogOpen(true)}
										className="w-full bg-gray-900 hover:bg-gray-800 text-white"
									>
										<Edit className="h-4 w-4 mr-2" />
										Update Status
									</Button>

									<Button
										variant="outline"
										className="w-full border-gray-300 text-gray-700"
									>
										<MessageSquare className="h-4 w-4 mr-2" />
										Message Customer
									</Button>
								</div>
							</div>
						</div>

						<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
							<DialogContent className="sm:max-w-[400px]">
								<DialogHeader>
									<DialogTitle>Confirm Status Update</DialogTitle>
								</DialogHeader>
								<p className="text-gray-700 my-4">
									Are you sure you want to mark this order as{" "}
									<strong>Processed for Pickup</strong>?
								</p>
								<DialogFooter className="flex justify-end space-x-2">
									<Button
										variant="outline"
										onClick={() => setIsDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button onClick={handleConfirmUpdateStatus}>Confirm</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Timeline */}
						<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
							<div className="px-6 py-5 border-b border-gray-50">
								<h3 className="text-lg font-light text-gray-900">
									Order Timeline
								</h3>
							</div>
							<div className="p-6">
								<div className="space-y-6">
									<div className="flex items-start space-x-4">
										<div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
										<div>
											<p className="text-sm font-medium text-gray-900 mb-1">
												Order Placed
											</p>
											<p className="text-xs text-gray-500">
												{new Date(order.timestamp).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									</div>

									<div className="flex items-start space-x-4">
										<div
											className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
												[
													"inprogress",
													"processing",
													"confirmed",
													"shipped",
													"delivered",
													"completed",
												].includes(
													order.order_status
														.toLowerCase()
														.replace(/[_\s]/g, ""),
												)
													? "bg-emerald-400"
													: "bg-gray-200"
											}`}
										></div>
										<div>
											<p className="text-sm font-medium text-gray-900 mb-1">
												Processing
											</p>
											<p className="text-xs text-gray-500">
												Order confirmed and in production
											</p>
										</div>
									</div>

									<div className="flex items-start space-x-4">
										<div
											className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
												["shipped", "delivered", "completed"].includes(
													order.order_status
														.toLowerCase()
														.replace(/[_\s]/g, ""),
												)
													? "bg-emerald-400"
													: "bg-gray-200"
											}`}
										></div>
										<div>
											<p className="text-sm font-medium text-gray-900 mb-1">
												Shipped
											</p>
											<p className="text-xs text-gray-500">
												Package dispatched for delivery
											</p>
										</div>
									</div>

									<div className="flex items-start space-x-4">
										<div
											className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
												["delivered", "completed"].includes(
													order.order_status
														.toLowerCase()
														.replace(/[_\s]/g, ""),
												)
													? "bg-emerald-400"
													: "bg-gray-200"
											}`}
										></div>
										<div>
											<p className="text-sm font-medium text-gray-900 mb-1">
												Delivery
											</p>
											<p className="text-xs text-gray-500">
												Expected{" "}
												{new Date(order.delivery_date).toLocaleDateString(
													"en-US",
													{
														month: "short",
														day: "numeric",
													},
												)}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
