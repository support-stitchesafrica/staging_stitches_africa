/**
 * Promotional Product Detail Component
 * Displays full product details with event badge integration
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { ProductWithDiscount, PromotionalEvent } from '@/types/promotionals';
import { CountdownTimer } from './CountdownTimer';
import { PromotionalBadge } from './PromotionalBadge';
import { PromotionalEventBadge } from '../promotionals/PromotionalEventBadge';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/utils/timestamp-helpers';

interface PromotionalProductDetailProps {
    product: ProductWithDiscount;
    event: PromotionalEvent;
    onAddToCart: (quantity: number) => void;
    className?: string;
}

export function PromotionalProductDetail({
    product,
    event,
    onAddToCart,
    className,
}: PromotionalProductDetailProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');

    // Check if product has size/color options (from rtwOptions)
    const productData = product as any; // Cast to access rtwOptions
    const hasSizes = productData.rtwOptions?.sizes && productData.rtwOptions.sizes.length > 0;
    const hasColors = productData.rtwOptions?.colors && productData.rtwOptions.colors.length > 0;

    // Determine if Add to Cart should be disabled
    const isAddToCartDisabled =
        (hasSizes && !selectedSize) ||
        (hasColors && !selectedColor) ||
        product.availability === 'out_of_stock';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };

    // Round total discount to nearest integer (standard rounding: 11.8 → 12, 11.2 → 11, 11.5 → 12)
    const getRoundedTotalDiscount = (percentage: number) => {
        return Math.round(percentage);
    };

    const handleAddToCart = () => {
        onAddToCart(quantity);
    };

    return (
        <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-8', className)}>
            {/* Images Section */}
            <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square bg-white rounded-xl overflow-hidden border-2 border-gray-200">
                    {product.images && product.images.length > 0 ? (
                        <Image
                            src={product.images[selectedImage]}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image Available
                        </div>
                    )}

                    {/* Event Badge - Top Left (Shows promotional discount only, e.g., 2%) */}
                    <div className="absolute top-4 left-4 z-10">
                        <PromotionalEventBadge
                            eventName={event.name}
                            discount={product.promotionalDiscountPercentage || 0}
                            size="md"
                            showDiscount={true}
                        />
                    </div>

                    {/* Discount Badge - Top Right (Shows total discount rounded to nearest integer, e.g., 12%) */}
                    <div className="absolute top-4 right-4 z-10">
                        <PromotionalBadge
                            discountPercentage={getRoundedTotalDiscount(product.discountPercentage)}
                            variant="compact"
                            size="md"
                        />
                    </div>
                </div>

                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                        {product.images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                className={cn(
                                    'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                                    selectedImage === idx
                                        ? 'border-red-600 ring-2 ring-red-200'
                                        : 'border-gray-200 hover:border-gray-300'
                                )}
                            >
                                <Image
                                    src={img}
                                    alt={`${product.title} ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="150px"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
                {/* Event Badge (Large) */}
                <div className="inline-block">
                    <PromotionalEventBadge
                        eventName={event.name}
                        discount={product.discountPercentage}
                        size="lg"
                        showDiscount={true}
                    />
                </div>

                {/* Product Title & Vendor */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {product.title}
                    </h1>
                    <p className="text-lg text-gray-600">
                        by <span className="font-medium">{product.vendor.name}</span>
                    </p>
                </div>

                {/* Countdown Timer */}
                <CountdownTimer
                    endDate={toDate(event.endDate)}
                    size="md"
                />

                {/* Pricing Section */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
                    <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-4xl font-bold text-red-600">
                            {formatPrice(product.discountedPrice)}
                        </span>
                        <span className="text-xl text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold text-lg">
                            You save {formatPrice(product.savings)}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-bold rounded">
                            {product.discountPercentage}% OFF
                        </span>
                    </div>
                </div>

                {/* Size Selection */}
                {hasSizes && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Size <span className="text-red-600">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {productData.rtwOptions.sizes.map((size: any) => {
                                const sizeLabel = typeof size === 'string' ? size : size.label;
                                const isSelected = selectedSize === sizeLabel;
                                return (
                                    <button
                                        key={sizeLabel}
                                        onClick={() => setSelectedSize(sizeLabel)}
                                        className={cn(
                                            'px-4 py-2 border-2 rounded-lg font-medium transition-all',
                                            isSelected
                                                ? 'border-red-600 bg-red-50 text-red-700'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                        )}
                                    >
                                        {sizeLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Color Selection */}
                {hasColors && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color <span className="text-red-600">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {productData.rtwOptions.colors.map((color: string) => {
                                const isSelected = selectedColor === color;
                                return (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={cn(
                                            'px-4 py-2 border-2 rounded-lg font-medium transition-all capitalize',
                                            isSelected
                                                ? 'border-red-600 bg-red-50 text-red-700'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                        )}
                                    >
                                        {color}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Quantity Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl font-semibold w-12 text-center">
                            {quantity}
                        </span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={isAddToCartDisabled}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-6 py-4 font-semibold rounded-lg transition-colors shadow-md",
                        isAddToCartDisabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 hover:shadow-lg"
                    )}
                >
                    <ShoppingCart className="w-5 h-5" />
                    {isAddToCartDisabled && (hasSizes || hasColors)
                        ? `Select ${!selectedSize && hasSizes ? 'Size' : ''}${!selectedSize && !selectedColor && hasSizes && hasColors ? ' & ' : ''}${!selectedColor && hasColors ? 'Color' : ''}`
                        : `${product.availability === 'pre_order' ? 'Pre Order' : 'Add to Cart'} - ${formatPrice(product.discountedPrice * quantity)}`
                    }
                </button>

                {/* Product Description */}
                {product.description && (
                    <div className="border-t pt-6">
                        <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                            Description
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            {product.description}
                        </p>
                    </div>
                )}

                {/* Product Details */}
                <div className="border-t pt-6 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                        Product Details
                    </h3>
                    {product.category && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium capitalize text-gray-900">
                                {product.category}
                            </span>
                        </div>
                    )}
                    {product.availability && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Availability:</span>
                            <span
                                className={cn(
                                    'px-3 py-1 rounded-full text-sm font-medium',
                                    product.availability === 'in_stock'
                                        ? 'bg-green-100 text-green-700'
                                        : product.availability === 'pre_order'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-700'
                                )}
                            >
                                {product.availability === 'in_stock'
                                    ? 'In Stock'
                                    : product.availability === 'pre_order'
                                        ? 'Pre-Order'
                                        : 'Out of Stock'}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Vendor:</span>
                        <span className="font-medium text-gray-900">
                            {product.vendor.name}
                        </span>
                    </div>
                </div>

                {/* Promotional Event Info */}
                <div className="border-t pt-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <PromotionalEventBadge
                                    eventName={event.name}
                                    discount={product.discountPercentage}
                                    size="sm"
                                    showDiscount={false}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-700">
                                    This product is part of the <strong>{event.name}</strong> promotional event.
                                    Discount applies automatically at checkout.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

