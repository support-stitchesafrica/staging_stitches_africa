"use client";

import { useState } from "react";
import { Eye, Search, Check, X } from "lucide-react";

import {
	approveTailorWork,
	rejectTailorWork,
} from "@/admin-services/approveTailorWork";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, getDiscount, type PriceType } from "@/lib/priceUtils";

export interface Product {
	id: string;
	product_id: string;
	title: string;
	description: string;
	category: string;
	subcategory?: string;
	type: string;
	// Updated price structure to support new schema
	price: PriceType;
	discount?: number; // Legacy field, may not exist in new products
	is_verified: boolean;
	customSizes: boolean;
	wear_category: string;
	wear_quantity: number;
	images: string[];
	sizes: string[];
	tags: string[];
	keywords: string[];
	tailor: string;
	tailor_id: string;
	created_at: Date;
	status?: "approved" | "pending" | "rejected";
}

interface ProductsTabProps {
	products: Product[];
}

export function ProductsTab({ products }: ProductsTabProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [productList, setProductList] = useState<Product[]>(products);
	const [currentPage, setCurrentPage] = useState(1);
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [targetProductId, setTargetProductId] = useState<string | null>(null);

	const itemsPerPage = 5;
	const { toast } = useToast();

	const filteredProducts = productList.filter(
		(product) =>
			product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.id.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentProducts = filteredProducts.slice(
		startIndex,
		startIndex + itemsPerPage
	);

	const getStatusBadge = (status?: string) => {
		switch (status) {
			case "approved":
				return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
			case "pending":
				return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
			case "rejected":
				return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
			default:
				return <Badge>Not Set</Badge>;
		}
	};

	const confirmApprove = async () => {
		if (!targetProductId) return;
		try {
			const success = await approveTailorWork(targetProductId);
			if (success) {
				setProductList((prev) =>
					prev.map((product) =>
						product.id === targetProductId
							? { ...product, status: "approved", is_verified: true }
							: product
					)
				);
				toast({
					title: "Product Approved",
					description: `Product ${targetProductId} has been approved successfully.`,
				});
			} else {
				toast({
					title: "Already Approved",
					description: `Product ${targetProductId} is already verified.`,
					variant: "default",
				});
			}
		} catch (error) {
			toast({
				title: "Error Approving",
				description: (error as Error).message,
				variant: "destructive",
			});
		} finally {
			setApproveDialogOpen(false);
			setTargetProductId(null);
		}
	};

	const confirmReject = async () => {
		if (!targetProductId) return;
		try {
			const success = await rejectTailorWork(targetProductId, rejectReason);
			if (success) {
				setProductList((prev) =>
					prev.map((product) =>
						product.id === targetProductId
							? { ...product, status: "rejected", is_verified: false }
							: product
					)
				);
				toast({
					title: "Product Rejected",
					description: `Product ${targetProductId} has been rejected.`,
					variant: "destructive",
				});
			} else {
				toast({
					title: "Cannot Reject",
					description: `Product ${targetProductId} may already be approved or rejected.`,
					variant: "default",
				});
			}
		} catch (error) {
			toast({
				title: "Error Rejecting",
				description: (error as Error).message,
				variant: "destructive",
			});
		} finally {
			setRejectDialogOpen(false);
			setRejectReason("");
			setTargetProductId(null);
		}
	};

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Products</CardTitle>
				<CardDescription>All products created by this vendor</CardDescription>
				<div className="flex items-center space-x-2">
					<Search className="h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search products..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="max-w-sm"
					/>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Product ID</TableHead>
							<TableHead>Title</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Price</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created Date</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{currentProducts.map((product) => (
							<TableRow key={product.id}>
								<TableCell className="font-medium">{product.id}</TableCell>
								<TableCell>{product.title}</TableCell>
								<TableCell>{product.category}</TableCell>
								<TableCell>{formatPrice(product.price)}</TableCell>
								<TableCell>{getStatusBadge(product.status)}</TableCell>
								<TableCell>
									{product.created_at instanceof Date
										? product.created_at.toLocaleDateString()
										: ""}
								</TableCell>
								<TableCell>
									<div className="flex items-center space-x-2">
										<Dialog>
											<DialogTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedProduct(product)}
												>
													<Eye className="h-4 w-4 mr-2" />
													View
												</Button>
											</DialogTrigger>
											<DialogContent className="max-w-3xl">
												<DialogHeader>
													<DialogTitle>Product Details</DialogTitle>
													<DialogDescription>
														Detailed information for product{" "}
														{selectedProduct?.id}
													</DialogDescription>
												</DialogHeader>
												{selectedProduct && (
													<div className="space-y-4">
														<div className="grid grid-cols-2 gap-4">
															<div>
																<p>
																	<strong>Product ID:</strong>{" "}
																	{selectedProduct.id}
																</p>
																<p>
																	<strong>Title:</strong>{" "}
																	{selectedProduct.title}
																</p>
																<p>
																	<strong>Category:</strong>{" "}
																	{selectedProduct.category}
																</p>
																<p>
																	<strong>Price:</strong>{" "}
																	{formatPrice(selectedProduct.price)}
																</p>
																<p>
																	<strong>Discount:</strong>{" "}
																	{getDiscount(
																		selectedProduct.price,
																		selectedProduct.discount
																	) || 0}
																	%
																</p>
																<p>
																	<strong>Wear Category:</strong>{" "}
																	{selectedProduct.wear_category || "N/A"}
																</p>
																<p>
																	<strong>Wear Quantity:</strong>{" "}
																	{selectedProduct.wear_quantity || "N/A"}
																</p>
															</div>
															<div>
																<p>
																	<strong>Status:</strong>{" "}
																	{selectedProduct.status ?? "N/A"}
																</p>
																<p>
																	<strong>Created Date:</strong>
																	{selectedProduct.created_at instanceof Date
																		? selectedProduct.created_at.toLocaleDateString()
																		: ""}
																</p>
																<p>
																	<strong>Tailor:</strong>{" "}
																	{selectedProduct.tailor}
																</p>
																<p>
																	<strong>Tailor ID:</strong>{" "}
																	{selectedProduct.tailor_id}
																</p>
																<p>
																	<strong>Sizes:</strong>{" "}
																	{selectedProduct.sizes.join(", ")}
																</p>
																<p>
																	<strong>Tags:</strong>{" "}
																	{selectedProduct.tags.join(", ")}
																</p>
															</div>
														</div>

														<div>
															<p>
																<strong>Description:</strong>
															</p>
															<p className="text-sm text-muted-foreground">
																{selectedProduct.description}
															</p>
														</div>

														<div>
															<p>
																<strong>Images:</strong>
															</p>
															<div className="flex flex-wrap gap-4">
																{selectedProduct.images.map((img, idx) => (
																	<img
																		key={idx}
																		src={img}
																		alt={`Product ${selectedProduct.id} Image ${
																			idx + 1
																		}`}
																		className="w-32 h-32 object-cover rounded-md border"
																	/>
																))}
															</div>
														</div>
													</div>
												)}
											</DialogContent>
										</Dialog>
										{!product.is_verified && (
											<>
												<Button
													size="sm"
													className="bg-green-600 hover:bg-green-700"
													onClick={() => {
														setTargetProductId(product.id);
														setApproveDialogOpen(true);
													}}
												>
													<Check className="h-4 w-4 mr-2" />
													Approve
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onClick={() => {
														setTargetProductId(product.id);
														setRejectDialogOpen(true);
													}}
												>
													<X className="h-4 w-4 mr-2" />
													Reject
												</Button>
											</>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				<div className="flex justify-between items-center mt-4">
					<Button
						variant="outline"
						disabled={currentPage === 1}
						onClick={() => handlePageChange(currentPage - 1)}
					>
						Previous
					</Button>
					<span>
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant="outline"
						disabled={currentPage === totalPages}
						onClick={() => handlePageChange(currentPage + 1)}
					>
						Next
					</Button>
				</div>
			</CardContent>

			<Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Approve Product</DialogTitle>
						<DialogDescription>
							Are you sure you want to approve this product?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setApproveDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button className="bg-green-600" onClick={confirmApprove}>
							Approve
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Product</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting this product.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						placeholder="Enter rejection reason..."
						value={rejectReason}
						onChange={(e) => setRejectReason(e.target.value)}
					/>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRejectDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmReject}
							disabled={!rejectReason.trim()}
						>
							Reject
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
