"use client";

import { useState, useEffect } from "react";
import { Eye, CheckCircle, Search, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatPrice, getPriceValue, type PriceType } from "@/lib/priceUtils";
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
import { getUserReturns } from "@/vendor-services/returnsService"; // ✅ service
import { db } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";

// === Interfaces ===
interface UserAddress {
	first_name: string;
	last_name: string;
	city: string;
	state: string;
	country: string;
	country_code: string;
	dial_code: string;
	phone_number: string;
	post_code: string;
	flat_number: string;
	street_address: string;
}

interface UserOrder {
	order_id: string;
	tailor_id: string;
	user_id: string;
	product_id: string;
	tailor_name: string;
	title: string;
	quantity: number;
	price: PriceType;
	order_status: string;
	delivery_date: string;
	description?: string;
	images?: string[];
	user_address: UserAddress;
	timestamp: string;
	size?: string;
	shipping_fee: number;
	wear_category?: string;
	product_order_ref?: string;
	timeline?: Array<{
		actor: string;
		description: string;
		hash: string;
		location: string;
		occurredAt: string;
		raw: {
			date: string;
			serviceArea: Array<{
				code: string;
				description: string;
				time: string;
				source: string;
				status: string;
				typeCode: string;
			}>;
		};
	}>;
}

interface ReturnPayload {
	id: string;
	reason: string;
	status: string;
	createdAt: { seconds: number; nanoseconds: number };
	updatedAt: { seconds: number; nanoseconds: number };
	user_id: string;
	user_address: UserAddress;
	user_order: UserOrder[];
	shipping?: {
		carrier: string;
		type: string;
		shipmentTrackingNumber?: string;
		trackingUrl?: string;
		packages?: any[];
		documents?: any[];
		status: string;
		createdAt?: any;
	};
	pickup?: {
		status: string;
		requestedWindow?: any;
		location: string;
		locationType?: string;
		specialInstructions?: any[];
		packages: any[];
		customerDetailsSnapshot?: any;
		providerResponse?: any;
		createdAt?: any;
	};
}

interface ReturnRow {
	id: string;
	customerName: string;
	reason: string;
	status: string;
	orderIds: string[];
	createdDate: string;
	totalValue: number;
	raw: ReturnPayload;
}

interface ReturnsTabProps {
	userId: string;
}

export function CustomerReturnsTab({ userId }: ReturnsTabProps) {
	const [returns, setReturns] = useState<ReturnPayload[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedReturn, setSelectedReturn] = useState<ReturnRow | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [loadingShipment, setLoadingShipment] = useState(false);
	const [loadingPickup, setLoadingPickup] = useState(false);
	const [showPickupModal, setShowPickupModal] = useState(false);
	const [pickupForm, setPickupForm] = useState({
		plannedPickupDateAndTime: new Date().toISOString().slice(0, 16), // Default to now
		closeTime: "18:00",
		location: "reception",
		locationType: "business" as "business" | "residential",
		specialInstructions: "",
	});
	const rowsPerPage = 5;

	useEffect(() => {
		async function fetchReturns() {
			try {
				setLoading(true);
				const data = await getUserReturns(userId); // Firestore query
				setReturns((data as ReturnPayload[]) || []);
			} catch (err: any) {
				setError(err.message || "Failed to fetch returns");
			} finally {
				setLoading(false);
			}
		}
		if (userId) {
			fetchReturns();
		}
	}, [userId]);

	// Map API payload into UI table rows
	const mappedReturns: ReturnRow[] = returns.map((r) => ({
		id: r.id,
		customerName: `${r.user_address?.first_name || ""} ${
			r.user_address?.last_name || ""
		}`,
		reason: r.reason,
		status: r.status,
		orderIds: r.user_order?.map((order) => order.order_id) || [],
		createdDate: new Date(r.createdAt.seconds * 1000).toLocaleDateString(),
		totalValue:
			r.user_order?.reduce(
				(sum, order) => sum + getPriceValue(order.price) * order.quantity,
				0
			) || 0,
		raw: r,
	}));

	// Search filter
	const filteredReturns = mappedReturns.filter(
		(ret) =>
			ret.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ret.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ret.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ret.orderIds.some((orderId) =>
				orderId.toLowerCase().includes(searchTerm.toLowerCase())
			)
	);

	// Pagination slice
	const totalPages = Math.ceil(filteredReturns.length / rowsPerPage);
	const paginatedReturns = filteredReturns.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);

	console.log(filteredReturns);

	// Status badge
	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
			case "approved":
				return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
			case "rejected":
				return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
			case "shipment_created":
				return (
					<Badge className="bg-blue-100 text-blue-800">
						Ready for Shipment
					</Badge>
				);
			case "pickup_scheduled":
				return (
					<Badge className="bg-purple-100 text-purple-800">
						Pickup Scheduled
					</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	// === DHL Return Shipment Generation ===
	const generateDhlReturnShipment = async (returnId: string) => {
		try {
			setLoadingShipment(true);

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

			const fn = httpsCallable(
				getFunctions(app, "europe-west1"),
				"adminGenerateDhlReturnShipmentForReturn"
			);

			const res: any = await fn({
				returnId,
				accessToken,
				useFulfillmentAddress: true,
			});

			if (res?.data?.ok) {
				toast.success("📦 DHL return shipment created");

				// Update local state
				setReturns((prev) =>
					prev.map((r) =>
						r.id === returnId
							? {
									...r,
									status: "shipment_created",
									shipping: res.data.shipment,
							  }
							: r
					)
				);
			} else {
				throw new Error("Failed to create return shipment");
			}
		} catch (err: any) {
			console.error("Return shipment generation error:", err);
			toast.error(err?.message || "❌ Failed to create return shipment");
		} finally {
			setLoadingShipment(false);
		}
	};

	// === DHL Return Pickup Scheduling ===
	const scheduleDhlReturnPickup = async (returnId: string) => {
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
				getFunctions(app, "europe-west1"),
				"adminScheduleDhlReturnPickupForReturn"
			);

			const payload: any = {
				returnId,
				plannedPickupDateAndTime: pickupForm.plannedPickupDateAndTime,
				closeTime: pickupForm.closeTime,
				location: pickupForm.location,
				accessToken,
				useFulfillmentAddress: true,
			};

			// Add locationType for domestic returns only
			const returnData = returns.find((r) => r.id === returnId);
			if (returnData?.shipping?.type === "domestic_return") {
				payload.locationType = pickupForm.locationType;
			}

			// Add special instructions if provided
			if (pickupForm.specialInstructions.trim()) {
				payload.specialInstructions = pickupForm.specialInstructions.trim();
			}

			const res: any = await fn(payload);

			if (res?.data?.ok) {
				toast.success("🚚 Return pickup scheduled");

				// Update local state
				setReturns((prev) =>
					prev.map((r) =>
						r.id === returnId
							? {
									...r,
									status: "pickup_scheduled",
									pickup: res.data.pickup,
							  }
							: r
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
			} else {
				throw new Error("Failed to schedule return pickup");
			}
		} catch (err: any) {
			console.error("Return pickup scheduling error:", err);
			toast.error(err?.message || "❌ Failed to schedule return pickup");
		} finally {
			setLoadingPickup(false);
		}
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Return History</CardTitle>
					<CardDescription>Loading returns...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Return History</CardTitle>
					<CardDescription className="text-red-500">{error}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Return History</CardTitle>
				<CardDescription>All return requests for this customer</CardDescription>
				<div className="flex items-center space-x-2">
					<Search className="h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search returns..."
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
							<TableHead>Return ID</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Reason</TableHead>
							<TableHead>Orders</TableHead>
							<TableHead>Total Value</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedReturns.map((ret) => (
							<TableRow key={ret.id}>
								<TableCell className="font-medium">{ret.id}</TableCell>
								<TableCell>{ret.customerName}</TableCell>
								<TableCell>{ret.reason}</TableCell>
								<TableCell>
									<div className="flex flex-col gap-1">
										{ret.orderIds.map((orderId, idx) => (
											<span
												key={idx}
												className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded font-mono"
											>
												{orderId}
											</span>
										))}
									</div>
								</TableCell>
								<TableCell>${ret.totalValue.toFixed(2)}</TableCell>
								<TableCell>{getStatusBadge(ret.status)}</TableCell>
								<TableCell>{ret.createdDate}</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Dialog>
											<DialogTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedReturn(ret)}
												>
													<Eye className="h-4 w-4 mr-2" />
													View
												</Button>
											</DialogTrigger>
											<DialogContent className="max-w-3xl">
												<DialogHeader>
													<DialogTitle>Return Details</DialogTitle>
													<DialogDescription>
														Detailed information for return {selectedReturn?.id}
													</DialogDescription>
												</DialogHeader>
												{selectedReturn && (
													<div className="space-y-6">
														<div className="grid grid-cols-2 gap-4">
															<div>
																<p className="font-semibold">Return ID</p>
																<p>{selectedReturn.id}</p>
															</div>
															<div>
																<p className="font-semibold">Customer</p>
																<p>{selectedReturn.customerName}</p>
															</div>
															<div>
																<p className="font-semibold">Reason</p>
																<p>{selectedReturn.reason}</p>
															</div>
															<div>
																<p className="font-semibold">Status</p>
																<p>{selectedReturn.status}</p>
															</div>
															<div>
																<p className="font-semibold">Total Value</p>
																<p>${selectedReturn.totalValue.toFixed(2)}</p>
															</div>
															<div>
																<p className="font-semibold">Date</p>
																<p>{selectedReturn.createdDate}</p>
															</div>
														</div>

														{/* Orders Information */}
														<div>
															<p className="font-semibold mb-2">
																Orders in Return
															</p>
															<div className="space-y-3">
																{selectedReturn.raw.user_order?.map(
																	(order, idx) => (
																		<div
																			key={idx}
																			className="border rounded-lg p-3"
																		>
																			<div className="grid grid-cols-2 gap-2 text-sm">
																				<div>
																					<span className="font-medium">
																						Order ID:
																					</span>{" "}
																					{order.order_id}
																				</div>
																				<div>
																					<span className="font-medium">
																						Product:
																					</span>{" "}
																					{order.title}
																				</div>
																				<div>
																					<span className="font-medium">
																						Quantity:
																					</span>{" "}
																					{order.quantity}
																				</div>
																				<div>
																					<span className="font-medium">
																						Price:
																					</span>{" "}
																					{formatPrice(order.price)}
																				</div>
																				<div>
																					<span className="font-medium">
																						Size:
																					</span>{" "}
																					{order.size || "N/A"}
																				</div>
																				<div>
																					<span className="font-medium">
																						Status:
																					</span>{" "}
																					{order.order_status}
																				</div>
																			</div>
																			{order.description && (
																				<div className="mt-2">
																					<span className="font-medium text-sm">
																						Description:
																					</span>
																					<p className="text-sm text-gray-600 mt-1">
																						{order.description}
																					</p>
																				</div>
																			)}
																		</div>
																	)
																)}
															</div>
														</div>

														{/* Shipping Information */}
														{selectedReturn.raw.shipping && (
															<div>
																<p className="font-semibold mb-2">
																	Shipping Information
																</p>
																<div className="grid grid-cols-2 gap-4 text-sm">
																	<div>
																		<span className="font-medium">
																			Carrier:
																		</span>{" "}
																		{selectedReturn.raw.shipping.carrier}
																	</div>
																	<div>
																		<span className="font-medium">Type:</span>{" "}
																		{selectedReturn.raw.shipping.type}
																	</div>
																	{selectedReturn.raw.shipping
																		.shipmentTrackingNumber && (
																		<div>
																			<span className="font-medium">
																				Tracking Number:
																			</span>{" "}
																			{
																				selectedReturn.raw.shipping
																					.shipmentTrackingNumber
																			}
																		</div>
																	)}
																	{selectedReturn.raw.shipping.trackingUrl && (
																		<div>
																			<span className="font-medium">
																				Tracking URL:
																			</span>
																			<a
																				href={
																					selectedReturn.raw.shipping
																						.trackingUrl
																				}
																				target="_blank"
																				rel="noreferrer"
																				className="text-blue-600 underline ml-1"
																			>
																				View Tracking
																			</a>
																		</div>
																	)}
																</div>
															</div>
														)}

														{/* Pickup Information */}
														{selectedReturn.raw.pickup && (
															<div>
																<p className="font-semibold mb-2">
																	Pickup Information
																</p>
																<div className="grid grid-cols-2 gap-4 text-sm">
																	<div>
																		<span className="font-medium">Status:</span>{" "}
																		{selectedReturn.raw.pickup.status}
																	</div>
																	<div>
																		<span className="font-medium">
																			Location:
																		</span>{" "}
																		{selectedReturn.raw.pickup.location}
																	</div>
																	{selectedReturn.raw.pickup.requestedWindow
																		?.plannedPickupDateAndTime && (
																		<div>
																			<span className="font-medium">
																				Pickup Date:
																			</span>{" "}
																			{new Date(
																				selectedReturn.raw.pickup.requestedWindow.plannedPickupDateAndTime
																			).toLocaleString()}
																		</div>
																	)}
																</div>
															</div>
														)}
													</div>
												)}
											</DialogContent>
										</Dialog>

										{ret.status === "pending" && (
											<Button
												variant="default"
												size="sm"
												onClick={() => generateDhlReturnShipment(ret.id)}
												disabled={loadingShipment}
											>
												<Package className="h-4 w-4 mr-2" />
												{loadingShipment ? "Creating..." : "Create Shipment"}
											</Button>
										)}
										{ret.status === "shipment_created" && (
											<Button
												variant="default"
												size="sm"
												onClick={() => {
													setSelectedReturn(ret);
													setShowPickupModal(true);
												}}
												disabled={loadingPickup}
											>
												<Truck className="h-4 w-4 mr-2" />
												{loadingPickup ? "Scheduling..." : "Schedule Pickup"}
											</Button>
										)}
									</div>
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

			{/* Pickup Scheduling Modal */}
			{showPickupModal && selectedReturn && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold">
								Schedule DHL Return Pickup
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
									<Label htmlFor="pickupDateTime">Pickup Date & Time *</Label>
									<Input
										id="pickupDateTime"
										type="datetime-local"
										value={pickupForm.plannedPickupDateAndTime}
										onChange={(e) =>
											setPickupForm((prev) => ({
												...prev,
												plannedPickupDateAndTime: e.target.value,
											}))
										}
										disabled={loadingPickup}
									/>
									<p className="text-xs text-gray-500 mt-1">Local time</p>
								</div>
								<div>
									<Label htmlFor="closeTime">Close Time *</Label>
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
								<Label htmlFor="location">Pickup Location *</Label>
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

							{/* Location Type - only for domestic returns */}
							{selectedReturn.raw.shipping?.type === "domestic_return" && (
								<div>
									<Label htmlFor="locationType">Location Type *</Label>
									<Select
										value={pickupForm.locationType}
										onValueChange={(value: "business" | "residential") =>
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
											<SelectItem value="business">Business</SelectItem>
											<SelectItem value="residential">Residential</SelectItem>
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
									onClick={() => scheduleDhlReturnPickup(selectedReturn.id)}
									disabled={loadingPickup}
								>
									{loadingPickup ? "Scheduling..." : "Schedule Pickup"}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</Card>
	);
}
