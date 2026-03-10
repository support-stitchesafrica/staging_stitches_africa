"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { CustomerPromotionalService } from "@/lib/promotionals/customer-service";
import { PromotionalEvent, ProductWithDiscount } from "@/types/promotionals";
import { PromotionalProductDetail } from "@/components/promotions/PromotionalProductDetail";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { toDate } from "@/lib/utils/timestamp-helpers";

export default function PromotionalProductDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { addPromotionalProduct, itemCount } = useCart();
	const eventId = params.eventId as string;
	const productId = params.productId as string;

	const [event, setEvent] = useState<PromotionalEvent | null>(null);
	const [product, setProduct] = useState<ProductWithDiscount | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				const [eventData, productData] = await Promise.all([
					CustomerPromotionalService.getPromotionalEvent(eventId),
					CustomerPromotionalService.getPromotionalProduct(eventId, productId),
				]);

				if (!eventData || !productData) {
					router.push(`/promotions/${eventId}`);
					return;
				}

				setEvent(eventData);
				setProduct(productData);
			} catch (error) {
				console.error("Error loading product:", error);
				toast.error("Failed to load product");
				router.push(`/promotions/${eventId}`);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [eventId, productId, router]);

	const handleAddToCart = async (quantity: number) => {
		if (!product || !event) return;

		// Convert ProductWithDiscount to Product format for cart
		const productForCart: any = {
			product_id: product.productId,
			title: product.title,
			description: product.description,
			type: "ready-to-wear",
			price: product.originalPrice,
			discount: 0,
			images: product.images || [],
			tailor_id: product.vendor.id,
			tailor: product.vendor.name,
			vendor: product.vendor,
			category: product.category,
			availability: product.availability,
		};

		// Use promotional discount percentage (not total)
		addPromotionalProduct(
			productForCart,
			quantity,
			event.id,
			event.name,
			product.promotionalDiscountPercentage || 0,
			toDate(event.endDate)
		);

		toast.success(`Added ${quantity} item(s) to cart!`);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-12 h-12 animate-spin text-red-600" />
			</div>
		);
	}

	if (!event || !product) return null;

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Breadcrumb & Back */}
			<div className="bg-white border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<button
							onClick={() => router.push(`/promotions/${eventId}`)}
							className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to {event.name}
						</button>

						{/* Cart Icon */}
						<button
							onClick={() => router.push("/shops/cart")}
							className="relative flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
						>
							<ShoppingCart className="w-5 h-5" />
							<span className="font-medium">Cart</span>
							{itemCount > 0 && (
								<span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
									{itemCount}
								</span>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Product Detail */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<PromotionalProductDetail
					product={product}
					event={event}
					onAddToCart={handleAddToCart}
				/>
			</div>
		</div>
	);
}
