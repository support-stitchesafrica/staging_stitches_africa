'use client';

import { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface SelectedProduct
{
    productId: string;
    discountPercentage: number;
}

interface ProductSelectionGridProps
{
    products: Product[];
    selectedProducts: Map<string, number>;
    onToggleSelect: (productId: string) => void;
    onDiscountChange: (productId: string, discount: number) => void;
    eventName?: string;
    showEventBadges?: boolean;
    bulkDiscountProducts?: Set<string>; // Track which products have bulk discounts
}

export function ProductSelectionGrid({
    products,
    selectedProducts,
    onToggleSelect,
    onDiscountChange,
    eventName,
    showEventBadges = false,
    bulkDiscountProducts = new Set(),
}: ProductSelectionGridProps)
{
    if (products.length === 0)
    {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No products found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) =>
            {
                const isSelected = selectedProducts.has(product.product_id);
                const discountPercentage = selectedProducts.get(product.product_id) || 0;
                const isBulkDiscount = bulkDiscountProducts.has(product.product_id);

                return (
                    <ProductCard
                        key={product.product_id}
                        product={product}
                        isSelected={isSelected}
                        discountPercentage={discountPercentage}
                        onToggleSelect={onToggleSelect}
                        onDiscountChange={onDiscountChange}
                        eventName={eventName}
                        showEventBadge={showEventBadges && isSelected}
                        isBulkDiscount={isBulkDiscount}
                    />
                );
            })}
        </div>
    );
}
